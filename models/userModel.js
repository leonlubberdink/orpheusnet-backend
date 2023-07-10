const mongoose = require('mongoose');
const { default: validator } = require('validator');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'A username must be provided'],
    unique: [
      true,
      'Username already in use, please choose a different username',
    ],
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, 'An email address must be provided'],
    unique: [
      true,
      'Email address already in use, please use a different email address',
    ],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please use a valid email address'],
  },
  userImage: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'group-admin', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'A password must contain at least 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: function (val) {
      return val === this.password;
    },
    message: 'Please use the same password',
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
