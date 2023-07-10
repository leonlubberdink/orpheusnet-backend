//Require node modules
const path = require('path');

//Require custom modules
const userRouter = require('./routes/userRoutes');
const shareRouter = require('./routes/shareRoutes');

//Require installed packages
const express = require('express');
const morgan = require('morgan');

//Start express app
const app = express();

// 1 MIDDLEWARES

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Morgan Middleware for development. Logging request info to console.
if (process.env.NODE_ENV === 'development') {
  console.log('DEVELOPMENT ENVIRONMENT');
  app.use(morgan('dev'));
}

// Parse incoming requests with JSON payloads (body-parser)
app.use(express.json({ limit: '10kb' }));

// 2 ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/shares', shareRouter);

app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.status = 'fail';
  err.statusCode = 404;
  next(err);
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
