const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');

let server, httpsServer;

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' });
const app = require('./app');

const database = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
).replace('<DATABASE_NAME>', process.env.DATABASE_NAME);

mongoose
  .connect(database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => console.log('DB Connection successful!'));

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 7999;
  server = app.listen(port, () => {
    console.log(`App listening on port ${port}...`);
  });
}

// HTTPS SERVER
if (process.env.NODE_ENV === 'production') {
  const httpsPort = process.env.SSL_PORT;

  const options = {
    key: fs.readFileSync(`${process.env.PRIV_KEY}`),
    cert: fs.readFileSync(`${process.env.PUB_KEY}`),
  };

  httpsServer = https.createServer(options, app);

  // Define your routes and middleware here
  httpsServer.listen(httpsPort, () => {
    console.log(`Server is running on port ${httpsPort}`);
  });
}

// Handle unhandled rejected promisses
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
