//Require node modules
const path = require('path');

//Require installed packages
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

//Require custom modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const shareRouter = require('./routes/shareRoutes');

//Start express app
const app = express();

// 1 GLOBAL MIDDLEWARES

// MIDDLEWARE FOR DEVELOPMEN ENV
if (process.env.NODE_ENV === 'development') {
  console.log('DEVELOPMENT ENVIRONMENT');

  // Morgan Middleware for logging request info to console.
  app.use(morgan('dev'));

  // // Custom, Middleware for testing purposes
  // app.use((req, res, next) => {
  //   console.log(req.headers);
  //   next();
  // });
}

// MIDDLEWARES FOR PRODFUCTION ENV
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security https headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://bundle.js:*',
          'ws://localhost:*/',
        ],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});

app.use('/api', limiter);

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
