import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined),
  headless: true,
});
for (const [name, width, height] of [
  ["desktop", 1440, 1100],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto("http://127.0.0.1:3100");
  await page.getByText("AI is not connected", { exact: false }).waitFor();
  const shot = async (section) => {
    await page.screenshot({
      path: `docs/design/review/${section}-${name}.png`,
      fullPage: !section.includes("privacy"),
    });
  };
  await shot("01-invitation");
  await page.getByRole("button", { name: /Try the example/ }).click();
  await shot("02-suggestion");
  await page.getByRole("button", { name: "Try this practice" }).click();
  await shot("03-practice");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await shot("04-meditation");
  await page.getByRole("button", { name: "Skip quiet and reflect" }).click();
  await page
    .getByPlaceholder("You can keep this just for yourself…")
    .fill("I can prepare without deciding how everyone will respond.");
  await shot("05-reflection");
  await page.getByRole("button", { name: "Keep private & continue" }).click();
  await shot("06-next-action");
  await page
    .getByRole("button", { name: "Return to the practice map" })
    .click();
  await shot("07-map");
  await page
    .getByRole("button", { name: "Privacy & about", exact: true })
    .click();
  await shot("08-privacy");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "soulfire home" }).click();
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByText("Start a voice conversation", { exact: true }).waitFor();
  await shot("09-voice-consent");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  for (const topic of ["pattern", "care", "conflict"]) {
    await page
      .getByRole("button", { name: "The practice", exact: true })
      .click();
    const labels = {
      pattern: "A pattern I can’t break",
      care: "Feeling low or disconnected",
      conflict: "Conflict with someone",
    };
    await page
      .getByRole("button", { name: labels[topic], exact: true })
      .click();
    await page.getByRole("button", { name: "Try this practice" }).click();
    await shot(`10-${topic}`);
  }
  await page.getByRole("button", { name: "soulfire home" }).click();
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("I would like a little help with my presentation.");
  await page.route("**/api/companion", async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route
      .fulfill({
        status: 503,
        json: {
          error: "The AI service is unavailable. Your draft is still here.",
        },
      })
      .catch(() => {});
  });
  await page
    .getByRole("button", { name: "Find a practice", exact: true })
    .click();
  await shot("11-loading-simulated");
  await page.locator("main [role=alert]").waitFor();
  await shot("12-service-error-simulated");
  await page.unroute("**/api/companion");
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await page.route("**/api/status", (route) =>
    route.fulfill({ json: { configured: true } }),
  );
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("denied", "NotAllowedError");
    };
  });
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await page.locator("main [role=alert]").waitFor();
  await shot("13-microphone-denial-simulated");
  await page.close();
}
await browser.close();
