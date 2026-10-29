// CONCEPT ONLY. Renders frames + concept boards with system Chrome via playwright-core.
// Usage (from repo root): node docs/design/current-customization-options/src/render.mjs
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = dirname(fileURLToPath(import.meta.url));
const out = join(src, "..");
mkdirSync(join(src, "frames"), { recursive: true });
const url = (f) => { const i = f.search(/[?#]/); return pathToFileURL(join(src, i < 0 ? f : f.slice(0, i))).href + (i < 0 ? "" : f.slice(i)); };

const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 390, height: 844 };
const shots = [
  ["a-desktop", "concept-a.html", DESKTOP, ["aside.player h2", "aside.player .primary", "aside.player .slider >> nth=0", ".player .slider >> nth=1", ".player .slider >> nth=2"]],
  ["a-mobile", "concept-a.html", MOBILE, [".dock b", ".dock .play", ".dock .shape"]],
  ["a-mobile-sheet", "concept-a.html#sheet", MOBILE, [".sheet h2", ".sheet .primary", ".sheet .slider >> nth=0", ".sheet .slider >> nth=1", ".sheet .slider >> nth=2", ".sheet .done"]],
  ["b-desktop", "concept-b.html", DESKTOP, [".change", ".scene h1", ".bigplay .play", ".ctl >> nth=0", ".ctl >> nth=1", ".ctl >> nth=2"]],
  ["b-mobile", "concept-b.html", MOBILE, [".change", ".scene h1", ".bigplay .play", ".ctl >> nth=0", ".ctl >> nth=1", ".ctl >> nth=2"]],
  ["b-mobile-catalogue", "concept-b.html#catalogue", MOBILE, [".catalogue h1", ".c.tap .go"]],
];

const browser = await chromium.launch({ headless: true, chromiumSandbox: true, ignoreDefaultArgs: ["--unsafely-disable-devtools-self-xss-warnings"], executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const results = [];
for (const [name, file, vp, required] of shots) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(url(file));
  await page.waitForLoadState("load");
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    wideElements: [...document.querySelectorAll("body *")]
      .filter((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
        return r.width && s.position !== "fixed" && !e.closest(".goals,svg") && (r.right > innerWidth + 0.5 || r.left < -0.5); })
      .slice(0, 5).map((e) => e.tagName + "." + e.className),
  }));
  const controls = [];
  for (const sel of required) {
    const box = await page.locator(sel).first().boundingBox();
    controls.push({ sel, box, inFirstViewport: !!box && box.y >= 0 && box.y + box.height <= vp.height && box.x >= 0 && box.x + box.width <= vp.width });
  }
  await page.screenshot({ path: join(src, "frames", `${name}.png`) });
  const pass = overflow.scrollWidth <= overflow.innerWidth && overflow.wideElements.length === 0 && controls.every((c) => c.inFirstViewport);
  results.push({ name, file, viewport: vp, pass, overflow, controls });
  await ctx.close();
}
for (const c of ["a", "b"]) {
  const ctx = await browser.newContext({ viewport: { width: 2100, height: 1200 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await page.goto(url(`board.html?c=${c}`));
  await page.waitForLoadState("load");
  await page.screenshot({ path: join(out, `concept-${c}-board.png`), fullPage: true });
  await ctx.close();
}
await browser.close();
writeFileSync(join(out, "checks.json"), JSON.stringify({ generated: new Date().toISOString(), note: "Static concept mockups; no audio, network, microphone or provider calls.", results }, null, 2));
for (const r of results) console.log(r.pass ? "PASS" : "FAIL", r.name, `scrollWidth=${r.overflow.scrollWidth}/${r.overflow.innerWidth}`, r.overflow.wideElements.join(","), r.controls.filter((c) => !c.inFirstViewport).map((c) => c.sel + JSON.stringify(c.box)).join(" "));
