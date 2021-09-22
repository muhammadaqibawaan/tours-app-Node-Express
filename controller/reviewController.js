const Review = require('./../models/reviewModel');
const catchAsync = require('./../utility/catchAsync');
const AppError = require('./../utility/appError');
const factory = require('./handleFactory');


exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {}
    if(req.params.tourId) filter = { tour: req.params.tourId };
  const reviews = await Review.find(filter);

  return res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
}); 

exports.setTourAndUserIds = (req, res, next) => {
  // Allow Nested Routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getSingleReview = factory.getSingleOne(Review);
exports.deleteReview = factory.deleteOne(Review);