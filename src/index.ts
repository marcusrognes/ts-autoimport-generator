#!/usr/bin/env node

import fs from "fs/promises";
import yargs from "yargs";
import { glob } from "glob";
import watch from "glob-watcher";
import { getSafeName } from "./utils/getSafeName";
import { Config, FileConfig, getConfig } from "./utils/getConfig";
import {
  TreeNode,
  getRootSegments,
  insertIntoTree,
  serializeTree,
  stripSourceExtension,
} from "./utils/tree";

export { Config, FileConfig };

const argv = yargs(process.argv.slice(2)).parseSync();

const [command] = argv._;

async function processFileConfig(
  fileName: string,
  fileConfig: FileConfig,
  stripExtensions: boolean,
) {
  const files = await glob(fileConfig.patterns, { posix: true });
  files.sort();
  const sharedSegments = getRootSegments(fileConfig.patterns);
  let fileContents = `/* GENERATED FILE, do not edit! */\n\n`;
  const exportName = fileConfig.exportName || "collected";

  if (!fileConfig.tree) {
    let fileExport = `export const ${exportName} = {`;
    files.forEach((f) => {
      const normalized = f.startsWith("./") ? f.slice(2) : f;
      const segments = normalized.split("/").slice(sharedSegments.length);
      const safeName = getSafeName(segments.join("/"));

      const rawPath = `${fileConfig.prefix || "./"}${segments.join("/")}`;
      const importPath = stripExtensions
        ? stripSourceExtension(rawPath)
        : rawPath;

      fileContents += `import * as ${safeName} from '${importPath}';\n`;
      fileExport += `...${safeName},`;
    });
    fileExport += `};`;
    fileContents += `\n\n${fileExport}\n`;
  } else {
    const outputDir = fileName.replace(/^\.\//, "").split("/").slice(0, -1);
    const extraStrip = outputDir.slice(sharedSegments.length);

    const tree: TreeNode = {};
    files.forEach((f) => {
      const normalized = f.startsWith("./") ? f.slice(2) : f;
      const segments = normalized.split("/").slice(sharedSegments.length);
      const safeName = getSafeName(segments.join("/"));

      const relativeSegments = segments.slice(extraStrip.length);
      const rawPath = `${fileConfig.prefix || "./"}${relativeSegments.join("/")}`;
      const importPath = stripExtensions
        ? stripSourceExtension(rawPath)
        : rawPath;

      fileContents += `import * as ${safeName} from '${importPath}';\n`;

      const keyPath = relativeSegments.map((s, i) =>
        i === relativeSegments.length - 1 ? s.split(".")[0] : s,
      );
      insertIntoTree(tree, keyPath, safeName);
    });
    const fileExport = `export const ${exportName} = {\n${serializeTree(tree, 2)}\n};`;
    fileContents += `\n\n${fileExport}\n`;
  }

  await fs.writeFile(fileName, fileContents, { encoding: "utf-8" });
}

function watchFileConfig(
  fileName: string,
  fileConfig: FileConfig,
  stripExtensions: boolean,
) {
  const watcher = watch(fileConfig.patterns);

  watcher.on("add", async () => {
    console.log("File added\n");
    await processFileConfig(fileName, fileConfig, stripExtensions);
  });

  watcher.on("unlink", async () => {
    console.log("File removed\n");
    await processFileConfig(fileName, fileConfig, stripExtensions);
  });
}

async function main() {
  const config = await getConfig(process.cwd());

  const files = Object.keys(config.files);

  const stripExtensions = config.stripExtensions ?? false;

  console.log("TSAG: Building files\n");
  for (const filePath of files) {
    await processFileConfig(filePath, config.files[filePath], stripExtensions);
  }
  console.log("TSAG: Done building files\n");

  if (command === "watch") {
    console.log("TSAG: Watching files\n");
    for (const filePath of files) {
      watchFileConfig(filePath, config.files[filePath], stripExtensions);
    }
  }
}

main();
