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
const corsOptionsDelegate = require('./utils/corsOptionsDelegate');
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
}

if (process.env.NODE_ENV === 'production') {
  console.log('PRODUCTION ENVIRONMENT');
}

// MIDDLEWARES FOR PRODUCTION ENV
// Serving static files
// Serve static files from these directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/img', express.static(__dirname + '/public/img/'));
app.use('/group-img', express.static(__dirname + '/public/img/groups'));
app.use('/user-img', express.static(__dirname + '/public/img/users'));

///USE CORS
app.use(cors(corsOptionsDelegate));

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
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://orpheusnet.com:7998/user-img/', // Add this line
          'https://orpheusnet.com:7998',
        ],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'ws://localhost:*/',
          'https://orpheusnet.com',
          'https://orpheusnet.com:7998',
          'https://orpheusnet.com:7998/*',
        ],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  max: 300,
  windowMs: 10 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});

app.use('/api', limiter);

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

// Serve React app for any other route not handled by API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create AppError wenn non existing route is used
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
