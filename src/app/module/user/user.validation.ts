import { z } from "zod";

export const updateCustomerProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(11).max(15).optional(),
    address: z.string().min(3).max(255).optional(),
});
export const updateMeterSchema = z.object({
    meterNo: z.string().min(5).max(35)
});