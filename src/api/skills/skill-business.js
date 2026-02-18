const { Op } = require('sequelize');
const Role = require('../../constants/role');
const {
  UnauthorizedException,
  NotFoundException,
} = require('../../utils/app-exception');
const { Skill } = require('../../config/database').models;

function ensureCollegeRole(currentUser) {
  if (currentUser.role !== Role.COLLEGE) {
    throw new UnauthorizedException();
  }
}

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
  const { currentUser, payload } = params;
  ensureCollegeRole(currentUser);
  return Skill.create(payload);
};

module.exports.update = async (params) => {
  const { id, currentUser, payload } = params;
  ensureCollegeRole(currentUser);

  const skill = await Skill.findByPk(id);
  if (!skill) {
    throw new NotFoundException('Skill not found');
  }
  return skill.update(payload);
};

module.exports.deleteById = async (params) => {
  const { id, currentUser } = params;
  ensureCollegeRole(currentUser);

  const skill = await Skill.findByPk(id);
  if (!skill) {
    throw new NotFoundException('Skill not found');
  }
  await skill.destroy();
};
