import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { AppError } from "../utils/sendResponse";

export const validate = (schema: z.ZodType<any>): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new AppError(StatusCodes.BAD_REQUEST, "Validation failed", result.error.flatten().fieldErrors)
      );
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: z.ZodType<any>): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new AppError(StatusCodes.BAD_REQUEST, "Invalid query parameters", result.error.flatten().fieldErrors)
      );
    }
    (req as any).validatedQuery = result.data;
    next();
  };
};
