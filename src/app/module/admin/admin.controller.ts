import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { AdminServices } from "./admin.service";
import { sendSuccess } from "../../utils/sendResponse";




const updateRole = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
	const id = req?.user?.id as string;
	const userId=req.params.id as string
	const data = await AdminServices.updateRole(req.body.role,id,userId);
	sendSuccess(res, StatusCodes.OK, "User Role update successful", data );
});


export const AdminController = {
	updateRole
};