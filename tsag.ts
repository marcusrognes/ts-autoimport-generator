import type { Config } from "./src/utils/getConfig";

export const config: Config = {
  files: {
    "./example/imports.generated.ts": {
      patterns: ["example/**/*.glob.ts", "example/**/*.actions.ts"],
    },
    "./example/features/actions.generated.ts": {
      patterns: ["example/**/*.actions.ts"],
      exportName: "actions",
      tree: true,
    },

    "./example/features/nodes/actions.generated.ts": {
      patterns: ["example/features/nodes/**/*.actions.ts"],
      exportName: "actions",
      tree: true,
    },
  },
};
