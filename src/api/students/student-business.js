const { Op } = require("sequelize");
const Role = require("../../constants/role");
const {
  NotFoundException,
  UnauthorizedException,
  AppException,
  ValidationException,
  ConflictException,
} = require("../../utils/app-exception");
const {
  Student,
  StudentEducation,
  StudentExperience,
  StudentSkill,
  StudentCertification,
  StudentLanguage,
  User,
  Skill,
  StudentView,
  Company,
} = require("../../config/database").models;
const { sequelize } = require("../../config/database");
const hashingUtil = require("../../utils/hashing-util");
const storageUtil = require("../../utils/storage-util");

const ROLES_CAN_LIST_STUDENTS = [Role.COLLEGE, Role.COMPANY];
const MAX_CURRENTLY_WORKING_EXPERIENCES = 1;
const STUDENT_ATTRIBUTES_EXCLUDE = ["updatedAt", "createdAt"];
const EDUCATION_ATTRIBUTES_EXCLUDE = ["studentId", "id"];
const EXPERIENCE_ATTRIBUTES_EXCLUDE = ["studentId", "id"];
const SKILL_ATTRIBUTES_EXCLUDE = ["studentId", "id"];
const CERTIFICATION_ATTRIBUTES_EXCLUDE = ["studentId", "id"];
const LANGUAGE_ATTRIBUTES_EXCLUDE = ["studentId", "id"];
const VIEW_ATTRIBUTES_EXCLUDE = ["studentId", "companyId"];
const COMPANY_ATTRIBUTES = ["id", "tradeName", "logoUrl"];
const SKILL_ATTRIBUTES = ["id", "name", "type"];

function getEducationInclude(attributes = EDUCATION_ATTRIBUTES_EXCLUDE) {
  return {
    model: StudentEducation,
    as: "educations",
    attributes: { exclude: attributes },
  };
}

function getExperienceInclude(attributes = EXPERIENCE_ATTRIBUTES_EXCLUDE) {
  return {
    model: StudentExperience,
    as: "experiences",
    attributes: { exclude: attributes },
  };
}

function getSkillInclude(options = {}) {
  const { required = false, skillIds, attributes = SKILL_ATTRIBUTES_EXCLUDE } = options;
  const include = {
    model: StudentSkill,
    as: "skills",
    required,
    attributes: { exclude: attributes },
    include: [{ model: Skill, as: "skill", attributes: SKILL_ATTRIBUTES }],
  };
  if (skillIds?.length) {
    include.where = { skillId: { [Op.in]: skillIds } };
  }
  return include;
}

function getCertificationInclude(attributes = CERTIFICATION_ATTRIBUTES_EXCLUDE) {
  return {
    model: StudentCertification,
    as: "certifications",
    attributes: { exclude: attributes },
  };
}

function getLanguageInclude() {
  return {
    model: StudentLanguage,
    as: "languages",
    attributes: { exclude: LANGUAGE_ATTRIBUTES_EXCLUDE },
  };
}

function getViewInclude(attributes = VIEW_ATTRIBUTES_EXCLUDE) {
  return {
    model: StudentView,
    as: "views",
    attributes: { exclude: attributes },
    include: [{ model: Company, as: "company", attributes: COMPANY_ATTRIBUTES }],
  };
}

function getStudentDetailIncludeOptions() {
  return [
    getEducationInclude(),
    getExperienceInclude(),
    getSkillInclude({ attributes: SKILL_ATTRIBUTES_EXCLUDE }),
    getCertificationInclude(),
    getLanguageInclude(),
    getViewInclude(),
  ];
}

function getStudentListIncludeOptions(skillIds) {
  const hasSkillFilter = skillIds?.length > 0;
  return [
    getSkillInclude({
      required: hasSkillFilter,
      skillIds: hasSkillFilter ? skillIds : undefined,
      attributes: SKILL_ATTRIBUTES_EXCLUDE,
    }),
    getEducationInclude(),
    getExperienceInclude(),
    getCertificationInclude(),
    getLanguageInclude(),
    getViewInclude(),
  ].map((inc) => ({ ...inc, required: inc.required ?? false }));
}

function buildFindManyWhere(params) {
  const {
    fullName,
    addressCity,
    addressState,
    maxSalaryBudget,
    workModels,
    contractTypes,
    availableForRelocation,
    availabilityToStart,
  } = params;

  const where = {};

  if (fullName) where.fullName = { [Op.like]: `%${fullName}%` };
  if (addressCity) where.addressCity = { [Op.like]: `%${addressCity}%` };
  if (addressState) where.addressState = addressState;
  if (maxSalaryBudget) where.salaryExpectationMin = { [Op.lte]: maxSalaryBudget };
  if (availableForRelocation !== undefined) where.availableForRelocation = availableForRelocation;
  if (availabilityToStart !== undefined) where.availabilityToStart = availabilityToStart;
  if (workModels?.length) where.workModels = { [Op.overlap]: workModels };
  if (contractTypes?.length) where.contractTypes = { [Op.overlap]: contractTypes };

  return where;
}

function validateEducationDateRange(edu) {
  if (edu.endDate && edu.endDate < edu.startDate) {
    throw new ValidationException("A data de término da formação não pode ser anterior à data de início");
  }
}

function validateExperienceDateRange(exp) {
  if (exp.endDate && exp.endDate < exp.startDate) {
    throw new ValidationException("A data de término da experiência não pode ser anterior à data de início");
  }
}

function validateEducations(educations) {
  if (!educations?.length) return;
  educations.forEach(validateEducationDateRange);
}

function validateExperiences(experiences) {
  if (!experiences?.length) return;
  const currentlyWorkingCount = experiences.filter((exp) => exp.isCurrentlyWorking).length;
  if (currentlyWorkingCount > MAX_CURRENTLY_WORKING_EXPERIENCES) {
    throw new ValidationException("Apenas uma experiência pode ser marcada como atualmente trabalhando");
  }
  experiences.forEach(validateExperienceDateRange);
}

function ensureStudentExists(student) {
  if (!student) throw new NotFoundException("Estudante não encontrado");
}

function ensureStudentOwnedByUser(student, currentUser) {
  ensureStudentExists(student);
  if (student.userId !== currentUser.id) {
    throw new UnauthorizedException('Você não tem permissão para acessar este estudante');
  }
}

function ensureCanAccessStudent(student, currentUser) {
  ensureStudentExists(student);
  const isYourself = student.userId === currentUser.id;
  if (isYourself && currentUser.role === Role.STUDENT) return;

  if (!isYourself && !ROLES_CAN_LIST_STUDENTS.includes(currentUser.role)) {
    throw new UnauthorizedException('Você não tem permissão para acessar este estudante');
  }
}

function ensureCanListStudents(currentUser) {
  if (!ROLES_CAN_LIST_STUDENTS.includes(currentUser.role)) {
    throw new UnauthorizedException('Você não tem permissão para listar estudantes');
  }
}

async function createEducations(studentId, educations, transaction) {
  if (!educations?.length) return;
  validateEducations(educations);
  const records = educations.map((edu) => ({ ...edu, studentId }));
  await StudentEducation.bulkCreate(records, { transaction });
}

async function createExperiences(studentId, experiences, transaction) {
  if (!experiences?.length) return;
  validateExperiences(experiences);
  const records = experiences.map((exp) => ({ ...exp, studentId }));
  await StudentExperience.bulkCreate(records, { transaction });
}

async function createSkills(studentId, skills, transaction) {
  if (!skills?.length) return;
  const records = skills.map((skill) => ({ ...skill, studentId }));
  await StudentSkill.bulkCreate(records, { transaction });
}

async function createCertifications(studentId, certifications, transaction) {
  if (!certifications?.length) return;
  const records = certifications.map((cert) => ({ ...cert, studentId }));
  await StudentCertification.bulkCreate(records, { transaction });
}

async function replaceEducations(studentId, educations, transaction) {
  await StudentEducation.destroy({ where: { studentId }, transaction });
  await createEducations(studentId, educations ?? [], transaction);
}

async function replaceExperiences(studentId, experiences, transaction) {
  await StudentExperience.destroy({ where: { studentId }, transaction });
  await createExperiences(studentId, experiences ?? [], transaction);
}

async function replaceSkills(studentId, skills, transaction) {
  await StudentSkill.destroy({ where: { studentId }, transaction });
  await createSkills(studentId, skills ?? [], transaction);
}

async function replaceCertifications(studentId, certifications, transaction) {
  await StudentCertification.destroy({ where: { studentId }, transaction });
  await createCertifications(studentId, certifications ?? [], transaction);
}

async function createLanguages(studentId, languages, transaction) {
  if (!languages?.length) return;
  const records = languages.map((lang) => ({ ...lang, studentId }));
  await StudentLanguage.bulkCreate(records, { transaction });
}

async function replaceLanguages(studentId, languages, transaction) {
  await StudentLanguage.destroy({ where: { studentId }, transaction });
  await createLanguages(studentId, languages ?? [], transaction);
}

async function findStudentWithDetail(id, options = {}) {
  const { attributes = { exclude: STUDENT_ATTRIBUTES_EXCLUDE } } = options;
  return Student.findByPk(id, {
    include: getStudentDetailIncludeOptions(),
    attributes,
  });
}

module.exports.findById = async (params) => {
  const { id, currentUser } = params;

  const student = await Student.findByPk(id, {
    include: getStudentDetailIncludeOptions(),
    attributes: { exclude: STUDENT_ATTRIBUTES_EXCLUDE },
  }).then(s => s.toJSON());

  ensureCanAccessStudent(student, currentUser);

  delete student.userId;

  return student;
};

module.exports.findCurrent = async (currentUser) => {
  if (currentUser.role !== Role.STUDENT) throw new UnauthorizedException();

  const student = await Student.findOne({ 
    where: { userId: currentUser.id }, 
    include: getStudentDetailIncludeOptions(), 
    attributes: { exclude: STUDENT_ATTRIBUTES_EXCLUDE } 
  }).then(s => s.toJSON());
  
  delete student.userId;

  return student;
};

module.exports.findMany = async (params) => {
  const { currentUser, limit, offset, skillIds, ...filters } = params;

  ensureCanListStudents(currentUser);

  const where = buildFindManyWhere(filters);

  const { rows: students, count } = await Student.findAndCountAll({
    where,
    include: getStudentListIncludeOptions(skillIds),
    attributes: { exclude: STUDENT_ATTRIBUTES_EXCLUDE },
    distinct: true,
    limit,
    offset,
  });

  const records = students.map((s) => {
    const json = s.toJSON ? s.toJSON() : s;
    delete json.userId;
    return json;
  });

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

module.exports.create = async (payload) => {
  const { educations, experiences, skills, certifications, languages, user, ...profileData } = payload;

  const existingUser = await User.findOne({ where: { email: user.email } });
  if (existingUser) throw new ConflictException("Usuário já existe");

  const existingStudent = await Student.findOne({
    where: {
      enrollmentNumber: profileData.enrollmentNumber
    },
  });
  if (existingStudent) throw new ConflictException("Estudante já existe");

  const transaction = await sequelize.transaction();

  try {
    const createdUser = await User.create(
      {
        email: user.email,
        password: await hashingUtil.hash(user.password),
        role: Role.STUDENT,
        isActive: true,
      },
      { transaction },
    );

    const student = await Student.create(
      { ...profileData, userId: createdUser.id },
      { transaction },
    );

    await createEducations(student.id, educations, transaction);
    await createExperiences(student.id, experiences, transaction);
    await createSkills(student.id, skills, transaction);
    await createCertifications(student.id, certifications, transaction);
    await createLanguages(student.id, languages, transaction);

    await transaction.commit();
    return findStudentWithDetail(student.id).then(s => { delete s.userId; return s; });
  } catch (e) {
    await transaction.rollback();
    console.error('[student-business.create]', e?.message ?? e);
    if (e?.stack) console.error(e.stack);
    throw new AppException("Erro ao criar perfil de estudante");
  }
};

module.exports.update = async (params) => {
  const { id, currentUser, payload } = params;

  if (currentUser.role !== Role.STUDENT) throw new UnauthorizedException();

  const student = await Student.findByPk(id).then(s => s.toJSON());
  ensureStudentOwnedByUser(student, currentUser); 

  const { educations, experiences, skills, certifications, languages, ...profileData } = payload;
  const transaction = await sequelize.transaction();

  try {
    await Student.update(profileData, { where: { id }, transaction });

    if (educations.length > 0) await replaceEducations(id, educations, transaction);
    if (experiences.length > 0) await replaceExperiences(id, experiences, transaction);
    if (skills.length > 0) await replaceSkills(id, skills, transaction);
    if (certifications.length > 0) await replaceCertifications(id, certifications, transaction);
    if (languages.length > 0) await replaceLanguages(id, languages, transaction);

    await transaction.commit();
    return findStudentWithDetail(id).then(s => { delete s.userId; return s; });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof AppException) throw error;

    throw new AppException("Erro ao atualizar perfil de estudante");
  }
};

module.exports.deleteById = async (params) => {
  const { id, currentUser } = params;

  if (currentUser.role !== Role.STUDENT) throw new UnauthorizedException();

  const student = await Student.findByPk(id);
  ensureStudentOwnedByUser(student, currentUser);

  await student.destroy();
};

module.exports.addView = async (params) => {
  const { studentId, companyId, currentUser } = params;

  if (currentUser.role !== Role.COMPANY) throw new UnauthorizedException();

  const student = await Student.findByPk(studentId);
  ensureStudentExists(student);

  const company = await Company.findByPk(companyId);
  if (!company) throw new NotFoundException("Company not found");

  const today = new Date().toISOString().split("T")[0];

  const existingView = await StudentView.findOne({
    where: { studentId, companyId, viewedAt: today },
  });
  if (existingView) throw new ConflictException("Visualização já existe");

  await StudentView.create({ studentId, companyId, viewedAt: today });

  return StudentView.findOne({
    where: { studentId, companyId, viewedAt: today },
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["id", "trade_name", "corporate_name", "logo_url"],
      },
      {
        model: Student,
        as: "student",
        attributes: ["id", "fullName", "academicEmail", "phoneNumber"],
      },
    ],
    attributes: { exclude: ["studentId", "companyId"] },
  });
};

module.exports.addResume = async (params) => {
  const { studentId, currentUser, resume } = params;

  if (currentUser.role !== Role.STUDENT) throw new UnauthorizedException();

  const student = await Student.findByPk(studentId);
  ensureStudentOwnedByUser(student, currentUser);

  const resumeKey = `students/${studentId}/resume.pdf`;
  const resumeUrl = await storageUtil.upload(resumeKey, resume, "application/pdf");
  await student.update({ resumeUrl });

  return { resumeUrl };
};

const IMAGE_MIMETYPE_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getExtensionFromMimetype(mimetype) {
  if (!mimetype) return "jpg";
  const normalized = mimetype.split(";")[0].trim().toLowerCase();
  return IMAGE_MIMETYPE_EXT[normalized] ?? "jpg";
}

module.exports.addProfilePicture = async (params) => {
  const { studentId, currentUser, profilePicture, mimetype } = params;

  if (currentUser.role !== Role.STUDENT) throw new UnauthorizedException();

  const student = await Student.findByPk(studentId);
  ensureStudentOwnedByUser(student, currentUser);

  const ext = getExtensionFromMimetype(mimetype);
  const contentType = mimetype?.split(";")[0]?.trim() ?? "image/jpeg";
  const profilePictureKey = `students/${studentId}/profile-picture.${ext}`;
  const profilePictureUrl = await storageUtil.upload(
    profilePictureKey,
    profilePicture,
    contentType,
  );
  await student.update({ profilePictureUrl });

  return { profilePictureUrl };
};

/**
 * Percentual de completude do perfil (0–100).
 * Considera: campos obrigatórios/opcionais preenchidos, desconsidera valores default do model.
 * Arrays (educations, experiences, skills, certifications, languages) contam se tiverem pelo menos 1 item.
 */
module.exports.getProfileCompletationPercentage = async (currentUser) => {
  if (currentUser.role !== Role.STUDENT) throw new UnauthorizedException();

  const student = await Student.findOne({
    where: { userId: currentUser.id },
    include: [
      getEducationInclude(),
      getExperienceInclude(),
      getSkillInclude({ attributes: SKILL_ATTRIBUTES_EXCLUDE }),
      getCertificationInclude(),
      getLanguageInclude(),
    ],
  });
  ensureStudentExists(student);

  const s = typeof student.toJSON === "function" ? student.toJSON() : student;
  const filled = (val) =>
    val != null && val !== "" && (typeof val !== "number" || (!Number.isNaN(val) && val !== 0));
  const hasArray = (arr) => Array.isArray(arr) && arr.length >= 1;
  const hasAddress =
    (filled(s.addressZipCode) || filled(s.addressStreet)) &&
    filled(s.addressCity);
  const hasBioOrAbout = filled(s.bio) || filled(s.about);
  const hasSocialLink =
    filled(s.linkedinUrl) || filled(s.githubUrl) || filled(s.portfolioUrl);
  const hasDiversity =
    filled(s.gender) || filled(s.race) || filled(s.genderExpression);
  const hasSalary =
    s.salaryExpectationMin != null &&
    s.salaryExpectationMin !== "" &&
    Number(s.salaryExpectationMin) >= 0;

  const criteria = [
    filled(s.fullName),
    filled(s.birthDate),
    filled(s.phoneNumber),
    filled(s.headline),
    hasBioOrAbout,
    filled(s.academicEmail),
    hasSocialLink,
    filled(s.resumeUrl),
    filled(s.profilePictureUrl),
    filled(s.mainEducationLevel),
    s.isCurrentlyWorking !== null && s.isCurrentlyWorking !== undefined,
    hasDiversity,
    hasAddress,
    hasArray(s.targetRoles),
    hasSalary,
    hasArray(s.workModels),
    hasArray(s.contractTypes),
    s.availableForRelocation !== null && s.availableForRelocation !== undefined,
    s.availabilityToStart !== null && s.availabilityToStart !== undefined,
    hasArray(s.educations),
    hasArray(s.experiences),
    hasArray(s.skills),
    hasArray(s.certifications),
    hasArray(s.languages),
  ];

  const total = criteria.length;
  const count = criteria.filter(Boolean).length;
  const percent = Math.round((count / total) * 100);
  return Math.min(100, Math.max(0, percent));
};