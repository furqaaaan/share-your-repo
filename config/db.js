const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.db.uri);
    console.log('mongodb connected');
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
