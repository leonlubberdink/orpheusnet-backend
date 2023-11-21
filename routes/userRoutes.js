const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const groupRouter = require('./groupRoutes');

const router = express.Router();

router.use('/isLoggedIn', authController.isLoggedIn);

router.use('/:userId/groups', groupRouter);

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//All routes below are protectet with JWT
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getOneUser);

router.patch('/updateMyPassword', authController.updateMyPassword);

router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

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
