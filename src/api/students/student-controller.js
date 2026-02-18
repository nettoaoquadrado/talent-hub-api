const studentBusiness = require('./student-business');

module.exports.findById = async (req, h) => {
  const student = await studentBusiness.findById({ id: req.params.id, currentUser: req.auth.credentials, });

  return h.response(student).code(200);
};

module.exports.findMe = async (req, h) => {
  const student = await studentBusiness.findCurrent(req.auth.credentials);

  return h.response(student).code(200);
};

module.exports.findMany = async (req, h) => {
  const studentsResponse = await studentBusiness.findMany({
    currentUser: req.auth.credentials,
    ...req.query,
  });

  return h.response(studentsResponse).code(200);
};

module.exports.create = async (req, h) => {
  const { payload } = req;

  const student = await studentBusiness.create(payload);

  return h.response(student).code(201);
};

module.exports.update = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;
  const { payload } = req;

  const student = await studentBusiness.update({ id, currentUser, payload });

  return h.response(student).code(200);
};

module.exports.deleteById = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;

  await studentBusiness.deleteById({ id, currentUser });

  return h.response().code(204);
};

module.exports.addView = async (req, h) => {
  await studentBusiness.addView({ 
    studentId: req.params.studentId, 
    companyId: req.params.companyId, 
    currentUser: req.auth.credentials, 
  });

  return h.response().code(204);
};

module.exports.addResume = async (req, h) => {
  const resumeUrl = await studentBusiness.addResume({
    studentId: req.params.id,
    currentUser: req.auth.credentials,
    resume: req.payload?.resume?.buffer ?? req.payload?.resume,
  });

  return h.response({ resumeUrl }).code(200);
};

module.exports.addProfilePicture = async (req, h) => {
  const file = req.payload?.profilePicture;
  const buffer = file?.buffer ?? file?._data ?? file;
  const mimetype =
    file?.mimetype ??
    file?.headers?.['content-type'] ??
    file?.hapi?.headers?.['content-type'] ??
    file?.hapi?.headers?.['Content-Type'] ??
    'image/jpeg';

  const result = await studentBusiness.addProfilePicture({
    studentId: req.params.id,
    currentUser: req.auth.credentials,
    profilePicture: buffer,
    mimetype,
  });

  return h.response(result).code(200);
};

module.exports.getProfileCompletationPercentage = async (req, h) => {
  const percentage = await studentBusiness.getProfileCompletationPercentage(req.auth.credentials);

  return h.response({ percentage }).code(200);
};