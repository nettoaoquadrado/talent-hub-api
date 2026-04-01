const { Op, Sequelize } = require('sequelize');
const Role = require('../../constants/role');
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
  StudentCertification,
  StudentLanguage,
  Skill,
} = require('../../config/database').models;
const applicationScoringService = require('../../services/application-scoring-service');
const config = require('../../config/config');

const COMPANY_ATTRS = ['id', 'tradeName', 'corporateName', 'logoUrl'];
const COMPANY_ATTRS_WITH_SECTOR = ['id', 'tradeName', 'corporateName', 'logoUrl', 'sector', 'size'];
const STUDENT_ATTRS = ['id', 'fullName', 'academicEmail', 'phoneNumber'];
const STUDENT_ATTRS_WITH_BIRTH = ['id', 'fullName', 'academicEmail', 'phoneNumber', 'birthDate'];
const VALID_SORT_BY = ['createdAt', 'updatedAt', 'finalScore'];
const DEFAULT_SORT_BY = 'createdAt';
const VALID_SORT_ORDER = ['ASC', 'DESC'];
const DEFAULT_SORT_ORDER = 'DESC';
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
const MIN_FEEDBACK_LENGTH = 10;

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
      { model: Company, as: 'company', attributes: companyAttrs },
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

const JOB_OPENING_ATTRS_FOR_SCORING = [
  'id', 'companyId', 'title', 'description', 'requirements', 'requiredSkills',
  'salary', 'salaryMin', 'salaryMax', 'workModel', 'contractType', 'degreeType', 'seniority',
  'minExperience', 'minAge', 'maxAge', 'requireCompleteGraduation', 'availableForReaddress',
  'addressCity', 'addressState', 'addressCountry', 'addressStreet', 'addressNeighborhood', 'addressZipCode',
  'benefits', 'otherBenefits', 'startDate', 'endDate',
];

const STUDENT_ATTRS_FOR_SCORING = [
  'id', 'fullName', 'headline', 'bio', 'about', 'salaryExpectationMin', 'availableForRelocation',
  'addressCity', 'addressState', 'addressCountry', 'addressNeighborhood', 'addressZipCode',
  'targetRoles', 'workModels', 'contractTypes', 'availabilityToStart', 'mainEducationLevel', 'isCurrentlyWorking',
];

function studentIncludeForScoring() {
  return [
    {
      model: StudentEducation,
      as: 'educations',
      attributes: ['degree', 'status', 'currentSemester', 'fieldOfStudy', 'institution', 'expectedGraduationDate', 'startDate', 'endDate'],
    },
    {
      model: StudentExperience,
      as: 'experiences',
      attributes: ['company', 'position', 'startDate', 'endDate', 'description', 'isCurrentlyWorking'],
    },
    {
      model: StudentSkill,
      as: 'skills',
      attributes: ['skillId', 'level'],
      include: [{ model: Skill, as: 'skill', attributes: ['id', 'name'] }],
    },
    {
      model: StudentCertification,
      as: 'certifications',
      attributes: ['name', 'issuingOrganization', 'issueDate'],
    },
    {
      model: StudentLanguage,
      as: 'languages',
      attributes: ['language', 'proficiency'],
    },
  ];
}

function includeOptionsForScoring() {
  return [
    {
      model: JobOpening,
      as: 'jobOpening',
      attributes: JOB_OPENING_ATTRS_FOR_SCORING,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'userId', 'tradeName'] },
      ],
    },
    {
      model: Student,
      as: 'student',
      attributes: STUDENT_ATTRS_FOR_SCORING,
      include: studentIncludeForScoring(),
    },
  ];
}

async function computeAndPersistScoreForApplicationId(applicationId) {
  const application = await JobApplication.findByPk(applicationId, {
    include: includeOptionsForScoring(),
  });
  if (!application) throw new NotFoundException('Candidatura não encontrada');

  const job = application.jobOpening;
  if (!job) throw new NotFoundException('Vaga não encontrada');

  const studentPlain = application.student
    ? (application.student.toJSON ? application.student.toJSON() : application.student)
    : null;
  if (!studentPlain) throw new NotFoundException('Estudante não encontrado');

  const jobPlain = job.toJSON ? job.toJSON() : job;
  const requiredSkillIds = job.requiredSkills || [];
  if (requiredSkillIds.length > 0) {
    const skills = await Skill.findAll({
      where: { id: requiredSkillIds },
      attributes: ['id', 'name'],
    });
    jobPlain.requiredSkillNames = skills.map((s) => s.name);
  } else {
    jobPlain.requiredSkillNames = [];
  }

  const result = await applicationScoringService.computeScore({
    job: jobPlain,
    student: studentPlain,
    coverLetter: application.coverLetter,
  });

  await application.update({
    finalScore: result.finalScore,
    scoreBreakdown: result.breakdown,
    aiInsights: result.aiInsights,
  });
}

function buildFindManyWhere(currentUser, filters, student) {
  const where = {};
  if (filters.jobId) where.jobId = filters.jobId;
  if (filters.status) where.status = filters.status;
  if (currentUser.role === Role.STUDENT && student) {
    where.studentId = student.id;
  }
  return where;
}

function buildFindManyInclude(currentUser, filters, student, company) {
  const jobOpeningWhere = {};
  if (currentUser.role === Role.COMPANY) {
    jobOpeningWhere.companyId = company.id;
  } else if (currentUser.role === Role.STUDENT && filters.companyId) {
    jobOpeningWhere.companyId = filters.companyId;
  }

  const companyWhere = {};
  if (
    currentUser.role === Role.STUDENT &&
    filters.companyTradeName &&
    String(filters.companyTradeName).trim()
  ) {
    companyWhere.tradeName = { [Op.iLike]: `%${String(filters.companyTradeName).trim()}%` };
  }

  return [
    includeStudent(STUDENT_ATTRS_WITH_BIRTH),
    {
      model: JobOpening,
      as: 'jobOpening',
      where: Object.keys(jobOpeningWhere).length ? jobOpeningWhere : undefined,
      attributes: ['id', 'title', 'status', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: COMPANY_ATTRS_WITH_SECTOR,
          where: Object.keys(companyWhere).length ? companyWhere : undefined,
        },
      ],
    },
  ];
}

function buildFindManyOrder(sortBy, sortOrder) {
  const validSortBy = VALID_SORT_BY.includes(sortBy) ? sortBy : DEFAULT_SORT_BY;
  const validSortOrder = VALID_SORT_ORDER.includes(sortOrder) ? sortOrder : DEFAULT_SORT_ORDER;
  if (validSortBy === 'finalScore') {
    return [[Sequelize.literal('"JobApplication"."final_score" DESC NULLS LAST')]];
  }
  return [[validSortBy, validSortOrder]];
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

  const where = buildFindManyWhere(currentUser, filters, student);

  const include = buildFindManyInclude(currentUser, filters, student, company);
  const order = buildFindManyOrder(sortBy, sortOrder);

  const { rows: jobApplications, count } = await JobApplication.findAndCountAll({
    where,
    limit,
    offset,
    include,
    attributes: { exclude: ['studentId', 'jobId'] },
    order,
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

  const jobApplication = await JobApplication.findByPk(id);
  if (!jobApplication) throw new NotFoundException('Candidatura não encontrada');

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
  if (!jobApplication) throw new NotFoundException('Candidatura não encontrada');

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

  const feedbackText =
    payload.feedback != null ? String(payload.feedback).trim() : null;
  const hasFeedback =
    feedbackText && feedbackText.length >= MIN_FEEDBACK_LENGTH;

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

  const jobApplication = await JobApplication.findByPk(id);
  if (!jobApplication) throw new NotFoundException('Candidatura não encontrada');

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

module.exports.computeAndSaveScore = async (params) => {
  const { id, currentUser } = params;

  const application = await JobApplication.findByPk(id, {
    include: [
      {
        model: JobOpening,
        as: 'jobOpening',
        attributes: ['id', 'companyId'],
      },
    ],
  });
  if (!application) throw new NotFoundException('Candidatura não encontrada');

  const job = application.jobOpening;
  if (!job) throw new NotFoundException('Vaga não encontrada');

  if (currentUser.role === Role.COMPANY) {
    const company = await Company.findOne({ where: { userId: currentUser.id } });
    if (!company || job.companyId !== company.id) {
      throw new UnauthorizedException(
        'Você só pode recalcular score de candidaturas das suas vagas'
      );
    }
  }

  await computeAndPersistScoreForApplicationId(id);

  const updated = await JobApplication.findByPk(id, {
    include: findByIdIncludeOptions(),
  });
  return updated.toJSON();
};

const AUTO_APPLY_COVER_LETTER = 'Candidatura automática com base no seu perfil.';

module.exports.processAutoApplyForJob = async (jobId) => {
  const { maxCandidatesToScorePerJob, minScoreThreshold, maxAutoApplicationsPerJob } = config.autoApply || {};
  const maxToScore = maxCandidatesToScorePerJob ?? 200;
  const minScore = minScoreThreshold ?? 50;

  const job = await JobOpening.findOne({
    where: {
      id: jobId,
      status: JobOpeningStatus.OPEN,
      acceptAutoApply: true,
    },
    attributes: JOB_OPENING_ATTRS_FOR_SCORING,
  });
  if (!job) return { created: 0 };

  const existingAutoApplyCount = await JobApplication.count({
    where: { jobId, isAutoApply: true },
  });
  if (existingAutoApplyCount >= maxAutoApplicationsPerJob) {
    return { created: 0 };
  }
  const slotsRemaining = maxAutoApplicationsPerJob - existingAutoApplyCount;

  const appliedStudentIds = await JobApplication.findAll({
    where: { jobId },
    attributes: ['studentId'],
  }).then((rows) => rows.map((r) => r.studentId));

  const eligibleStudents = await Student.findAll({
    where: {
      isAutoApplyEnabled: true,
      ...(appliedStudentIds.length > 0 && { id: { [Op.notIn]: appliedStudentIds } }),
    },
    attributes: STUDENT_ATTRS_FOR_SCORING,
    include: studentIncludeForScoring(),
    limit: maxToScore,
  });
  if (eligibleStudents.length === 0) return { created: 0 };

  const jobPlain = job.toJSON ? job.toJSON() : job;
  const requiredSkillIds = job.requiredSkills || [];
  if (requiredSkillIds.length > 0) {
    const skills = await Skill.findAll({
      where: { id: requiredSkillIds },
      attributes: ['id', 'name'],
    });
    jobPlain.requiredSkillNames = skills.map((s) => s.name);
  } else {
    jobPlain.requiredSkillNames = [];
  }

  const scored = [];
  for (const student of eligibleStudents) {
    const studentPlain = student.toJSON ? student.toJSON() : student;
    try {
      const result = await applicationScoringService.computeScore({
        job: jobPlain,
        student: studentPlain,
        coverLetter: null,
      });
      scored.push({ studentId: student.id, result });
    } catch (e) {
    }
  }

  scored.sort((a, b) => (b.result.finalScore ?? 0) - (a.result.finalScore ?? 0));
  const toCreate = scored
    .filter((s) => (s.result.finalScore ?? 0) >= minScore)
    .slice(0, slotsRemaining);

  let created = 0;
  for (const { studentId, result } of toCreate) {
    const existing = await JobApplication.findOne({
      where: { jobId, studentId },
    });
    if (existing) continue;

    await JobApplication.create({
      jobId,
      studentId,
      status: JobApplicationStatus.APPLIED,
      coverLetter: AUTO_APPLY_COVER_LETTER,
      finalScore: result.finalScore,
      scoreBreakdown: result.breakdown,
      aiInsights: result.aiInsights ?? null,
      isAutoApply: true,
    });
    created += 1;
  }

  return { created };
};
