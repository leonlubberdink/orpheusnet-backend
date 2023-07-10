const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupeName: {
    type: String,
    required: [true, 'A group name must be provided'],
    unique: [
      true,
      'Group name already in use, please choose a different group name',
    ],
    trim: true,
    lowercase: true,
  },
  userImage: {
    type: String,
    default: 'default.jpg',
  },
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
