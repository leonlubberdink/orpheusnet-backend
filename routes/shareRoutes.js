const express = require('express');
const shareController = require('../controllers/shareController');
const authController = require('../controllers/authController');

// Merge params to be able to see shares per groupId getAllSharesInGroup
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Routes for creating a share in a group,
// and getting all shares beloning to group
router
  .route('/')
  .get(shareController.setGroupUserIds, shareController.getAllSharesInGroup)
  .post(shareController.setGroupUserIds, shareController.createShare);

// Route for deleting a share, a user has created
router.route('/:id').delete(shareController.deleteShare);

module.exports = router;
