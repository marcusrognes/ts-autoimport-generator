import path from "path";

export type FileConfig = {
  tree?: boolean;
  exportName?: string;
  patterns: string[];
};
export type Config = {
  files: { [file: string]: FileConfig };
};

export async function getConfig(dir: string): Promise<Config> {
  const configPath = path.resolve(dir, "tsag.ts");

  // Register tsx so .ts files can be loaded via require
  require("tsx/cjs");

  let file: any = {};
  try {
    delete require.cache[require.resolve(configPath)];
    file = require(configPath);
  } catch (error) {
    console.error(error);
    throw new Error("Missing config file tsag.ts");
  }

  if (!file?.config) {
    throw new Error("Missing or invalid tsag.ts config");
  }

  return file.config;
}
