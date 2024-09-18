import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  allCoupons,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  newCoupon,
} from "../controllers/paymentController.js";

const app = express.Router();

app.post("/create", createPaymentIntent);

app.get("/discount-apply", applyDiscount);

app.post("/coupon/new", adminOnly, newCoupon);

app.get("/coupon/all", adminOnly, allCoupons);

app.route("/coupon/:id").delete(adminOnly, deleteCoupon);

export default app;
