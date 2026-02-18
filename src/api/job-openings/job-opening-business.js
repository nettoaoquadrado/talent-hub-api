const { Op } = require('sequelize');
const Role = require('../../constants/role');
const JobOpeningStatus = require('../../constants/job-opening-status');
const {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} = require('../../utils/app-exception');
const { JobOpening, Company, JobApplication } = require('../../config/database').models;

const COMPANY_INCLUDE = {
  model: Company,
  as: 'company',
  attributes: ['id', 'tradeName', 'corporateName', 'logoUrl'],
};

const COMPANY_INCLUDE_WITH_SECTOR = {
  model: Company,
  as: 'company',
  attributes: ['id', 'tradeName', 'corporateName', 'logoUrl', 'sector', 'size'],
};

const VALID_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'salary'];

function buildFindManyWhere(params) {
  const {
    companyId,
    companyTradeName,
    title,
    description,
    status,
    workModel,
    contractType,
    degreeType,
    seniority,
    addressCity,
    addressState,
    salaryMin,
    salaryMax,
    minAge,
    maxAge,
    minExperience,
    maxExperience,
    requireCompleteGraduation,
    availableForRelocation,
    benefits,
    createdAfter,
    createdBefore,
  } = params;

  const where = {};
  const companyWhere = {};
  if (addressCity) where.addressCity = { [Op.like]: `%${addressCity}%` };
  if (addressState) where.addressState = addressState;
  if (companyId) where.companyId = companyId;
  if (companyTradeName) companyWhere.tradeName = { [Op.iLike]: `%${companyTradeName}%` };
  if (title) where.title = { [Op.like]: `%${title}%` };
  if (description) where.description = { [Op.like]: `%${description}%` };
  if (status != null && status !== '') where.status = status;
  if (workModel) where.workModel = workModel;
  if (contractType) where.contractType = contractType;
  if (degreeType) where.degreeType = degreeType;
  if (seniority) where.seniority = seniority;
  if (requireCompleteGraduation !== undefined) {
    where.requireCompleteGraduation = requireCompleteGraduation;
  }
  if (availableForRelocation !== undefined) {
    where.availableForRelocation = availableForRelocation;
  }

  if (salaryMin != null || salaryMax != null) {
    where.salary = {};
    if (salaryMin != null) where.salary[Op.gte] = salaryMin;
    if (salaryMax != null) where.salary[Op.lte] = salaryMax;
  }

  if (minAge != null || maxAge != null) {
    where.minAge = {};  
    if (minAge != null) where.minAge[Op.lte] = minAge;
    if (maxAge != null) where.maxAge[Op.gte] = maxAge;
  }

  if (minExperience != null || maxExperience != null) {
    where.minExperience = {};
    if (minExperience != null) where.minExperience[Op.lte] = minExperience;
    if (maxExperience != null) where.maxExperience[Op.gte] = maxExperience;
  }

  if (createdAfter != null || createdBefore != null) {
    where.createdAt = {};
    if (createdAfter != null) where.createdAt[Op.gte] = new Date(createdAfter);
    if (createdBefore != null) where.createdAt[Op.lte] = new Date(createdBefore);
  }

  if (benefits?.length > 0) {
    where.benefits = { [Op.overlap]: benefits };
  }

  return { where, companyWhere };
}

function buildFindManyOrder(sortBy, sortOrder) {
  const sortField = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const order = [[sortField, sortDirection]];
  if (sortField !== 'createdAt') {
    order.push(['createdAt', 'DESC']);
  }
  return order;
}

function validateJobOpeningPayload(payload) {
  if (payload.minAge != null && payload.maxAge != null && payload.minAge > payload.maxAge) {
    throw new ConflictException('Idade mínima não pode ser maior que a máxima');
  }
  if (
    payload.minExperience != null &&
    payload.maxExperience != null &&
    payload.minExperience > payload.maxExperience
  ) {
    throw new ConflictException('Experiência mínima não pode ser maior que a máxima');
  }
  if (
    payload.startDate != null &&
    payload.endDate != null &&
    new Date(payload.startDate) >= new Date(payload.endDate)
  ) {
    throw new ConflictException('Data de início deve ser anterior à data de término');
  }
}

module.exports.findById = async (id) => {
  const jobOpening = await JobOpening.findByPk(id, {
    include: [COMPANY_INCLUDE_WITH_SECTOR],
    attributes: {
      exclude: ['companyId'],
      include: [
        [
          JobOpening.sequelize.literal(`(
            SELECT COUNT(*)
            FROM job_applications AS ja
            WHERE ja.job_id = "${JobOpening.name}".id
          )`),
          'applicationCount'
        ]
      ]
    },
  }).then((jo) => jo?.toJSON());

  if (!jobOpening) {
    throw new NotFoundException('Vaga não encontrada');
  }
  return jobOpening;
};

module.exports.findMany = async (params) => {
  const {
    limit,
    offset,
    sortBy,
    sortOrder,
    ...filters
  } = params;

  const { where, companyWhere } = buildFindManyWhere(filters);
  const order = buildFindManyOrder(sortBy, sortOrder);

  const { rows: jobOpenings, count } = await JobOpening.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      {
        ...COMPANY_INCLUDE_WITH_SECTOR,
        where: companyWhere,
      },
    ],
    attributes: {
      exclude: ['companyId'],
      include: [
        [
          JobOpening.sequelize.literal(`(
            SELECT COUNT(*)
            FROM job_applications AS ja
            WHERE ja.job_id = "${JobOpening.name}".id
          )`),
          'applicationCount'
        ]
      ]
    },
    order,
  });

  return {
    records: jobOpenings,
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
  const { payload, currentUser } = params;

  if (![Role.COMPANY, Role.COLLEGE].includes(currentUser.role)) {
    throw new UnauthorizedException('Apenas empresas podem criar vagas');
  }

  const company = await Company.findByPk(payload.companyId);
  if (!company) {
    throw new NotFoundException('Empresa não encontrada');
  }

  if (currentUser.role === Role.COMPANY && company.userId !== currentUser.id) {
    throw new UnauthorizedException('Você não tem permissão para criar vagas nesta empresa');
  }

  validateJobOpeningPayload(payload);
  payload.status = JobOpeningStatus.OPEN;

  const jobOpening = await JobOpening.create(payload);
  const created = await JobOpening.findByPk(jobOpening.id, {
    include: [COMPANY_INCLUDE],
    attributes: { exclude: ['companyId'] },
  });
  return created;
};

module.exports.update = async (params) => {
  const { id, payload, currentUser } = params;

  const jobOpening = await JobOpening.findByPk(id);
  if (!jobOpening) {
    throw new NotFoundException('Vaga não encontrada');
  }

  if (![Role.COLLEGE, Role.COMPANY].includes(currentUser.role)) {
    throw new UnauthorizedException('Permissão negada');
  }

  const company = await Company.findByPk(jobOpening.companyId);
  if (currentUser.role === Role.COMPANY && company.userId !== currentUser.id) {
    throw new UnauthorizedException('Você não pode editar vagas de outra empresa');
  }

  validateJobOpeningPayload(payload);

  await jobOpening.update(payload);
  const result = await JobOpening.findByPk(jobOpening.id, {
    include: [COMPANY_INCLUDE],
  });
  return result;
};

module.exports.deleteById = async (params) => {
  const { id, currentUser } = params;

  const jobOpening = await JobOpening.findByPk(id, {
    include: [{ model: JobApplication, as: 'jobApplications', attributes: ['id'] }],
  });

  if (!jobOpening) {
    throw new NotFoundException('Vaga não encontrada');
  }

  const company = await Company.findByPk(jobOpening.companyId);
  if (currentUser.role === Role.COMPANY && company.userId !== currentUser.id) {
    throw new UnauthorizedException('Você não pode excluir vagas de outra empresa');
  }

  if (currentUser.role !== Role.COMPANY && currentUser.role !== Role.COLLEGE) {
    throw new UnauthorizedException('Permissão negada');
  }

  const applications = jobOpening.jobApplications ?? [];
  if (applications.length > 0) {
    throw new ConflictException('Não é possível excluir uma vaga com candidaturas ativas');
  }

  await jobOpening.destroy();
};
