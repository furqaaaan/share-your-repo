require('dotenv').config();
const env = process.env.NODE_ENV;

const dev = {
  db: {
    uri: `mongodb+srv://dev:${process.env.DB_PASSWORD}@syr-dev.o4v7l.mongodb.net/syr-dev?retryWrites=true&w=majority`,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "somerandomsecret",
    expiry: 3600000,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || "someran12asdf1231asdfdomkey",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
};

const test = {
  jwt: {
    secret: 'somerandomsecret',
    expiry: 3600000,
  },
};

const prod = {
  db: {
    uri: `mongodb+srv://dev:${process.env.DB_PASSWORD}@syr-dev.o4v7l.mongodb.net/syr-dev?retryWrites=true&w=majority`,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: 3600000,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
};

const config = {
  dev,
  prod,
  test,
};

module.exports = config[env];
