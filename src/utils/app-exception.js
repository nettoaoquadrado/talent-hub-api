class AppException extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isAppException = true;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestException extends AppException {
  constructor(message, details = null) {
    super(message, 400, 'BAD_REQUEST');
    this.details = details;
  }
}

class ValidationException extends AppException {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundException extends AppException {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }
}

class UnauthorizedException extends AppException {
  constructor(message) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenException extends AppException {
  constructor(message) {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictException extends AppException {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  AppException,
  ValidationException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
};
