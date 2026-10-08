import type { Priority, Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { buildMeta, calculatePagination, type PaginationQuery } from "../../utils/paginate";
import { AppError } from "../../utils/sendResponse";


const feederSelect = {
  id: true,
  name: true,
  code: true,
  loadMw: true,
  priority: true,
  substationId: true,
  createdAt: true,
  updatedAt: true,
  substation: {
    select: {
      id: true,
      name: true,
      code: true,
      zone: { select: { id: true, name: true, code: true } },
    },
  },
  _count: { select: { areas: { where: { deletedAt: null } } } },
} satisfies Prisma.FeederSelect;

export type CreateFeederInput = {
  name: string;
  code: string;
  loadMw: number;
  priority?: Priority;
  substationId: string;
};
export type UpdateFeederInput = Partial<CreateFeederInput>;
export type ListFeederQuery = PaginationQuery & {
  substationId?: string;
  priority?: Priority;
  searchTerm?: string;
};

const assertSubstationExists = async (substationId: string) => {
  const substation = await prisma.substation.findFirst({
    where: { id: substationId, deletedAt: null },
    select: { id: true },
  });

  if (!substation) {
    throw new AppError(404, 'Substation not found', [
      { path: 'substationId', message: 'No active substation matches this id' },
    ]);
  }
};

const findActiveOrThrow = async (id: string) => {
  const feeder = await prisma.feeder.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, code: true, loadMw: true, priority: true, substationId: true },
  });

  if (!feeder) {
    throw new AppError(404, 'Feeder not found');
  }

  return feeder;
};

const create = async (actorId: string, payload: CreateFeederInput) => {
  await assertSubstationExists(payload.substationId);
  return prisma.$transaction(async (tx) => {
    const created = await tx.feeder.create({ data: payload, select: feederSelect });
    return created;
  });
};

const list = async (query: ListFeederQuery) => {
  const { substationId, priority, searchTerm, ...paginationQuery } = query;
  const options = calculatePagination(paginationQuery);

  const where: Prisma.FeederWhereInput = {
    deletedAt: null,
    ...(substationId ? { substationId } : {}),
    ...(priority ? { priority } : {}),
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
    prisma.feeder.findMany({
      where,
      select: feederSelect,
      skip: options.skip,
      take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
    }),
    prisma.feeder.count({ where }),
  ]);

  return { data, meta: buildMeta(total, options) };
};

const getById = async (id: string) => {
  const feeder = await prisma.feeder.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...feederSelect,
      areas: {
        where: { deletedAt: null },
        orderBy: { code: 'asc' },
        select: { id: true, name: true, code: true, lat: true, lng: true },
      },
    },
  });

  if (!feeder) {
    throw new AppError(404, 'Feeder not found');
  }

  return feeder;
};

const update = async (actorId: string, id: string, payload: UpdateFeederInput) => {
  const before = await findActiveOrThrow(id);

  if (payload.substationId && payload.substationId !== before.substationId) {
    await assertSubstationExists(payload.substationId);
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.feeder.update({
      where: { id },
      data: payload,
      select: feederSelect,
    });
    return updated;
  });
};

const softDelete = async (actorId: string, id: string) => {
  const [activeAreas, activeSchedules] = await Promise.all([
    prisma.area.count({ where: { feederId: id, deletedAt: null } }),
    prisma.loadShedSchedule.count({
      where: { feederId: id, deletedAt: null, status: { in: ['DRAFT', 'PUBLISHED', 'ACTIVE'] } },
    }),
  ]);

  if (activeAreas > 0) {
    throw new AppError(409, 'Feeder still has active areas', [
      {
        path: 'areas',
        message: `Delete or move ${activeAreas} area(s) before deleting this feeder`,
      },
    ]);
  }

  if (activeSchedules > 0) {
    throw new AppError(409, 'Feeder still has pending schedules', [
      {
        path: 'schedules',
        message: `Cancel ${activeSchedules} schedule(s) before deleting this feeder`,
      },
    ]);
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.feeder.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, name: true, code: true, deletedAt: true },
    });
    return deleted;
  });
};

export const FeederService = { create, list, getById, update, softDelete };
