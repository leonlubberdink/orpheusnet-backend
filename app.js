//Require node modules
const path = require('path');

//Require custom modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
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

// Create AppError wenn non existing route is used
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
