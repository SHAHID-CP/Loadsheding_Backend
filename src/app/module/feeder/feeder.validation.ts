import { z } from 'zod';
import { Priority } from '../../../../generated/prisma/enums';

const codeSchema = z
  .string()
  .min(3, 'Code must be at least 3 characters')
  .max(30, 'Code must be at most 30 characters')
  .regex(/^[A-Z0-9-]+$/, 'Code may only contain uppercase letters, numbers and dashes');

const createFeederSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: codeSchema,
    loadMw: z.coerce.number().positive('loadMw must be greater than 0'),
    priority: z.nativeEnum(Priority).optional(),
    substationId: z.string().uuid('substationId must be a valid uuid'),
  }),
});

const updateFeederSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid uuid') }),
  body: z
    .object({
      name: z.string().min(3).optional(),
      code: codeSchema.optional(),
      loadMw: z.coerce.number().positive().optional(),
      priority: z.nativeEnum(Priority).optional(),
      substationId: z.string().uuid('substationId must be a valid uuid').optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

const listFeederSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'code', 'loadMw', 'priority']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    substationId: z.string().uuid('substationId must be a valid uuid').optional(),
    priority: z.nativeEnum(Priority).optional(),
    searchTerm: z.string().min(1).optional(),
  }),
});

const feederIdSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid uuid') }),
});

export const FeederValidation = {
  createFeederSchema,
  updateFeederSchema,
  listFeederSchema,
  feederIdSchema,
};
