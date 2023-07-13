const Share = require('../models/shareModel');
const factory = require('./controllerFactory');
const catchAsync = require('../utils/catchAsync');
const { filter } = require('lodash');

exports.createShare = factory.createOne(Share);
exports.getOneShare = factory.getOne(Share);
exports.updateShare = factory.updateOne(Share);
exports.deleteShare = factory.deleteOne(Share);

exports.getAllShares = factory.getAll(Share, {
  path: 'group user',
  select: 'groupName groupImage userName userImage',
});

exports.getAllSharesInGroup = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.groupId) filter = { group: req.params.groupId };

  const shares = await Share.find(filter);

  res.status(201).json({
    status: 'success',
    results: shares.length,
    data: {
      data: shares,
    },
  });
});

exports.shareMusicInGroup = catchAsync(async (req, res, next) => {
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
