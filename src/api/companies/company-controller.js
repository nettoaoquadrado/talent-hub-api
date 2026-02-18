const companyBusiness = require('./company-business');
const storageUtil = require('../../utils/storage-util');
const { BadRequestException } = require('../../utils/app-exception');

async function extractFileBuffer(file) {
  if (!file) return null;
  const raw = file.buffer ?? file._data ?? file;
  if (Buffer.isBuffer(raw) && raw.length > 0) return raw;
  if (raw && typeof raw.pipe === 'function') {
    return storageUtil.streamToBuffer(raw);
  }
  if (raw && raw instanceof Uint8Array) return Buffer.from(raw);
  return raw;
}

module.exports.findMe = async (req, h) => {
  const userId = req.auth.credentials.id;
  const company = await companyBusiness.findByUserId(userId);
  if (!company) {
    return h.response({ message: 'Empresa não encontrada para este usuário' }).code(404);
  }
  return h.response(company).code(200);
};

module.exports.findById = async (req, h) => {
  const { id } = req.params;

  const company = await companyBusiness.findById(id);

  return h.response(company).code(200);
};

module.exports.findMany = async (req, h) => {
  const { cnpj, tradeName, sector, size, locationCity, locationState, limit, offset } = req.query;

  const companiesResponse = await companyBusiness.findMany({
    cnpj,
    tradeName,
    sector,
    size,
    locationCity,
    locationState,
    limit,
    offset,
  });

  return h.response(companiesResponse).code(200);
};

module.exports.create = async (req, h) => {
  const { payload } = req;

  const company = await companyBusiness.create({ payload });

  return h.response(company).code(201);
};

module.exports.update = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;
  const { payload } = req;

  const company = await companyBusiness.update({ id, currentUser, payload });

  return h.response(company).code(200);
};

module.exports.deleteById = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;

  await companyBusiness.deleteById({ id, currentUser });

  return h.response().code(204);
};

module.exports.addBanner = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;
  const file = req.payload?.banner;
  const buffer = await extractFileBuffer(file);
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new BadRequestException('Arquivo de banner inválido ou vazio');
  }
  const mimetype =
    file?.mimetype ??
    file?.headers?.['content-type'] ??
    file?.hapi?.headers?.['content-type'] ??
    file?.hapi?.headers?.['Content-Type'] ??
    'image/jpeg';

  const company = await companyBusiness.addBanner({ id, currentUser, banner: buffer, mimetype });

  return h.response(company).code(200);
};

module.exports.addLogo = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;
  const file = req.payload?.logo;
  const buffer = await extractFileBuffer(file);

  const mimetype =
    file?.mimetype ??
    file?.headers?.['content-type'] ??
    file?.hapi?.headers?.['content-type'] ??
    file?.hapi?.headers?.['Content-Type'] ??
    'image/jpeg';

  const company = await companyBusiness.addLogo({ id, currentUser, logo: buffer, mimetype });

  return h.response(company).code(200);
};