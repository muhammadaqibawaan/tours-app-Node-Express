const AppError = require('./../utility/appError');

const handleCastErrorDB = err => {
  console.log("called")
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const JsonWebTokenError = () => new AppError('Invalid token. Please login', 401);;
const TokenExpiredError = () =>
  new AppError('Your token has expired. Please login again.', 401);

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  console.log('fineee', err);
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR 💥 errorController-line43-> log', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    
    let error = {
      statusCode: err.statusCode,
      message: err.message,
      status: err.status,
      isOperational: err.isOperational,
    };
    
    if (err.name == 'CastError') {
      error = handleCastErrorDB(err);
    }
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(err);
    }
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(err);
    };
    if (err.name === 'JsonWebTokenError') {
      error = JsonWebTokenError(err);
    }
    if (err.name === 'TokenExpiredError') {
      error = TokenExpiredError(err);
    }

    sendErrorProd(error, res);
  }
};
