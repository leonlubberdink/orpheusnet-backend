const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errorMsgs = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');

  const message = `Invalid input data. ${errorMsgs}`;
  return new AppError(message, 400);
};

const handleDuplicatedFieldsDB = (err) => {
  const message = `Duplicated field value: ${
    Object.values(err.keyValue)[0]
  }. Please use another value`;

  return new AppError(message, 400);
};

const handleJWTError = () => {
  const message = `Ivalid token, please login again`;
  return new AppError(message, 401);
};

const handleJWTExpiredError = () => {
  const message = `Your token has expired`;
  console.log(message);
  return new AppError(message, 401);
};

////////////////////////////////////////////////////////////

// Function that gets triggered on error in development
const sendErrDev = (err, res) => {
  console.log(err);
  if (err.name === 'TokenExpiredError') err.statusCode = 401;
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Function that gets triggered on error in production
const sendErrProd = (err, res) => {
  //Operational, trusted error: send message to client
  if (err.isOperational)
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

  //Programming or other unknown error: don't leak error details to client
  console.error('ERROR', sendErrProd);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong! Please try again',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') sendErrDev(err, res);

  if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.code === 11000) error = handleDuplicatedFieldsDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrProd(error, res);
  }
};
