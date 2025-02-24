const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
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
    invitedUsers: {
      type: Array,
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
        unique: true,
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

groupSchema.virtual('shares', {
  ref: 'Share',
  foreignField: 'group',
  localField: '_id',
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
