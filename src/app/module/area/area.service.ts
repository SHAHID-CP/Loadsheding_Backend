import type { Prisma } from '../../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { buildMeta, calculatePagination, type PaginationQuery } from '../../utils/paginate';
import { AppError } from '../../utils/sendResponse';


const areaSelect = {
  id: true,
  name: true,
  code: true,
  lat: true,
  lng: true,
  feederId: true,
  createdAt: true,
  updatedAt: true,
  feeder: {
    select: {
      id: true,
      name: true,
      code: true,
      priority: true,
      substation: {
        select: {
          id: true,
          name: true,
          code: true,
          zone: { select: { id: true, name: true, code: true } },
        },
      },
    },
  },
  _count: { select: { customers: { where: { deletedAt: null } } } },
} satisfies Prisma.AreaSelect;

export type CreateAreaInput = {
  name: string;
  code: string;
  lat?: number;
  lng?: number;
  feederId: string;
};
export type UpdateAreaInput = Partial<CreateAreaInput> & {
  lat?: number | null;
  lng?: number | null;
};
export type ListAreaQuery = PaginationQuery & {
  feederId?: string;
  substationId?: string;
  zoneId?: string;
  searchTerm?: string;
};

const assertFeederExists = async (feederId: string) => {
  const feeder = await prisma.feeder.findFirst({
    where: { id: feederId, deletedAt: null },
    select: { id: true },
  });

  if (!feeder) {
    throw new AppError(404, 'Feeder not found', [
      { path: 'feederId', message: 'No active feeder matches this id' },
    ]);
  }
};

const findActiveOrThrow = async (id: string) => {
  const area = await prisma.area.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, code: true, lat: true, lng: true, feederId: true },
  });

  if (!area) {
    throw new AppError(404, 'Area not found');
  }

  return area;
};

const create = async (actorId: string, payload: CreateAreaInput) => {
  await assertFeederExists(payload.feederId);
  return prisma.$transaction(async (tx) => {
    const created = await tx.area.create({ data: payload, select: areaSelect });
    return created;
  });
};

const list = async (query: ListAreaQuery) => {
  const { feederId, substationId, zoneId, searchTerm, ...paginationQuery } = query;
  const options = calculatePagination(paginationQuery);

  const where: Prisma.AreaWhereInput = {
    deletedAt: null,
    ...(feederId ? { feederId } : {}),
    ...(substationId || zoneId
      ? {
          feeder: {
            deletedAt: null,
            ...(substationId ? { substationId } : {}),
            ...(zoneId ? { substation: { zoneId } } : {}),
          },
        }
      : {}),
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
    prisma.area.findMany({
      where,
      select: areaSelect,
      skip: options.skip,
      take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
    }),
    prisma.area.count({ where }),
  ]);

  return { data, meta: buildMeta(total, options) };
};

const getById = async (id: string) => {
  const area = await prisma.area.findFirst({
    where: { id, deletedAt: null },
    select: areaSelect,
  });

  if (!area) {
    throw new AppError(404, 'Area not found');
  }

  return area;
};

const update = async (actorId: string, id: string, payload: UpdateAreaInput) => {
  const before = await findActiveOrThrow(id);

  if (payload.feederId && payload.feederId !== before.feederId) {
    await assertFeederExists(payload.feederId);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.area.update({ where: { id }, data: payload, select: areaSelect });
    return updated;
  });
};

const softDelete = async (actorId: string, id: string) => {

  const [activeCustomers, activeOutages] = await Promise.all([
    prisma.customerProfile.count({ where: { areaId: id, deletedAt: null } }),
    prisma.outage.count({
      where: {
        areaId: id,
        deletedAt: null,
        status: { notIn: ['RESTORED', 'COMPLETED', 'CANCELLED', 'REJECTED'] },
      },
    }),
  ]);

  if (activeCustomers > 0) {
    throw new AppError(409, 'Area still has active customers', [
      {
        path: 'customers',
        message: `Move ${activeCustomers} customer(s) to another area before deleting it`,
      },
    ]);
  }

  if (activeOutages > 0) {
    throw new AppError(409, 'Area still has ongoing outages', [
      {
        path: 'outages',
        message: `Resolve ${activeOutages} outage(s) before deleting this area`,
      },
    ]);
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.area.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, name: true, code: true, deletedAt: true },
    });
    return deleted;
  });
};

export const AreaService = { create, list, getById, update, softDelete };
