const Share = require('../models/shareModel');
const factory = require('./controllerFactory');
const catchAsync = require('../utils/catchAsync');

const popOptions = {
  path: 'group user',
  select: 'groupName groupImage userName userImage',
};

exports.deleteShare = factory.deleteOne(Share);

exports.getAllSharesInGroup = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.groupId) filter = { group: req.params.groupId };

  const shares = await Share.find(filter).populate(popOptions);

  res.status(201).json({
    status: 'success',
    results: shares.length,
    data: {
      data: shares,
    },
  });
});

exports.createShare = catchAsync(async (req, res, next) => {
  const newShare = await Share.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: newShare,
    },
  });
});

exports.setGroupUserIds = (req, res, next) => {
  // Get params from nested routes
  if (!req.body.group) req.body.group = req.params.groupId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
