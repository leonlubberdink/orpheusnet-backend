const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'File is not an image! Please upload image files only.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserImage = upload.single('userImage');

exports.resizeUserImage = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `${req.body.userName.toLowerCase()}-${Date.now()}.jpeg`;

  console.log(req.file.filename);

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

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

exports.signup = catchAsync(async (req, res, next) => {
  console.log(req.file);
  req.body.userImage = req.file ? req.file.filename : 'default.jpg';

  const newUser = await User.create({
    userName: req.body.userName,
    email: req.body.email,
    userImage: req.body.userImage,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createAndSendJwtTokens(newUser, 201, res);
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
  createAndSendJwtTokens(user, 200, res);
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
  console.log(decoded);
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
