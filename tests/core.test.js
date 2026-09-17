import test from "node:test";
import assert from "node:assert/strict";
import { diffJSON, asPatch, parseJSON } from "../src/core.js";
test("ignores object order and escapes pointer paths", () => {
  assert.deepEqual(diffJSON({ a: 1, b: 2 }, { b: 2, a: 1 }), []);
  assert.equal(diffJSON({ "a/b~c": 1 }, { "a/b~c": 2 })[0].path, "/a~1b~0c");
});
test("array removals descend, additions append, root replacement is supported", () => {
  assert.deepEqual(asPatch(diffJSON([1, 2, 3], [1])), [
    { op: "remove", path: "/2" },
    { op: "remove", path: "/1" },
  ]);
  assert.deepEqual(asPatch(diffJSON([1], [1, 2])), [
    { op: "add", path: "/-", value: 2 },
  ]);
  assert.deepEqual(asPatch(diffJSON(null, {})), [
    { op: "replace", path: "", value: {} },
  ]);
});
test("prototype-like keys are ordinary own data", () => {
  const a = JSON.parse('{"__proto__":1}'),
    b = JSON.parse('{"__proto__":2,"constructor":3}');
  assert.equal(diffJSON(a, b).length, 2);
  assert.equal({}.polluted, undefined);
});
test("rejects unsafe integers, invalid JSON and excessive nesting", () => {
  assert.throws(() => parseJSON('{"id":9007199254740993}'));
  assert.throws(() => parseJSON('{"x":1e999}'));
  assert.throws(() => parseJSON("{"));
  assert.throws(() => parseJSON("[".repeat(152) + "0" + "]".repeat(152)));
});
