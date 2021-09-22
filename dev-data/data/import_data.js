const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
const fs = require('fs');
const Tour = require('./../../models/TourModel')
const User = require('./../../models/UserModel')
const Review = require('./../../models/reviewModel');


//DATABASE CONNECTION
mongoose
  .connect('mongodb://localhost:27017/ntours', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connection created successfully!'));

  //Read Files
  const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
  const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
  const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

  //IMPORT DATA
  const importData = async ()=>{
      try {
          await User.create(users,{validateBeforeSave: false});
          await Tour.create(tours);
          await Review.create(reviews);
          console.log("Tours created!")
      } catch (error) {
        console.log("error while importing...",error)
      }
  }

  //DELETE ALL DATA FROM DB
  const deleteData = async () => {
    try {
      await User.deleteMany();
      await Tour.deleteMany();
      await Review.deleteMany();
      console.log("DB Deleted successfully")
    } catch (error) {
      console.log('error while importing...', error);
    }
  };
  if (process.argv[2] == '--import') {
      importData();
  } else if (process.argv[2] == '--delete') {
      deleteData();
  }

  console.log(process.argv)
