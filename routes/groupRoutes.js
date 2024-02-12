const express = require('express');
const groupController = require('../controllers/groupController');
const authController = require('../controllers/authController');
const multerController = require('../controllers/multerController');
const shareRouter = require('./shareRoutes');

// Merge params to be able to see groups per userId getMyGroups
const router = express.Router({ mergeParams: true });

router.use('/:groupId/shares', shareRouter);

router.use(authController.verifyJWT);

// Route for getting all groups where user is a member from
router
  .route('/')
  .get(authController.restrictTo('user'), groupController.getUsersGroups);

// Route for starting a new group
router
  .route('/startNewGroup')
  .post(
    authController.restrictTo('user'),
    multerController.uploadGroupImage,
    multerController.resizeGroupImage,
    groupController.startNewGroup
  );

// Routes for deleting or editing groups if admin or groupAdmin
router
  .route('/:id')
  .get(groupController.getGroup)
  .delete(groupController.checkIfGroupAdmin, groupController.deleteGroup)
  .patch(groupController.checkIfGroupAdmin, groupController.updateGroup);

// Routes for adding or removing members/admins if groupAdmin
router
  .route('/:id/addMember')
  .patch(groupController.checkIfGroupAdmin, groupController.addMember);
router
  .route('/:id/removeMember')
  .patch(groupController.checkIfGroupAdmin, groupController.removeMember);
router
  .route('/:id/addAdmin')
  .patch(groupController.checkIfGroupAdmin, groupController.addAdmin);
router
  .route('/:id/removeAdmin')
  .patch(groupController.checkIfGroupAdmin, groupController.removeAdmin);

module.exports = router;
