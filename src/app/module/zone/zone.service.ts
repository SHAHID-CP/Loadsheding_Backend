import type { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { buildMeta, calculatePagination, type PaginationQuery } from "../../utils/paginate";
import { AppError } from "../../utils/sendResponse";

const zoneSelect = {
  id: true,
  name: true,
  code: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { substations: { where: { deletedAt: null } } } },
} satisfies Prisma.ZoneSelect;

export type CreateZoneInput = { name: string; code: string };
export type UpdateZoneInput = Partial<CreateZoneInput>;
export type ListZoneQuery = PaginationQuery & { searchTerm?: string };

const findActiveOrThrow = async (id: string) => {
  const zone = await prisma.zone.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, code: true },
  });

  if (!zone) {
    throw new AppError(404, 'Zone not found');
  }

  return zone;
};

const create = async (actorId: string, payload: CreateZoneInput) =>
  prisma.$transaction(async (tx) => {
    const created = await tx.zone.create({ data: payload, select: zoneSelect });
    return created;
  });

const list = async (query: ListZoneQuery) => {
  const { searchTerm, ...paginationQuery } = query;
  const options = calculatePagination(paginationQuery);

  const where: Prisma.ZoneWhereInput = {
    deletedAt: null,
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
    prisma.zone.findMany({
      where,
      select: zoneSelect,
      skip: options.skip,
      take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
    }),
    prisma.zone.count({ where }),
  ]);

  return { data, meta: buildMeta(total, options) };
};

// Nested read: zone -> substations -> feeders -> areas (active records only).
const getById = async (id: string) => {
  const zone = await prisma.zone.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...zoneSelect,
      substations: {
        where: { deletedAt: null },
        orderBy: { code: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          capacityMw: true,
          feeders: {
            where: { deletedAt: null },
            orderBy: { code: 'asc' },
            select: {
              id: true,
              name: true,
              code: true,
              loadMw: true,
              priority: true,
              areas: {
                where: { deletedAt: null },
                orderBy: { code: 'asc' },
                select: { id: true, name: true, code: true, lat: true, lng: true },
              },
            },
          },
        },
      },
    },
  });

  if (!zone) {
    throw new AppError(404, 'Zone not found');
  }

  return zone;
};

const update = async (actorId: string, id: string, payload: UpdateZoneInput) => {
  const before = await findActiveOrThrow(id);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.zone.update({ where: { id }, data: payload, select: zoneSelect });
    return updated;
  });
};

const softDelete = async (actorId: string, id: string) => {
  const before = await findActiveOrThrow(id);

  const activeSubstations = await prisma.substation.count({
    where: { zoneId: id, deletedAt: null },
  });

  if (activeSubstations > 0) {
    throw new AppError(409, 'Zone still has active substations', [
      {
        path: 'substations',
        message: `Delete or move ${activeSubstations} substation(s) before deleting this zone`,
      },
    ]);
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.zone.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, name: true, code: true, deletedAt: true },
    });
    return deleted;
  });
};

export const ZoneService = { create, list, getById, update, softDelete, findActiveOrThrow };
