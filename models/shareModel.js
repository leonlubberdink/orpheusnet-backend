const mongoose = require('mongoose');
const { default: validator } = require('validator');

const shareSchema = new mongoose.Schema({
  shareUrl: {
    type: String,
    required: [true, 'A url must be provided'],
    lowercase: true,
    validate: {
      validator: (value) =>
        validator.isURL(value, {
          protocols: ['http', 'https'],
          require_tld: true,
          require_protocol: true,
        }),
      message: 'Must be a Valid URL',
    },
    validate: {
      validator: (val) => {
        return val.includes('spotify') || val.includes('soundcloud');
      },
      message: 'Url must be a soundcloud or spotify url',
    },
  },
  shareType: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

shareSchema.pre('save', function (next) {
  this.shareType = this.shareUrl.includes('spotify') ? 'Spotify' : 'Soundcloud';
  next();
});

const Share = mongoose.model('Share', shareSchema);

module.exports = Share;
