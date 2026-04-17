import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";

// Load .env.local so TEST_API_KEY (and other vars) are available in tests
config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
  },
});