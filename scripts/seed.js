const path = require('path');
const fs = require('fs');
const { initDatabase, models } = require('../src/config/database');
const hashingUtil = require('../src/utils/hashing-util');

const SEEDS_DIR = path.join(__dirname, '..', 'seeds', 'data');

function readSeedFile(filename) {
  const filePath = path.join(SEEDS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

async function runSeed() {
  console.log('🌱 Iniciando seed...');
  await initDatabase();

  const {
    User,
    Skill,
    Company,
    Student,
    StudentEducation,
    StudentExperience,
    StudentSkill,
    StudentCertification,
    StudentLanguage,
    JobOpening,
    JobApplication,
    JobApplicationFeedback,
    StudentView,
  } = models;

  const steps = [
    { name: 'users', file: 'users.json', model: User, transform: async (rows) => {
      const hashed = await Promise.all(rows.map(async (r) => {
        const { password, ...rest } = r;
        return { ...rest, password: await hashingUtil.hash(password) };
      }));
      return hashed;
    }},
    { name: 'skills', file: 'skills.json', model: Skill },
    { name: 'companies', file: 'companies.json', model: Company },
    { name: 'students', file: 'students.json', model: Student },
    { name: 'student_education', file: 'student_education.json', model: StudentEducation },
    { name: 'student_experience', file: 'student_experience.json', model: StudentExperience },
    { name: 'student_skills', file: 'student_skills.json', model: StudentSkill },
    { name: 'student_certifications', file: 'student_certifications.json', model: StudentCertification },
    { name: 'student_languages', file: 'student_languages.json', model: StudentLanguage },
    { name: 'job_openings', file: 'job_openings.json', model: JobOpening },
    { name: 'job_applications', file: 'job_applications.json', model: JobApplication },
    { name: 'job_application_feedbacks', file: 'job_application_feedbacks.json', model: JobApplicationFeedback },
    { name: 'student_views', file: 'student_views.json', model: StudentView },
  ];

  for (const step of steps) {
    const rows = readSeedFile(step.file);
    if (rows.length === 0) {
      console.log(`  ⏭ ${step.name}: arquivo vazio ou inexistente, pulando.`);
      continue;
    }
    const data = step.transform ? await step.transform(rows) : rows;
    await step.model.bulkCreate(data, { validate: true });
    console.log(`  ✅ ${step.name}: ${data.length} registro(s) inserido(s).`);
  }

  console.log('✅ Seed concluído.');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
