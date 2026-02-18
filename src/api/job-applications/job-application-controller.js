const jobApplicationBusiness = require('./job-application-business');

module.exports.findById = async (req, h) => {
  const jobApplication = await jobApplicationBusiness.findById(req.params.id);

  return h.response(jobApplication).code(200);
};

module.exports.findMany = async (req, h) => {
  const jobApplicationsResponse = await jobApplicationBusiness.findMany({
    currentUser: req.auth.credentials,
    ...req.query,
    limit: Number(req.query.limit) || 20,
    offset: Number(req.query.offset) || 0,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'DESC',
  });

  return h.response(jobApplicationsResponse).code(200);
};

module.exports.create = async (req, h) => {
  const currentUser = req.auth.credentials;
  const { payload } = req;

  const jobApplication = await jobApplicationBusiness.create({ currentUser, payload });

  return h.response(jobApplication).code(201);
};

module.exports.updateCoverLetter = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;
  const { payload } = req;

  const jobApplication = await jobApplicationBusiness.updateCoverLetter({ id, currentUser, payload });

  return h.response(jobApplication).code(200);
};

module.exports.updateStatus = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;
  const { payload } = req;

  const jobApplication = await jobApplicationBusiness.updateStatus({ id, currentUser, payload });

  return h.response(jobApplication).code(200);
};
