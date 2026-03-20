import type { Config } from "./src/utils/getConfig";

export const config: Config = {
  files: {
    "./example/imports.generated.ts": {
      patterns: ["example/**/*.glob.ts", "example/**/*.actions.ts"],
    },
    "./example/actions.generated.ts": {
      patterns: ["example/**/*.actions.ts"],
      tree: true,
    },
  },
};
