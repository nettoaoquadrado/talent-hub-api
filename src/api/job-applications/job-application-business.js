const { Op } = require('sequelize');
const Role = require('../../constants/role');
const EducationStatus = require('../../constants/education-status');
const JobApplicationStatus = require('../../constants/job-application-status');
const JobOpeningStatus = require('../../constants/job-opening-status');
const {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} = require('../../utils/app-exception');
const {
  JobApplication,
  JobApplicationFeedback,
  JobOpening,
  Student,
  Company,
  StudentEducation,
  StudentExperience,
  StudentSkill,
} = require('../../config/database').models;

const COMPANY_ATTRS = ['id', 'tradeName', 'corporateName', 'logoUrl'];
const COMPANY_ATTRS_WITH_SECTOR = ['id', 'tradeName', 'corporateName', 'logoUrl', 'sector', 'size'];
const STUDENT_ATTRS = ['id', 'fullName', 'academicEmail', 'phoneNumber'];
const STUDENT_ATTRS_WITH_BIRTH = ['id', 'fullName', 'academicEmail', 'phoneNumber', 'birthDate'];

const STATUS_FINALIZADORES = [
  JobApplicationStatus.HIRED,
  JobApplicationStatus.REJECTED,
  JobApplicationStatus.WITHDRAWN,
  JobApplicationStatus.EXPIRED,
];

const ALLOWED_TRANSITIONS = {
  [JobApplicationStatus.APPLIED]: [
    JobApplicationStatus.REVIEWING,
    JobApplicationStatus.REJECTED,
    JobApplicationStatus.WITHDRAWN,
  ],
  [JobApplicationStatus.REVIEWING]: [
    JobApplicationStatus.INTERVIEWING,
    JobApplicationStatus.REJECTED,
    JobApplicationStatus.WITHDRAWN,
  ],
  [JobApplicationStatus.INTERVIEWING]: [
    JobApplicationStatus.OFFER_SENT,
    JobApplicationStatus.REJECTED,
    JobApplicationStatus.WITHDRAWN,
  ],
  [JobApplicationStatus.OFFER_SENT]: [
    JobApplicationStatus.HIRED,
    JobApplicationStatus.REJECTED,
    JobApplicationStatus.WITHDRAWN,
  ],
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function getAgeFromBirthDate(birthDate) {
  if (!birthDate) return null;
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / MS_PER_YEAR);
}

function getTotalExperienceYears(experiences) {
  if (!Array.isArray(experiences) || experiences.length === 0) return 0;
  const now = Date.now();
  let totalMs = 0;
  for (const exp of experiences) {
    const start = new Date(exp.startDate).getTime();
    const end = exp.endDate ? new Date(exp.endDate).getTime() : now;
    if (end >= start) totalMs += end - start;
  }
  return totalMs / MS_PER_YEAR;
}

function includeJobOpeningWithCompany(companyAttrs = COMPANY_ATTRS) {
  return {
    model: JobOpening,
    as: 'jobOpening',
    include: [
      {
        model: Company,
        as: 'company',
        attributes: companyAttrs,
      },
    ],
  };
}

function includeStudent(attrs = STUDENT_ATTRS) {
  return {
    model: Student,
    as: 'student',
    attributes: attrs,
  };
}

function findByIdIncludeOptions() {
  return [
    includeJobOpeningWithCompany(),
    includeStudent(),
    {
      model: JobApplicationFeedback,
      as: 'feedbacks',
      attributes: ['id', 'status', 'feedback', 'createdAt'],
    },
  ];
}

module.exports.findById = async (id) => {
  const jobApplication = await JobApplication.findByPk(id, {
    include: findByIdIncludeOptions(),
    order: [[{ model: JobApplicationFeedback, as: 'feedbacks' }, 'createdAt', 'ASC']],
  }).then((ja) => ja.toJSON());

  if (!jobApplication) {
    throw new NotFoundException('Candidatura não encontrada');
  }
  return jobApplication;
};

module.exports.findMany = async (params) => {
  const { currentUser, limit, offset, sortBy, sortOrder, ...filters } = params;

  let student = null;
  let company = null;
  if (currentUser.role === Role.STUDENT) {
    student = await Student.findOne({ where: { userId: currentUser.id } });
    if (!student) throw new NotFoundException('Estudante não encontrado');

    
  } else if (currentUser.role === Role.COMPANY) {
    company = await Company.findOne({ where: { userId: currentUser.id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
  }

  const validSortBy = ['createdAt', 'updatedAt'].includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';

  const { rows: jobApplications, count } = await JobApplication.findAndCountAll({
    where: {
      ...(currentUser.role === Role.STUDENT ? { studentId: student.id } : {}),
      ...(filters.jobId ? { jobId: filters.jobId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    limit,
    offset,
    include: [
      includeStudent(STUDENT_ATTRS_WITH_BIRTH),
      {
        model: JobOpening,
        as: 'jobOpening',
        ...(currentUser.role === Role.COMPANY
          ? { where: { companyId: company.id } }
          : currentUser.role === Role.STUDENT && filters.companyId
            ? { where: { companyId: filters.companyId } }
            : {}),
        attributes: ['id', 'title', 'status', 'createdAt', 'updatedAt'],
        include: [
          {
            model: Company,
            as: 'company',
            attributes: COMPANY_ATTRS_WITH_SECTOR,
            ...(currentUser.role === Role.STUDENT &&
              filters.companyTradeName &&
              String(filters.companyTradeName).trim()
              ? {
                  where: {
                    tradeName: {
                      [Op.iLike]: `%${String(filters.companyTradeName).trim()}%`
                    }
                  }
                }
              : {})
          }
        ]
      },
    ],
    attributes: {
      exclude: ['studentId', 'jobId']
    },
    order: [[validSortBy, validSortOrder]],
  });

  return {
    records: jobApplications,
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

  if (currentUser.role !== Role.STUDENT) {
    throw new UnauthorizedException('Somente estudantes podem se candidatar');
  }

  const student = await Student.findByPk(payload.studentId, {
    include: [
      { model: StudentEducation, as: 'educations' },
      { model: StudentExperience, as: 'experiences' },
      { model: StudentSkill, as: 'skills' },
    ],
  });
  if (!student) throw new NotFoundException('Estudante não encontrado');
  if (student.userId !== currentUser.id) {
    throw new UnauthorizedException('Você não tem permissão para se candidatar a esta vaga');
  }

  const jobOpening = await JobOpening.findByPk(payload.jobId);
  if (!jobOpening) throw new NotFoundException('Vaga não encontrada');
  if (jobOpening.status !== JobOpeningStatus.OPEN) {
    throw new ConflictException('Vaga não está aberta para candidaturas');
  }

  const existing = await JobApplication.findOne({
    where: { jobId: payload.jobId, studentId: student.id },
  });
  if (existing) {
    throw new ConflictException('Você já se candidatou a esta vaga');
  }

  const created = await JobApplication.create({
    ...payload,
    studentId: student.id,
    status: JobApplicationStatus.APPLIED,
  });

  const withInclude = await JobApplication.findByPk(created.id, {
    include: findByIdIncludeOptions(),
  });
  return withInclude.toJSON();
};

module.exports.updateCoverLetter = async (params) => {
  const { id, currentUser, payload } = params;

  if (currentUser.role !== Role.STUDENT) {
    throw new UnauthorizedException('Permissão negada');
  }

  const jobApplication = await JobApplication.findByPk(id);
  if (!jobApplication) {
    throw new NotFoundException('Candidatura não encontrada');
  }

  const student = await Student.findByPk(jobApplication.studentId);
  if (!student || student.userId !== currentUser.id) {
    throw new UnauthorizedException('Você só pode atualizar sua própria candidatura');
  }

  jobApplication.coverLetter = payload.coverLetter;
  await jobApplication.save();
  return jobApplication;
};

module.exports.updateStatus = async (params) => {
  const { id, currentUser, payload } = params;

  if (
    currentUser.role === Role.STUDENT &&
    payload.status !== JobApplicationStatus.WITHDRAWN
  ) {
    throw new UnauthorizedException(
      'Somente empresas podem atualizar o status de uma candidatura'
    );
  }

  if (
    currentUser.role === Role.COMPANY &&
    payload.status === JobApplicationStatus.WITHDRAWN
  ) {
    throw new UnauthorizedException(
      'Somente estudantes podem desistir de uma candidatura'
    );
  }

  const jobApplication = await JobApplication.findByPk(id);
  if (!jobApplication) {
    throw new NotFoundException('Candidatura não encontrada');
  }

  if (STATUS_FINALIZADORES.includes(jobApplication.status)) {
    throw new ConflictException(
      'Não é possível atualizar o status de uma candidatura encerrada'
    );
  }

  const currentStatus = jobApplication.status;
  const newStatus = payload.status;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new ConflictException(
      `Transição de status inválida de '${currentStatus}' para '${newStatus}'`
    );
  }

  const feedbackText = payload.feedback != null
    ? String(payload.feedback).trim()
    : null;
  const hasFeedback = feedbackText && feedbackText.length >= 10;

  if (hasFeedback) {
    await JobApplicationFeedback.create({
      jobApplicationId: id,
      status: newStatus,
      feedback: feedbackText,
    });
  }

  await jobApplication.update({
    status: newStatus,
    ...(hasFeedback && { feedback: feedbackText }),
  });

  const updated = await JobApplication.findByPk(id, {
    include: findByIdIncludeOptions(),
  });
  return updated.toJSON();
};

module.exports.deleteById = async (params) => {
  const { id, currentUser } = params;

  if (currentUser.role !== Role.STUDENT && currentUser.role !== Role.COLLEGE) {
    throw new UnauthorizedException('Permissão negada');
  }

  const jobApplication = await JobApplication.findByPk(id);
  if (!jobApplication) {
    throw new NotFoundException('Candidatura não encontrada');
  }

  if (currentUser.role === Role.STUDENT) {
    const student = await Student.findOne({ where: { userId: currentUser.id } });
    if (!student || student.id !== jobApplication.studentId) {
      throw new UnauthorizedException('Você só pode excluir suas próprias candidaturas');
    }
  }

  if (jobApplication.status === JobApplicationStatus.HIRED) {
    throw new ConflictException('Não é possível excluir uma candidatura contratada');
  }

  await jobApplication.destroy();
};
