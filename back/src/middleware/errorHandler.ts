import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/appError";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};