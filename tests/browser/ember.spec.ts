import { test, expect, type Page } from "@playwright/test";
import { emberStorageKey } from "../../src/domain/ember";
async function open(page: Page) {
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: false } }),
  );
  await page.addInitScript(() => {
    localStorage.setItem("soulfire.ambient.enabled", "off");
    const audios: HTMLAudioElement[] = [];
    const Native = window.Audio;
    window.Audio = class extends Native {
      constructor(src?: string) {
        super(src);
        audios.push(this);
      }
    };
    Object.defineProperty(window, "__emberAudio", { value: audios });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Ember", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ember", exact: true }),
  ).toBeVisible();
}
const audio = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as { __emberAudio: HTMLAudioElement[] }
    ).__emberAudio.map((a) => ({
      src: a.getAttribute("src"),
      paused: a.paused,
      time: a.currentTime,
      ready: a.readyState,
    })),
  );
async function create(page: Page) {
  await page
    .getByRole("button", { name: "Create my practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Begin practice", exact: true }),
  ).toBeVisible();
}
async function start(page: Page) {
  await page
    .getByRole("button", { name: "Begin practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause practice", exact: true }),
  ).toBeVisible();
}
test("Ember retains Soulfire masterbrand, nav and silent editable creation", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole("button", { name: "soulfire home" }),
  ).toBeVisible();
  const labels = await page
    .locator('nav[aria-label="Main navigation"] button')
    .allTextContents();
  expect(labels.indexOf("Ember")).toBe(labels.indexOf("Current") + 1);
  await page.getByLabel("Your intention").count();
  await page.getByLabel("Return to my attention").check();
  await create(page);
  await expect(
    page.getByRole("heading", { name: "A steady return" }),
  ).toBeVisible();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await page.getByText("Read the complete practice", { exact: true }).click();
  await expect(page.getByText(/Choose one simple anchor/).last()).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("soulfire.ember.preferences.v1"),
    ),
  ).toBeNull();
});
test("actual local narration decodes and plays, pause/resume and repeated stop release media", async ({
  page,
}) => {
  await open(page);
  await create(page);
  await start(page);
  await expect
    .poll(async () =>
      (await audio(page)).some(
        (a) =>
          !!a.src?.includes("/audio/ember/arrival.m4a") &&
          !a.paused &&
          a.time > 0.15 &&
          a.ready >= 2,
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Pause practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume practice", exact: true }),
  ).toBeVisible();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await page
    .getByRole("button", { name: "Resume practice", exact: true })
    .click();
  await expect
    .poll(async () =>
      (await audio(page)).some((a) => !a.paused && a.time > 0.2),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Stop practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Stop practice", exact: true })
    .click();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await start(page);
  await page
    .getByRole("button", { name: "Stop practice", exact: true })
    .click();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
});
test("grounding and navigation stop narration and never auto-resume", async ({
  page,
}) => {
  await open(page);
  await create(page);
  await start(page);
  await page
    .getByRole("button", { name: "Stop & ground", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Come back to the room" }),
  ).toBeVisible();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await start(page);
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find your Current.", exact: true }),
  ).toBeVisible();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await page.getByRole("button", { name: "Ember", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Create my practice" }),
  ).toBeVisible();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
});
test("narration failure and blocked playback preserve transcript and recover explicitly", async ({
  page,
}) => {
  await page.route("**/audio/ember/*.m4a", (r) => r.abort());
  await open(page);
  await create(page);
  await page
    .getByRole("button", { name: "Begin practice", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: /Narration|Audio/ }),
  ).toBeVisible();
  await page.getByText("Read the complete practice", { exact: true }).click();
  await expect(page.locator(".ember-transcript li")).toHaveCount(5);
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await page.unroute("**/audio/ember/*.m4a");
  await start(page);
  await expect
    .poll(async () =>
      (await audio(page)).some((a) => !a.paused && a.time > 0.1),
    )
    .toBe(true);
});
test("caption-only silence, timer completion and no replay use deliberate choices", async ({
  page,
}) => {
  await page.clock.install();
  await open(page);
  await page.getByLabel("Voice", { exact: true }).selectOption("captions");
  await page.getByLabel("Sound", { exact: true }).selectOption("quiet");
  await page.getByLabel("Ember duration", { exact: true }).selectOption("2");
  await create(page);
  await start(page);
  for (let i = 0; i < 121; i++) await page.clock.fastForward(1000);
  await expect(
    page.getByText("Complete. Nothing will replay automatically.", {
      exact: true,
    }),
  ).toBeVisible();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await page.clock.fastForward(1000);
  await expect(
    page.getByRole("button", { name: "Begin practice", exact: true }),
  ).toBeVisible();
});
test("explicit preferences save/reload stays silent and deletion preserves other data", async ({
  page,
}) => {
  await open(page);
  await page.getByText("Keep my preferences", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save Ember preferences" }),
  ).toBeDisabled();
  await page.getByLabel("Meet myself kindly").check();
  await page.getByLabel("Save only these choices on this browser").check();
  await page.getByRole("button", { name: "Save Ember preferences" }).click();
  await page.evaluate(() => localStorage.setItem("unrelated", "keep"));
  expect(
    JSON.parse(
      (await page.evaluate((k) => localStorage.getItem(k), emberStorageKey))!,
    ).intention,
  ).toBe("kindness");
  await page.reload();
  await page.getByRole("button", { name: "Ember", exact: true }).click();
  await page.getByText("Keep my preferences", { exact: true }).click();
  await page.getByRole("button", { name: "Load saved preferences" }).click();
  await expect(page.getByLabel("Meet myself kindly")).toBeChecked();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await page.getByRole("button", { name: "Delete Ember preferences" }).click();
  expect(
    await page.evaluate((k) => localStorage.getItem(k), emberStorageKey),
  ).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("unrelated"))).toBe(
    "keep",
  );
});
test("reduced motion, keyboard, mobile fit and background interruption are truthful", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await create(page);
  await start(page);
  await expect(page.locator(".ember-art")).not.toHaveClass(/ember-moving/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("button", { name: "Resume practice" }),
  ).toBeVisible();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
  await page.getByRole("button", { name: "Stop practice" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Begin practice" }),
  ).toBeVisible();
});
test("late narration start after stop cannot resume a canceled practice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const native = HTMLMediaElement.prototype.play;
    let release: () => void = () => {};
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes("/audio/ember/"))
        return new Promise<void>((resolve, reject) => {
          release = () => {
            native.call(this).then(resolve, reject);
          };
        });
      return native.call(this);
    };
    Object.defineProperty(window, "__releaseEmber", { value: () => release() });
  });
  await open(page);
  await create(page);
  await page.getByRole("button", { name: "Begin practice" }).click();
  await expect(
    page.getByRole("button", { name: "Pause practice" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop practice" }).click();
  await page.evaluate(() =>
    (window as unknown as { __releaseEmber: () => void }).__releaseEmber(),
  );
  await expect(
    page.getByRole("button", { name: "Begin practice" }),
  ).toBeVisible();
  await expect
    .poll(async () => (await audio(page)).every((a) => a.paused))
    .toBe(true);
});

test("audio permission denial fails safely", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes("/audio/ember/"))
        return Promise.reject(
          new DOMException("Synthetic denied playback", "NotAllowedError"),
        );
      return original.call(this);
    };
  });
  await open(page);
  await create(page);
  await page.getByRole("button", { name: "Begin practice" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Audio could not start" }),
  ).toBeVisible();
  expect((await audio(page)).every((a) => a.paused)).toBe(true);
});

test("opening Ember stops live voice and another dialog pauses meditation", async ({
  page,
}) => {
  const { simulateVoice } = await import("./helpers/simulated-voice");
  await simulateVoice(page);
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page
    .getByRole("button", { name: "Allow microphone & start", exact: true })
    .click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ember", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __voiceTest: { stops: number } }).__voiceTest
          .stops,
    ),
  ).toBeGreaterThan(0);
  await create(page);
  await start(page);
  await page.getByRole("button", { name: "My memory", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume practice", exact: true }),
  ).toBeVisible();
});

test("stalled narration times out, releases sound and keeps captions", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes("/audio/ember/"))
        return new Promise<void>(() => {});
      return original.call(this);
    };
  });
  await open(page);
  await page.getByLabel("Sound", { exact: true }).selectOption("quiet");
  await create(page);
  await page.getByRole("button", { name: "Begin practice" }).click();
  await page.clock.fastForward(13000);
  await expect(
    page.getByRole("alert").filter({ hasText: "Narration could not load" }),
  ).toBeVisible();
  await page.getByText("Read the complete practice", { exact: true }).click();
  await expect(page.locator(".ember-transcript li")).toHaveCount(5);
});
