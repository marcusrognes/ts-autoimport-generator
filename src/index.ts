#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import yargs from 'yargs';
import { glob } from 'glob';
import watch from 'glob-watcher';

const argv = yargs(process.argv.slice(2)).parseSync();

const pattern = argv.pattern as string;
const prefix = argv.prefix ?? "./" as string;
const output = argv.output as string;
const [command] = argv._;

function getSafeName(name: string): string {
  return name.replace(/\./g, "_").replace(new RegExp(`g\${path.delimiter}/g`), "_");
}

async function processFiles() {
  const files = await glob(pattern);

  let fileContents = `/* GENERATED FILE, do not edit! */\n\n`;
  let fileExport = `export const collected = {`;

  files.forEach(f => {
    const pathList = f.split(path.sep);
    const fileName = f.split(path.sep).pop() ?? "";
    const safeName = getSafeName(fileName);
    fileContents += `import * as ${safeName} from '${prefix}${pathList.join("/")}';\n`;
    fileExport += `...${safeName},`;
  });

  fileExport += `};`;
  fileContents += `\n\n${fileExport}\n`;

  await fs.writeFile(output, fileContents, { encoding: 'utf-8' });
}

async function main() {
  if (!pattern || !output) {
    console.log("Missing --pattern or --ouput");
    return;
  }

  await processFiles();

  if (command === "watch") {
    const watcher = watch(pattern);

    watcher.on("add", async () => {
      console.log("File added\n");
      await processFiles();
    });

    watcher.on("unlink", async () => {
      console.log("File removed\n");
      await processFiles();
    });
  }
}

main();

