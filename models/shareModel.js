const mongoose = require('mongoose');
const { default: validator } = require('validator');

const shareSchema = new mongoose.Schema({
  shareUrl: {
    type: String,
    required: [true, 'Please provide a url of the music you want to share.'],
    validate: [
      {
        validator: (value) =>
          validator.isURL(value, {
            protocols: ['http', 'https'],
            require_tld: true,
            require_protocol: true,
          }),
        message:
          'Please provide a valid URL, including protocoll (http/https).',
      },
      {
        validator: (val) => {
          return val.includes('spotify') || val.includes('soundcloud');
        },
        message: 'Please provide a SoundCloud or Spotify url.',
      },
    ],
  },
  publisher: {
    type: String,
  },
  title: {
    type: String,
  },
  shareType: {
    type: String,
  },
  platform: {
    type: String,
  },
  format: {
    type: String,
    required: [true, 'Please provide a format (Album / EP /Song / Mix)'],
    enum: {
      values: ['mix', 'album', 'ep', 'track', 'other'],
      message:
        '{VALUE} is not supported (must be either mix, album, ep, track or other)',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
  },
});

shareSchema.pre('save', function (next) {
  if (this.isNew) {
    this.shareType = this.shareUrl.includes('spotify')
      ? 'Spotify'
      : 'Soundcloud';
  }
  next();
});

const Share = mongoose.model('Share', shareSchema);

module.exports = Share;
