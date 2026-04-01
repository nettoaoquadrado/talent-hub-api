const { Op } = require('sequelize');
const { NotFoundException } = require('../../utils/app-exception');
const { Skill } = require('../../config/database').models;

module.exports.findById = (id) => Skill.findByPk(id);

module.exports.findMany = async (params) => {
  const { name, type, limit, offset } = params;
  const where = {};
  if (type) where.type = type;
  if (name) where.name = { [Op.like]: `%${name}%` };

  const { rows: skills, count } = await Skill.findAndCountAll({
    where,
    limit,
    offset,
  });

  return {
    records: skills,
    meta: {
      total: count,
      limit,
      offset,
    },
  };
};

module.exports.create = (params) => {
  const { payload } = params;
  return Skill.create(payload);
};

module.exports.update = async (params) => {
  const { id, payload } = params;

  const skill = await Skill.findByPk(id);
  if (!skill) {
    throw new NotFoundException('Skill not found');
  }
  return skill.update(payload);
};

module.exports.deleteById = async (params) => {
  const { id } = params;
  const skill = await Skill.findByPk(id);
  if (!skill) throw new NotFoundException('Skill não encontrado');
  await skill.destroy();
};
