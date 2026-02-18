const jobOpeningBusiness = require('./job-opening-business');

module.exports.findById = async (req, h) => {
  const { id } = req.params;

  const jobOpening = await jobOpeningBusiness.findById(id);

  return h.response(jobOpening).code(200);
};

module.exports.findMany = async (req, h) => {

  const jobOpeningsResponse = await jobOpeningBusiness.findMany({
    ...req.query,
    limit: Number(req.query.limit) || 20,
    offset: Number(req.query.offset) || 0,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'DESC',
  });

  return h.response(jobOpeningsResponse).code(200);
};

module.exports.create = async (req, h) => {
  const currentUser = req.auth.credentials;
  const { payload } = req;

  const jobOpening = await jobOpeningBusiness.create({ currentUser, payload });

  return h.response(jobOpening).code(201);
};

module.exports.update = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;
  const { payload } = req;

  const jobOpening = await jobOpeningBusiness.update({ id, currentUser, payload });

  return h.response(jobOpening).code(200);
};

module.exports.deleteById = async (req, h) => {
  const { id } = req.params;
  const currentUser = req.auth.credentials;

  await jobOpeningBusiness.deleteById({ id, currentUser });

  return h.response().code(204);
};