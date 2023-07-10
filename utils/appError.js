const AppError = function (message, statusCode) {
  this.message = message;
  this.statusCode = statusCode;

  this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  this.stack = Error().stack;
};

AppError.prototype = Object.create(Error.prototype);
AppError.prototype.name = 'AppError';
AppError.prototype.isOperational = true;

module.exports = AppError;
