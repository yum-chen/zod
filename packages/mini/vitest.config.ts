import { defineProject, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config.js";

export default mergeConfig(
  rootConfig,
  defineProject({
    resolve: {
      conditions: ["@schema/source", "default"],
    },
    test: {
      typecheck: {
        tsconfig: "./tsconfig.json",
      },
    },
  })
);
