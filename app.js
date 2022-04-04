var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const connectDB = require('./config/db');

connectDB();

var authRouter = require('./routes/api/auth');
var usersRouter = require('./routes/api/users');
var githubRouter = require('./routes/api/github');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/github', githubRouter);

module.exports = app;
