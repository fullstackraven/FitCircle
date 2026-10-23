import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 2,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173/FitCircle/",
    trace: process.env.CI ? "retain-on-failure" : "off",
    launchOptions: {
      args: ["--enable-gpu-rasterization"],
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
    },
  },
  webServer: [
    {
      command: "npm run preview -- --port 4173 --strictPort",
      url: "http://127.0.0.1:4173/FitCircle/",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --port 4184 --strictPort",
      url: "http://127.0.0.1:4184/FitCircle/",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
