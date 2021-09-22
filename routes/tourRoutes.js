const express = require('express');
const tourController = require('./../controller/tourController')
const authController = require('./../controller/authController');
const reviewRouter = require('./reviewRoutes')
const router = express.Router();

// router.param('id', tourController.checkedID);

// Nested Routes
router.use('/:tourId/reviews', reviewRouter);



router.route('/top-5-cheap')
.get(
    tourController.topFiveMiddleware,
    tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlanByYear);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(authController.protect,tourController.createTour);
router
  .route('/:id')
  .get(tourController.getSingleTour)
  .patch(tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin','lead-guide'), tourController.deleteTour);


module.exports = router; // when you have only one route