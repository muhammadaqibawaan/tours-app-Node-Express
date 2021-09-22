const express = require('express');
const router = express.Router();
const authController = require('./../controller/authController');
const userController = require('./../controller/userController');

 router.route('/signup').post(authController.signup);
 router.route('/login').post(authController.login);;
 router.route('/forgotPassword').post(authController.forgotPassword);
 router.route('/resetPassword/:token').post(authController.resetPassword);

 // For already loggedIn users  getMeMeddleware
 router
   .route('/updateMyPassword')
   .patch(authController.protect,authController.updatePassword);
router
  .route('/updateMe')
  .patch(authController.protect, userController.updateMe);
router
  .route('/deleteMe')
  .delete(authController.protect, userController.deleteMe);

router
  .route('/me')
  .get(
    authController.protect,
    userController.getMeMeddleware,
    userController.getSingleUser
  );

 router
   .route('/')
   .get(userController.getAllUsers)
   .post(userController.createUser);
 router.route('/:id').get(userController.getSingleUser).patch(userController.updateUser).delete(userController.deleteUser);

 module.exports = router;