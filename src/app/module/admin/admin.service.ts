import { StatusCodes } from "http-status-codes";
import type { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/sendResponse";


const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const updateRole = async (role:"CUSTOMER" | "TECHNICIAN" ,  currentUserId: string,targetUserId: string) => {
  const target = await prisma.user.findFirst({
    where: { id: targetUserId,isDeleted: false, deletedAt: null },
    select: { id: true, role: true, email: true },
  });

  if (!target) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (target.id === currentUserId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot change your own role');
  }

  if (target.role === role) {
    throw new AppError(StatusCodes.BAD_REQUEST, `User already has the ${role} role`);
  }

     const data = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: publicUserSelect,
    });
	return data;
	
  
};



export const AdminServices = {
updateRole
};