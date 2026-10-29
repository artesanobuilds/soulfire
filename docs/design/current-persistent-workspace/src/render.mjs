import { chromium } from "@playwright/test";
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
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    await p.addInitScript(() =>
      localStorage.setItem("soulfire.ambient.enabled", "off"),
    );
    await p.goto(process.env.SOULFIRE_TEST_URL || "http://127.0.0.1:3198");
    await p.getByRole("button", { name: "Current", exact: true }).click();
    await p.locator(".cm-starter").first().click();
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.waitForTimeout(400);
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.screenshot({
      path: "docs/design/current-persistent-workspace/desktop-explore.png",
    });
    await p.getByRole("button", { name: "Create for me", exact: true }).click();
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.waitForTimeout(400);
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.screenshot({
      path: "docs/design/current-persistent-workspace/desktop-create.png",
    });
    await p.setViewportSize({ width: 390, height: 844 });
    await p
      .getByRole("button", { name: "Explore Currents", exact: true })
      .click();
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.waitForTimeout(400);
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.screenshot({
      path: "docs/design/current-persistent-workspace/mobile-explore.png",
    });
    await p.getByRole("button", { name: /Shape sound/ }).click();
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.waitForTimeout(400);
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.screenshot({
      path: "docs/design/current-persistent-workspace/mobile-shape.png",
    });
    await p.getByRole("button", { name: "Close shaping controls" }).click();
    await p.getByRole("button", { name: "Create for me", exact: true }).click();
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.evaluate(() => new Promise(requestAnimationFrame));
    await p.waitForTimeout(400);
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.screenshot({
      path: "docs/design/current-persistent-workspace/mobile-create.png",
    });
    console.log("5 actual-layout screenshots saved");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
