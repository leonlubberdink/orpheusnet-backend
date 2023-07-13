const mongoose = require('mongoose');
const { default: validator } = require('validator');

const shareSchema = new mongoose.Schema({
  shareUrl: {
    type: String,
    required: [true, 'A url must be provided'],
    lowercase: true,
    validate: [
      {
        validator: (value) =>
          validator.isURL(value, {
            protocols: ['http', 'https'],
            require_tld: true,
            require_protocol: true,
          }),
        message: 'Must be a Valid URL, including protocoll (http/https)',
      },
      {
        validator: (val) => {
          return val.includes('spotify') || val.includes('soundcloud');
        },
        message: 'Url must be a soundcloud or spotify url',
      },
    ],
  },
  shareType: String,
  format: {
    type: String,
    required: [true, 'A format must be provided'],
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
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
