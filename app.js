//Require node modules
const path = require('path');

//Require installed packages
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

//Require custom modules
const AppError = require('./utils/appError');
const credentials = require('./utils/credentials');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const shareRouter = require('./routes/shareRoutes');
const groupRouter = require('./routes/groupRoutes');

let corsOptions = {};

//Start express app
const app = express();

// 1 GLOBAL MIDDLEWARES

// MIDDLEWARE FOR DEVELOPMEN ENV
if (process.env.NODE_ENV === 'development') {
  console.log('DEVELOPMENT ENVIRONMENT');

  // Morgan Middleware for logging request info to console.
  app.use(morgan('dev'));

  corsOptions = {
    origin: process.env.LOCALHOST,
    methods: 'GET, POST, PUT,PATCH, DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
  };
}

if (process.env.NODE_ENV === 'production') {
  corsOptions = {
    origin: process.env.APP_DOMAIN,
    methods: 'GET, POST, PUT, PATCH, DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
  };
}

// MIDDLEWARES FOR PRODUCTION ENV
// Serving static files
// Serve static files from these directories
app.use('/group-img', express.static(__dirname + '/public/img/groups'));
app.use('/user-img', express.static(__dirname + '/public/img/users'));

///USE CORS
app.use(credentials);
app.use(cors(corsOptions));

// Set security https headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: ["'self'", 'data:', 'blob:'],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
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
  windowMs: 10 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});

// app.use('/api', limiter);

// Parse incoming requests with JSON payloads (body-parser)
app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: true })); // For form data

// pasre data from cookie
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Preventg parameter polution
app.use(
  hpp({
    whitelist: ['format', 'shareType'],
  })
);

// 2 ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/shares', shareRouter);
app.use('/api/v1/groups', groupRouter);

// Create AppError wenn non existing route is used
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
