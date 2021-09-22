// exports.checkedID = (req, res, next, val)=>{
//     console.log("This middleware run for val", val)
//     const id = req.params.id * 1;
//      if (id > tours.length) {
//        return res.status(404).json({
//          status: 'fail',
//          message: 'Invalid ID',
//        });
//      }
//     next()
// }
const Tour = require('./../models/TourModel')
const ApiFeatures = require('./../utility/apiFeatures')
const catchAsync = require('./../utility/catchAsync');
const AppError = require('./../utility/appError');
const User = require('./../models/UserModel');
const factory = require('./handleFactory')
const fs = require('fs');
let tours;
// try {
//   tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
//   );
// } catch (err) {
//   console.error(err);
// }

exports.topFiveMiddleware = (req,res,next)=>{
  req.query.sort = '-ratingsQuantity,price';
  req.query.fields = 'name, description';
  req.query.limit = 5;
  next()
}; 

exports.getMonthlyPlanByYear = catchAsync(async (req, res)=>{
   const year = req.params.year * 1;
   console.log(year);
   const plan = await Tour.aggregate([
     {
       $unwind: '$startDates',
     },
     {
       $match: {
         startDates: {
           $gt: `${year}-01-01`,
           $lt: `${year}-12-31`,
         },
       },
     },
    //  {
    //    $group: {
    //      _id: { $month: '$startDates' },
    //      nuTourStarts: { $sum: 1 },
    //    },
    //  },
   ]);
    return res.status(200).json({
      status: 'success',
      stats: plan,
    });
}); 

exports.getTourStats = catchAsync(async (req, res)=>{
    const tourStats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: 'ratingsQuantity' },
          avgRatings: { $avg: '$ratingsAverage' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          numRatings: { $avg: '$price' },
        },
      },
      {
        $sort: { avgRatings: 1 },
      },
      { $match: { _id: { $ne: 'easy' } } },
    ]);
    return res.status(200).json({
      status: 'success',
      stats: tourStats,
    });
})

exports.getAllTours = catchAsync(async (req, res) => {
  //EXECUTE QUERY
  const features = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limiting()
    .pagination();
  const tours = await features.query;
  return res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});


exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.getSingleTour = factory.getSingleOne(Tour, { path: 'reviews' });
exports.deleteTour = factory.deleteOne(Tour);

