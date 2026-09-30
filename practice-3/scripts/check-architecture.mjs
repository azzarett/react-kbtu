import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const root = resolve("src");
const errors = [];

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(js|jsx)$/.test(path)) yield path;
  }
}

// Check local static imports and re-exports. App entry files may compose
// features and common; common stays independent and features stay isolated.
for await (const file of walk(root)) {
  const source = relative(root, file).split("/");
  const text = await readFile(file, "utf8");
  const imports = text.matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g);
  for (const [, specifier] of imports) {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
    const targetPath = specifier.startsWith("@/")
      ? resolve(root, specifier.slice(2))
      : resolve(dirname(file), specifier);
    const target = relative(root, targetPath).split("/");
    const report = (reason) =>
      errors.push(`${relative(root, file)} → ${specifier}: ${reason}`);

    if (source[0] === "common" && target[0] !== "common")
      report("common must not depend on features or app entry files");
    if (source[0] === "features") {
      if (!["common", "features"].includes(target[0]))
        report("features must not depend on app entry files");
      else if (target[0] === "features" && source[1] !== target[1])
        report("features must not import other features");
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Common/features import boundaries: OK");
}
