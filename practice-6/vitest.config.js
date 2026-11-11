import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "https://polka.test/" } },
    include: ["ui-tests/**/*.test.jsx"],
    clearMocks: true,
    restoreMocks: true,
  },
}));
