const express = require('express');
const groupController = require('../controllers/groupController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(authController.protect, groupController.getMyGroups)
  .post(authController.protect, groupController.startNewGroup);

module.exports = router;
