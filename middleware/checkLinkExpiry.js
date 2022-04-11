const { NotFound, Unauthorized } = require('../utils/errors');
const {
  linkStatus: { DEACTIVATED, EXPIRED },
} = require('../models/constants');

module.exports = async function (req, res, next) {
  try {
    if (req.params.custom_url) {
      var url = await ShareableLink.findOne({
        customUrl: req.params.custom_url,
      });
      if (!url) {
        throw new NotFound('Link not found');
      }
    }
    if (url.status === DEACTIVATED || url.status === EXPIRED) {
      throw new Unauthorized('Link Expired');
    } else {
      var today = new Date();
      if (url.expiryDate < today) {
        url.status = EXPIRED;
        await url.save();
        throw new Unauthorized('Link Expired');
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
