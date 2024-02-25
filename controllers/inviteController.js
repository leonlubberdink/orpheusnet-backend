const validator = require('validator');

const User = require('../models/userModel');
const Group = require('../models/groupModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const sendInviteToExistingUser = catchAsync(async ({ user, communityName }) => {
  await new Email(user, '', communityName).sendinviteExistingUser();
});

const sendInviteToNewUser = catchAsync(async ({ user, url, communityName }) => {
  console.log(user, url, communityName);
  await new Email(user, url, communityName).sendInviteNewUser();
});

exports.inviteMember = catchAsync(async (req, res, next) => {
  const referer = req.headers['referer'] || req.headers['referrer'];
  const { groupId } = req.params;
  const { user: userNameOrEmail } = req.body;

  console.log(req.headers);

  // 1) Check if userName or E-mail address was sent
  if (!userNameOrEmail)
    return next(
      new AppError(
        'Please provide username or email address from the member you want to invite',
        400
      )
    );

  // 3) Check if user with username or e-mailaddress exists
  let user = await User.findOne({ userName: userNameOrEmail });
  if (!user) user = await User.findOne({ email: userNameOrEmail });

  // 3) Check if user is already a member of the group
  const group = await Group.findById(groupId);

  if (user && group.members.includes(user._id))
    return next(
      new AppError(
        "Good news! The person you're trying to invite is already part of our community!",
        400
      )
    );

  // 4) add user to invitedUsers array
  group.invitedUsers.push(user ? user.email : userNameOrEmail);
  group.save();

  // ) If userName does not exist return without info (privacy), send e-mail with invite for signup
  if (!user && validator.isEmail(userNameOrEmail)) {
    // Create verification URL
    const signUpUrl = `${referer}signup/${groupId}`;

    console.log(signUpUrl);

    sendInviteToNewUser({
      user: { email: userNameOrEmail },
      url: signUpUrl,
      communityName: group.groupName,
    });
  }

  // 6) If user exists, send e-mail with invite to group
  if (user) {
    sendInviteToExistingUser({ user, communityName: group.groupName });
    user.receivedInvites.push({
      groupId: group._id,
      groupName: group.groupName,
    });
    user.save();
  }

  res.status(201).json({
    status: 'success',
  });
});

exports.respondToInvite = catchAsync(async (req, res, next) => {
  const { hasAcceptedInvite, userId, groupId } = req.body;

  // 1) Check if userName or E-mail address was sent
  if (!hasAcceptedInvite || !userId || !groupId)
    return next(
      new AppError(
        'Invalid request, please provide userId, groupId and hasAcceptedInvite value',
        400
      )
    );

  const invitedUser = await User.findById(userId);
  const group = await Group.findById(groupId);

  // Always remove invited user from invitedUser
  group.invitedUsers.pull(invitedUser.email);
  invitedUser.receivedInvites.pull({ groupId });

  // If invite is accepted, add userid to members array in group and add groupid to groups array in user
  if (hasAcceptedInvite) {
    group.members.push(userId);
    invitedUser.groups.push(groupId);
  }

  invitedUser.save();
  group.save();

  res.status(200).json({
    status: 'success',
  });
});

exports.getUsersInvites = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  const { receivedInvites } = user;

  res.status(201).json({
    status: 'success',
    receivedInvites,
  });
});
