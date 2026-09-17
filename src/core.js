export const pointer = (key) =>
  String(key).replaceAll("~", "~0").replaceAll("/", "~1");
export function diffJSON(before, after, path = "", depth = 0) {
  if (depth > 150)
    throw new Error("JSON nesting exceeds the supported depth (150).");
  if (Object.is(before, after)) return [];
  const arrayA = Array.isArray(before),
    arrayB = Array.isArray(after),
    objA = before !== null && typeof before === "object",
    objB = after !== null && typeof after === "object";
  if (!objA || !objB || arrayA !== arrayB)
    return [{ op: "replace", path, value: after, before }];
  let changes = [];
  if (arrayA) {
    const length = Math.min(before.length, after.length);
    for (let i = 0; i < length; i++)
      changes.push(...diffJSON(before[i], after[i], `${path}/${i}`, depth + 1));
    for (let i = before.length - 1; i >= after.length; i--)
      changes.push({ op: "remove", path: `${path}/${i}`, before: before[i] });
    for (let i = before.length; i < after.length; i++)
      changes.push({ op: "add", path: `${path}/-`, value: after[i] });
    return changes;
  }
  for (const key of Object.keys(before)) {
    const p = `${path}/${pointer(key)}`;
    if (!Object.hasOwn(after, key))
      changes.push({ op: "remove", path: p, before: before[key] });
    else changes.push(...diffJSON(before[key], after[key], p, depth + 1));
  }
  for (const key of Object.keys(after))
    if (!Object.hasOwn(before, key))
      changes.push({
        op: "add",
        path: `${path}/${pointer(key)}`,
        value: after[key],
      });
  return changes;
}
export const asPatch = (changes) =>
  changes.map(({ op, path, value }) =>
    op === "remove" ? { op, path } : { op, path, value },
  );
export function parseJSON(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }
  const check = (v, depth = 0) => {
    if (depth > 150) throw new Error("JSON nesting exceeds 150.");
    if (
      typeof v === "number" &&
      (!Number.isFinite(v) || (Number.isInteger(v) && !Number.isSafeInteger(v)))
    )
      throw new Error(
        "Unsafe JSON number: encode large identifiers as strings to avoid precision loss.",
      );
    if (v && typeof v === "object")
      for (const x of Object.values(v)) check(x, depth + 1);
  };
  check(value);
  return value;
}
