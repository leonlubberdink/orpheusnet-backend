const Group = require('../models/groupModel');
const factory = require('./controllerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getAllGroups = factory.getAll(Group);
exports.updateGroup = factory.updateOne(Group);
exports.deleteGroup = factory.deleteOne(Group);

exports.startNewGroup = catchAsync(async (req, res, next) => {
  req.body.groupAdmins = [req.user.id];

  if (req.body.members) req.body.members.unshift(req.user.id);
  if (!req.body.members) req.body.members = [req.user.id];

  const newGroup = await Group.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: newGroup,
    },
  });
});

exports.getOneGroup = factory.getOne(Group);

exports.getMyGroups = catchAsync(async (req, res, next) => {
  console.log(req.user);
  //   const newGroup = await Group.create(req.body);

  res.status(201).json({
    status: 'success',
    // data: {
    //   data: newDoc,
    // },
  });
});
