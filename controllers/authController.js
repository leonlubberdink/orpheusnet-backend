const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const Group = require('../models/groupModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const clearCookie = (res) => {
  if (process.env.NODE_ENV === 'development') {
    res.clearCookie('jwt', {
      httpOnly: true,
    });
  }

  if (process.env.NODE_ENV === 'production') {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
    });
  }
};

const signToken = (id, type) => {
  if (type === 'refresh')
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

  if (type === 'access')
    return jwt.sign({ id }, process.env.ACCES_TOKEN_SECRET, {
      expiresIn: process.env.ACCES_TOKEN_EXPIRES_IN,
    });
};

const createAndSendJwtTokens = async (user, statusCode, res) => {
  const accessToken = signToken(user._id, 'access');
  const refreshToken = signToken(user._id, 'refresh');

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  const userWithNewRefreshToken = await User.findByIdAndUpdate(
    user._id,
    {
      refreshToken,
    },
    { new: true }
  );

  // Set cookieOptions.secure (only works wenn using browser in production)
  // Send refreshToken as httpOnly cookie
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', refreshToken, cookieOptions);

  // Remove password from response output, and send accessToken as json
  userWithNewRefreshToken.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    accessToken,
    data: {
      user: userWithNewRefreshToken,
    },
  });
};

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
  createAndSendJwtTokens(user, 200, res);
});

exports.signup = catchAsync(async (req, res, next) => {
  req.body.userImage = req.file ? req.file.filename : 'default.jpg';

  let group = {};

  if (req.body.groupToSignupFor) {
    group = await Group.findById(req.body.groupToSignupFor);

    if (!group.invitedUsers.includes(req.body.email)) {
      return next(
        new AppError(
          'Please sign up with the email that received the invite to join the community.',
          401
        )
      );
    }
  }

  const newUser = await User.create({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    userImage: req.file?.filename || 'default.jpg',
    groups: req.body.groupToSignupFor ? [req.body.groupToSignupFor] : [],
  });

  if (req.body.groupToSignupFor) {
    const newIvitesArray = group.invitedUsers.filter(
      (invite) => invite !== req.body.email
    );
    group.members.push(newUser._id);
    group.invitedUsers = newIvitesArray;
    await group.save();
  }

  // Generate email verification token
  const emailVerificationToken = newUser.createEmailVerificationToken();

  // Don't forget to save the user document after modifying it
  await newUser.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/verifyEmail/${emailVerificationToken}`;

  await new Email(req.body, verificationUrl, '').sendConfirmAccount();

  createAndSendJwtTokens(newUser, 201, res);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  // 1. Get the token from the URL parameter
  const token = req.params.token;

  // 2. Hash the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // 3. Find the user by the hashed token and ensure the token hasn't expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  // 4. If no user is found or token has expired, handle the error
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 5. Update the user's status to mark the email as verified
  user.emailVerified = true;
  user.emailVerificationToken = undefined; // Clear the token fields after verification
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const url =
    process.env.NODE_ENV === 'development'
      ? process.env.LOCALHOST
      : process.env.APP_DOMAIN;

  res.redirect(`${url}/isconfirmed`);
});

exports.logout = catchAsync(async (req, res, next) => {
  // On client also delete accessToken from memory

  // Get cookies
  const cookies = req.cookies;

  // Get check if jwt token in cookie, if not, return success
  if (!cookies?.jwt) {
    return res.status(204).json({
      status: 'success',
    });
  }

  // If JWT token, search User belonging to this token
  const refreshToken = cookies.jwt;
  const user = await User.findOne({ refreshToken });

  // If no user, clear cookie, and return success
  if (!user) {
    clearCookie(req, res, next);
    return res.status(204).json({
      status: 'success',
    });
  }

  // If user is found, remove refreshtoken from user in database.
  await User.findByIdAndUpdate(user._id, { refreshToken: '' });

  clearCookie(res);

  res.status(204).json({
    status: 'success',
  });
});

exports.refreshAccessToken = catchAsync(async (req, res, next) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );
  }

  const refreshToken = cookies.jwt;

  const user = await User.findOne({ refreshToken });

  if (!user) return next(new AppError('Forbidden', 403));

  const decoded = await promisify(jwt.verify)(
    refreshToken,
    process.env.JWT_SECRET
  );

  if (!decoded || user.id !== decoded?.id)
    return next(new AppError('Forbidden', 403));

  if (user.hasPasswordChangedAfter(decoded.iat))
    return next(new AppError('Forbidden', 403));

  const accessToken = signToken(decoded.id, 'access');

  res.status(200).json({
    status: 'success',
    accessToken,
    data: {
      user,
    },
  });
});

//This will be the new protect function
exports.verifyJWT = catchAsync(async (req, res, next) => {
  // 1) Getting Auth Headers and check if token is there
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.split(' ')[1]) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );
  }

  // 2) Verify token
  const token = authHeader.split(' ')[1];
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.ACCES_TOKEN_SECRET
  );

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

  const referer = req.headers['referer'] || req.headers['referrer'];

  if (!user)
    return next(new AppError('There is no user with that email address.', 404));

  // 2) Generate random token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send token to user's email
  const resetURL = `${referer}pwreset/${resetToken}`;

  try {
    new Email(user, resetURL, '').sendForgotPassword();

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
  createAndSendJwtTokens(user, 200, res);
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
  createAndSendJwtTokens(user, 200, res);
});
