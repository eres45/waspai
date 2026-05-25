import { defineConfig } from "vitest/config";

import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    exclude: ["**/tests/**", "**/node_modules/**", "**/db-debug.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
