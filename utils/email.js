const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { htmlToText } = require('html-to-text');

const getConfirmAccountTemplate = require('../templates/getConfirmAccountTemplate');
const getResetPasswordTemplate = require('../templates/getResetPasswordTemplate');
const getInviteExistingUserTemplate = require('../templates/getInviteExistingUserTemplate');
const getInviteNewUserTemplate = require('../templates/getInviteNewUserTemplate');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const devTransporter = {
  host: process.env.DEV_EMAIL_HOST,
  port: process.env.DEV_EMAIL_PORT,
  auth: {
    user: process.env.DEV_EMAIL_USERNAME,
    pass: process.env.DEV_EMAIL_PASSWORD,
  },
};

const prodTransporter = {
  service: 'SendGrid',
  auth: {
    user: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_PASSWORD,
  },
};

module.exports = class Email {
  constructor(user, url, communityName) {
    this.to = user.email;
    this.userName = user.userName;
    this.communityName = communityName;
    this.url = url;
    this.from = `Orpheusnet <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport(prodTransporter);
    }

    return nodemailer.createTransport(devTransporter);
  }

  async send(html, subject) {
    // Define mail options:
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // Create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendConfirmAccount() {
    const template = getConfirmAccountTemplate(this.userName, this.url);
    await this.send(
      template,
      'Welcome to Orpheusnet! Please confirm your account'
    );
  }

  async sendForgotPassword() {
    const template = getResetPasswordTemplate(this.url);
    await this.send(template, 'You requested to reset your password.');
  }

  async sendinviteExistingUser() {
    const template = getInviteExistingUserTemplate(this.communityName);
    await this.send(
      template,
      'You got invited to join a community on Orpheus.net.'
    );
  }

  async sendInviteNewUser() {
    const template = getInviteNewUserTemplate(this.url, this.communityName);
    await this.send(
      template,
      'You got invited to join a community on Orpheus.net.'
    );
  }
};
