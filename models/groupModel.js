const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: [true, 'A group name must be provided'],
    unique: [
      true,
      'Group name already in use, please choose a different group name',
    ],
    trim: true,
    lowercase: true,
  },
  groupImage: {
    type: String,
    default: 'default.jpg',
  },
  groupAdmins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

groupSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'groupAdmins members',
    select: 'userName userImage',
  });
  next();
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
