import { test, expect, type Page } from "@playwright/test";
import { samples } from "../../src/lib/catalog";

// Real Web Audio + MediaRecorder, driven by a local oscillator. Never use the
// physical microphone, and intercept every transcription request before networking.
async function setup(
  page: Page,
  permission: "allow" | "wait" | "deny" = "allow",
  recorderFails = false,
) {
  await page.addInitScript(
    ({ permission, recorderFails }) => {
      localStorage.setItem("soulfire.ambient.enabled", "off");
      const NativeContext = window.AudioContext;
      const s = {
        tracks: [] as MediaStreamTrack[],
        contexts: [] as AudioContext[],
        level: undefined as GainNode | undefined,
        resolve: () => {},
        disconnect: () => {},
      };
      Object.defineProperty(window, "__dictationTest", { value: s });
      window.AudioContext = class extends NativeContext {
        constructor() {
          super();
          s.contexts.push(this);
        }
      };
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          if (permission === "wait")
            await new Promise<void>((resolve) => {
              s.resolve = resolve;
            });
          if (permission === "deny")
            throw new DOMException("Denied", "NotAllowedError");
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          gain.gain.value = 0;
          s.level = gain;
          const destination = context.createMediaStreamDestination();
          oscillator.connect(gain).connect(destination); // Not connected to speakers.
          oscillator.start();
          await context.resume();
          const track = destination.stream.getAudioTracks()[0];
          s.tracks.push(track);
          const nativeStop = track.stop.bind(track);
          track.stop = () => {
            nativeStop();
            oscillator.disconnect();
            gain.disconnect();
            if (context.state !== "closed") void context.close();
          };
          s.disconnect = () => {
            track.stop();
            track.dispatchEvent(new Event("ended"));
          };
          return destination.stream;
        },
      });
      if (recorderFails) {
        const NativeRecorder = window.MediaRecorder;
        window.MediaRecorder = class extends NativeRecorder {
          start() {
            throw new Error("Synthetic recorder startup failure");
          }
        };
      }
    },
    { permission, recorderFails },
  );
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: true } }),
  );
  await page.route("**/api/transcribe", (r) =>
    r.fulfill({ json: { text: "Synthetic final words." } }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("Existing draft.");
}
async function start(page: Page) {
  await page.getByRole("button", { name: "Dictate", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
}
const capture = (page: Page) =>
  page.evaluate(() => {
    const s = (
      window as unknown as {
        __dictationTest: {
          tracks: MediaStreamTrack[];
          contexts: AudioContext[];
        };
      }
    ).__dictationTest;
    return {
      tracks: s.tracks.map((t) => t.readyState),
      contexts: s.contexts.map((c) => c.state),
    };
  });
async function released(page: Page) {
  await expect
    .poll(async () => {
      const s = await capture(page);
      return (
        s.tracks.every((t) => t === "ended") &&
        s.contexts.every((c) => c === "closed")
      );
    })
    .toBe(true);
}

test("real synthetic waveform reacts to level, stays until Stop, then inserts final text once", async ({
  page,
}, testInfo) => {
  await setup(page);
  let requests = 0;
  let finish!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/transcribe", async (r) => {
    requests++;
    await responseReady;
    await r
      .fulfill({ json: { text: "Synthetic final words." } })
      .catch(() => {});
  });
  await start(page);
  await expect(
    page.getByText("Listening · microphone on", { exact: true }),
  ).toBeVisible();
  const height = () =>
    page
      .locator(".dictation-waveform i")
      .nth(7)
      .evaluate((el) => parseFloat((el as HTMLElement).style.height));
  await expect.poll(height).toBeLessThan(6);
  await page.evaluate(() => {
    (
      window as unknown as { __dictationTest: { level: GainNode } }
    ).__dictationTest.level.gain.value = 0.2;
  });
  await expect.poll(height).toBeGreaterThan(16);
  expect((await capture(page)).tracks).toEqual(["live"]);
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Existing draft.",
  );
  expect(requests).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dictation-listening.png"),
    fullPage: true,
  });
  // Advancing timers beyond the old minute limit must not finish capture.
  await page.clock.install();
  await page.clock.fastForward(65000);
  await expect(
    page.getByText("Listening · microphone on", { exact: true }),
  ).toBeVisible();
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Stop & transcribe" }).click();
  await page.clock.resume();
  await expect(page.locator(".dictation-waveform")).toHaveCount(0);
  await expect(
    page.getByText("Transcribing · microphone off…", { exact: true }),
  ).toBeVisible();
  await released(page);
  await expect.poll(() => requests).toBe(1);
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Existing draft.",
  );
  finish();
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Existing draft.\nSynthetic final words.",
  );
  await expect(
    page.getByRole("button", { name: "Dictate", exact: true }),
  ).toBeVisible();
  expect(requests).toBe(1);
});

test("pending permission never looks like capture; cancel releases a late stream", async ({
  page,
}) => {
  await setup(page, "wait");
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/transcribe")) requests++;
  });
  await start(page);
  await expect(
    page.getByText("Waiting for microphone…", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".dictation-waveform")).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.evaluate(() =>
    (
      window as unknown as { __dictationTest: { resolve: () => void } }
    ).__dictationTest.resolve(),
  );
  await expect.poll(async () => (await capture(page)).tracks.length).toBe(1);
  await released(page);
  await expect(
    page.getByRole("button", { name: "Dictate", exact: true }),
  ).toBeVisible();
  expect(requests).toBe(0);
});

for (const failure of ["denial", "recorder"] as const) {
  test(`${failure} failure shows no listening animation and preserves text`, async ({
    page,
  }) => {
    await setup(
      page,
      failure === "denial" ? "deny" : "allow",
      failure === "recorder",
    );
    await start(page);
    await expect(page.locator("main [role=alert]")).toContainText(
      failure === "denial" ? "permission was denied" : "startup failure",
    );
    await expect(page.locator(".dictation-waveform")).toHaveCount(0);
    await released(page);
    await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
      "Existing draft.",
    );
    await expect(
      page.getByRole("button", { name: "Dictate", exact: true }),
    ).toBeEnabled();
  });
}

test("discard, disconnect and navigation release capture without uploading", async ({
  page,
}) => {
  await setup(page);
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/transcribe")) requests++;
  });
  await start(page);
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await released(page);
  await start(page);
  await expect(page.locator(".dictation-waveform")).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { __dictationTest: { disconnect: () => void } }
    ).__dictationTest.disconnect(),
  );
  await expect(page.locator("main [role=alert]")).toContainText(
    "Microphone disconnected",
  );
  await released(page);
  await start(page);
  await expect(page.locator(".dictation-waveform")).toBeVisible();
  await page.getByRole("button", { name: "soulfire home" }).click();
  await released(page);
  await expect(page.locator(".dictation-waveform")).toHaveCount(0);
  expect(requests).toBe(0);
});

test("cancel processing ignores late text and a failed transcription remains retryable", async ({
  page,
}) => {
  await setup(page);
  let finish!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/transcribe", async (r) => {
    await responseReady;
    await r.fulfill({ json: { text: "Must not appear." } }).catch(() => {});
  });
  await start(page);
  await page.getByRole("button", { name: "Stop & transcribe" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  finish();
  await released(page);
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Existing draft.",
  );
  await page.route("**/api/transcribe", (r) =>
    r.fulfill({
      status: 503,
      json: { error: "Synthetic service unavailable." },
    }),
  );
  await start(page);
  await page.getByRole("button", { name: "Stop & transcribe" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "Synthetic service unavailable",
  );
  await released(page);
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Existing draft.",
  );
  await expect(
    page.getByRole("button", { name: "Dictate", exact: true }),
  ).toBeEnabled();
});

test("reduced motion keeps a static listening indicator without interrupting recording", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page);
  await start(page);
  await expect(
    page.getByText("Listening · microphone on", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".dictation-waveform i").nth(7)).toHaveCSS(
    "height",
    "4px",
  );
  expect((await capture(page)).tracks).toEqual(["live"]);
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await released(page);
});

test("motion pause is static; pagehide discards capture and cancels its analyser", async ({
  page,
}) => {
  await setup(page);
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/transcribe")) requests++;
  });
  await start(page);
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".dictation-waveform i").nth(7)).toHaveCSS(
    "height",
    "4px",
  );
  await expect(
    page.getByText("Listening · microphone on", { exact: true }),
  ).toBeVisible();
  expect((await capture(page)).tracks).toEqual(["live"]);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(page.locator(".dictation-waveform")).toHaveCount(0);
  await released(page);
  expect(requests).toBe(0);
});

test("empty recognized text reports recovery instead of changing the draft", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/transcribe", (r) =>
    r.fulfill({ json: { text: "  " } }),
  );
  await start(page);
  await page.getByRole("button", { name: "Stop & transcribe" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "No speech was recognized",
  );
  await released(page);
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Existing draft.",
  );
});

test("long dictated draft exposes explicit Send after processing, with one keyboard submission", async ({
  page,
}, info) => {
  await setup(page);
  if (info.project.name === "mobile")
    await page.setViewportSize({ width: 390, height: 450 });
  const words =
    "A synthetic presentation draft for reviewing and editing. ".repeat(35);
  let finishTranscription!: () => void;
  const transcriptionReady = new Promise<void>((resolve) => {
    finishTranscription = resolve;
  });
  await page.route("**/api/transcribe", async (r) => {
    await transcriptionReady;
    await r.fulfill({ json: { text: words } });
  });
  let modelCalls = 0;
  let finishModel!: () => void;
  const modelReady = new Promise<void>((resolve) => {
    finishModel = resolve;
  });
  await page.route("**/api/companion", async (r) => {
    modelCalls++;
    expect(r.request().postDataJSON().messages.at(-1).content).toContain(
      words.trim(),
    );
    await modelReady;
    await r.fulfill({
      json: {
        reply: {
          kind: "practice",
          message: "Synthetic response.",
          exercise: samples.worry,
        },
      },
    });
  });
  const send = page.getByRole("button", {
    name: "Send & find a practice",
    exact: true,
  });
  await start(page);
  await expect(send).toBeDisabled();
  await page.getByRole("button", { name: "Stop & transcribe" }).click();
  await expect(
    page.getByText("Transcribing · microphone off…", { exact: true }),
  ).toBeVisible();
  await expect(send).toBeDisabled();
  await released(page);
  finishTranscription();
  const input = page.getByLabel("What’s weighing on you today?");
  await expect(input).toHaveValue("Existing draft.\n" + words);
  await expect(page.locator(".draft-review")).toContainText("Draft ready");
  await expect(send).toBeEnabled();
  await expect(send).toBeInViewport({ ratio: 1 });
  expect(await input.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  );
  expect(modelCalls).toBe(0);
  await page.screenshot({ path: info.outputPath("submit-ready.png") });
  await input.press("Control+Enter");
  await input.press("Control+Enter");
  await expect.poll(() => modelCalls).toBe(1);
  finishModel();
  await expect(
    page.getByRole("button", { name: "Try this practice", exact: true }),
  ).toBeVisible();
  expect(modelCalls).toBe(1);
});

test("typed draft keeps newlines, survives failed send and canceled permission", async ({
  page,
}) => {
  await setup(page);
  const input = page.getByLabel("What’s weighing on you today?");
  const send = page.getByRole("button", {
    name: "Send & find a practice",
    exact: true,
  });
  let calls = 0;
  await page.route("**/api/companion", (r) => {
    calls++;
    return r.fulfill({
      status: 503,
      json: { error: "Synthetic service unavailable; draft retained." },
    });
  });
  await input.fill("Synthetic editable draft");
  await input.press("End");
  await input.press("Enter");
  await expect(input).toHaveValue("Synthetic editable draft\n");
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Dictate", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(input).toHaveValue("Synthetic editable draft\n");
  await input.press("Tab");
  await expect(send).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main [role=alert]")).toContainText(
    "Synthetic service unavailable",
  );
  await expect(input).toHaveValue("Synthetic editable draft\n");
  expect(calls).toBe(1);
});

test("unconfigured and checking states explain disabled Send without discarding typed text", async ({
  page,
}) => {
  await page.route("**/api/memory", (r) =>
    r.fulfill({ json: { revision: 0, memory: null } }),
  );
  let ready!: () => void;
  const pending = new Promise<void>((resolve) => {
    ready = resolve;
  });
  await page.route("**/api/status", async (r) => {
    await pending;
    await r.fulfill({ json: { configured: false } });
  });
  let calls = 0;
  await page.route("**/api/companion", (r) => {
    calls++;
    return r.abort();
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  const input = page.getByLabel("What’s weighing on you today?");
  await input.fill("Synthetic preserved words.");
  const send = page.getByRole("button", {
    name: "Send & find a practice",
    exact: true,
  });
  await expect(send).toBeDisabled();
  await expect(page.locator("#opening-send-help")).toContainText("Checking");
  ready();
  await expect(page.locator("#opening-send-help")).toContainText(
    "AI is not connected",
  );
  await input.press("Control+Enter");
  await expect(send).toBeDisabled();
  await expect(input).toHaveValue("Synthetic preserved words.");
  expect(calls).toBe(0);
});
