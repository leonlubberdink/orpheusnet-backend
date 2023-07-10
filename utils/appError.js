const AppError = function (message, statusCode) {
  this.message = message;
  this.statusCode = statusCode;

  this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  this.stack = Error().stack;
  this.isOperational = true;
};

AppError.prototype = Object.create(Error.prototype);

module.exports = AppError;
