const jobApplicationBusiness = require('./job-application-business');

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'DESC';

module.exports.findById = async (req, h) => {
  const { id } = req.params;
  const jobApplication = await jobApplicationBusiness.findById(id);
  return h.response(jobApplication).code(200);
};

module.exports.findMany = async (req, h) => {
  const { credentials } = req.auth;
  const { limit, offset, sortBy, sortOrder, ...query } = req.query;
  const data = await jobApplicationBusiness.findMany({
    currentUser: credentials,
    ...query,
    limit: Number(limit) || DEFAULT_LIMIT,
    offset: Number(offset) || DEFAULT_OFFSET,
    sortBy: sortBy || DEFAULT_SORT_BY,
    sortOrder: sortOrder || DEFAULT_SORT_ORDER,
  });
  return h.response(data).code(200);
};

module.exports.create = async (req, h) => {
  const { credentials } = req.auth;
  const { payload } = req;
  const jobApplication = await jobApplicationBusiness.create({
    currentUser: credentials,
    payload,
  });
  return h.response(jobApplication).code(201);
};

module.exports.updateCoverLetter = async (req, h) => {
  const { id } = req.params;
  const { credentials } = req.auth;
  const { payload } = req;
  const jobApplication = await jobApplicationBusiness.updateCoverLetter({
    id,
    currentUser: credentials,
    payload,
  });
  return h.response(jobApplication).code(200);
};

module.exports.updateStatus = async (req, h) => {
  const { id } = req.params;
  const { credentials } = req.auth;
  const { payload } = req;
  const jobApplication = await jobApplicationBusiness.updateStatus({
    id,
    currentUser: credentials,
    payload,
  });
  return h.response(jobApplication).code(200);
};

module.exports.computeScore = async (req, h) => {
  const { id } = req.params;
  const { credentials } = req.auth;
  const jobApplication = await jobApplicationBusiness.computeAndSaveScore({
    id,
    currentUser: credentials,
  });
  return h.response(jobApplication).code(200);
};
