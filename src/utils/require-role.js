const { ForbiddenException } = require('./app-exception');
const Role = require('../constants/role');

function requireRole(allowedRoles) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error('requireRole: allowedRoles must be a non-empty array');
  }
  const set = new Set(allowedRoles);
  return async (request, h) => {
    const credentials = request.auth?.credentials;
    if (!credentials || !credentials.role) {
      throw new ForbiddenException('Acesso negado');
    }
    if (!set.has(credentials.role)) {
      throw new ForbiddenException('Você não tem permissão para esta ação');
    }
    return h.continue;
  };
}

function studentOnly(request, h) {
  return requireRole([Role.STUDENT])(request, h);
}

function companyOrCollege(request, h) {
  return requireRole([Role.COMPANY, Role.COLLEGE])(request, h);
}

function companyOrCollegeOrAdmin(request, h) {
  return requireRole([Role.COMPANY, Role.COLLEGE, Role.ADMIN])(request, h);
}

function collegeOrAdmin(request, h) {
  return requireRole([Role.COLLEGE, Role.ADMIN])(request, h);
}

async function anyAuthenticated(request, h) {
  const credentials = request.auth?.credentials;
  if (!credentials || !credentials.role) {
    throw new ForbiddenException('Acesso negado');
  }
  return h.continue;
}

module.exports = {
  requireRole,
  studentOnly,
  companyOrCollege,
  companyOrCollegeOrAdmin,
  collegeOrAdmin,
  anyAuthenticated,
};
