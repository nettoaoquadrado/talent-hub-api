const { Op } = require('sequelize');
const Role = require('../../constants/role');
const {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} = require('../../utils/app-exception');
const { Company, User } = require('../../config/database').models;
const { sequelize } = require('../../config/database');
const hashingUtil = require('../../utils/hashing-util');
const storageUtil = require('../../utils/storage-util');

const IMAGE_MIMETYPE_EXT = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function getExtensionFromMimetype(mimetype) {
  if (!mimetype) return 'jpg';
  const normalized = mimetype.split(';')[0].trim().toLowerCase();
  return IMAGE_MIMETYPE_EXT[normalized] ?? 'jpg';
}

function toCompanyJson(company) {
  const json = company.toJSON ? company.toJSON() : company;
  delete json.userId;
  return json;
}

async function ensureCompanyForImageUpload(id, currentUser) {
  if (currentUser.role === Role.COMPANY) {
    const myCompany = await Company.findOne({ where: { userId: currentUser.id } });
    if (!myCompany || myCompany.id !== id) throw new UnauthorizedException();
    return myCompany;
  }
  const company = await Company.findByPk(id);
  if (!company) throw new NotFoundException('Empresa não encontrada');
  return company;
}

async function uploadCompanyImage(companyId, file, mimetype, fileKey, modelField) {
  const ext = getExtensionFromMimetype(mimetype);
  const contentType = mimetype?.split(';')[0]?.trim() ?? 'image/jpeg';
  const key = `companies/${companyId}/${fileKey}.${ext}`;
  const url = await storageUtil.upload(key, file, contentType);
  const company = await Company.findByPk(companyId);
  await company.update({ [modelField]: url });
  return toCompanyJson(company);
}

module.exports.findById = async (id) => {
  const company = await Company.findByPk(id, {
    attributes: { exclude: ['userId'] },
  }).then((c) => c.toJSON());
  return company;
};

module.exports.findByUserId = async (userId) => {
  const company = await Company.findOne({
    where: { userId },
    attributes: { exclude: ['userId'] },
  });
  return company ? company.toJSON() : null;
};

module.exports.findMany = async (params) => {
  const { cnpj, tradeName, sector, size, locationCity, locationState, limit, offset } = params;
  const where = {};
  if (cnpj) where.cnpj = cnpj;
  if (tradeName) where.tradeName = { [Op.like]: `%${tradeName}%` };
  if (sector) where.sector = sector;
  if (size) where.size = size;
  if (locationCity) where.locationCity = { [Op.like]: `%${locationCity}%` };
  if (locationState) where.locationState = { [Op.like]: `%${locationState}%` };

  const { rows: companies, count } = await Company.findAndCountAll({
    where,
    limit,
    offset,
    attributes: { exclude: ['userId'] },
  });

  const records = companies.map((c) => toCompanyJson(c));
  return {
    records,
    meta: {
      total: count,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
    },
  };
};

module.exports.create = async (params) => {
  const {
    payload: { user: userPayload, ...payload },
  } = params;

  const existingUser = await User.findOne({ where: { email: userPayload.email } });
  if (existingUser) {
    throw new ConflictException('Usuário já cadastrado');
  }

  const existingCompany = await Company.findOne({ where: { cnpj: payload.cnpj } });
  if (existingCompany) {
    throw new ConflictException('Empresa já cadastrada');
  }

  const transaction = await sequelize.transaction();
  try {
    const createdUser = await User.create(
      {
        email: userPayload.email,
        password: await hashingUtil.hash(userPayload.password),
        role: Role.COMPANY,
        isActive: true,
      },
      { transaction }
    );

    const company = await Company.create(
      { ...payload, userId: createdUser.id },
      { transaction }
    ).then((c) => c.toJSON());

    await transaction.commit();
    delete company.userId;
    return company;
  } catch (e) {
    await transaction.rollback();
    console.error('[company-business.create]', e?.message ?? e);
    if (e?.stack) console.error(e.stack);
    throw new ConflictException('Erro ao criar empresa');
  }
};

module.exports.update = async (params) => {
  const { id, payload, currentUser } = params;

  if (currentUser.role === Role.COMPANY) {
    const myCompany = await Company.findOne({ where: { userId: currentUser.id } });
    if (!myCompany || myCompany.id !== id) throw new UnauthorizedException();
    const updated = await myCompany.update(payload);
    return toCompanyJson(updated);
  }

  const company = await Company.findByPk(id);
  if (!company) throw new NotFoundException('Empresa não encontrada');
  const updated = await company.update(payload);
  return toCompanyJson(updated);
};

module.exports.deleteById = async (params) => {
  const { id } = params;
  await Company.destroy({ where: { id } });
};

module.exports.addBanner = async (params) => {
  const { id, currentUser, banner, mimetype } = params;
  await ensureCompanyForImageUpload(id, currentUser);
  return uploadCompanyImage(id, banner, mimetype, 'banner', 'bannerUrl');
};

module.exports.addLogo = async (params) => {
  const { id, currentUser, logo, mimetype } = params;
  await ensureCompanyForImageUpload(id, currentUser);
  return uploadCompanyImage(id, logo, mimetype, 'logo', 'logoUrl');
};
