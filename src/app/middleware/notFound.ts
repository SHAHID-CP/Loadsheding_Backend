import type { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { sendError } from "./globalErrorHandler";

export const notFound = (req: Request, res: Response) => {

return sendError(res,StatusCodes.NOT_FOUND,'API Not Found',{path: req.originalUrl,method: req.method})
};
