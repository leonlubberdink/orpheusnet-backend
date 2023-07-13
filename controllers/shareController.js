const Share = require('../models/shareModel');
const factory = require('./controllerFactory');
const catchAsync = require('../utils/catchAsync');

exports.createShare = factory.createOne(Share);
exports.getOneShare = factory.getOne(Share);
exports.updateShare = factory.updateOne(Share);
exports.deleteShare = factory.deleteOne(Share);

exports.getAllShares = factory.getAll(Share, {
  path: 'group user',
  select: 'groupName groupImage userName userImage',
});

exports.shareMusicInGroup = catchAsync(async (req, res, next) => {
  req.body.creator = [req.user.id];

  const newShare = await Share.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: newShare,
    },
  });
});
