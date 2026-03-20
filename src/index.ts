#!/usr/bin/env node

import path from "path";
import fs from "fs/promises";
import yargs from "yargs";
import { glob } from "glob";
import watch from "glob-watcher";
import { getSafeName } from "./utils/getSafeName";
import { Config, FileConfig, getConfig } from "./utils/getConfig";

const argv = yargs(process.argv.slice(2)).parseSync();

const stripExtension = argv.stripExtension;

const prefix = argv.prefix ?? ("./" as string);
const [command] = argv._;

function getSharedSegments(files: string[]): string[] {
  if (files.length === 0) return [];
  const split = files.map((f) => f.split("/"));
  const first = split[0];
  let i = 0;
  while (i < first.length - 1 && split.every((segs) => segs[i] === first[i])) {
    i++;
  }
  return first.slice(0, i);
}

async function processFileConfig(fileName: string, fileConfig: FileConfig) {
  const files = await glob(fileConfig.patterns, { posix: true });
  files.sort();
  const sharedSegments = getSharedSegments(files);
  let fileContents = `/* GENERATED FILE, do not edit! */\n\n`;
  let fileExport = `export const ${fileConfig.exportName || "collected"} = {`;

  if (!fileConfig.tree) {
    files.forEach((f) => {
      const segments = f.split("/").slice(sharedSegments.length);
      const fileName = segments[segments.length - 1] ?? "";
      const safeName = getSafeName(fileName);

      let importPath = `${prefix}${segments.join("/")}`;

      if (stripExtension) {
        const importPathList = importPath.split(".");
        importPathList.pop();
        importPath = importPathList.join(".");
      }

      fileContents += `import * as ${safeName} from '${importPath}';\n`;
      fileExport += `...${safeName},`;
    });
  } else {
  }

  fileExport += `};`;
  fileContents += `\n\n${fileExport}\n`;

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

  for (const filePath of files) {
    await processFileConfig(filePath, config.files[filePath]);
  }

  if (command === "watch") {
    for (const filePath of files) {
      watchFileConfig(filePath, config.files[filePath]);
    }
  }
}

main();
