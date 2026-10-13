/**
 * Shared pagination utilities used across all controllers.
 */

export const parsePagination = (query) => ({
  limit: Math.min(parseInt(query.limit) || 20, 50),
  skip: Math.max(parseInt(query.skip) || 0, 0),
});

export const buildPaginationResponse = (data, { skip, limit, total }) => ({
  data,
  pagination: {
    page: Math.floor(skip / limit) + 1,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + limit < total,
  },
});
