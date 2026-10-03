import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import {  AppError, sendSuccess } from "../../utils/sendResponse";
import { UserServices } from "./user.service";
import type { Role } from "../../../../generated/prisma/enums";




const getMyProfile = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
	const id = req?.user?.id as string;
	const role = req?.user?.role as Role;
	const user = await UserServices.getMyProfile(id,role);
	sendSuccess(res, StatusCodes.OK, "Profile data fetch successful", user  );
});


const updateProfile = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
	const id = req?.user?.id as string;
	const role = req?.user?.role as Role;
	const user = await UserServices.updateProfile(req.body,id,role);
	sendSuccess(res, StatusCodes.OK, "Profile update successful", user );
});

const updateMeter = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
	const id = req?.user?.id as string;
	const user = await UserServices.updateMeter(req.body,id,);
	sendSuccess(res, StatusCodes.OK, "Meter update successful", user );
});




const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new AppError(StatusCodes.BAD_REQUEST, "No File Provided.");
	}

	const userId = req.user?.id;

	const result = await UserServices.uploadProfileImage(
		req.file?.buffer,
		userId!,
	);
    sendSuccess(res, StatusCodes.OK, "profile picture uploded successful", null );
});

export const UserController = {
	uploadProfileImage,
	getMyProfile,
	updateProfile,
	updateMeter
};
