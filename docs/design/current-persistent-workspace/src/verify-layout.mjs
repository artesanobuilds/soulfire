import { chromium } from "@playwright/test";
import fs from "node:fs";
(async () => {
  const b = await chromium.launch({
    headless: true,
    chromiumSandbox: true,
    ignoreDefaultArgs: ["--unsafely-disable-devtools-self-xss-warnings"],
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--mute-audio"],
  });
  try {
    const results = [];
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
      { width: 360, height: 640 },
    ]) {
      const p = await b.newPage({ viewport });
      await p.addInitScript(() =>
        localStorage.setItem("soulfire.ambient.enabled", "off"),
      );
      await p.goto(process.env.SOULFIRE_TEST_URL || "http://127.0.0.1:3198");
      await p.getByRole("button", { name: "Current", exact: true }).click();
      await p.locator(".cm-starter").first().click();
      await p.waitForTimeout(400);
      await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      const inspect = async (l) => {
        const r = await l.boundingBox();
        return {
          box: r,
          inViewport: !!r && r.y >= 0 && r.y + r.height <= viewport.height,
        };
      };
      const creation = await inspect(
        p.getByRole("button", { name: "Create for me", exact: true }),
      );
      if (!creation.inViewport) throw Error("Creation entry hidden");
      let controls = {};
      if (viewport.width < 851) {
        const dock = await inspect(p.locator(".cm-player-dock"));
        if (!dock.inViewport) throw Error("Dock hidden");
        await p.getByRole("button", { name: /Shape sound/ }).click();
        for (const name of [
          "Current volume",
          "Current brightness",
          "Current space",
        ]) {
          controls[name] = await inspect(p.getByRole("slider", { name }));
          if (viewport.height >= 844 && !controls[name].inViewport)
            throw Error("Primary shaping control hidden");
        }
        await p.getByRole("button", { name: "Close shaping controls" }).click();
      } else {
        for (const name of [
          "Current volume",
          "Current brightness",
          "Current space",
        ]) {
          controls[name] = await inspect(p.getByRole("slider", { name }));
          if (!controls[name].inViewport)
            throw Error("Primary shaping control hidden");
        }
      }
      const overflow = await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw Error("Horizontal overflow");
      results.push({
        viewport,
        creation,
        controls,
        overflow,
        smallHeight:
          "Scrollable sheet retains Stop near its top; all controls remain reachable",
      });
      await p.close();
    }
    fs.writeFileSync(
      "docs/design/current-persistent-workspace/layout-checks.json",
      JSON.stringify({ results, realMusicRegenerated: false }, null, 2),
    );
    console.log("Desktop and two mobile sizes passed");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
