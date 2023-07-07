const mongoose = require("mongoose");
const { default: validator } = require("validator");

const shareSchema = new mongoose.Schema({
  shareUrl: {
    type: String,
    required: [true, "A url must be provided"],
    lowercase: true,
  },
  shareType: {
    type: String,
    set: function () {
      return this.shareUrl.includes("spotify") ? "Spotify" : "Soundcloud";
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Share = mongoose.model("User", shareSchema);

module.exports = Share;
