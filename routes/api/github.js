var express = require('express');
var router = express.Router();
const axios = require('axios');
const authUtil = require('../../utils/authUtil');
const config = require('../../config/config');
const AuthToken = require('../../models/AuthToken');
const { GITHUB } = require('../../models/hostTypes');
const auth = require('../../middleware/auth');

const clientId = config.github.clientId;
const clientSecret = config.github.clientSecret;

// @route   GET /api/github/authorize
// @desc    Get oauth token from github
// @access  private
router.post('/authorize', auth, async (req, res) => {
  const user = req.user;
  const { code } = req.body;

  try {
    const url = `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`;
    const config = {
      headers: {
        Accept: 'application/json',
      },
    };

    const response = await axios.post(url, {}, config);
    if (response.status !== 200 || response.data.error) {
      console.log(response.data);
      return res.status(404).json({ msg: 'error getting auth token' });
    }

    let authToken = await AuthToken.findOne({
      user: req.user.id,
      host: GITHUB,
    });

    const { iv, encryptedData } = authUtil.encrypt(response.data.access_token);

    if (authToken) {
      authToken.token = encryptedData;
      authToken.iv = iv;
    } else {
      authToken = new AuthToken({
        user: req.user.id,
        host: GITHUB,
        iv: iv,
        token: encryptedData,
      });
    }

    await authToken.save();

    return res.json({ authorized: 'true' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/github/user/repos
// @desc    Get authenticated user's repositories
// @access  private
router.get('/user/repos', auth, async (req, res) => {
  let encToken = await AuthToken.findOne({
    user: req.user.id,
    host: GITHUB,
  });

  if (!encToken) {
    // possible to redirect? we also need to tell react to update the state that the user is no longer authorized
    return res.status(401).json({ msg: 'Oauth token expired / revoked.' });
  }

  const { iv, token: encryptedData } = encToken;
  const decryptedToken = authUtil.decrypt({ iv, encryptedData });
  try {
    const config = {
      headers: { Authorization: `Bearer ${decryptedToken}` },
    };
    const response = await axios.get(
      'https://api.github.com/user/repos',
      config
    );

    if (response.status !== 200) {
      return res.status(400).json({ msg: 'error getting repos' });
    }

    // const repos = [];
    // for (const repo of response.data) {
    //   const { id, name, full_name, html_url } = repo;
    //   repos.push({ id, name, full_name, html_url });
    // }
    // same as below

    const repos = response.data.map((repo) => {
      const { id, name, full_name, html_url } = repo;
      return { id, name, full_name, html_url };
    });

    res.json(repos);
  } catch (err) {
    console.error(err.response);
    if (err.response.status === 401) {
      await AuthToken.findOneAndRemove({
        _id: encToken.id,
      });
      return res.status(401).json({ msg: 'token expired' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
