const handleErrors = (err, req, res, next) => {
  return res.status(err.code || 500).json({
    status: 'error',
    message: err.message,
  });
};

module.exports = handleErrors;
