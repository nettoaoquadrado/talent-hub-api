const ollama = require('./ollama-client');

const MAX_SKILLS = 35;
const MAX_EDUCATION = 20;
const MAX_EXPERIENCE = 15;
const MAX_LOCATION = 15;
const MAX_SALARY = 15;

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

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

async function computeScore(params) {
  const { job, student, coverLetter, jobEmbedding, studentEmbedding } = params;

  const breakdown = {
    skillsMatch: computeSkillsMatch(job, student),
    educationMatch: computeEducationMatch(job, student),
    experienceMatch: computeExperienceMatch(job, student),
    locationMatch: computeLocationMatch(job, student),
    salaryMatch: computeSalaryMatch(job, student),
  };

  let vectorSimilarity = null;
  if (Array.isArray(jobEmbedding) && Array.isArray(studentEmbedding) && jobEmbedding.length === studentEmbedding.length) {
    vectorSimilarity = ollama.cosineSimilarity(jobEmbedding, studentEmbedding);
  }

  const totalFromBreakdown =
    breakdown.skillsMatch + breakdown.educationMatch + breakdown.experienceMatch +
    breakdown.locationMatch + breakdown.salaryMatch;
  let finalScore = Math.round(Math.min(100, totalFromBreakdown));
  if (vectorSimilarity != null) {
    const vectorBonus = Math.round(vectorSimilarity * 15);
    finalScore = Math.min(100, finalScore + vectorBonus);
  }

  let aiInsights = null;
  try {
    aiInsights = await ollama.generate(
      buildInsightsPrompt(job, student, coverLetter, breakdown)
    );
  } catch (_e) {}

  return {
    finalScore,
    breakdown,
    ...(vectorSimilarity != null && { vectorSimilarity: Math.round(vectorSimilarity * 100) / 100 }),
    aiInsights,
  };
}

function computeSkillsMatch(job, student) {
  const requiredIds = job.requiredSkills || [];
  if (requiredIds.length === 0) return MAX_SKILLS;

  const studentSkillIds = (student.skills || []).map((s) =>
    typeof s.skillId !== 'undefined' ? s.skillId : s.skill?.id
  ).filter(Boolean);
  const studentSet = new Set(studentSkillIds.map(String));
  let match = 0;
  for (const id of requiredIds) {
    if (studentSet.has(String(id))) match++;
  }
  return Math.round((match / requiredIds.length) * MAX_SKILLS);
}

function computeEducationMatch(job, student) {
  const educations = student.educations || [];
  if (educations.length === 0) return 0;

  const jobDegree = job.degreeType || null;
  const requireComplete = job.requireCompleteGraduation === true;

  let best = 0;
  for (const ed of educations) {
    let score = 0;
    if (jobDegree && ed.degree === jobDegree) score += 12;
    else if (jobDegree) score += 4;

    if (requireComplete && ed.status === 'completed') score += 8;
    else if (!requireComplete && (ed.status === 'completed' || ed.status === 'in_progress')) score += 8;
    best = Math.max(best, Math.min(MAX_EDUCATION, score));
  }
  return best;
}

function computeExperienceMatch(job, student) {
  const minYears = job.minExperience != null ? Number(job.minExperience) : null;
  if (minYears == null || minYears <= 0) return MAX_EXPERIENCE;

  const studentYears = getTotalExperienceYears(student.experiences || []);
  if (studentYears >= minYears) return MAX_EXPERIENCE;
  const ratio = studentYears / minYears;
  if (ratio >= 0.5) return Math.round(MAX_EXPERIENCE * 0.7);
  if (ratio >= 0.25) return Math.round(MAX_EXPERIENCE * 0.4);
  return 0;
}

function computeLocationMatch(job, student) {
  const jobRemote = job.workModel === 'remote' || job.workModel === 'hybrid';
  const jobCity = (job.addressCity || '').trim().toLowerCase();
  const jobState = (job.addressState || '').trim().toLowerCase();
  const studentCity = (student.addressCity || '').trim().toLowerCase();
  const studentState = (student.addressState || '').trim().toLowerCase();
  const studentWorkModels = Array.isArray(student.workModels) ? student.workModels : [];
  const studentPrefersRemote = studentWorkModels.some((m) => m === 'remote' || m === 'hybrid');

  if (jobRemote && studentPrefersRemote) return MAX_LOCATION;
  if (jobRemote) return Math.round(MAX_LOCATION * 0.8);
  if (!jobCity) return Math.round(MAX_LOCATION / 2);
  if (studentCity && jobCity === studentCity) return MAX_LOCATION;
  if (studentState && jobState && studentState === jobState) return Math.round(MAX_LOCATION * 0.7);
  if (student.availableForRelocation === true) return Math.round(MAX_LOCATION / 2);
  return 0;
}

function computeSalaryMatch(job, student) {
  const studentMin = student.salaryExpectationMin != null ? Number(student.salaryExpectationMin) : null;
  const jobMax = job.salaryMax != null ? Number(job.salaryMax) : job.salary != null ? Number(job.salary) : null;
  const jobMin = job.salaryMin != null ? Number(job.salaryMin) : null;

  if (jobMax == null) return Math.round(MAX_SALARY / 2);
  if (studentMin == null) return Math.round(MAX_SALARY / 2);
  if (studentMin <= jobMax && (jobMin == null || studentMin >= jobMin)) return MAX_SALARY;
  if (studentMin <= jobMax) return 12;
  const ratio = jobMax / studentMin;
  if (ratio >= 0.8) return 8;
  if (ratio >= 0.6) return 5;
  return 0;
}

function buildInsightsPrompt(job, student, coverLetter, breakdown) {
  const jobTitle = job.title || 'Vaga';
  const jobDesc = (job.description || '').slice(0, 500);
  const jobReq = (job.requirements || []).slice(0, 12).join('. ');
  const skillNames = (job.requiredSkillNames || []).length
    ? job.requiredSkillNames.join(', ')
    : (job.requiredSkills || []).length
      ? 'Skills por ID (não listadas)'
      : 'Não especificadas';
  const jobWorkModel = job.workModel || 'não informado';
  const jobContract = job.contractType || 'não informado';
  const jobSeniority = job.seniority || 'não informado';
  const jobBenefits = [...(job.benefits || []), ...(job.otherBenefits || [])].slice(0, 8).join(', ') || 'não informados';
  const jobLocation = [job.addressCity, job.addressState].filter(Boolean).join(', ') || 'não informado';
  const jobSalaryRange =
    job.salaryMin != null || job.salaryMax != null
      ? `${job.salaryMin ?? '?'} - ${job.salaryMax ?? '?'}`
      : job.salary != null ? String(job.salary) : 'não informada';

  const studentSkills = (student.skills || [])
    .map((s) => {
      const name = s.skill?.name || s.name;
      const level = s.level ? ` (${s.level})` : '';
      return name ? name + level : null;
    })
    .filter(Boolean)
    .join(', ');
  const studentEdu = (student.educations || [])
    .map((e) => `${e.degree} em ${e.fieldOfStudy} - ${e.institution || '?'} (${e.status}${e.currentSemester != null ? `, ${e.currentSemester}º sem` : ''})`)
    .join('; ');
  const studentExp = (student.experiences || [])
    .map((e) => `${e.position} na ${e.company}${e.isCurrentlyWorking ? ' (atual)' : ''}`)
    .slice(0, 5)
    .join('; ');
  const studentCerts = (student.certifications || [])
    .map((c) => `${c.name} (${c.issuingOrganization})`)
    .slice(0, 5)
    .join('; ');
  const studentLangs = (student.languages || [])
    .map((l) => `${l.language} - ${l.proficiency}`)
    .join('; ');
  const bio = (student.bio || student.about || '').slice(0, 450);
  const headline = student.headline || '';
  const targetRoles = Array.isArray(student.targetRoles) ? student.targetRoles.join(', ') : '';
  const workModels = Array.isArray(student.workModels) ? student.workModels.join(', ') : '';
  const contractTypes = Array.isArray(student.contractTypes) ? student.contractTypes.join(', ') : '';
  const salaryExp = student.salaryExpectationMin != null ? String(student.salaryExpectationMin) : 'não informada';
  const availability = student.availabilityToStart === true ? 'Sim' : student.availabilityToStart === false ? 'Não' : 'não informado';
  const letter = (coverLetter || '').slice(0, 400);

  return `Você é um recrutador. Em UMA frase curta e objetiva em português do Brasil, resuma o fit do candidato para a vaga. Foque em: match de habilidades, formação, experiência e um ponto de atenção se houver.

--- VAGA ---
Título: ${jobTitle}
Descrição (trecho): ${jobDesc}
Requisitos: ${jobReq}
Skills desejadas: ${skillNames}
Modelo de trabalho: ${jobWorkModel} | Contrato: ${jobContract} | Senioridade: ${jobSeniority}
Local: ${jobLocation} | Faixa salarial: ${jobSalaryRange}
Benefícios: ${jobBenefits}

--- CANDIDATO ---
Skills (e nível): ${studentSkills || 'Não informadas'}
Formação: ${studentEdu || 'Não informada'}
Experiência: ${studentExp || 'Nenhuma'}
Certificações: ${studentCerts || 'Nenhuma'}
Idiomas: ${studentLangs || 'Não informados'}
Headline: ${headline}
Objetivo de cargos: ${targetRoles}
Modelos de trabalho de interesse: ${workModels}
Tipos de contrato de interesse: ${contractTypes}
Pretensão salarial: ${salaryExp} | Disponível para começar: ${availability}
Bio/Sobre: ${bio || 'Não informada'}
Carta de apresentação: ${letter || 'Não informada'}

Responda apenas com a frase, sem título nem bullet.`;
}

module.exports = {
  computeScore,
  getTotalExperienceYears,
};
