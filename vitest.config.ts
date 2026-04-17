import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    // Use Vitest's built-in env config instead of manual dotenv loading (#23).
    // This reads from process.env at test time — set env vars in CI or via
    // a .env.test file that's gitignored.
    env: {
      API_BASE_URL: "http://localhost:3000",
    },
  },
});