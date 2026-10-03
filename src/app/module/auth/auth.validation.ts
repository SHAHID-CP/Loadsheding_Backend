import { z } from "zod";
import { Priority } from "../../../../generated/prisma/enums";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"), 
  phone: z.string().min(6, 'A valid phone number is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  meterNo: z.string().min(3, 'Meter number is required'),
  priority: z.nativeEnum(Priority).optional(),
  areaId: z.string().uuid('areaId must be a valid uuid').optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password is required"),
});

export const userEmailVerifySchema = z.object({
	email: z.email("Not email!!"),
	otp: z.string().length(6),
});


export const ForgotPasswordSchema = z.object({
	email: z.email(),
});

export const ResetPasswordSchema = z.object({
	email: z.email(),
	newPassword: z
		.string()
		.min(8, "Password Must Minimum 8 Characters Long.")
		.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
		.regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

		.regex(/[0-9]/, "Password must contain atleast 1 Number")
		.regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
	otp: z.string().length(6),
});
export const ChangedPasswordSchema = z.object({
    oldPassword: z.string().min(8, "Password is required"),
	newPassword: z
		.string()
		.min(8, "Password Must Minimum 8 Characters Long.")
		.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
		.regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

		.regex(/[0-9]/, "Password must contain atleast 1 Number")
		.regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character")
});

