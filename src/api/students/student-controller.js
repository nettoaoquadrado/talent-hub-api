const studentBusiness = require('./student-business');

module.exports.findById = async (req, h) => {
  const { id } = req.params;
  const { credentials } = req.auth;
  const student = await studentBusiness.findById({ id, currentUser: credentials });
  return h.response(student).code(200);
};

module.exports.findMe = async (req, h) => {
  const student = await studentBusiness.findCurrent(req.auth.credentials);
  return h.response(student).code(200);
};

module.exports.findMany = async (req, h) => {
  const data = await studentBusiness.findMany({
    currentUser: req.auth.credentials,
    ...req.query,
  });
  return h.response(data).code(200);
};

module.exports.create = async (req, h) => {
  const student = await studentBusiness.create(req.payload);
  return h.response(student).code(201);
};

module.exports.update = async (req, h) => {
  const { id } = req.params;
  const { credentials } = req.auth;
  const student = await studentBusiness.update({
    id,
    currentUser: credentials,
    payload: req.payload,
  });
  return h.response(student).code(200);
};

module.exports.deleteById = async (req, h) => {
  const { id } = req.params;
  await studentBusiness.deleteById({ id, currentUser: req.auth.credentials });
  return h.response().code(204);
};

module.exports.addView = async (req, h) => {
  const { studentId, companyId } = req.params;
  await studentBusiness.addView({
    studentId,
    companyId,
    currentUser: req.auth.credentials,
  });
  return h.response().code(204);
};

module.exports.addResume = async (req, h) => {
  const { id } = req.params;
  const resume = req.payload?.resume?.buffer ?? req.payload?.resume;
  const result = await studentBusiness.addResume({
    studentId: id,
    currentUser: req.auth.credentials,
    resume,
  });
  return h.response(result).code(200);
};

module.exports.addProfilePicture = async (req, h) => {
  const file = req.payload?.profilePicture;
  const buffer = file?.buffer ?? file?._data ?? file;
  const mimetype =
    file?.mimetype ??
    file?.headers?.['content-type'] ??
    file?.hapi?.headers?.['content-type'] ??
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
  const percentage = await studentBusiness.getProfileCompletationPercentage(
    req.auth.credentials
  );
  return h.response({ percentage }).code(200);
};
