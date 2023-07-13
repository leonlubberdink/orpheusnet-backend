const Group = require('../models/groupModel');
const User = require('../models/userModel');
const factory = require('./controllerFactory');
const catchAsync = require('../utils/catchAsync');

const popOptions = {
  path: 'groupAdmins members',
  select: 'userName userImage',
};

exports.deleteGroup = factory.deleteOne(Group);
exports.getAllGroups = factory.getAll(Group, popOptions);

exports.startNewGroup = catchAsync(async (req, res, next) => {
  req.body.groupAdmins = [req.user.id];

  if (req.body.members) req.body.members.unshift(req.user.id);
  if (!req.body.members) req.body.members = [req.user.id];

  const newGroup = await Group.create(req.body);

  await User.findByIdAndUpdate(req.user.id, {
    $push: { groups: newGroup._id },
  });

  res.status(201).json({
    status: 'success',
    data: {
      data: newGroup,
    },
  });
});

exports.getMyGroups = catchAsync(async (req, res, next) => {
  console.log('Get my groups');
  let filter = {};
  if (req.params.userId) filter = { members: req.params.groupId };

  const shares = await Group.find(filter);

  res.status(201).json({
    status: 'success',
    // data: {
    //   data: newDoc,
    // },
  });
});
