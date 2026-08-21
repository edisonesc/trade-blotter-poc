export function isObjectEmpty<T extends object>(obj: T) {
  return Object.values(obj).every((value) => value === undefined);
}
