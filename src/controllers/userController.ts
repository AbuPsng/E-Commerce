import { NextFunction, Request, Response } from "express";
import User from "../models/userModel.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utilityClass.js";
import { TryCatch } from "../middlewares/error.js";

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    if (!name || !email || !photo || !gender || !_id || !dob) {
      return next(
        new ErrorHandler("Please enter all the required fields", 500)
      );
    }

    let user = await User.findById(_id);

    if (user) {
      return res
        .status(200)
        .json({ succuess: true, message: `Welcome ${user.name}` });
    }

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob: new Date(dob),
    });

    return res.status(201).json({
      success: true,
      message: `Welcome ${user.name}`,
    });
  }
);

export const getAllUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    let allUsers = await User.find();

    return res.status(200).json({
      success: true,
      users: allUsers,
    });
  }
);

export const deleteUser = TryCatch(
  async (
    req: Request<{ id: any }, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    let userId = req.params.id;

    if (!userId) return next(new ErrorHandler("Please provide a Id", 404));

    let user = await User.findById(userId);

    if (!user) {
      return next(new ErrorHandler("Please provide a correct Id", 404));
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: `User ${user.name} has been removed`,
    });
  }
);

export const getUser = TryCatch(
  async (
    req: Request<{ id: any }, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    let userId = req.params.id;

    if (!userId) return next(new ErrorHandler("Please provide a Id", 404));

    let user = await User.findById(userId);

    if (!user)
      return next(new ErrorHandler("Please provide a correct Id", 404));

    return res.status(200).json({
      success: true,
      user: user,
    });
  }
);
