const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendAccessToken = (user, statusCode, res) => {
  const accessStoken = jwt.sign(
    { userName: user.userName },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN * 60 * 1000 }
  );

  res.status(statusCode).json({
    status: 'success',
    accessStoken,
    data: {
      user,
    },
  });
};

const createAndSendRefreshToken = async (user, statusCode, res) => {
  const refreshToken = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  await User.findByIdAndUpdate(user._id, { refreshToken });

  // cookieOptions.secure only works wenn using prowser in production
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', refreshToken, cookieOptions);

  // Remove password from response output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    refreshToken,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    userName: req.body.userName,
    email: req.body.email,
    userImage: req.body.userImage,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createAndSendRefreshToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { userName, password } = req.body;

  // 1) Check if email and password are sent
  if (!userName || !password)
    return next(
      new AppError('Please provide username or email and password', 400)
    );

  // 2) Check if user exists && passord is correct
  let user = await User.findOne({ userName: req.body.userName }).select(
    '+password'
  );

  if (!user)
    user = await User.findOne({ email: req.body.userName }).select('+password');

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect username/email or password!', 401));
  }

  // 3) If all is ok, send token to client
  createAndSendRefreshToken(user, 200, res);
});

// Only for rendered pages, no errors!
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  let user = '';
  let authenticated = false;

  if (req.cookies.jwt) {
    // 1) Verification cookie
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) return next();

    // 3) Check if user changed password after the token was issued
    if (currentUser.hasPasswordChangedAfter(decoded.iat)) return next();

    // Set authenticated: true, and user: currentUser
    authenticated = true;
    user = currentUser;
  }
  //THERE IS A LOGGED IN USER
  res.status(200).json({
    status: 'success',
    data: {
      authenticated,
      user,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('The user belonging to the token no longer exists.', 401)
    );

  // 4) Check if user changed password after the token was issued
  if (currentUser.hasPasswordChangedAfter(decoded.iat))
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );

  // Add current user to request, is usefull for further access control
  req.user = currentUser;

  //GRANT ACCESS TO PROTECTED ROUTE
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have persmission to perform this action.', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError('There is no user with that email address.', 404));

  // 2) Generate random token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Use this link to create a new Password: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password rest token (only valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get User based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) If token has not expired and user exists, set new Password
  const user = await User.findOne({ passwordResetToken: hashedToken });
  if (!user) {
    return next(new AppError('Invalid token!', 401));
  }

  if (user.hasTokenExpired()) {
    return next(new AppError('Token has expired!', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update changedPasswordAt property fo the user, in usermodel with presave hook
  // 4) Login user and send JWT
  createAndSendRefreshToken(user, 200, res);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed PW is correct
  if (!(await user.correctPassword(req.body.passwordCurrent))) {
    return next(new AppError('Your current password does not match!', 401));
  }

  // 3) Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createAndSendRefreshToken(user, 200, res);
});
