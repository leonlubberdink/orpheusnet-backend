const express = require('express');
const groupController = require('../controllers/groupController');
const authController = require('../controllers/authController');
const shareRouter = require('./shareRoutes');

const router = express.Router();

router.use('/:groupId/shares', shareRouter);

router.use(authController.protect);

// Route for starting a new group
router
  .route('/startNewGroup')
  .post(authController.restrictTo('user'), groupController.startNewGroup);

// Route for getting all groups where user is a member from
router
  .route('/getMyGroups')
  .get(authController.restrictTo('user'), groupController.getMyGroups);

//Restrict non "auth user" routes to admin (LATER)
router.route('/').get(groupController.getAllGroups);
router.route('/:id').get(groupController.getOneGroup);

module.exports = router;
