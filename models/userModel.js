const crypto = require('crypto');
const mongoose = require('mongoose');
const { default: validator } = require('validator');
const bcrypt = require('bcrypt');

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
    unique: [true, 'Email already in use, please choose a different username'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  userImage: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
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
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
  ],
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasPasswordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp;
  }

  //False means NOT Changed
  return false;
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 600000; //set to 600000ms = 10min
  return resetToken;
};

userSchema.methods.hasTokenExpired = function () {
  if (this.passwordResetExpires < Date.now()) return true;
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
