class GeneralError extends Error {
  constructor(message, code = 500) {
    super();
    this.message = message;
    this.code = code;
  }
}

class BadRequest extends GeneralError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFound extends GeneralError {
  constructor(message) {
    super(message, 404);
  }
}

class Unauthorized extends GeneralError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class Conflict extends GeneralError {
  constructor(message) {
    super(message, 409);
  }
}

module.exports = {
  GeneralError,
  BadRequest,
  NotFound,
  Unauthorized,
  Conflict,
};
