const mongoose = require('mongoose');

const ShareableLink = new mongoose.Schema({
  customUrl: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
  },
  repos: {
    type: [],
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
    required: true,
  },
  expiryDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

module.exports = ShareableLink = mongoose.model('shareableLink', ShareableLink);
