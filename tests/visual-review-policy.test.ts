import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const job = (name: string) => {
  const block = workflow.match(new RegExp(`^  ${name}:\\n[\\s\\S]*?(?=^  [a-z_][a-z_-]*:|$(?![\\s\\S]))`, "m"));
  assert.ok(block, `Missing job: ${name}`);
  return block[0];
};

test("only the image-only review job is advisory; publication still requires all browser shards", () => {
  for (const name of ["prepare", "browser", "build", "deploy", "record_release"]) {
    assert.doesNotMatch(job(name), /continue-on-error|test:visual/);
  }
  assert.match(job("prepare"), /run: npm test/);
  assert.match(job("prepare"), /run: npm run audit:storage/);
  assert.match(job("browser"), /run: npm run test:e2e/);
  assert.match(job("build"), /needs: \[prepare, browser\]/);
  assert.match(job("build"), /BROWSER_RESULT.*!= success/);
  assert.match(job("deploy"), /needs: \[prepare, build\]/);
  assert.match(job("deploy"), /needs\.build\.result == 'success'/);
  assert.match(job("record_release"), /needs\.deploy\.result == 'success'/);
  assert.match(job("visual-review"), /continue-on-error: true/);
  assert.match(job("visual-review"), /run: npm run test:visual/);
  assert.doesNotMatch(job("visual-review"), /run: npm (test|run test:e2e|run audit:storage)\s*$/m);
});

test("mandatory browser specs capture pixels without comparing them; semantic color assertions remain", () => {
  const files = fs.readdirSync("tests/browser").filter(file => file.endsWith(".spec.ts"));
  for (const file of files) {
    const source = fs.readFileSync(`tests/browser/${file}`, "utf8");
    assert.doesNotMatch(source, /\.toHaveScreenshot\(/, `${file}: use captureVisual and advisory comparison`);
  }
  const baseline = fs.readFileSync("tests/browser/appearance-baseline.spec.ts", "utf8");
  assert.match(baseline, /JSON\.stringify\(colors, null, 2\)\)\.toMatchSnapshot/);
});

test("screenshots and comparison reports are retained even on successful functional runs", () => {
  assert.match(job("browser"), /if: always\(\)[\s\S]*name: browser-test-results-/);
  assert.match(job("visual-review"), /pattern: browser-test-results-\*/);
  assert.match(job("visual-review"), /if: always\(\)[\s\S]*name: advisory-visual-review/);
  const config = fs.readFileSync("playwright.visual.config.ts", "utf8");
  assert.match(config, /updateSnapshots: "none"/);
  assert.doesNotMatch(config, /webServer|launchOptions/);
});
