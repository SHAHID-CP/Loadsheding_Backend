import { z } from 'zod';

const codeSchema = z
  .string()
  .min(3, 'Code must be at least 3 characters')
  .max(30, 'Code must be at most 30 characters')
  .regex(/^[A-Z0-9-]+$/, 'Code may only contain uppercase letters, numbers and dashes');

const latSchema = z.coerce.number().min(-90, 'lat must be >= -90').max(90, 'lat must be <= 90');
const lngSchema = z.coerce.number().min(-180, 'lng must be >= -180').max(180, 'lng must be <= 180');

const createAreaSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    code: codeSchema,
    lat: latSchema.optional(),
    lng: lngSchema.optional(),
    feederId: z.string().uuid('feederId must be a valid uuid'),
  }),
});

const updateAreaSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid uuid') }),
  body: z
    .object({
      name: z.string().min(3).optional(),
      code: codeSchema.optional(),
      lat: latSchema.nullable().optional(),
      lng: lngSchema.nullable().optional(),
      feederId: z.string().uuid('feederId must be a valid uuid').optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

const listAreaSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'code']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    feederId: z.string().uuid('feederId must be a valid uuid').optional(),
    substationId: z.string().uuid('substationId must be a valid uuid').optional(),
    zoneId: z.string().uuid('zoneId must be a valid uuid').optional(),
    searchTerm: z.string().min(1).optional(),
  }),
});

const areaIdSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid uuid') }),
});

export const AreaValidation = {
  createAreaSchema,
  updateAreaSchema,
  listAreaSchema,
  areaIdSchema,
};
