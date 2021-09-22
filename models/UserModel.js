const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'Please tell us your name!'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your eamil'],
      unique: true,
      lowerase: true,
      validate: [validator.isEmail, 'Please provide a valid eamil.'],
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password.'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password.'],
      minlength: 8,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!',
      },
    },
    updatedAt: Date,
    role: {
      type: String,
      required: [true, 'Please provide a role'],
      enum: ['admin', 'user', 'guide', 'lead-guide'],
    },
    resetPasswordToken: String,
    resetPassTokenExpiry: Date,
    active: {
      type: Boolean,
      default: true,
    },
  }
);


userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) {
      return next();
    }
    this.updatedAt = Date.now();
    next()
});

userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({active: {$ne: false}})
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  password
) {
  return await bcrypt.compare(candidatePassword,password);
};

userSchema.methods.changePasswordAfter = function (updatedTime,JWTCreateTime
) {
    if (this.updatedAt) {
      return JWTCreateTime < updatedTime.getTime();
    }
 return false
};

userSchema.methods.creatPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.resetPassTokenExpiry = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);
module.exports = User;


