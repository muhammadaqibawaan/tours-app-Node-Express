const User = require('./../models/UserModel')
const catchAsync = require('./../utility/catchAsync');
const AppError = require('./../utility/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require("util")
const sendEmail = require('./../utility/email');

const crypto = require('crypto');

const getSignInToken = id =>{
    return jwt.sign(
      { id: id, 
        createdAt: Date.now() },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
}

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    updatedAt: req.body.updatedAt,
  });
  const token = getSignInToken(newUser._id);
  return res.status(201).json({
    status: 'success',
    message: 'New User Created',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next)=>{
    const {email, password} = req.body;
    // Check if email and password exist
    if(!email || !password){
        return next(new AppError('Please provide email and password', 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(`${password}`, user.password))) {
      return next(new AppError('Invalid email or password', 400));
    }

    const token = getSignInToken(user._id);
    return res.status(200).json({
      status: 'success',
      message: 'logged in successfully',
      token
    });
}); 

exports.protect = catchAsync(async (req, res, next)=>{
    // Getting token and checking of it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(
          new AppError(
            'You are not logged In. Please login to get access.',
            401
          )
        );
    }

    //Verification token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

    // console.log(decode);

    // Check if user still exists
    const fetchUser = await User.findById(decode.id);
    if(!fetchUser){
         return next(
          new AppError(
            'The user belonging to this token does no longer exist more.',
            401
          )
        );
    }

    // Check if user changed password after the token was issued
    const changedPassword = fetchUser.changePasswordAfter(
      fetchUser.updatedAt,
      decode.createdAt
    );
    console.log('changedPassword', changedPassword);
    if (changedPassword) {
         return next(
           new AppError(
             'User recently changed password. Please login again',
             401
           )
         );
    }

    // Grant access to protected route
    req.user = fetchUser;
    // console.log(req.user)
    next();
})

exports.restrictTo = (...roles)=>{
    return (req, res, next)=>{
        if (!roles.includes(req.user.role)) {
             return next(
               new AppError(
                 'You don\'t have permission to access this feature',
                 403
               )
             );
        }
        next();
    }
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Cehck user against posted email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with given eamil address', 400));
  }

  // Create & Save Reset Password Token along with expiration
  const resetToken = user.creatPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user bases on the token
  const hasedPassword = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hasedPassword,
    resetPassTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired!'), 500);
  }

  // 2. Set new password, ih token has not expired and user exist
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPassTokenExpiry = undefined;
  user.resetPasswordToken = undefined;
  await user.save();

  // 3. update updatedAt property for the user
  // 4. Log the user in, send JWT
  
  const token = getSignInToken(user._id);
  return res.status(200).json({
    status: 'success',
    token,
  });
}); 

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // req.user.id is coming from authenticated users [from protect middleware]
  console.log('user is this one...', req.user);
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (
    !(await user.correctPassword(
      `${req.body.passwordCurrent}`,
      `${user.password}`
    ))
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT wo rk as intended! Schema validation and schema middleware will not work

  // 4) Log user in, send JWT
   const token = getSignInToken(user._id);
   return res.status(200).json({
     status: 'success',
     token,
   });
  // createSendToken(user, 200, res);
});

