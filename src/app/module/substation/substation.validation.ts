import { z } from 'zod';

const codeSchema = z
  .string()
  .min(3, 'Code must be at least 3 characters')
  .max(30, 'Code must be at most 30 characters')
  .regex(/^[A-Z0-9-]+$/, 'Code may only contain uppercase letters, numbers and dashes');

const createSubstationSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: codeSchema,
    capacityMw: z.coerce.number().positive('capacityMw must be greater than 0'),
    zoneId: z.string().uuid('zoneId must be a valid uuid'),
  }),
});

const updateSubstationSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid uuid') }),
  body: z
    .object({
      name: z.string().min(3).optional(),
      code: codeSchema.optional(),
      capacityMw: z.coerce.number().positive().optional(),
      zoneId: z.string().uuid('zoneId must be a valid uuid').optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

const listSubstationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'code', 'capacityMw']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    zoneId: z.string().uuid('zoneId must be a valid uuid').optional(),
    searchTerm: z.string().min(1).optional(),
  }),
});

const substationIdSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid uuid') }),
});

export const SubstationValidation = {
  createSubstationSchema,
  updateSubstationSchema,
  listSubstationSchema,
  substationIdSchema,
};
