const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image')) {
    return cb(new AppError('Only image files are allowed!', 400), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserImage = upload.single('userImage');
exports.uploadGroupImage = upload.single('groupImage');

exports.resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${
    req.body.userName || req.user.userName
  }-${Date.now()}.jpg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`../public_images/img/users/${req.file.filename}`);

  next();
});

exports.resizeGroupImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `${req.body.groupName
    .replaceAll(' ', '-')
    .toLowerCase()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`../public_images/img/groups/${req.file.filename}`);

  next();
});
