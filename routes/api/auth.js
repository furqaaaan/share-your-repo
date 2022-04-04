const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const { createJwtToken } = require('../../utils/authUtil');

// @route   GET api/auth
// @desc    Test route
// @access  public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.json(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth
// @desc    Authenticate user
// @access  public
router.post(
  '/',
  [
    check('email', 'please inclue valid email').isEmail(),
    check('password', 'please enter password.').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      res.json({ token: createJwtToken(payload) });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
