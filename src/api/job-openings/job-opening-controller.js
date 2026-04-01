const jobOpeningBusiness = require('./job-opening-business');

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'DESC';

module.exports.findById = async (req, h) => {
  const { id } = req.params;
  const jobOpening = await jobOpeningBusiness.findById(id);
  return h.response(jobOpening).code(200);
};

module.exports.findMany = async (req, h) => {
  const jobOpeningsResponse = await jobOpeningBusiness.findMany({
    ...req.query,
    limit: Number(req.query.limit) || DEFAULT_LIMIT,
    offset: Number(req.query.offset) || DEFAULT_OFFSET,
    sortBy: req.query.sortBy || DEFAULT_SORT_BY,
    sortOrder: req.query.sortOrder || DEFAULT_SORT_ORDER,
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