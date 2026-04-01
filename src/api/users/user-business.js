const Role = require('../../constants/role');
const { UnauthorizedException, NotFoundException } = require('../../utils/app-exception');
const { User } = require('../../config/database').models;
const jwtUtil = require('../../utils/jwt-util');
const hashingUtil = require('../../utils/hashing-util');

function parseToDto(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports.findById = async (params) => {
  const { id, currentUser } = params;
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundException('Usuário não encontrado');
  const isSelf = user.id === currentUser.id;
  const canViewOthers = [Role.COLLEGE, Role.ADMIN].includes(currentUser.role);
  if (!isSelf && !canViewOthers) throw new UnauthorizedException();
  return parseToDto(user);
};

module.exports.findMany = async (params) => {
  const { role, isActive, email, limit, offset } = params;

  const where = {};
  if (role) where.role = role;
  where.isActive = isActive;
  if (email) where.email = email;

  const { rows: users, count } = await User.findAndCountAll({
    where,
    limit,
    offset,
  });

  return {
    records: users.map((u) => parseToDto(u)),
    meta: {
      total: count,
      limit,
      offset,
    },
  };
};

module.exports.auth = async (params) => {
  const { email, password } = params;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new UnauthorizedException('Email ou senha inválidos');
  }

  const valid = await hashingUtil.compare(password, user.password);
  if (!valid) {
    throw new UnauthorizedException('Email ou senha inválidos');
  }

  const token = await jwtUtil.genToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  return { accessToken: token, user: parseToDto(user) };
};

module.exports.changePassword = async (params) => {
  const { oldPassword, newPassword, currentUser } = params;
  const user = await User.findByPk(currentUser.id);

  const valid = await hashingUtil.compare(oldPassword, user.password);
  if (!valid) {
    throw new UnauthorizedException('Senha antiga inválida');
  }

  user.password = await hashingUtil.hash(newPassword);
  await user.save();
};
