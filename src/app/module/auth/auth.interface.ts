import { Role, type Priority } from "../../../../generated/prisma/enums";


export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  meterNo?: string;
  priority?: Priority;
  areaId?: string;
}

export interface LoginInput {
	email: string;
	password: string;
}


export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}
export interface IResetPasswordPayload {
	email: string;
	newPassword: string;
	otp: string;
}
export interface IChangedPasswordPayload {
	oldPassword: string;
	newPassword: string;
	email:string
}
