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
  const configUrl = pathToFileURL(configPath).href;

  const file = await import(configUrl);

  if (!file?.config) {
    throw new Error("Missing or invalid tsag.ts config");
  }

  return file.config;
}
