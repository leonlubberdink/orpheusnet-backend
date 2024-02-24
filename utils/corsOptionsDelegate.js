const allowedOrigins = [
  process.env.LOCALHOST,
  process.env.LOCALHOST_2,
  process.env.APP_DOMAIN,
];

// const credentials = (req, res, next) => {
//   const { origin } = req.headers;
//   console.log('ORIGIN: ', origin);
//   if (allowedOrigins.includes(origin)) {
//     res.header('Access-Control-Allow-Credentials', true);
//   }
//   console.log('HEADER: ', res.header('Access-Control-Allow-Credentials'));
//   next();
// };

const corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  let isDomainAllowed = allowedOrigins.includes(req.header('Origin'));

  if (isDomainAllowed) {
    // Enable CORS for this request
    corsOptions = {
      origin: true,
      credentials: true,
      optionsSuccessStatus: 204,
    }; // Reflect the request origin in the CORS response
  } else {
    // Disable CORS for this request
    corsOptions = { origin: false };
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

module.exports = corsOptionsDelegate;
