// import type { Prisma } from '@prisma/client';
// import { prisma } from '../../config/prisma.js';
// import ApiError from '../../shared/ApiError.js';
// import { type PaginationQuery, buildMeta, calculatePagination } from '../../shared/paginate.js';

import type { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { buildMeta, calculatePagination, type PaginationQuery } from "../../utils/paginate";
import { AppError } from "../../utils/sendResponse";


const substationSelect = {
  id: true,
  name: true,
  code: true,
  capacityMw: true,
  zoneId: true,
  createdAt: true,
  updatedAt: true,
  zone: { select: { id: true, name: true, code: true } },
  _count: { select: { feeders: { where: { deletedAt: null } } } },
} satisfies Prisma.SubstationSelect;

export type CreateSubstationInput = {
  name: string;
  code: string;
  capacityMw: number;
  zoneId: string;
};
export type UpdateSubstationInput = Partial<CreateSubstationInput>;
export type ListSubstationQuery = PaginationQuery & { zoneId?: string; searchTerm?: string };

const assertZoneExists = async (zoneId: string) => {
  const zone = await prisma.zone.findFirst({
    where: { id: zoneId, deletedAt: null },
    select: { id: true },
  });

  if (!zone) {
    throw new AppError(404, 'Zone not found', [
      { path: 'zoneId', message: 'No active zone matches this id' },
    ]);
  }
};

const findActiveOrThrow = async (id: string) => {
  const substation = await prisma.substation.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, code: true, capacityMw: true, zoneId: true },
  });

  if (!substation) {
    throw new AppError(404, 'Substation not found');
  }

  return substation;
};

const create = async (actorId: string, payload: CreateSubstationInput) => {
  await assertZoneExists(payload.zoneId);

  return prisma.$transaction(async (tx) => {
    const created = await tx.substation.create({ data: payload, select: substationSelect });

    return created;
  });
};

const list = async (query: ListSubstationQuery) => {
  const { zoneId, searchTerm, ...paginationQuery } = query;
  const options = calculatePagination(paginationQuery);

  const where: Prisma.SubstationWhereInput = {
    deletedAt: null,
    ...(zoneId ? { zoneId } : {}),
    ...(searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { code: { contains: searchTerm, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.substation.findMany({
      where,
      select: substationSelect,
      skip: options.skip,
      take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
    }),
    prisma.substation.count({ where }),
  ]);

  return { data, meta: buildMeta(total, options) };
};

const getById = async (id: string) => {
  const substation = await prisma.substation.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...substationSelect,
      feeders: {
        where: { deletedAt: null },
        orderBy: { code: 'asc' },
        select: { id: true, name: true, code: true, loadMw: true, priority: true },
      },
    },
  });

  if (!substation) {
    throw new AppError(404, 'Substation not found');
  }

  return substation;
};

const update = async (actorId: string, id: string, payload: UpdateSubstationInput) => {
  const before = await findActiveOrThrow(id);

  if (payload.zoneId && payload.zoneId !== before.zoneId) {
    await assertZoneExists(payload.zoneId);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.substation.update({
      where: { id },
      data: payload,
      select: substationSelect,
    });
    return updated;
  });
};

const softDelete = async (actorId: string, id: string) => {
  const activeFeeders = await prisma.feeder.count({
    where: { substationId: id, deletedAt: null },
  });

  if (activeFeeders > 0) {
    throw new AppError(409, 'Substation still has active feeders', [
      {
        path: 'feeders',
        message: `Delete or move ${activeFeeders} feeder(s) before deleting this substation`,
      },
    ]);
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.substation.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, name: true, code: true, deletedAt: true },
    });

    return deleted;
  });
};

export const SubstationService = { create, list, getById, update, softDelete };
