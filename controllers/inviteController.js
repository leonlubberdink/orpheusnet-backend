const validator = require('validator');

const User = require('../models/userModel');
const Group = require('../models/groupModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const sendInviteToExistingUser = catchAsync(async (user, communityName) => {
  console.log('EXISTING USER');
  const emailOptions = {
    email: user.email,
    subject: 'You got invited to join a community on Orpheus.net',
    message: `You've been invited to join a community on Orpheusnet: ${communityName}!\n\n
                To accept the invitation, please log in to your Orpheusnet account and accept 
                the invite once you're there.`,
  };

  await sendEmail(emailOptions);
});

const sendInviteToNewUser = catchAsync(
  async ({ userNameOrEmail, signUpUrl, communityName }) => {
    const emailOptions = {
      email: userNameOrEmail,
      subject: 'You got invited to join a community on Orpheus.net',
      message: `Someone invited you to join their community "${communityName}".\n\nPlease click on the following link to accept their invitation, create an Orpheusnet account, and join their community: ${signUpUrl}`,
    };

    await sendEmail(emailOptions);
  }
);

exports.inviteMember = catchAsync(async (req, res, next) => {
  const referer = req.headers['referer'] || req.headers['referrer'];
  const { groupId } = req.params;
  const { user: userNameOrEmail } = req.body;

  // 1) Check if userName or E-mail address was sent
  if (!req.body.user)
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
  group.invitedUsers.push(userNameOrEmail);
  group.save();

  // 5) If userName does not exist return without info (privacy), send e-mail with invite for signup
  if (!user && validator.isEmail(userNameOrEmail)) {
    // Create verification URL
    const signUpUrl = `${referer}signup/${groupId}`;

    sendInviteToNewUser({
      userNameOrEmail,
      signUpUrl,
      communityName: group.groupName,
    });
  }

  // 6) If user exists, send e-mail with invite to group
  if (user) sendInviteToExistingUser(user);

  res.status(201).json({
    status: 'success',
  });
});
