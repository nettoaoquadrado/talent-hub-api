const skillBusiness = require('./skill-business');

module.exports.findById = async (req, h) => {
  const { id } = req.params;

  const skill = await skillBusiness.findById(id);

  return h.response(skill).code(200);
};

module.exports.findMany = async (req, h) => {
  const { name, type, limit, offset } = req.query;

  const skills = await skillBusiness.findMany({
    name,
    type,
    limit,
    offset,
  });

  return h.response(skills).code(200);
};

module.exports.create = async (req, h) => {
  const skill = await skillBusiness.create({ payload: req.payload });
  return h.response(skill).code(201);
};

module.exports.update = async (req, h) => {
  const { id } = req.params;
  const skill = await skillBusiness.update({ id, payload: req.payload });
  return h.response(skill).code(200);
};

module.exports.deleteById = async (req, h) => {
  const { id } = req.params;
  await skillBusiness.deleteById({ id });
  return h.response().code(204);
};
