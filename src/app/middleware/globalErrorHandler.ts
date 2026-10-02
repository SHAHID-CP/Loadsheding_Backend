import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "../../../generated/prisma/client";
import config from "../../../src/app/config";
import { AppError } from "../utils/sendResponse";

export const sendError = (res: Response, statusCode: number, message: string, errors?: unknown):Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};


export const globalErrorHandler = (err: any,req: Request,res: Response,next: NextFunction) => {

let statusCode: number = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
let message: string = err.message || "Internal Server Error";
let errors: unknown = err.errors || err;

if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }

// 1. Prisma Validation Errors (Missing/Wrong Fields)
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Invalid or missing field types provided.";
  } 
  // 2. Known Prisma Errors (Unique constraints, FKs, Not Found)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = StatusCodes.BAD_REQUEST;
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ");
      message = target ? `Duplicate entry for field(s): ${target}` : "Duplicate key error";
    } else if (err.code === "P2003") {
      message = "Foreign key constraint failed.";
    } else if (err.code === "P2025") {
      statusCode = StatusCodes.NOT_FOUND;
      message = "Requested record was not found.";
    } else {
      message = `Database query error: ${err.message}`;
    }
  } 
  // 3. Database Connection / Auth Errors
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    if (err.errorCode === "P1000") {
      statusCode = StatusCodes.UNAUTHORIZED;
      message = "Database authentication failed.";
    } else if (err.errorCode === "P1001") {
      message = "Cannot reach database server.";
    } else {
      message = "Failed to initialize database connection.";
    }
  } 
  // 4. Prisma Unknown Query Errors
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = "An unknown database query error occurred.";
  }


if(config.node_env === 'development'){
return sendError(res,statusCode,message,
    {issues: errors,stack: err.stack})
}else{
    if (err.isOperational) {
        const safeMessage = message;
        return sendError(res,
        statusCode,
        safeMessage,
        errors
        );
    } 
    else {
        const secureFallback = "Something went very wrong!";
        return sendError(res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        secureFallback,
        null
        );
    }
}
};


