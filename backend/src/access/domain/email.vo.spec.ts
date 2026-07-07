import { Email } from './email.vo';
import { InvalidEmailError } from './access.errors';

describe('Email', () => {
  it('accepts a well-formed address and exposes its value', () => {
    expect(Email.of('priya@acme.com').value).toBe('priya@acme.com');
  });

  it('normalises to lower-case and trims surrounding whitespace', () => {
    expect(Email.of('  Priya@ACME.com  ').value).toBe('priya@acme.com');
  });

  it('treats two addresses that differ only in case as equal', () => {
    expect(Email.of('priya@acme.com').equals(Email.of('PRIYA@acme.com'))).toBe(true);
  });

  it('rejects an address with no @ so an invalid Email cannot exist', () => {
    expect(() => Email.of('priya.acme.com')).toThrow(InvalidEmailError);
  });

  it('rejects an address with no domain', () => {
    expect(() => Email.of('priya@')).toThrow(InvalidEmailError);
  });

  it('rejects an empty string', () => {
    expect(() => Email.of('')).toThrow(InvalidEmailError);
  });
});
