const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const multerController = require('../controllers/multerController');
const inviteController = require('../controllers/inviteController');
const groupController = require('../controllers/groupController');

const router = express.Router();

router.post(
  '/signup',
  multerController.uploadUserImage,
  multerController.resizeUserImage,
  authController.signup
);

router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/refreshToken', authController.refreshAccessToken);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/verifyEmail/:token', authController.verifyEmail);

//All routes below are protectet with JWT
router.use(authController.verifyJWT);

//// Should be user route!!!!!!!
router.route('/invites/:userId').get(inviteController.getUsersInvites);
router.get('/:userId/groups', groupController.getUsersGroups);

router.get('/me', userController.getMe, userController.getOneUser);
router.patch('/updateMyPassword', authController.updateMyPassword);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.patch(
  '/updateMyImage',
  multerController.uploadUserImage,
  multerController.resizeUserImage,
  userController.updateMyImage
);

//All routes below are restricted to Admin users
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getOneUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
