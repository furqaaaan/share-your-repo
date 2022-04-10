const { Unauthorized } = require('../utils/errors');
const {
  host: { GITHUB },
} = require('..//models/constants');
const authUtil = require('../utils/authUtil');
const axios = require('axios');

exports.getUserRepos = async (userId) => {
  const decryptedToken = await this.getUserOauthToken(userId);
  const config = {
    headers: { Authorization: `Bearer ${decryptedToken}` },
  };
  try {
    var response = await axios.get('https://api.github.com/user/repos', config);
    if (response.status !== 200) {
      throw new GeneralError('Error getting repos', response.status);
    }
  } catch (err) {
    if (err.response.status === 401) {
      await AuthToken.findOneAndRemove({
        _id: encToken.id,
      });
      throw new Unauthorized('Oauth token expired / revoked.');
    }
    throw new GeneralError('Error getting repos', response.status);
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

  return repos;
};

exports.getUserOauthToken = async (userId) => {
  let encToken = await AuthToken.findOne({
    user: userId,
    host: GITHUB,
  });

  if (!encToken) {
    // possible to redirect? we also need to tell react to update the state that the user is no longer authorized
    throw new Unauthorized('Oauth token expired / revoked.');
  }

  const { iv, token: encryptedData } = encToken;
  const decryptedToken = authUtil.decrypt({ iv, encryptedData });

  return decryptedToken;
};
