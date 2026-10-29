// UI fixtures use synthetic PCM tones only. Never written to the real model catalog.
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { musicFixture } from "../fixtures/music-lab";
import { musicRatingStorageKey } from "../../src/domain/music-lab";
const a = musicFixture(),
  b = musicFixture("stable", "22222222-2222-4222-8222-222222222222");
function tone() {
  const sr = 24000,
    n = sr * 2,
    bytes = Buffer.alloc(44 + n * 2);
  bytes.write("RIFF");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sr, 24);
  bytes.writeUInt32LE(sr * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++)
    bytes.writeInt16LE(
      Math.round(Math.sin((i / sr) * Math.PI * 2 * 220) * 3000),
      44 + i * 2,
    );
  return bytes;
}
async function open(page: Page, samples = [a, b]) {
  await page.addInitScript(() => {
    localStorage.setItem("soulfire.ambient.enabled", "off");
    const items: HTMLAudioElement[] = [];
    const Native = window.Audio;
    window.Audio = class extends Native {
      constructor(src?: string) {
        super(src);
        if (src?.includes("/api/music-lab/audio")) items.push(this);
      }
    };
    Object.defineProperty(window, "__musicTest", { value: items });
  });
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: false } }),
  );
  await page.route("**/api/music-lab**", (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith("/audio"))
      return r.fulfill({ body: tone(), contentType: "audio/wav" });
    if (r.request().method() === "DELETE")
      return r.fulfill({ json: { cancelled: true } });
    return r.fulfill({
      json: {
        models: [
          {
            model: "ace",
            ready: true,
            state: "ready",
            message: "TEST runtime",
            version: "TEST ONLY",
          },
          {
            model: "stable",
            ready: false,
            state: "license-pending",
            message: "Terms pending. Nothing accepted.",
            version: "TEST ONLY",
          },
        ],
        samples,
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Music Lab", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Music Lab", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh local catalog" }),
  ).toBeEnabled();
}
const media = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { __musicTest: HTMLAudioElement[] }).__musicTest.map(
      (a) => ({
        src: a.getAttribute("src"),
        paused: a.paused,
        time: a.currentTime,
        volume: a.volume,
      }),
    ),
  );
async function play(page: Page, label = "A") {
  await page
    .getByRole("button", { name: `Play ${label}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Pause ${label}`, exact: true }),
  ).toBeVisible();
}
test("empty catalog is honest, gates generation and creates no fake audio", async ({
  page,
}) => {
  await open(page, []);
  await expect(
    page.getByRole("heading", {
      name: "No measured sample for this brief yet",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate Stable Audio", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Terms pending. Nothing accepted.", { exact: true }),
  ).toBeVisible();
  expect((await media(page)).every((a) => a.paused)).toBe(true);
});
test("A/B stays blinded until reveal and changing the brief never reuses an unrelated file", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole("heading", { name: "Listen A", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("TEST FIXTURE ONLY", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reveal models", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Sample A" }).getByRole("heading"),
  ).toHaveText(/ACE-Step|Stable Audio/);
  await page.getByLabel("Music Lab style").selectOption("ambient");
  await expect(
    page.getByRole("heading", {
      name: "No measured sample for this brief yet",
    }),
  ).toBeVisible();
});
test("real browser decoding, pause/resume and A/B switching never overlap", async ({
  page,
}) => {
  await open(page);
  await play(page);
  await expect
    .poll(async () =>
      (await media(page)).some((a) => !a.paused && a.time > 0.1),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Pause A", exact: true }).click();
  expect((await media(page)).every((a) => a.paused)).toBe(true);
  await page.getByRole("button", { name: "Resume A", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause A", exact: true }),
  ).toBeVisible();
  await play(page, "B");
  expect((await media(page)).filter((a) => !a.paused)).toHaveLength(1);
  await page
    .getByRole("button", { name: "Stop Music Lab", exact: true })
    .click();
  expect((await media(page)).every((a) => a.paused && !a.src)).toBe(true);
});
test("independent volume, mode changes and natural end are truthful", async ({
  page,
}) => {
  await open(page);
  await play(page);
  await page.getByLabel("Volume A", { exact: true }).fill("0.2");
  await expect
    .poll(async () => (await media(page)).find((a) => !a.paused)?.volume)
    .toBe(0.2);
  await page.getByLabel("Music Lab audition mode").selectOption("narration");
  expect((await media(page)).every((a) => a.paused)).toBe(true);
  await play(page);
  expect((await media(page)).find((a) => !a.paused)?.src).toContain(
    "mode=narration",
  );
  await expect(
    page.getByText("Finished. Nothing replays automatically.", { exact: true }),
  ).toBeVisible();
  expect((await media(page)).every((a) => a.paused && !a.src)).toBe(true);
});
test("ratings are explicit, blank scores stay blank and export carries evidence", async ({
  page,
}) => {
  await open(page);
  await page.getByLabel("A Pleasantness", { exact: true }).selectOption("4");
  expect(
    await page.evaluate((k) => localStorage.getItem(k), musicRatingStorageKey),
  ).toBeNull();
  await page.getByLabel("Save only my ratings on this browser").check();
  await page
    .getByRole("button", { name: "Save ratings locally", exact: true })
    .click();
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    musicRatingStorageKey,
  );
  expect(saved[0].ratings.pleasantness).toBe(4);
  expect(saved[0].ratings.artifacts).toBeNull();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export results JSON" }).click();
  const file = await download;
  const content = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(content.samples).toHaveLength(2);
  expect(content.ratings[0].ratings.pleasantness).toBe(4);
  expect(content.preference.value).toBe("undecided");
  expect(content.protocol.targetLufs).toBe(-21);
  await page.evaluate(() => localStorage.setItem("unrelated", "keep"));
  await page.getByRole("button", { name: "Clear saved ratings" }).click();
  expect(await page.evaluate(() => localStorage.getItem("unrelated"))).toBe(
    "keep",
  );
});
test("generation failure retains catalog and only sends structured local settings", async ({
  page,
}) => {
  await open(page);
  let body: unknown;
  await page.route("**/api/music-lab", (r) => {
    if (r.request().method() === "POST") {
      body = r.request().postDataJSON();
      return r.fulfill({
        status: 503,
        json: { error: "Synthetic generation failed" },
      });
    }
    return r.fallback();
  });
  await page
    .getByRole("button", { name: "Generate ACE-Step", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Synthetic generation failed" }),
  ).toBeVisible();
  expect(body).toMatchObject({
    request: { model: "ace", style: "piano", seed: 101, seconds: 30 },
  });
  expect(Object.keys((body as { request: object }).request)).toEqual([
    "model",
    "style",
    "seed",
    "seconds",
  ]);
  await expect(page.getByRole("heading", { name: "Listen A" })).toBeVisible();
});
test("cancel before delayed acknowledgement and navigation use the known job ID", async ({
  page,
}) => {
  await open(page);
  let release: (() => void) | undefined;
  const deletes: string[] = [];
  let id = "";
  await page.route("**/api/music-lab**", async (r) => {
    const u = new URL(r.request().url());
    if (r.request().method() === "POST") {
      const data = r.request().postDataJSON();
      id = data.id;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return r.fulfill({
        status: 202,
        json: {
          job: {
            id,
            request: data.request,
            phase: "running",
            message: "TEST pending",
          },
        },
      });
    }
    if (r.request().method() === "DELETE") {
      deletes.push(u.searchParams.get("job")!);
      return r.fulfill({ json: { cancelled: true } });
    }
    return r.fallback();
  });
  await page
    .getByRole("button", { name: "Generate ACE-Step", exact: true })
    .click();
  await expect.poll(() => !!release).toBe(true);
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await expect.poll(() => deletes.includes(id)).toBe(true);
  release!();
  await expect(
    page.getByRole("heading", { name: "Current", exact: true }),
  ).toBeVisible();
});
test("blocked playback and late play after stop are recoverable without substituted sound", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    let mode = "deny";
    let release = () => {};
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes("/api/music-lab/audio")) {
        if (mode === "deny")
          return Promise.reject(
            new DOMException("TEST denial", "NotAllowedError"),
          );
        return new Promise<void>((resolve, reject) => {
          release = () => {
            original.call(this).then(resolve, reject);
          };
        });
      }
      return original.call(this);
    };
    Object.defineProperty(window, "__playTest", {
      value: {
        wait: () => {
          mode = "wait";
        },
        release: () => release(),
      },
    });
  });
  await open(page);
  await page.getByRole("button", { name: "Play A" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "could not play" }),
  ).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { __playTest: { wait: () => void } }
    ).__playTest.wait(),
  );
  await page.getByRole("button", { name: "Play A" }).click();
  await page.getByRole("button", { name: "Stop Music Lab" }).click();
  await page.evaluate(() =>
    (
      window as unknown as { __playTest: { release: () => void } }
    ).__playTest.release(),
  );
  await expect
    .poll(async () => (await media(page)).every((a) => a.paused))
    .toBe(true);
});
test("navigation, dialogs and backgrounding pause or release audition audio", async ({
  page,
}) => {
  await open(page);
  await play(page);
  await page.getByRole("button", { name: "My memory", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume A" })).toBeVisible();
  await page.getByRole("button", { name: "Resume A" }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("button", { name: "Resume A" })).toBeVisible();
  await page.getByRole("button", { name: "Ember", exact: true }).click();
  expect((await media(page)).every((a) => a.paused && !a.src)).toBe(true);
});
test("mobile layout, reduced motion and keyboard stop remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Play A" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Pause A" })).toBeVisible();
  await page.getByRole("button", { name: "Stop Music Lab" }).focus();
  await page.keyboard.press("Enter");
  expect((await media(page)).every((a) => a.paused)).toBe(true);
});
