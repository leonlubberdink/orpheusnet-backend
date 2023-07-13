const express = require('express');
const groupController = require('../controllers/groupController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/startNewGroup')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    groupController.startNewGroup
  );

router
  .route('/getMyGroups')
  .get(
    authController.protect,
    authController.restrictTo('user'),
    groupController.getMyGroups
  );

//Restrict non "auth user" routes to admin (LATER)
router.route('/').get(authController.protect, groupController.getAllGroups);

router.route('/:id').get(authController.protect, groupController.getOneGroup);

module.exports = router;
