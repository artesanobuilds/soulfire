// Synthetic PCM and mocked jobs; never reads a microphone or invokes a provider.
import { test, expect, type Page } from "@playwright/test";
import { musicFixture } from "../fixtures/music-lab";
import { currentMusicStorageKey } from "../../src/domain/current-music";
const sample = musicFixture();
function tone() {
  const sr = 12000,
    n = sr * 10,
    b = Buffer.alloc(44 + n * 2);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++)
    b.writeInt16LE(
      Math.round(Math.sin((i / sr) * Math.PI * 440) * 1000),
      44 + i * 2,
    );
  return b;
}
async function open(
  page: Page,
  mode: "normal" | "empty" | "deny" | "bad-audio" = "normal",
) {
  await page.addInitScript(
    ({ deny }) => {
      localStorage.setItem("soulfire.ambient.enabled", "off");
      const Native = window.AudioContext;
      const contexts: AudioContext[] = [];
      let starts = 0,
        stops = 0;
      window.AudioContext = class extends Native {
        constructor() {
          super();
          contexts.push(this);
        }
        resume() {
          return deny
            ? Promise.reject(Error("Synthetic browser audio denial"))
            : super.resume();
        }
        createBufferSource() {
          const s = super.createBufferSource(),
            start = s.start.bind(s),
            stop = s.stop.bind(s);
          s.start = (...args: Parameters<typeof start>) => {
            starts++;
            start(...args);
          };
          s.stop = (...args: Parameters<typeof stop>) => {
            stops++;
            stop(...args);
          };
          return s;
        }
      };
      Object.defineProperty(window, "__cm", {
        value: {
          advanceTime: (seconds: number) => {
            for (const c of contexts) {
              const t = c.currentTime;
              Object.defineProperty(c, "currentTime", {
                configurable: true,
                get: () => t + seconds,
              });
            }
          },
          snapshot: () => ({
            contexts: contexts.map((c) => c.state),
            starts,
            stops,
          }),
        },
      });
    },
    { deny: mode === "deny" },
  );
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: false } }),
  );
  await page.route("**/api/current/music**", (r) => {
    if (r.request().method() === "DELETE")
      return r.fulfill({ json: { cancelled: true } });
    return r.fulfill({
      json: {
        samples: mode === "empty" ? [] : [sample],
        availability: {
          model: "ace",
          ready: true,
          state: "ready",
          message: "TEST ONLY",
        },
      },
    });
  });
  await page.route("**/api/music-lab/audio**", (r) =>
    mode === "bad-audio"
      ? r.fulfill({ status: 404, json: { error: "Missing" } })
      : r.fulfill({ body: tone(), contentType: "audio/wav" }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find your Current." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh available music" }),
  ).toBeEnabled();
}
const snap = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as {
        __cm: {
          snapshot: () => { contexts: string[]; starts: number; stops: number };
        };
      }
    ).__cm.snapshot(),
  );
async function select(page: Page) {
  await page.getByRole("button", { name: /Window Light.*Soft piano/ }).click();
}
async function play(page: Page) {
  await select(page);
  await page.getByRole("button", { name: "Play Current", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause Current", exact: true }),
  ).toBeVisible();
}
test("goal-first, no autoplay, no comparison tab, optional hidden settings", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole("button", { name: "Music Lab", exact: true }),
  ).toHaveCount(0);
  expect((await snap(page)).starts).toBe(0);
  await page
    .getByRole("button", { name: "Find my focus", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Find my focus", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Leave out", { exact: true })).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveJSProperty("scrollWidth", 0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("empty shelf never invents playable seed concepts and retains Classic", async ({
  page,
}) => {
  await open(page, "empty");
  await expect(
    page.getByRole("heading", { name: "Your shelf is ready for a beginning." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play Current", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Explore Classic soundscapes" })
    .click();
  await expect(
    page.getByRole("button", { name: "Create my mix", exact: true }),
  ).toBeVisible();
});
test("real Web Audio decoding, live controls, pause/resume, repeated Stop and navigation cleanup", async ({
  page,
}) => {
  await open(page);
  await play(page);
  expect((await snap(page)).starts).toBeGreaterThan(0);
  await page.getByRole("slider", { name: "Current brightness" }).fill("0.8");
  await page.getByRole("slider", { name: "Current space" }).fill("0.2");
  await page
    .getByRole("button", { name: "Pause Current", exact: true })
    .click();
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
  await page
    .getByRole("button", { name: "Resume Current", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause Current", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Play Current", exact: true }).click();
  await page.getByRole("button", { name: "Ember", exact: true }).click();
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
});
test("permission/audio unlock rejection and missing files stay recoverable", async ({
  page,
}) => {
  await open(page, "deny");
  await select(page);
  await page.getByRole("button", { name: "Play Current", exact: true }).click();
  await expect(page.getByText("Synthetic browser audio denial")).toBeVisible();
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
});
test("missing file is explicit and releases audio", async ({ page }) => {
  await open(page, "bad-audio");
  await select(page);
  await page.getByRole("button", { name: "Play Current", exact: true }).click();
  await expect(page.getByText(/This local piece is unavailable/)).toBeVisible();
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
});
test("opt-in save/reload preserves sample identity and omits feeling text", async ({
  page,
}) => {
  await open(page);
  await select(page);
  await page
    .getByRole("textbox", { name: /How are you feeling/ })
    .fill("PRIVATE TEST NOTE");
  expect(
    await page.evaluate((k) => localStorage.getItem(k), currentMusicStorageKey),
  ).toBeNull();
  await page
    .getByRole("checkbox", { name: "Save this music session in this browser" })
    .check();
  await page.getByRole("button", { name: "Save Current", exact: true }).click();
  const raw = await page.evaluate(
    (k) => localStorage.getItem(k),
    currentMusicStorageKey,
  );
  expect(raw).not.toContain("PRIVATE TEST NOTE");
  await page.reload();
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your saved Currents" }),
  ).toBeVisible();
  await page
    .locator(".cm-saved")
    .getByRole("button", { name: "Window Light", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Current name" })).toHaveValue(
    "Window Light",
  );
});
test("structured custom generation and cancellation retain player control", async ({
  page,
}) => {
  await open(page);
  let request: Record<string, unknown> | null = null;
  let deleted = 0;
  await page.route("**/api/current/music**", async (r) => {
    if (r.request().method() === "POST") {
      request = r.request().postDataJSON();
      return r.fulfill({
        status: 202,
        json: {
          job: {
            ...(request as object),
            phase: "running",
            message: "TEST generating",
          },
        },
      });
    }
    if (r.request().method() === "DELETE") {
      deleted++;
      return r.fulfill({ json: { cancelled: true } });
    }
    return r.fulfill({
      json: {
        job: {
          ...(request as object),
          phase: "running",
          message: "TEST generating",
        },
      },
    });
  });
  await page
    .getByRole("button", { name: "Find my focus", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await expect(page.getByText("Preparing your Current…")).toBeVisible();
  expect(JSON.stringify(request)).toContain('"intent":"focus"');
  await page
    .getByRole("button", { name: "Cancel generation", exact: true })
    .click();
  await expect.poll(() => deleted).toBe(1);
  await play(page);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
test("leaving cancels pending generation and closes playback", async ({
  page,
}) => {
  await open(page);
  let id = "",
    deletes = 0;
  await page.route("**/api/current/music**", (r) => {
    if (r.request().method() === "POST") {
      id = r.request().postDataJSON().id;
      return r.fulfill({
        status: 202,
        json: { job: { id, phase: "running", message: "TEST" } },
      });
    }
    if (r.request().method() === "DELETE") {
      deletes++;
      return r.fulfill({ json: { cancelled: true } });
    }
    return r.fulfill({
      json: { job: { id, phase: "running", message: "TEST" } },
    });
  });
  await play(page);
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await page.getByRole("button", { name: "Ember", exact: true }).click();
  await expect.poll(() => deletes).toBe(1);
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
});
test("reduced motion disables illustration movement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(
    await page
      .locator(".cm-ripples")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});
test("timer ends with no restart (accelerated audio clock)", async ({
  page,
}) => {
  await open(page);
  await select(page);
  await page
    .getByRole("combobox", { name: "Listening time" })
    .selectOption("1");
  await page.getByRole("button", { name: "Play Current", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause Current", exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { __cm: { advanceTime: (s: number) => void } }
    ).__cm.advanceTime(61),
  );
  await expect(page.getByText(/Your Current has finished/)).toBeVisible();
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
  expect((await snap(page)).starts).toBe(1);
});
test("generation failure keeps the existing piece usable", async ({ page }) => {
  await open(page);
  await play(page);
  await page.route("**/api/current/music**", (r) =>
    r.request().method() === "POST"
      ? r.fulfill({ status: 503, json: { error: "TEST model unavailable" } })
      : r.fulfill({ json: { cancelled: true } }),
  );
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Current music", exact: true })
      .getByRole("alert"),
  ).toContainText("TEST model unavailable");
  await expect(
    page.getByRole("button", { name: "Pause Current", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
test("completed generation refreshes the shelf without autoplay", async ({
  page,
}) => {
  await open(page);
  let id = "",
    posted = false;
  await page.route("**/api/current/music**", (r) => {
    if (r.request().method() === "POST") {
      id = r.request().postDataJSON().id;
      posted = true;
      return r.fulfill({
        status: 202,
        json: { job: { id, phase: "running", message: "TEST" } },
      });
    }
    if (new URL(r.request().url()).searchParams.has("job"))
      return r.fulfill({
        json: {
          job: {
            id,
            phase: "done",
            sampleId: sample.id,
            message: "TEST measured",
          },
        },
      });
    return r.fulfill({
      json: { samples: [sample], availability: { ready: true, model: "ace" } },
    });
  });
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await expect(page.getByText("A new piece is on your shelf")).toBeVisible();
  expect(posted).toBe(true);
  expect((await snap(page)).starts).toBe(0);
});
test("cancel before POST acknowledgement ignores the late running reply", async ({
  page,
}) => {
  await open(page);
  let release = () => {},
    deletes = 0;
  await page.route("**/api/current/music**", async (r) => {
    if (r.request().method() === "POST") {
      const id = r.request().postDataJSON().id;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return r.fulfill({
        status: 202,
        json: { job: { id, phase: "running", message: "TEST late" } },
      });
    }
    if (r.request().method() === "DELETE") {
      deletes++;
      return r.fulfill({ json: { cancelled: true } });
    }
    return r.fulfill({ json: {} });
  });
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel generation", exact: true })
    .click();
  release();
  await expect.poll(() => deletes).toBe(1);
  await expect(
    page.getByText("Generation cancelled", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create a new Current", exact: true }),
  ).toBeEnabled();
  expect((await snap(page)).starts).toBe(0);
});
test("dialog interruptions pause music without an automatic restart", async ({
  page,
}) => {
  await open(page);
  await play(page);
  await page.getByRole("button", { name: "Simulations", exact: true }).click();
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Resume Current", exact: true }),
  ).toBeVisible();
});
test("repeated starter choices and Stop during loading cannot revive audio", async ({
  page,
}) => {
  await open(page);
  let release = () => {};
  await page.route("**/api/music-lab/audio**", async (r) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      await r.fulfill({ body: tone(), contentType: "audio/wav" });
    } catch {}
  });
  await select(page);
  await page.getByRole("button", { name: "Play Current", exact: true }).click();
  await expect(page.getByText("Opening your Current…")).toBeVisible();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  release();
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
  expect((await snap(page)).starts).toBe(0);
});
