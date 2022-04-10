const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const ShareableLink = require('../../models/ShareableLink');
const router = require('./github');
const { customAlphabet } = require('nanoid');
const { getUserRepos } = require('../../services/github.service');
const { Conflict, NotFound, BadRequest } = require('../../utils/errors');
const {
  linkStatus: { DEACTIVATED },
} = require('../../models/constants');

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
      const userRepos = await getUserRepos(req.user);

      // verify that user repos exist
      const invalidRepos = repos.filter((repoId) => {
        const repoIdFound = userRepos.find((userRepo) => userRepo.id == repoId);
        if (!repoIdFound) {
          return repoId;
        }
      });

      if (invalidRepos.length > 0) {
        throw new BadRequest(`Invalid repository IDs: ${invalidRepos}`);
      }

      const url = new ShareableLink({
        customUrl: customUrl || nanoid(),
        description: description,
        repos: repos,
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
    const userRepos = await getUserRepos(req.user);
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

module.exports = router;
