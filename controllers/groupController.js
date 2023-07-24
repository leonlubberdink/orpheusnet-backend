const Group = require('../models/groupModel');
const User = require('../models/userModel');
const factory = require('./controllerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.checkIfGroupAdmin = catchAsync(async (req, res, next) => {
  console.log(req.params);
  if (req.user.role !== 'admin') {
    const group = await Group.findById(req.params.id).populate({
      path: 'groupAdmins',
      select: 'userName',
    });

    if (!group) return next(new AppError('Group not found', 403));

    let isGroupAdmin = false;
    group.groupAdmins.forEach((admin) => {
      if (admin.userName === req.user.userName) isGroupAdmin = true;
    });
    if (!isGroupAdmin) {
      return next(
        new AppError('Only Group Admins can perform this operation', 403)
      );
    }
  }
  next();
});

exports.deleteGroup = factory.deleteOne(Group);

exports.updateGroup = catchAsync(async (req, res, next) => {
  if (req.body.groupAdmins)
    return next(
      new AppError(
        'To add or remove Group Admins please use /:groupId/addAdmin and /:groupId/removeAdmin endpoints'
      )
    );

  if (req.body.members)
    return next(
      new AppError(
        'To add or remove Group Members please use /:groupId/addMember and /:groupId/removeMember endpoints'
      )
    );

  const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!group)
    return next(new AppError(`No group found with ID '${req.params.id}'`, 404));

  res.status(200).json({
    status: 'succes',
    data: {
      group,
    },
  });
});

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

exports.getUsersGroups = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.userId) filter = { members: req.params.userId };

  const groups = await Group.find(filter).select('groupName groupImage');

  res.status(200).json({
    status: 'success',
    data: {
      data: groups,
    },
  });
});

exports.addMember = catchAsync(async (req, res, next) => {
  // Create filter based on req.body (email or userId)
  let filter = {};

  if (req.body.userId) filter = { _id: req.body.userId };
  if (req.body.email) filter = { email: req.body.email };

  const [user, group] = await Promise.all([
    User.findOne(filter),
    Group.findById(req.params.id),
  ]);

  if (!user) {
    return next(new AppError('User not found'), 404);
  }

  if (group.members.includes(user._id)) {
    return next(new AppError('User is already a member'), 400);
  }

  const updatedGroup = await Group.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: { members: user._id },
    },
    {
      new: true,
    }
  );

  await User.findByIdAndUpdate(user._id, {
    $addToSet: { groups: req.params.id },
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedGroup,
    },
  });
});

exports.removeMember = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group.members.includes(req.body.user))
    return next(new AppError('No member found with that ID'), 404);

  const updatedGroup = await Group.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { members: req.body.user },
    },
    {
      new: true,
    }
  );

  await User.findByIdAndUpdate(req.body.user, {
    $pull: { groups: req.params.id },
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedGroup,
    },
  });
});

exports.addAdmin = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group.members.includes(req.body.user))
    return next(new AppError('No member found with that ID'), 404);

  const updatedGroup = await Group.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: { groupAdmins: req.body.user },
    },
    {
      new: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedGroup,
    },
  });
});

exports.removeAdmin = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group.groupAdmins.includes(req.body.user))
    return next(new AppError('No Group Admin found with that ID'), 404);

  const updatedGroup = await Group.findByIdAndUpdate(req.params.id, {
    $pull: { groupAdmins: req.body.user },
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedGroup,
    },
  });
});
