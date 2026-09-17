import { parseJSON, diffJSON, asPatch } from "./core.js";
import {
  $,
  init,
  message,
  table,
  stats,
  download,
  textImport,
  guard,
  ready,
} from "./ui.js";
init();
let changes = [];
const show = (x) => (x === undefined ? "— absent —" : JSON.stringify(x));
function run() {
  changes = diffJSON(parseJSON($("left").value), parseJSON($("right").value));
  stats(
    ["add", "remove", "replace"].map((op) => [
      op,
      changes.filter((c) => c.op === op).length,
    ]),
  );
  table(
    ["Operation", "JSON Pointer", "Before", "After"],
    changes.map((c) => [
      c.op,
      c.path || "(root)",
      show(c.before),
      c.op === "remove" ? "— absent —" : show(c.value),
    ]),
  );
  $("patch").textContent = JSON.stringify(asPatch(changes), null, 2);
  message(
    changes.length
      ? `${changes.length} structural changes. Object key order is ignored; array positions are significant.`
      : "The JSON structures are equivalent.",
  );
  ready();
}
$("run").onclick = guard(run);
for (const side of ["left", "right"])
  textImport(`file-${side}`, side, () => {
    $("export").disabled = true;
  });
$("export").onclick = () =>
  download(
    JSON.stringify(asPatch(changes), null, 2),
    "jsontrail.patch.json",
    "application/json",
  );
$("demo").onclick = guard(() => {
  $("left").value = JSON.stringify(
    {
      app: "weekend",
      theme: "light",
      features: ["search", "export"],
      limits: { files: 20 },
      legacy: true,
    },
    null,
    2,
  );
  $("right").value = JSON.stringify(
    {
      app: "weekend",
      theme: "dark",
      features: ["search", "export", "offline"],
      limits: { files: 100 },
      version: "1.0",
    },
    null,
    2,
  );
  run();
});
