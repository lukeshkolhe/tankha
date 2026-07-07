import { PageRequest, PaginatedResult } from './pagination';

describe('PageRequest', () => {
  describe('normalisation of untrusted query input', () => {
    it('defaults to page 1, pageSize 25 when nothing is given', () => {
      const page = PageRequest.from({});

      expect(page.page).toBe(1);
      expect(page.pageSize).toBe(25);
    });

    it('clamps pageSize to the max of 100', () => {
      expect(PageRequest.from({ pageSize: 5000 }).pageSize).toBe(100);
    });

    it('floors page and pageSize to at least 1', () => {
      const page = PageRequest.from({ page: 0, pageSize: 0 });

      expect(page.page).toBe(1);
      expect(page.pageSize).toBe(1);
    });

    it('coerces numeric strings from the query string', () => {
      const page = PageRequest.from({ page: '3', pageSize: '10' });

      expect(page.page).toBe(3);
      expect(page.pageSize).toBe(10);
    });

    it('ignores non-numeric junk and falls back to defaults', () => {
      const page = PageRequest.from({ page: 'abc', pageSize: 'xyz' });

      expect(page.page).toBe(1);
      expect(page.pageSize).toBe(25);
    });
  });

  describe('offset for the database', () => {
    it('computes a zero-based skip from the 1-based page', () => {
      expect(PageRequest.from({ page: 1, pageSize: 25 }).skip).toBe(0);
      expect(PageRequest.from({ page: 3, pageSize: 25 }).skip).toBe(50);
    });

    it('exposes take equal to pageSize', () => {
      expect(PageRequest.from({ pageSize: 40 }).take).toBe(40);
    });
  });
});

describe('PaginatedResult', () => {
  it('wraps rows with the total, page and pageSize envelope', () => {
    const result = PaginatedResult.of(['a', 'b'], 10000, PageRequest.from({ page: 2, pageSize: 25 }));

    expect(result).toEqual({ data: ['a', 'b'], total: 10000, page: 2, pageSize: 25 });
  });
});
