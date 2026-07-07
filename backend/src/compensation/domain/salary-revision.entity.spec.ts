import { SalaryRevision } from './salary-revision.entity';
import { SalaryStructure } from './salary-structure.entity';
import { SalaryComponent } from './salary-component.vo';
import { MissingRemarkError } from './compensation.errors';

function structure(basicMinor: number): SalaryStructure {
  return SalaryStructure.create('emp_1', 'org_1', 'INR', [
    SalaryComponent.of('BASIC', basicMinor, 'INR'),
  ]);
}

describe('SalaryRevision', () => {
  describe('initial revision (created with the employee)', () => {
    it('has a null old total and snapshots the components', () => {
      const revision = SalaryRevision.forInitial(structure(8000000), 'usr_1');

      expect(revision.oldTotalMinor).toBeNull();
      expect(revision.newTotalMinor).toBe(8000000);
      expect(revision.changedByUserId).toBe('usr_1');
      expect(revision.componentsSnapshot).toEqual([{ type: 'BASIC', amountMinor: 8000000 }]);
    });
  });

  describe('edit revision', () => {
    it('records old→new totals with the required remark and author', () => {
      const revision = SalaryRevision.forEdit(
        structure(8000000),
        structure(9000000),
        'FY25 increment, 12% raise',
        'usr_1',
      );

      expect(revision.oldTotalMinor).toBe(8000000);
      expect(revision.newTotalMinor).toBe(9000000);
      expect(revision.remark).toBe('FY25 increment, 12% raise');
    });

    it('rejects a blank remark — the appraisal trail can never be skipped (FR-3.3)', () => {
      expect(() => SalaryRevision.forEdit(structure(8000000), structure(9000000), '   ', 'usr_1')).toThrow(
        MissingRemarkError,
      );
    });
  });
});
