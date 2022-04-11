var express = require('express');
var router = express.Router();
const axios = require('axios');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const ShareableLink = require('../../models/ShareableLink');
const { customAlphabet } = require('nanoid');
const {
  getUserRepos,
  getUserOauthToken,
} = require('../../services/github.service');
const {
  Conflict,
  NotFound,
  BadRequest,
  Unauthorized,
  GeneralError,
} = require('../../utils/errors');
const {
  linkStatus: { DEACTIVATED, EXPIRED },
} = require('../../models/constants');
const checkLinkExpiry = require('../../middleware/checkLinkExpiry');

// @route   POST /api/share
// @desc    Create a custom URL to share private repos
// @access  private
router.post(
  '/',
  [auth, check('repos', 'repos cannot be empty').not().isEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const nanoid = customAlphabet(alphabet, 10);
    try {
      if (req.body.customUrl) {
        let url = await ShareableLink.findOne({
          customUrl: req.body.customUrl,
        });
        if (url) {
          throw new Conflict('Custom URL already exists');
        }
      }
      const { customUrl, repos, description, expiryDate } = req.body;
      const userRepos = await getUserRepos(req.user.id);

      // verify that user repos exist
      // const invalidRepos = repos.filter((repoId) => {
      //   const repoIdFound = userRepos.find((userRepo) => userRepo.id == repoId);
      //   if (!repoIdFound) {
      //     return repoId;
      //   }
      // });

      // if (invalidRepos.length > 0) {
      //   throw new BadRequest(`Invalid repository IDs: ${invalidRepos}`);
      // }

      const repoNameIdMap = userRepos
        .filter((userRepo) => {
          return repos.some((repo) => repo == userRepo.id);
        })
        .map((userRepo) => ({
          id: userRepo.id,
          full_name: userRepo.full_name,
        }));

      const url = new ShareableLink({
        user: req.user.id,
        customUrl: customUrl || nanoid(),
        description: description,
        repos: repoNameIdMap,
        expiryDate: expiryDate,
      });

      await url.save();
      res.json(url);
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

// @route   GET /api/share/
// @desc    Get list of links created by user
// @access  private
router.get('/', auth, async (req, res, next) => {
  try {
    const urls = await ShareableLink.find({
      user: req.user.id,
    });

    var today = new Date();
    urls.forEach(async (url) => {
      if (url.expiryDate < today) {
        url.status = EXPIRED;
        await url.save();
      }
    });
    res.json(urls);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/share/:custom_url
// @desc    Update Shareable Link
// @access  private
router.put('/:custom_url', [auth], async (req, res, next) => {
  try {
    // Get Shareable Link to be updated
    if (req.params.custom_url) {
      var url = await ShareableLink.findOne({
        customUrl: req.params.custom_url,
      });
      if (!url) {
        throw new NotFound('Link not found');
      }
    }

    if (url.user.toString() !== req.user.id) {
      throw new Unauthorized();
    }

    const { customUrl, repos, description, expiryDate } = req.body;

    // If updating custom url, check if already exists
    if (req.body.customUrl && req.params.custom_url != req.body.customUrl) {
      let url = await ShareableLink.findOne({
        customUrl: req.body.customUrl,
      });
      if (url) {
        throw new Conflict('Custom URL already exists');
      }
    }

    // verify that user repos exist
    const userRepos = await getUserRepos(req.user.id);
    const invalidRepos = repos.filter((repoId) => {
      const repoIdFound = userRepos.find((userRepo) => userRepo.id == repoId);
      if (!repoIdFound) {
        return repoId;
      }
    });

    if (invalidRepos.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid repository IDs: ${invalidRepos}`,
      });
    }

    if (customUrl) url.customUrl = customUrl;
    if (description) url.description = description;
    if (description) url.description = description;
    if (repos) url.repos = repos;
    if (expiryDate) url.expiryDate = expiryDate;

    await url.save();
    res.json(url);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// @route   POST /api/share/:custom_url/deactivate
// @desc    Deactivate shareable link
// @access  private
router.post('/:custom_url/deactivate', [auth], async (req, res, next) => {
  try {
    // Get Shareable Link to be updated
    if (req.params.custom_url) {
      var url = await ShareableLink.findOne({
        customUrl: req.params.custom_url,
      });
      if (!url) {
        throw new NotFound('Link not found');
      }
    }

    url.status = DEACTIVATED;

    await url.save();
    res.json(url);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/share/:custom_url
// @desc    Deactivate shareable link
// @access  private
router.delete('/:custom_url', [auth], async (req, res, next) => {
  try {
    if (req.params.custom_url) {
      var url = await ShareableLink.findOne({
        customUrl: req.params.custom_url,
      });
      if (!url) {
        throw new NotFound('Link not found');
      }
    }

    if (url.user.toString() !== req.user.id) {
      throw new Unauthorized();
    }

    // Get Shareable Link to be updated
    if (req.params.custom_url) {
      var url = await ShareableLink.findOneAndRemove({
        customUrl: req.params.custom_url,
      });
      if (!url) {
        throw new NotFound('Link not found');
      }
    }

    res.json({ msg: 'Shareable Link deleted' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/share/:custom_url/contents/:repo_id
// @desc    Get contents of a repo and by filepath
// @access  public
// router.get('/:custom_url/contents/:owner/:repo', async (req, res, next) => {
router.get(
  '/:custom_url/contents/:repo_id',
  checkLinkExpiry,
  async (req, res, next) => {
    try {
      if (req.params.custom_url) {
        var url = await ShareableLink.findOne({
          customUrl: req.params.custom_url,
        });
        if (!url) {
          throw new NotFound('Link not found');
        }
      }

      let repo_id = req.params.repo_id;
      const repo = url.repos.find((r) => r.id == repo_id);
      if (!repo) {
        throw new BadRequest('Invalid repo id');
      }
      const decryptedToken = await getUserOauthToken(url.user.toString());
      console.log(decryptedToken);
      const config = {
        headers: { Authorization: `Bearer ${decryptedToken}` },
      };

      let filepath = req.query.filepath || '';
      const response = await axios.get(
        `https://api.github.com/repos/${repo.full_name}/contents/${filepath}`,
        config
      );

      if (response.status !== 200) {
        console.log(response);
        throw new GeneralError();
      }

      if (response.data.constructor === Array) {
        const repos = response.data.map((repo) => {
          const { name, path, type } = repo;
          return { name, path, type };
        });
        res.json(repos);
      } else if (response.data.content) {
        let buf = Buffer.from(response.data.content, 'base64').toString(
          'ascii'
        );
        res.json({ content: buf });
      }
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

// @route   GET /api/share/:custom_url/repos
// @desc    Get repos by shareable link
// @access  public
// router.get('/:custom_url/contents/:owner/:repo', async (req, res, next) => {
router.get(
  '/:custom_url/repos',
  checkLinkExpiry,
  async (req, res, next) => {
    try {
      if (req.params.custom_url) {
        var url = await ShareableLink.findOne({
          customUrl: req.params.custom_url,
        });
        if (!url) {
          throw new NotFound('Link not found');
        }
      }
      res.json(url.repos);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

module.exports = router;
