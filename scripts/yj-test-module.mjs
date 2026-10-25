import { build } from "esbuild";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
export async function modules() {
  const directory = await mkdtemp(resolve(tmpdir(), "yj-services-test-"));
  const root = process.cwd();
  const entries = [
    "model",
    "fixtures",
    "routes",
    "camera",
    "id",
    "services/schema",
    "services/store",
    "services/gemini",
    "view-model",
    "services/external",
  ];
  await build({
    stdin: {
      contents: entries
        .map(
          (name, index) =>
            `import * as module${index} from ${JSON.stringify(resolve(root, "lib/yj/" + name + ".ts"))};export {module${index}};`,
        )
        .join("\n"),
      resolveDir: root,
      loader: "ts",
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: resolve(directory, "test.mjs"),
    logLevel: "silent",
  });
  const imported = await import(pathToFileURL(resolve(directory, "test.mjs")));
  const { module8: view, module9: external, ...rest } = imported;
  return { ...Object.assign({}, ...Object.values(rest)), view, external };
}
