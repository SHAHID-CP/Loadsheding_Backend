import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import {  clearAuthCookies, setAuthCookies } from "../../utils/cookies";
import { AppError, sendSuccess } from "../../utils/sendResponse";
import { authService } from "./auth.service";






const register = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
    const payload = req.body;
    await authService.registerUser(payload);
    sendSuccess(res, StatusCodes.CREATED, "Verification OTP Sent successfully",null);
});

const verifyUserEmail = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
    const payload = req.body;
    const {accessToken, refreshToken,user} =await authService.verifyUserEmail(payload);
    setAuthCookies(res, accessToken, refreshToken);
    sendSuccess(res, StatusCodes.OK, "Login successful", {user,accessToken,refreshToken } );
});



const login = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
    const payload = req.body;
    const {accessToken, refreshToken,user} = await authService.loginUser(payload);
    setAuthCookies(res, accessToken, refreshToken);
    sendSuccess(res, StatusCodes.OK, "Login successful", {user,accessToken,refreshToken } );
});




const googleLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;
    if (!idToken) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Google ID Token is required");
    }
    const { accessToken, refreshToken, user } = await authService.googleLoginUser(idToken);
    setAuthCookies(res, accessToken, refreshToken);
    sendSuccess(res, StatusCodes.OK, "Google Login successful", {user,accessToken,refreshToken });
});



const logout = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
  clearAuthCookies(res);
  sendSuccess(res, StatusCodes.OK, "Logged out successfully");
});

const refreshToken = catchAsync(async (req: Request, res: Response,next:NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "No refresh token provided");
    }

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(
    refreshToken
  );
  setAuthCookies(res, accessToken, newRefreshToken);
  sendSuccess(res, StatusCodes.OK, "Access token refreshed successfully");
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await authService.forgotPassword(payload);

	sendSuccess(res, StatusCodes.OK,`OTP Sent To Email : ${payload.email}`, null,);
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await authService.resetPassword(payload);
    	sendSuccess(res, StatusCodes.OK,"Password reset Successfully", null,);
});

const changedPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = {
          ...req.body,
          email: req?.user?.email,
    }
	await authService.changedPassword(payload);
    	sendSuccess(res, StatusCodes.OK,"Password Changed Successfully", null,);
});




export const authController={
    register,
    verifyUserEmail,
    googleLogin,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    changedPassword
}