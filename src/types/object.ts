export function deepClone(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj));
}
