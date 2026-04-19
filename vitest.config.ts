import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env vars from .env.test (or .env.<mode>) — respects Vite's env loading (#23)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
    test: {
      include: ["tests/**/*.test.ts"],
      testTimeout: 60_000,
      env: {
        NODE_ENV: "test",
        SKIP_RATE_LIMIT: "true",
        API_BASE_URL: env.API_BASE_URL || "http://localhost:4567",
        TEST_API_KEY: env.TEST_API_KEY || "sk_live_test_fake_key_000000000000000000",
      },
    },
  };
});
