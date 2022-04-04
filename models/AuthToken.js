const mongoose = require('mongoose');

const AuthTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  host: {
    type: String,
  },
  iv: {
    type: String,
  },
  token: {
    type: String,
  },
});

module.exports = AuthToken = mongoose.model('authToken', AuthTokenSchema);
