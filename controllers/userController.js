const User = require('../models/userModel');
const factory = require('./controllerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

//////////////////////////////////
//Admin controllers
exports.createUser = factory.createOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getOneUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

//////////////////////////////////
// Helper functions
const filterRequest = (obj, ...allowedFields) => {
  const returnObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      returnObj[el] = obj[el];
    }
  });
  return returnObj;
};

//////////////////////////////////
// User controllers (loged in users)

// PATCH One user based on Id, on user request
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs Password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use "/updateMyPassword"',
        400
      )
    );
  }

  // 2) Filtered out unallowed changes (i.e. role)
  const allowedChanges = ['userName', 'email'];

  const filteredBody = filterRequest(req.body, ...allowedChanges);

  // 3) Update user document
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user,
  });
});

// DELETE One user based on Id, on user request
exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
