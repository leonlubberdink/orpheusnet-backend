const nodemailer = require('nodemailer');

const devTransporter = {
  host: process.env.DEV_EMAIL_HOST,
  port: process.env.DEV_EMAIL_PORT,
  auth: {
    user: process.env.DEV_EMAIL_USERNAME,
    pass: process.env.DEV_EMAIL_PASSWORD,
  },
};

const liveTransporter = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const transporterObject =
  process.env.NODE_ENV === 'development' ? devTransporter : liveTransporter;

const sendEmail = async (options) => {
  // 1) create transporter
  const transporter = nodemailer.createTransport(transporterObject);

  // 2) Define email options
  const mailOptions = {
    from: 'Orpheusnet <admin@orpheusnet.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
