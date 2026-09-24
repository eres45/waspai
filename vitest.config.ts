import { defineConfig } from "vitest/config";

import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "**/tests/**",
      "**/node_modules/**",
      "**/db-debug.test.ts",
      "**/WaspAI app/**",
      "**/backup_waspai/**",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
