const allowedOrigins = [
  process.env.LOCALHOST,
  process.env.LOCALHOST_2,
  process.env.APP_DOMAIN,
];

const credentials = (req, res, next) => {
  const { origin } = req.headers;
  console.log('ORIGIN: ', origin);
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Credentials', true);
  }
  console.log('HEADER: ', res.header('Access-Control-Allow-Credentials'));
  next();
};

module.exports = credentials;
