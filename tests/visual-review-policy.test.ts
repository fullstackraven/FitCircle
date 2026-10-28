import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

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

test("the advisory runner resolves existing references and reports mismatches without updating them", () => {
  const directory = fs.mkdtempSync(path.resolve("tests/fixtures/.visual-policy-"));
  try {
    const red = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC", "base64");
    const blue = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYPgPAAEDAQAIicLsAAAAAElFTkSuQmCC", "base64");
    const captures = path.join(directory, "captures");
    fs.mkdirSync(captures);
    const reference = path.join(directory, "reference.png");
    const image = path.join(captures, "current.png");
    fs.writeFileSync(reference, red);
    fs.writeFileSync(image, red);
    fs.writeFileSync(`${image}.visual.json`, JSON.stringify({
      expected: path.relative(process.cwd(), reference), image: "current.png",
      title: "Advisory policy regression", comparison: { threshold: 0, maxDiffPixels: 0 },
    }));
    const require = createRequire(import.meta.url);
    const compare = () => spawnSync(process.execPath, [require.resolve("@playwright/test/cli"),
      "test", "--config", "playwright.visual.config.ts", "--reporter=list", "--output", path.join(directory, "results")], {
      env: { ...process.env, VISUAL_CAPTURE_DIR: captures }, encoding: "utf8", timeout: 30000,
    });
    const matching = compare();
    assert.equal(matching.status, 0, matching.stdout + matching.stderr);
    fs.writeFileSync(image, blue);
    const mismatch = compare();
    assert.equal(mismatch.status, 1, mismatch.stdout + mismatch.stderr);
    assert.match(mismatch.stdout, /1 pixels/);
    assert.deepEqual(fs.readFileSync(reference), red, "Advisory comparisons must not rewrite references");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
