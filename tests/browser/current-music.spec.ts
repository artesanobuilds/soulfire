// Synthetic PCM and mocked jobs; never reads a microphone or invokes a provider.
import { test, expect, type Page } from "@playwright/test";
import { musicFixture } from "../fixtures/music-lab";
import {
  currentMusicStorageKey,
  defaultCurrentMusic,
} from "../../src/domain/current-music";
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
async function closeShape(page: Page) {
  const close = page.getByRole("button", { name: "Close shaping controls" });
  if (await close.isVisible()) await close.click();
}
async function shape(page: Page) {
  const trigger = page.getByRole("button", { name: /Shape sound/ });
  if (await trigger.isVisible()) await trigger.click();
}
async function creation(page: Page) {
  await closeShape(page);
  await page
    .getByRole("button", { name: "Create for me", exact: true })
    .click();
}
async function select(page: Page) {
  await closeShape(page);
  await page
    .getByRole("button", { name: "Explore Currents", exact: true })
    .click();
  await page.getByRole("button", { name: /Window Light.*Soft piano/ }).click();
  await shape(page);
}
async function stopPlayback(page: Page) {
  const sheet = page.getByRole("dialog", { name: "Shape now", exact: true });
  if (await sheet.isVisible())
    await sheet.getByRole("button", { name: "Stop", exact: true }).click();
  else
    await page
      .getByRole("button", { name: "Stop Current audio", exact: true })
      .click();
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
  await closeShape(page);
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
  await creation(page);
  await page
    .getByText("Preferences & advanced options", { exact: true })
    .click();
  await page
    .getByRole("textbox", { name: /How are you feeling/ })
    .fill("PRIVATE TEST NOTE");
  expect(
    await page.evaluate((k) => localStorage.getItem(k), currentMusicStorageKey),
  ).toBeNull();
  await shape(page);
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
  await page
    .getByRole("button", { name: "Explore Currents", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your saved Currents" }),
  ).toBeVisible();
  await page
    .locator(".cm-saved")
    .getByRole("button", { name: "Window Light", exact: true })
    .click();
  await shape(page);
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
  await creation(page);
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
  await creation(page);
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await closeShape(page);
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
  await creation(page);
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Current music", exact: true })
      .getByRole("alert"),
  ).toContainText("TEST model unavailable");
  await shape(page);
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
  await creation(page);
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
  await creation(page);
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
  await closeShape(page);
  await page.getByRole("button", { name: "Simulations", exact: true }).click();
  await expect
    .poll(async () => (await snap(page)).contexts.every((s) => s === "closed"))
    .toBe(true);
  await page.keyboard.press("Escape");
  await shape(page);
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

const alternative = {
  ...sample,
  id: "22222222-2222-4222-8222-222222222222",
  request: { ...sample.request, seed: 202 },
  metrics: { ...sample.metrics, pcmSha256: "e".repeat(64) },
};
async function completeBatch(
  page: Page,
  mode: "compare" | "session" = "compare",
) {
  let id = "",
    posts = 0;
  await page.route("**/api/current/music**", (r) => {
    if (r.request().method() === "POST") {
      const body = r.request().postDataJSON();
      id = body.id;
      posts++;
      expect(body.candidateCount).toBe(2);
      expect(body.request.seconds).toBe(60);
      return r.fulfill({
        status: 202,
        json: {
          job: {
            id,
            request: body.request,
            mode,
            phase: "running",
            message: "TEST bounded candidates",
          },
        },
      });
    }
    if (new URL(r.request().url()).searchParams.has("job"))
      return r.fulfill({
        json: {
          job: {
            id,
            request: sample.request,
            mode,
            phase: "done",
            message: "TEST two measured pieces",
            candidateIds: [sample.id, alternative.id],
            completedCandidates: 2,
            requestedCandidates: 2,
          },
        },
      });
    return r.fulfill({
      json: {
        samples: [sample, alternative],
        availability: { model: "ace", ready: true },
      },
    });
  });
  await creation(page);
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Prepared candidates", exact: true }),
  ).toBeVisible();
  expect(posts).toBe(1);
}
test("two real-buffer alternatives support deliberate preview and selection without autoplay", async ({
  page,
}) => {
  await open(page);
  await completeBatch(page);
  expect((await snap(page)).starts).toBe(0);
  await page
    .getByRole("button", { name: "Preview choice A", exact: true })
    .click();
  await shape(page);
  await expect(
    page.getByRole("button", { name: "Pause Current", exact: true }),
  ).toBeVisible();
  await stopPlayback(page);
  await closeShape(page);
  await page.getByRole("button", { name: "Use choice B", exact: true }).click();
  await shape(page);
  await expect(
    page.getByRole("textbox", { name: "Current name", exact: true }),
  ).toHaveValue("Small Morning");
});
test("a multi-movement session decodes both files, uses quiet fallback and saves exact identities", async ({
  page,
}) => {
  await open(page);
  await completeBatch(page, "session");
  await page
    .getByRole("button", { name: "Make a session from these", exact: true })
    .click();
  await shape(page);
  await expect(page.locator(".cm-sequence")).toContainText(
    "2 movements · 60 seconds of distinct music",
  );
  await expect(page.locator(".cm-sequence")).toContainText(
    "compatibility is uncertain",
  );
  const audioIds: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/music-lab/audio"))
      audioIds.push(new URL(r.url()).searchParams.get("id")!);
  });
  await page.getByRole("button", { name: "Play Current", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause Current", exact: true }),
  ).toBeVisible();
  expect(audioIds.sort()).toEqual([sample.id, alternative.id].sort());
  await stopPlayback(page);
  await page
    .getByRole("checkbox", { name: "Save this music session in this browser" })
    .check();
  await page.getByRole("button", { name: "Save Current", exact: true }).click();
  const rows = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    currentMusicStorageKey,
  );
  expect(rows[0].segments).toHaveLength(2);
  expect(rows[0].transition).toBe("quiet-gap");
  await page.reload();
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await page
    .getByRole("button", { name: "Explore Currents", exact: true })
    .click();
  await page.locator(".cm-saved").getByRole("button").first().click();
  await shape(page);
  await expect(page.locator(".cm-sequence")).toContainText("2 movements");
  expect((await snap(page)).starts).toBe(0);
});
test("opt-in background preparation survives navigation and restores without resubmission", async ({
  page,
}) => {
  await open(page);
  let id = "",
    request: unknown,
    posts = 0,
    deletes = 0;
  await page.route("**/api/current/music**", (r) => {
    if (r.request().method() === "POST") {
      const b = r.request().postDataJSON();
      id = b.id;
      request = b.request;
      posts++;
      return r.fulfill({
        status: 202,
        json: {
          job: {
            id,
            request,
            phase: "running",
            message: "TEST background",
            mode: "compare",
            requestedCandidates: 2,
          },
        },
      });
    }
    if (r.request().method() === "DELETE") {
      deletes++;
      return r.fulfill({ json: { cancelled: true } });
    }
    if (new URL(r.request().url()).searchParams.has("job"))
      return r.fulfill({
        json: {
          job: {
            id,
            request,
            phase: "running",
            message: "TEST restored background",
            mode: "compare",
            requestedCandidates: 2,
          },
        },
      });
    return r.fulfill({
      json: { samples: [sample], availability: { model: "ace", ready: true } },
    });
  });
  await creation(page);
  await page
    .getByText("Preferences & advanced options", { exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Keep preparing when I leave Current" })
    .check();
  await creation(page);
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel generation", exact: true }),
  ).toBeVisible();
  await closeShape(page);
  await page.getByRole("button", { name: "Ember", exact: true }).click();
  expect(deletes).toBe(0);
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await expect(
    page.getByText("TEST restored background", { exact: true }),
  ).toBeVisible();
  expect(posts).toBe(1);
  await page
    .getByRole("button", { name: "Cancel generation", exact: true })
    .click();
  await expect.poll(() => deletes).toBe(1);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("soulfire.current.pending.v1"),
    ),
  ).toBeNull();
});
test("customization bounds two/three compositions and 30/60/90 second pieces", async ({
  page,
}) => {
  await open(page);
  await creation(page);
  await page
    .getByText("Preferences & advanced options", { exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "What should we prepare?" })
    .selectOption("session");
  await page
    .getByRole("combobox", { name: "Number of pieces" })
    .selectOption("3");
  await page
    .getByRole("combobox", { name: "Length of each new composition" })
    .selectOption("90");
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/current/music**", (r) => {
    if (r.request().method() === "POST") {
      sent = r.request().postDataJSON();
      return r.fulfill({
        status: 503,
        json: { error: "TEST completed payload capture; no model executed" },
      });
    }
    return r.fulfill({ json: { cancelled: true } });
  });
  await creation(page);
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await expect(
    page.getByText("TEST completed payload capture; no model executed"),
  ).toBeVisible();
  expect(sent?.candidateCount).toBe(3);
  expect(sent?.mode).toBe("session");
  expect((sent?.request as { seconds: number }).seconds).toBe(90);
});

test("checkbox rows align, wrap and toggle through labels and keyboard", async ({
  page,
}) => {
  await open(page);
  await creation(page);
  await page
    .getByText("Preferences & advanced options", { exact: true })
    .click();
  const background = page.locator(".cm-background");
  await expect(background).toBeVisible();
  await background.locator("span").click();
  await expect(background.getByRole("checkbox")).toBeChecked();
  await select(page);
  const rows = page.locator(".cm-shape .check-row");
  await expect(rows).toHaveCount(2);
  for (const row of await rows.all()) {
    const checkbox = row.getByRole("checkbox"),
      caption = row.locator("span");
    const box = await checkbox.boundingBox(),
      text = await caption.boundingBox(),
      target = await row.boundingBox();
    expect(box && text && target).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(22);
    expect(box!.height).toBeLessThanOrEqual(22);
    expect(target!.height).toBeGreaterThanOrEqual(44);
    expect(text!.x).toBeGreaterThanOrEqual(box!.x + box!.width + 8);
    expect(Math.abs(text!.y - box!.y)).toBeLessThanOrEqual(4);
    expect(text!.x + text!.width).toBeLessThanOrEqual(
      target!.x + target!.width + 1,
    );
    const initial = await checkbox.isChecked();
    await caption.click();
    await expect(checkbox).toBeChecked({ checked: !initial });
    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked({ checked: initial });
  }
});

test("catalogue replacement hides old starters but restores an exact saved earlier version", async ({
  page,
}) => {
  await open(page);
  const replacement = {
    ...sample,
    id: "99999999-9999-4999-8999-999999999999",
    metrics: { ...sample.metrics, pcmSha256: "d".repeat(64) },
  };
  await page.route("**/api/current/music**", (r) =>
    r.fulfill({
      json: {
        samples: [replacement],
        archivedSamples: [sample],
        catalogue: {
          version: "replacement-test",
          description: "New stereo music catalogue",
        },
        availability: { model: "ace", ready: true },
      },
    }),
  );
  await page.evaluate(
    ({ key, old }) => localStorage.setItem(key, JSON.stringify([old])),
    {
      key: currentMusicStorageKey,
      old: {
        version: 2,
        id: "88888888-8888-4888-8888-888888888888",
        name: "Earlier favorite",
        sampleId: sample.id,
        pcmSha256: sample.metrics.pcmSha256,
        options: defaultCurrentMusic,
        minutes: 5,
        volume: 0.22,
        brightness: 0.55,
        space: 0.08,
      },
    },
  );
  await page.reload();
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await expect(
    page.locator(`.cm-starter[data-sample-id="${sample.id}"]`),
  ).toHaveCount(0);
  await expect(
    page.locator(`.cm-starter[data-sample-id="${replacement.id}"]`),
  ).toHaveCount(1);
  await page
    .locator(".cm-saved")
    .getByRole("button", { name: "Earlier favorite", exact: true })
    .click();
  await shape(page);
  await expect(
    page.getByText(/Earlier catalogue version, retained/),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Current name", exact: true }),
  ).toHaveValue("Earlier favorite");
  let audioId = "";
  page.on("request", (r) => {
    if (r.url().includes("/api/music-lab/audio"))
      audioId = new URL(r.url()).searchParams.get("id") || "";
  });
  await page.getByRole("button", { name: "Play Current", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause Current", exact: true }),
  ).toBeVisible();
  expect(audioId).toBe(sample.id);
  await stopPlayback(page);
});

test("Option A keeps creation discoverable and selected audio intact across workspaces", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole("button", { name: "Create for me", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Create something new/ }),
  ).toBeVisible();
  await play(page);
  await closeShape(page);
  const before = await snap(page);
  await creation(page);
  await expect(
    page.getByRole("heading", { name: "Create your Current", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "What do you enjoy hearing?" }),
  ).toBeVisible();
  expect((await snap(page)).starts).toBe(before.starts);
  expect((await snap(page)).stops).toBe(before.stops);
  if ((page.viewportSize()?.width || 0) < 851) {
    const dock = page.locator(".cm-player-dock"),
      box = await dock.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
    await page
      .getByRole("button", { name: "Stop Current audio", exact: true })
      .click();
  } else {
    for (const label of [
      "Current volume",
      "Current brightness",
      "Current space",
    ]) {
      const box = await page.getByRole("slider", { name: label }).boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(
        page.viewportSize()!.height,
      );
    }
    await page.getByRole("button", { name: "Stop", exact: true }).click();
  }
  await page
    .getByRole("button", { name: "Explore Currents", exact: true })
    .click();
  await expect(page.locator(".cm-starter")).toHaveCount(1);
  expect((await snap(page)).contexts.every((c) => c === "closed")).toBe(true);
});

test("Option A mobile shaping supports Escape, focus return and browser history", async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width || 0) > 850, "Mobile sheet only");
  await open(page);
  await page.locator(".cm-starter").first().click();
  const trigger = page.getByRole("button", { name: /Shape sound/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Shape now", exact: true });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(
    true,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await creation(page);
  await trigger.click();
  await page.goBack();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Create your Current", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Close shaping controls" }).click();
  await expect(trigger).toBeFocused();
});

test("creation status and cancellation stay reachable while exploring without stopping music", async ({
  page,
}) => {
  await open(page);
  await play(page);
  await closeShape(page);
  let posted: Record<string, unknown> | undefined,
    deleted = 0;
  await page.route("**/api/current/music**", (route) => {
    if (route.request().method() === "POST") {
      posted = route.request().postDataJSON();
      return route.fulfill({
        status: 202,
        json: {
          job: {
            ...posted,
            phase: "running",
            message: "TEST preparing while listening",
          },
        },
      });
    }
    if (route.request().method() === "DELETE") {
      deleted++;
      return route.fulfill({ json: { cancelled: true } });
    }
    if (new URL(route.request().url()).searchParams.has("job"))
      return route.fulfill({
        json: {
          job: {
            ...posted,
            phase: "running",
            message: "TEST preparing while listening",
          },
        },
      });
    return route.fulfill({
      json: { samples: [sample], availability: { model: "ace", ready: true } },
    });
  });
  const before = await snap(page);
  await creation(page);
  await page
    .getByRole("button", { name: "Create a new Current", exact: true })
    .click();
  await expect(
    page.getByText("Preparing your Current…", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore Currents", exact: true })
    .click();
  await expect(
    page.getByText("Your new Current is preparing", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View progress", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Create your Current", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore Currents", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel generation", exact: true })
    .click();
  await expect.poll(() => deleted).toBe(1);
  expect((await snap(page)).starts).toBe(before.starts);
  expect((await snap(page)).stops).toBe(before.stops);
  await stopPlayback(page);
  expect((await snap(page)).contexts.every((c) => c === "closed")).toBe(true);
});
