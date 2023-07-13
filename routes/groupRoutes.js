const express = require('express');
const groupController = require('../controllers/groupController');
const authController = require('../controllers/authController');
const shareRouter = require('./shareRoutes');

// Merge params to be able to see groups per userId getMyGroups
const router = express.Router();
// const router = express.Router({ mergeParams: true });

router.use('/:groupId/shares', shareRouter);

router.use(authController.protect);

// Route for getting all groups where user is a member from
router
  .route('/')
  .get(authController.restrictTo('user'), groupController.getUsersGroups);

// Route for starting a new group
router
  .route('/startNewGroup')
  .post(authController.restrictTo('user'), groupController.startNewGroup);

// Route for deleting groups if admin or groupAdmin
router
  .route('/:id')
  .delete(groupController.checkIfGroupAdmin, groupController.deleteGroup);

module.exports = router;
