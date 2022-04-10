const mongoose = require('mongoose');
const {
  linkStatus: { ACTIVE },
} = require('./constants');

const ShareableLinkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  customUrl: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    default: ACTIVE,
  },
  repos: {
    type: Array,
    required: true,
    validate: {
      validator: function (v) {
        console.log(v);
        return v.length > 0;
      },
      message: () => `Repos cannot be empty!`,
    },
  },
  dateCreated: {
    type: Date,
    default: Date.now,
    required: true,
  },
  expiryDate: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    },
    required: true,
  },
});

module.exports = ShareableLink = mongoose.model(
  'shareableLink',
  ShareableLinkSchema
);
