const mongoose = require('mongoose');
const  slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      required: true,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: Number,
    summery: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a price'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a cover image'],
    },
    slug: String,
    images: [String],
    createdAt: {
      type: Date,
      select: false, // when we query, this field is excluded
      default: Date.now(),
    },
    startDates: [String],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

tourSchema.index({ startLocation: '2dsphere' });
// tourSchema.createIndex({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration/7;
});

tourSchema.pre('save', function (next) {
  db.places.createIndex( { loc : "2dsphere" } )
  // do stuff
  this.slug = slugify(this.name)
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -updatedAt',
  });

  next();
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// tourSchema.pre('post', async function (next) {
//   // do stuff User.findById();
//   const guidesPromises = this.guides.map(
//     async id => await User.findById(id)
//   );
//   this.guides = await Promise.all(guidesPromises);
//   next()
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
