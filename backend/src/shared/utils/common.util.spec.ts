import { isObjectEmpty } from './common.util';

describe('isObjectEmpty', () => {
  it('returns true for an empty object', () => {
    expect(isObjectEmpty({})).toBe(true);
  });

  it('returns true when every value is undefined', () => {
    expect(isObjectEmpty({ a: undefined, b: undefined })).toBe(true);
  });

  it('returns false when at least one value is defined', () => {
    expect(isObjectEmpty({ a: undefined, b: 'set' })).toBe(false);
  });

  it('treats a defined falsy number (0) as non-empty', () => {
    expect(isObjectEmpty({ quantity: 0 })).toBe(false);
  });

  it('treats a defined falsy string ("") as non-empty', () => {
    expect(isObjectEmpty({ book: '' })).toBe(false);
  });
});
