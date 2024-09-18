import express, { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utilityClass.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message ||= "Internal server error";
  err.statusCode ||= 500;

  if (err.name === "CastError") err.message = "Invalid ID";
  if (err.name === "MongoServerError")
    err.message =
      "This name is already being used. Please enter different name";

  console.log(err);

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export const TryCatch = (func: ControllerType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await func(req, res, next);
    } catch (error: any) {
      return next(error);
    }
  };
};
