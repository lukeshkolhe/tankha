import { describe, expect, it } from 'vitest';
import { buildCommitForm, buildPreviewForm } from './buildImportForm';

function csvFile(name = 'test.csv'): File {
  return new File(['employeeCode,firstName\nEMP-1,Priya'], name, { type: 'text/csv' });
}

describe('buildPreviewForm', () => {
  it('appends the file under the "file" field', () => {
    const file = csvFile();

    const form = buildPreviewForm(file);

    // jsdom's FormData.get() rewraps File as an equivalent-but-distinct
    // object, so reference equality (toBe) doesn't hold — compare identity
    // by content instead.
    const stored = form.get('file') as File;
    expect(stored.name).toBe(file.name);
    expect(stored.type).toBe(file.type);
    expect(stored.size).toBe(file.size);
  });
});

describe('buildCommitForm', () => {
  it('appends the same file plus one applyEmployeeCodes entry per selected code', () => {
    const file = csvFile();

    const form = buildCommitForm(file, ['EMP-1042', 'EMP-2001']);

    expect((form.get('file') as File).name).toBe(file.name);
    expect(form.getAll('applyEmployeeCodes')).toEqual(['EMP-1042', 'EMP-2001']);
  });

  it('omits applyEmployeeCodes entirely when no conflicts are selected', () => {
    const file = csvFile();

    const form = buildCommitForm(file, []);

    expect(form.getAll('applyEmployeeCodes')).toEqual([]);
  });
});
