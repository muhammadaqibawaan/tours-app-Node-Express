const catchAsync = require('./../utility/catchAsync');
const AppError = require('./../utility/appError');


exports.createOne = Model => catchAsync(async (req, res) => {
    const document = await Model.create(req.body);
    return res.status(201).json({
      status: 'success',
      data: {
        tour: document,
      },
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }
    return res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });

exports.getSingleOne = (Model,populateOtpions) =>{
    return catchAsync(async (req, res, next) => {
      let populateOpt = {};
      let query;

      query = Model.findById(req.params.id);

      //pupulate only if populateOtpions have been passed
      if (populateOtpions) {
        populateOpt = populateOtpions;
        query = query.populate(populateOpt);
      }

      const document = await query;
      if (!document) {
        return next(new AppError('No document found with that ID', 404));
      }
      res.status(200).json({
        status: 'success',
        data: {
          document,
        },
      });
    });
}

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }
    return res.status(200).json({
      status: 'success',
      data: null,
    });
  });
};
