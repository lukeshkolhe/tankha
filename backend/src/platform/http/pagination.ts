const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/** Raw, untrusted list params as they arrive on the query string. */
export interface RawPageParams {
  page?: number | string;
  pageSize?: number | string;
}

/**
 * A normalised, safe view of the shared list convention (`?page&pageSize`).
 * Clamps and coerces untrusted input once so no repository re-implements it,
 * and exposes DB-ready `skip`/`take`.
 */
export class PageRequest {
  private constructor(
    readonly page: number,
    readonly pageSize: number,
  ) {}

  static from(params: RawPageParams): PageRequest {
    const page = clampToAtLeast(coerce(params.page, DEFAULT_PAGE), 1);
    const pageSize = clamp(coerce(params.pageSize, DEFAULT_PAGE_SIZE), 1, MAX_PAGE_SIZE);
    return new PageRequest(page, pageSize);
  }

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get take(): number {
    return this.pageSize;
  }
}

/** The standard list response envelope: `{ data, total, page, pageSize }`. */
export class PaginatedResult<T> {
  private constructor(
    readonly data: T[],
    readonly total: number,
    readonly page: number,
    readonly pageSize: number,
  ) {}

  static of<T>(data: T[], total: number, request: PageRequest): PaginatedResult<T> {
    return new PaginatedResult(data, total, request.page, request.pageSize);
  }
}

function coerce(value: number | string | undefined, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (parsed === undefined || parsed === null || Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.floor(parsed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampToAtLeast(value: number, min: number): number {
  return Math.max(value, min);
}
