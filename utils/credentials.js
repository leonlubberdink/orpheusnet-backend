const allowedOrigins = [
  process.env.LOCALHOST,
  process.env.LOCALHOST_2,
  process.env.APP_DOMAIN,
];

const credentials = (req, res, next) => {
  console.log('Credentials');
  const { origin } = req.headers;
  if (allowedOrigins.includes(origin)) {
    console.log('Add CORS Header');
    res.header('Access-Control-Allow-Credentials', true);
  }
  next();
};

module.exports = credentials;
