import path from "path";
import { pathToFileURL } from "url";

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

  let file: any = {};

  try {
    file = await import(configPath);
  } catch (error) {
    console.error(error);
    throw new Error("Missing config file tsag.ts");
  }

  if (!file?.config) {
    throw new Error("Missing or invalid tsag.ts config");
  }

  return file.config;
}
