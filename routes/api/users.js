const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const User = require('../../models/User');
const { createJwtToken } = require('../../utils/authUtil');

// @route   POST api/users
// @desc    Register user
// @access  public
router.post(
  '/',
  [
    check('name', 'name is required').not().isEmpty(),
    check('email', 'please inclue valid email').isEmail(),
    check(
      'password',
      'please enter password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          errors: [{ msg: 'User already exists' }],
        });
      }

      user = new User({
        name,
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      return res.json({ token: createJwtToken(payload) });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
