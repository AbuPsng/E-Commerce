import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/couponModel.js";
import ErrorHandler from "../utils/utilityClass.js";

export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return next(new ErrorHandler("Please enter amount", 400));
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount * 100),
    currency: "inr",
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const { code, amount } = req.body;

  if (!code || !amount) {
    return next(new ErrorHandler("Please fill all the require fields", 400));
  }
  await Coupon.create({ code, amount });

  return res.status(201).json({
    success: true,
    message: `New Coupon ${code} created successfully`,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    return next(new ErrorHandler("Please fill all the require fields", 400));
  }
  const validateCoupon = await Coupon.findOne({ code });

  if (!validateCoupon) {
    return next(new ErrorHandler("Invalide Coupon Code", 400));
  }

  return res.status(201).json({
    success: true,
    discount: validateCoupon.amount,
  });
});

export const allCoupons = TryCatch(async (req, res, next) => {
  const allCoupons = await Coupon.find({});

  if (!allCoupons.length) {
    return next(new ErrorHandler("No coupons to show", 404));
  }

  return res.status(201).json({
    success: true,
    allCoupons,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  console.log(req.params, "params");

  if (!id) {
    return next(new ErrorHandler("Please enter the ID", 404));
  }

  const deletedCoupon = await Coupon.findByIdAndDelete(id);

  if (!deletedCoupon) {
    return next(new ErrorHandler("Invalid Coupon ID", 400));
  }

  return res.status(201).json({
    success: true,
    message: `Coupon ${deletedCoupon.code} has been deleted Successfully `,
  });
});
