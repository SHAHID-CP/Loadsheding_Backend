import { z } from 'zod';

const codeSchema = z
  .string()
  .min(3, 'Code must be at least 3 characters')
  .max(30, 'Code must be at most 30 characters')
  .regex(/^[A-Z0-9-]+$/, 'Code may only contain uppercase letters, numbers and dashes');

const createZoneSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: codeSchema,
});

const updateZoneSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid uuid') }),
  body: z
    .object({
      name: z.string().min(3).optional(),
      code: codeSchema.optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

const listZoneSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'code']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().min(1).optional(),
  }),
});

const zoneIdSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid uuid') }),
});

export const ZoneValidation = {
  createZoneSchema,
  updateZoneSchema,
  listZoneSchema,
  zoneIdSchema,
};
