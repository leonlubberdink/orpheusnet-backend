// Function that gets triggered on error in development
const sendErrDev = (err, res) => {
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
    res.status(err.statusCode).json({
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

  if (process.env.NODE_ENV === 'production') sendErrProd(err, res);
};
