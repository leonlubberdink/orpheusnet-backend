const express = require('express');
const shareController = require('../controllers/shareController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    authController.protect,
    shareController.setGroupUserIds,
    shareController.getAllSharesInGroup
  )
  .post(
    authController.protect,
    shareController.setGroupUserIds,
    shareController.shareMusicInGroup
  );

module.exports = router;
