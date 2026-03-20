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
  stripExtension,
  stripSourceExtension,
} from "./utils/tree";

export { Config, FileConfig };

const argv = yargs(process.argv.slice(2)).parseSync();

const shouldStripExtension = argv.stripExtension;

const [command] = argv._;

async function processFileConfig(fileName: string, fileConfig: FileConfig) {
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

      let importPath = stripSourceExtension(
        `${fileConfig.prefix || "./"}${segments.join("/")}`,
      );

      if (shouldStripExtension) {
        importPath = stripExtension(importPath);
      }

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
      let importPath = stripSourceExtension(
        `${fileConfig.prefix || "./"}${relativeSegments.join("/")}`,
      );
      if (shouldStripExtension) {
        importPath = stripExtension(importPath);
      }

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

function watchFileConfig(fileName: string, fileConfig: FileConfig) {
  const watcher = watch(fileConfig.patterns);

  watcher.on("add", async () => {
    console.log("File added\n");
    await processFileConfig(fileName, fileConfig);
  });

  watcher.on("unlink", async () => {
    console.log("File removed\n");
    await processFileConfig(fileName, fileConfig);
  });
}

async function main() {
  const config = await getConfig(process.cwd());

  const files = Object.keys(config.files);

  console.log("TSAG: Building files\n");
  for (const filePath of files) {
    await processFileConfig(filePath, config.files[filePath]);
  }
  console.log("TSAG: Done building files\n");

  if (command === "watch") {
    console.log("TSAG: Watching files\n");
    for (const filePath of files) {
      watchFileConfig(filePath, config.files[filePath]);
    }
  }
}

main();
