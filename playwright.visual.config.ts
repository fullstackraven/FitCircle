import { defineConfig } from "@playwright/test";

// This runner only compares existing image files. It never launches a browser,
// exercises application behavior, or participates in the publication gate.
export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "visual-test-results",
  snapshotPathTemplate: "{testDir}/../../{arg}{ext}",
  updateSnapshots: "none",
  reporter: [["list"], ["html", { outputFolder: "visual-review-report", open: "never" }]],
});
