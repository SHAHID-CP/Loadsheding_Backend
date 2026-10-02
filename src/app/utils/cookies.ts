import type { CookieOptions, Response } from "express";
import config from "../config";


const isProd = config.node_env === "production";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge:1000 * 60 * 60 * 24 //1 day
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 day
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", {...baseCookieOptions});
};