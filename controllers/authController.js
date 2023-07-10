const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./controllerFactory');

exports.signup = factory.createOne(User);
