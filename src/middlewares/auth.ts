import User from "../models/userModel.js";
import ErrorHandler from "../utils/utilityClass.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Please Log In first", 401));

  const user = await User.findById(id);

  if (!user)
    return next(new ErrorHandler("Please provide a correct credentials", 401));

  if (user.role !== "admin") {
    return next(new ErrorHandler("Only admin is authorized", 403));
  }

  next();
});
