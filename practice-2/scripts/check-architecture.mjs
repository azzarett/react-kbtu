import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const root = resolve("src");
const layers = ["shared", "entities", "features", "widgets", "pages", "app"];
const errors = [];

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(js|jsx)$/.test(path)) yield path;
  }
}

// Checks static imports and re-exports used by this project. Package imports
// and the main.jsx entry point are outside the FSD layer graph.
for await (const file of walk(root)) {
  const source = relative(root, file).split("/");
  if (!layers.includes(source[0])) continue;
  const text = await readFile(file, "utf8");
  const imports = text.matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g);
  for (const [, specifier] of imports) {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
    const targetPath = specifier.startsWith("@/")
      ? resolve(root, specifier.slice(2))
      : resolve(dirname(file), specifier);
    const target = relative(root, targetPath).split("/");
    const fromLayer = layers.indexOf(source[0]);
    const toLayer = layers.indexOf(target[0]);
    const sameSlice = source[0] === target[0] && source[1] === target[1];
    const unsegmentedLayer = ["app", "shared"].includes(source[0]);
    const report = (reason) =>
      errors.push(`${relative(root, file)} → ${specifier}: ${reason}`);

    if (toLayer < 0) report("target must be inside an FSD layer");
    else if (toLayer > fromLayer)
      report("imports may only point to lower layers");
    else if (toLayer === fromLayer && !sameSlice && !unsegmentedLayer)
      report("sibling slices must not import one another");
    else if (toLayer < fromLayer) {
      const publicDepth = target[0] === "shared" ? 3 : 2;
      const isPublicApi =
        target.length === publicDepth ||
        (target.length === publicDepth + 1 &&
          /^index\.(js|jsx)$/.test(target.at(-1)));
      if (!isPublicApi) report("use the slice public API (index.js)");
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("FSD import boundaries: OK");
}
