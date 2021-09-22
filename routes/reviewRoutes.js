const express = require('express');
const reviewController = require('./../controller/reviewController');
const authController = require('./../controller/authController');
const router = express.Router({ mergeParams: true });

// For already loggedIn users

// POST tour/1234567/reviews
// POST reviews 

router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.protect,
    reviewController.setTourAndUserIds, // middleware
    reviewController.createReview
  );

  router
    .route('/:id')
    .get(authController.protect, reviewController.getSingleReview)
    .delete(authController.protect, reviewController.deleteReview)
    .patch(authController.protect, reviewController.updateReview);

module.exports = router;
