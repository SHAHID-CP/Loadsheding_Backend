

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginationQuery = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
};

export type PaginationOptions = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export const paginationFields = ['page', 'limit', 'sortBy', 'sortOrder'] as const;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const calculatePagination = (
  query: PaginationQuery,
  defaults: { sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
): PaginationOptions => {
  const page = Math.max(Number(query.page) || 1, 1);
  const requestedLimit = Number(query.limit) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy: query.sortBy || defaults.sortBy || 'createdAt',
    sortOrder: query.sortOrder === 'asc' ? 'asc' : defaults.sortOrder === 'asc' ? 'asc' : 'desc',
  };
};

export const buildMeta = (total: number, options: PaginationOptions): PaginationMeta => ({
  page: options.page,
  limit: options.limit,
  total,
  totalPages: Math.max(Math.ceil(total / options.limit), 1),
});

export default calculatePagination;
