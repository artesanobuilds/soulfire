import { test, expect, type Page } from "@playwright/test";
import {
  createCurrentRecipe,
  defaultCurrentInput,
  currentStorageKey,
} from "../../src/domain/current";
import { simulateVoice } from "./helpers/simulated-voice";

async function instrument(
  page: Page,
  mode: "allow" | "deny" | "wait" | "unavailable" = "allow",
) {
  await page.addInitScript(
    ({ mode }) => {
      localStorage.setItem("soulfire.ambient.enabled", "off");
      const Native = window.AudioContext;
      const contexts: AudioContext[] = [],
        buffers: AudioBufferSourceNode[] = [],
        analysers: AnalyserNode[] = [];
      const media: HTMLAudioElement[] = [];
      let started = 0,
        stopped = 0,
        release = () => {};
      if (mode === "unavailable") {
        Object.defineProperty(window, "AudioContext", { value: undefined });
        Object.defineProperty(window, "webkitAudioContext", {
          value: undefined,
        });
      } else
        window.AudioContext = class extends Native {
          constructor(options?: AudioContextOptions) {
            super(options);
            contexts.push(this);
          }
          resume() {
            if (mode === "deny")
              return Promise.reject(
                new DOMException("Synthetic blocked audio", "NotAllowedError"),
              );
            if (mode === "wait")
              return new Promise<void>((resolve, reject) => {
                release = () => {
                  void super.resume().then(resolve, reject);
                };
              });
            return super.resume();
          }
          createBufferSource() {
            const source = super.createBufferSource();
            buffers.push(source);
            const start = source.start.bind(source),
              stop = source.stop.bind(source);
            source.start = (...args: Parameters<typeof start>) => {
              started++;
              start(...args);
            };
            source.stop = (...args: Parameters<typeof stop>) => {
              stopped++;
              stop(...args);
            };
            return source;
          }
          createAnalyser() {
            const analyser = super.createAnalyser();
            analysers.push(analyser);
            return analyser;
          }
        };
      const Audio = window.Audio;
      window.Audio = class extends Audio {
        constructor(src?: string) {
          super(src);
          media.push(this);
        }
      };
      Object.defineProperty(window, "__currentTest", {
        value: {
          release: () => release(),
          snapshot: () => ({
            contexts: contexts.map((c) => c.state),
            started,
            stopped,
            mediaPaused: media.every((a) => a.paused),
            fingerprints: buffers
              .filter((b) => b.buffer)
              .map((b) =>
                Array.from(b.buffer!.getChannelData(0).slice(1000, 1010)),
              ),
            peak: Math.max(
              0,
              ...analysers.map((a) => {
                if (a.context.state === "closed") return 0;
                const values = new Float32Array(a.fftSize);
                a.getFloatTimeDomainData(values);
                return Math.max(...values.map(Math.abs));
              }),
            ),
          }),
        },
      });
    },
    { mode },
  );
}
const snapshot = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as {
        __currentTest: {
          snapshot: () => {
            contexts: string[];
            started: number;
            stopped: number;
            mediaPaused: boolean;
            fingerprints: number[][];
            peak: number;
          };
        };
      }
    ).__currentTest.snapshot(),
  );
async function open(page: Page) {
  await page.route("**/api/memory", (r) =>
    r.fulfill({ json: { revision: 0, memory: null } }),
  );
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: false } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await page
    .getByRole("button", { name: "Explore Classic soundscapes" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Current", exact: true }),
  ).toBeVisible();
}
async function create(page: Page) {
  await page
    .getByRole("button", { name: "Create my mix", exact: true })
    .click();
  await expect(page.getByLabel("Mix name", { exact: true })).toBeVisible();
}
async function play(page: Page) {
  await page.getByRole("button", { name: "Play mix", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause mix", exact: true }),
  ).toBeVisible();
}
async function allClosed(page: Page) {
  await expect
    .poll(async () =>
      (await snapshot(page)).contexts.every((c) => c === "closed"),
    )
    .toBe(true);
}

test("Current is beside Simulations, keeps Soulfire identity, and recipe creation is silent and private", async ({
  page,
}) => {
  await instrument(page);
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url() + (r.postData() || "")));
  await open(page);
  await expect(
    page.getByRole("button", { name: "soulfire home" }),
  ).toBeVisible();
  expect(
    await page
      .locator('nav[aria-label="Main navigation"] button')
      .allTextContents(),
  ).toEqual(expect.arrayContaining(["Simulations", "Current"]));
  const labels = await page
    .locator('nav[aria-label="Main navigation"] button')
    .allTextContents();
  expect(labels.indexOf("Current")).toBe(labels.indexOf("Simulations") + 1);
  await page
    .getByLabel("A few words about the sound", { exact: false })
    .fill("PRIVATE-SOUND-NOTE, water, no rain");
  await create(page);
  expect((await snapshot(page)).contexts).toHaveLength(0);
  await expect(page.getByLabel("Exclude Rain", { exact: true })).toBeChecked();
  await expect(
    page.getByRole("slider", { name: "Rain layer level", exact: true }),
  ).toHaveCount(0);
  expect(requests.join(" ")).not.toContain("PRIVATE-SOUND-NOTE");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), currentStorageKey),
  ).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("real graph produces audio, levels/mutes affect output, pause resumes and stop closes all contexts", async ({
  page,
}) => {
  await instrument(page);
  await open(page);
  await create(page);
  await play(page);
  await expect
    .poll(() =>
      page
        .getByRole("meter", { name: "Current audio output level" })
        .evaluate((e) => (e as HTMLMeterElement).value),
    )
    .toBeGreaterThan(0.001);
  expect((await snapshot(page)).started).toBeGreaterThan(0);
  expect((await snapshot(page)).peak).toBeLessThan(1);
  await page
    .getByRole("slider", { name: "Current master volume", exact: true })
    .fill("0");
  await expect
    .poll(async () => (await snapshot(page)).peak)
    .toBeLessThan(0.001);
  await page
    .getByRole("slider", { name: "Current master volume", exact: true })
    .fill("0.3");
  await page.getByRole("button", { name: "Mute River", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute River", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Pause mix", exact: true }).click();
  await allClosed(page);
  await expect(
    page.getByRole("button", { name: "Resume mix", exact: true }),
  ).toBeVisible();
  const first = (await snapshot(page)).fingerprints[0];
  await page.getByRole("button", { name: "Resume mix", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause mix", exact: true }),
  ).toBeVisible();
  expect((await snapshot(page)).fingerprints).toContainEqual(first);
  await page.getByRole("button", { name: "Stop Current", exact: true }).click();
  await allClosed(page);
  expect((await snapshot(page)).stopped).toBe((await snapshot(page)).started);
});
test("timer and short preview finish without replay, and duration can be shortened", async ({
  page,
}) => {
  await instrument(page);
  await open(page);
  await create(page);
  await page.clock.install();
  await page.getByLabel("Current duration", { exact: true }).selectOption("1");
  await play(page);
  await page.clock.fastForward(61000);
  await expect(
    page.getByText("Finished. Nothing will restart automatically.", {
      exact: true,
    }),
  ).toBeVisible();
  await allClosed(page);
  await page
    .getByRole("button", { name: "Preview 20 seconds", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause mix", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(21000);
  await allClosed(page);
  await expect(
    page.getByRole("button", { name: "Play mix", exact: true }),
  ).toBeVisible();
});
test("regeneration and sound exclusions stop old playback and meaningfully change recipes", async ({
  page,
}) => {
  await instrument(page);
  await open(page);
  await create(page);
  await play(page);
  const original = await page
    .getByLabel("Mix name", { exact: true })
    .inputValue();
  const priorAudio = (await snapshot(page)).fingerprints;
  await page
    .getByRole("button", { name: "Create another variation", exact: true })
    .click();
  await allClosed(page);
  await expect(
    page.getByRole("button", { name: "Play mix", exact: true }),
  ).toBeVisible();
  const next = await page.getByLabel("Mix name", { exact: true }).inputValue();
  expect(next).not.toBe(original);
  await play(page);
  const freshAudio = (await snapshot(page)).fingerprints.slice(
    priorAudio.length,
  );
  expect(freshAudio[0]).not.toEqual(priorAudio[0]);
  await page.getByLabel("Exclude River", { exact: true }).check();
  await page
    .getByRole("button", { name: "Update my mix", exact: true })
    .click();
  await expect(
    page.getByRole("slider", { name: "River layer level", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("radio", { name: "Focus", exact: true }).check();
  await page
    .getByRole("button", { name: "Update my mix", exact: true })
    .click();
  await play(page);
  await page
    .getByRole("button", { name: "Create another variation", exact: true })
    .click();
  await allClosed(page);
});
test("save is explicit, retains the recipe through reload, loads silently and removes only Current data", async ({
  page,
}) => {
  await instrument(page);
  await open(page);
  await create(page);
  await page.getByLabel("Mix name", { exact: true }).fill("My test river");
  await expect(
    page.getByRole("button", { name: "Save mix", exact: true }),
  ).toBeDisabled();
  await page.evaluate(() =>
    localStorage.setItem("unrelated-current-test", "keep"),
  );
  await page
    .getByLabel("Keep this mix on this browser", { exact: false })
    .check();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), currentStorageKey),
  ).toBeNull();
  await page.getByRole("button", { name: "Save mix", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Load My test river", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await page
    .getByRole("button", { name: "Explore Classic soundscapes" })
    .click();
  await page
    .getByRole("button", { name: "Load My test river", exact: true })
    .click();
  expect((await snapshot(page)).started).toBe(0);
  await expect(page.getByLabel("Mix name", { exact: true })).toHaveValue(
    "My test river",
  );
  await page
    .getByRole("button", { name: "Remove My test river", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Load My test river", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("unrelated-current-test")),
  ).toBe("keep");
});
test("backgrounding and navigation release audio with no automatic resume", async ({
  page,
}) => {
  await instrument(page);
  await open(page);
  await create(page);
  await play(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await allClosed(page);
  await expect(
    page.getByRole("button", { name: "Resume mix", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      get: () => false,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect((await snapshot(page)).contexts.every((c) => c === "closed")).toBe(
    true,
  );
  await page.getByRole("button", { name: "Resume mix", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause mix", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "The practice", exact: true }).click();
  await allClosed(page);
});
test("blocked and unavailable Web Audio show a truthful recoverable error", async ({
  page,
}) => {
  await instrument(page, "deny");
  await open(page);
  await create(page);
  await page.getByRole("button", { name: "Play mix", exact: true }).click();
  await expect(
    page.getByText("Audio was blocked.", { exact: false }),
  ).toBeVisible();
  await allClosed(page);
  await expect(
    page.getByRole("button", { name: "Pause mix", exact: true }),
  ).toHaveCount(0);
});
test("late audio unlock cannot revive a stopped or regenerated graph", async ({
  page,
}) => {
  await instrument(page, "wait");
  await open(page);
  await create(page);
  await page.getByRole("button", { name: "Play mix", exact: true }).click();
  await page.getByRole("button", { name: "Stop Current", exact: true }).click();
  await allClosed(page);
  await page.evaluate(() =>
    (
      window as unknown as { __currentTest: { release: () => void } }
    ).__currentTest.release(),
  );
  await expect(
    page.getByRole("button", { name: "Pause mix", exact: true }),
  ).toHaveCount(0);
  expect((await snapshot(page)).started).toBe(0);
});
test("unavailable audio still allows a saved recipe; corrupt storage is not silently overwritten", async ({
  page,
}) => {
  await instrument(page, "unavailable");
  await page.addInitScript(
    (key) => localStorage.setItem(key, "{broken"),
    currentStorageKey,
  );
  await open(page);
  await create(page);
  await page.getByRole("button", { name: "Play mix", exact: true }).click();
  await expect(
    page.getByText("Audio is unavailable in this browser.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), currentStorageKey),
  ).toBe("{broken");
  await page
    .getByRole("button", {
      name: "Reset unreadable Current saved mixes",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirm reset Current mixes", exact: true })
    .click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), currentStorageKey),
  ).toBeNull();
});
test("opening Current stops voice and music, and other activities pause Current", async ({
  page,
}) => {
  await instrument(page);
  await simulateVoice(page);
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page
    .getByRole("button", { name: "Allow microphone & start", exact: true })
    .click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await page
    .getByRole("button", { name: "Explore Classic soundscapes" })
    .click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __voiceTest: { stops: number } }).__voiceTest
          .stops,
    ),
  ).toBeGreaterThan(0);
  await create(page);
  await play(page);
  expect((await snapshot(page)).mediaPaused).toBe(true);
  await page.getByRole("button", { name: "My memory", exact: true }).click();
  await allClosed(page);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume mix", exact: true }),
  ).toBeVisible();
});
test("reduced motion remains static, keyboard controls work, and all-excluded input is recoverable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await instrument(page);
  await open(page);
  for (const kind of ["River", "Rain", "Breeze", "Warm tones"])
    await page.getByLabel(`Exclude ${kind}`, { exact: true }).check();
  await page
    .getByRole("button", { name: "Create my mix", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Current soundscapes" })
      .getByRole("alert"),
  ).toContainText("at least one sound");
  await page.getByLabel("Exclude River", { exact: true }).uncheck();
  await create(page);
  await page.getByRole("button", { name: "Play mix", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Pause mix", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".current-river-lines")
      .evaluate((e) => e.getAnimations().length),
  ).toBe(0);
  await page.getByRole("button", { name: "Stop Current", exact: true }).focus();
  await page.keyboard.press("Enter");
  await allClosed(page);
});
test("valid stored recipes reject raw notes and unsafe gains", async ({
  page,
}) => {
  const recipe = createCurrentRecipe(defaultCurrentInput);
  await instrument(page);
  await page.addInitScript(
    ({ key, recipe }) =>
      localStorage.setItem(
        key,
        JSON.stringify([{ ...recipe, volume: 9, words: "SHOULD-NOT-LOAD" }]),
      ),
    { key: currentStorageKey, recipe },
  );
  await open(page);
  await expect(
    page.getByText("Saved mixes are unavailable or unreadable.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Load ${recipe.name}`, exact: true }),
  ).toHaveCount(0);
});

test("audio unlock timeout releases the graph and does not start later", async ({
  page,
}) => {
  await instrument(page, "wait");
  await open(page);
  await create(page);
  await page.clock.install();
  await page.getByRole("button", { name: "Play mix", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Stop Current", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(4100);
  await expect(
    page.getByText("Audio did not unlock.", { exact: false }),
  ).toBeVisible();
  await allClosed(page);
  expect((await snapshot(page)).started).toBe(0);
});
test("storage write failure never pretends the mix was saved", async ({
  page,
}) => {
  await instrument(page);
  await page.addInitScript((key) => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === key)
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return write.call(this, k, v);
    };
  }, currentStorageKey);
  await open(page);
  await create(page);
  await page
    .getByLabel("Keep this mix on this browser", { exact: false })
    .check();
  await page.getByRole("button", { name: "Save mix", exact: true }).click();
  await expect(
    page.getByText("Couldn’t save on this browser.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), currentStorageKey),
  ).toBeNull();
  await play(page);
  await page.getByRole("button", { name: "Stop Current", exact: true }).click();
  await allClosed(page);
});
