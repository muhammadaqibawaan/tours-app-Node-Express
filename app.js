const dotenv = require('dotenv');
const mongoose = require('mongoose');
const pug = require('pug');
const path = require('path');
const AppError = require('./utility/appError');
const globalErrorHandler = require('./controller/errorController');
dotenv.config({path: './config.env'});

const express = require('express');

const app = express();

// Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

//Pug server setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// SERVER SIDE RENDERING
app.use('/', (req, res)=>{
  return res.status(200).render('base',{
    tour: "Awesome tour",
    price: 45555
  })
});

// ROUTES
const tourRouter = require('./routes/tourRoutes'); // this is also called route mounting
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Catch all unknow routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global middleware for error handling
app.use(globalErrorHandler);

module.exports = app;
