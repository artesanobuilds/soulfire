import { test, expect, type Page } from "@playwright/test";
async function editableThought(p: Page) {
  const controls = p.locator(".simple-scene-controls").first();
  if (
    !(await controls.getAttribute("open")) &&
    !(await controls.evaluate((el) => (el as HTMLDetailsElement).open))
  )
    await controls.locator("summary").click();
  return p.getByRole("textbox", { name: "Thought", exact: true }).first();
}

test("one prompt at a time preserves edits, focus and the private full journey", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await expect(page.getByLabel("What’s weighing on you today?")).toBeFocused();
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page.getByRole("button", { name: "Try this practice" }).click();
  await expect(page.locator(".exercise-block")).toHaveCount(1);
  await expect(
    page.getByLabel("Name what is here", { exact: true }),
  ).toHaveCount(0);
  await (await editableThought(page)).fill("My preserved thought");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Name what is here", exact: true }),
  ).toBeFocused();
  await page
    .getByLabel("Name what is here", { exact: true })
    .fill("I feel a little more space.");
  await page.getByRole("button", { name: "Previous prompt" }).click();
  await expect(await editableThought(page)).toHaveValue("My preserved thought");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByLabel("Name what is here", { exact: true }),
  ).toHaveValue("I feel a little more space.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("My next action", { exact: true })
    .fill("Take one small step.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nothing to get right." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip quiet and reflect" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByLabel("What did you notice?").fill("A small shift.");
  await page.getByRole("button", { name: "Keep private & continue" }).click();
  await expect(page.getByLabel("My chosen action")).toHaveValue(
    "Take one small step.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("water moves gently, pauses, and obeys reduced-motion changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Pause motion", exact: true }),
  ).toBeVisible();
  const ring = page.locator(".water-ring").first();
  await expect
    .poll(() => ring.evaluate((el) => el.getAnimations()[0]?.playState))
    .toBe("running");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect
    .poll(() => ring.evaluate((el) => el.getAnimations()[0]?.playState))
    .toBe("paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Still scene", exact: true }),
  ).toBeDisabled();
  expect(await ring.evaluate((el) => el.getAnimations().length)).toBe(0);
});

// Uses the actual local AAC assets and browser decoding, muted to avoid surprise sound.
async function observeAudio(
  page: Page,
  preference: "on" | "off" | null = "off",
) {
  if (preference)
    await page.addInitScript(
      (value) => localStorage.setItem("soulfire.ambient.enabled", value),
      preference,
    );
  await page.addInitScript(() => {
    const list: HTMLAudioElement[] = [];
    Object.defineProperty(window, "__ambientAudio", { value: list });
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      constructor(src?: string) {
        super(src);
        this.muted = true;
        list.push(this);
      }
    };
  });
}
const audioState = (page: Page) =>
  page.evaluate(() => {
    const list = (window as unknown as { __ambientAudio: HTMLAudioElement[] })
      .__ambientAudio;
    const a = list[list.length - 1];
    return {
      count: list.length,
      playing: list.filter((a) => !a.paused).length,
      paused: a?.paused,
      time: a?.currentTime,
      duration: a?.duration,
      volume: a?.volume,
      loop: a?.loop,
    };
  });
test("both real music loops decode, wrap, pause, retain volume and avoid duplicate playback", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/");
  await page.getByText("Sound off", { exact: true }).click();
  await expect(page.getByLabel("Ambient track")).toHaveValue("quiet-ember-01");
  expect((await audioState(page)).paused).toBe(true);
  for (const id of ["quiet-ember-01", "quiet-ember-02"]) {
    await page.getByLabel("Ambient track").selectOption(id);
    await page.getByRole("button", { name: "Play sound", exact: true }).click();
    await expect
      .poll(async () => (await audioState(page)).time)
      .toBeGreaterThan(0.1);
    expect((await audioState(page)).loop).toBe(true);
    expect((await audioState(page)).duration).toBeGreaterThan(170);
    await page.getByLabel("Ambient volume").fill("0.15");
    await expect
      .poll(async () => (await audioState(page)).volume)
      .toBeCloseTo(0.15, 2);
    await page.evaluate(() => {
      const a = (
        window as unknown as { __ambientAudio: HTMLAudioElement[] }
      ).__ambientAudio.at(-1)!;
      a.currentTime = a.duration - 0.2;
    });
    await expect
      .poll(async () => (await audioState(page)).time)
      .toBeLessThan(2);
    await page
      .getByRole("button", { name: "Pause sound", exact: true })
      .click();
    await expect.poll(async () => (await audioState(page)).paused).toBe(true);
  }
  await page.getByRole("button", { name: "Play sound", exact: true }).click();
  await page.getByText("Sound on", { exact: true }).click();
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page.getByRole("button", { name: "Try this practice" }).click();
  expect((await audioState(page)).playing).toBe(1);
  expect((await audioState(page)).count).toBe(2);
});

test("blocked sound can be retried without blocking the practice", async ({
  page,
}) => {
  await observeAudio(page);
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) {
        first = false;
        return Promise.reject(
          new DOMException("Unavailable", "NotSupportedError"),
        );
      }
      return original.call(this);
    };
  });
  await page.goto("/");
  await page.getByText("Sound off", { exact: true }).click();
  await page.getByRole("button", { name: "Play sound", exact: true }).click();
  await expect(page.locator(".ambient-controls [role=alert]")).toContainText(
    "Sound couldn’t start",
  );
  await page.getByRole("button", { name: "Play sound", exact: true }).click();
  await expect.poll(async () => (await audioState(page)).playing).toBe(1);
});

test("fresh arrival attempts permitted autoplay and explicit mute persists on return", async ({
  page,
}) => {
  await observeAudio(page, null);
  await page.goto("/");
  await expect.poll(async () => (await audioState(page)).playing).toBe(1);
  await expect(
    page.getByRole("button", { name: "Mute ambient sound" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mute ambient sound" }).click();
  await expect.poll(async () => (await audioState(page)).paused).toBe(true);
  expect(
    await page.evaluate(() => localStorage.getItem("soulfire.ambient.enabled")),
  ).toBe("off");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enable ambient sound" }),
  ).toBeEnabled();
  expect((await audioState(page)).playing).toBe(0);
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  expect((await audioState(page)).playing).toBe(0);
  await page.getByRole("button", { name: "Enable ambient sound" }).click();
  await expect.poll(async () => (await audioState(page)).playing).toBe(1);
  await page.reload();
  await expect.poll(async () => (await audioState(page)).playing).toBe(1);
  expect((await audioState(page)).count).toBe(1);
});

test("autoplay refusal waits for the first deliberate gesture without bypassing policy", async ({
  page,
}) => {
  await observeAudio(page, null);
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) {
        first = false;
        return Promise.reject(new DOMException("Blocked", "NotAllowedError"));
      }
      return original.call(this);
    };
  });
  await page.goto("/");
  await expect(
    page.getByText("Starts when you begin", { exact: true }),
  ).toBeVisible();
  expect((await audioState(page)).playing).toBe(0);
  // Opening settings must not trigger sound; a user can mute before giving any playback gesture.
  await page.getByText("Sound ready", { exact: true }).click();
  expect((await audioState(page)).playing).toBe(0);
  await page.getByText("Sound ready", { exact: true }).click();
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await expect.poll(async () => (await audioState(page)).playing).toBe(1);
  expect((await audioState(page)).count).toBe(1);
});

test("opening cover contains visible animated water, and pause freezes the whole scene", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const scene = page.locator(".is-arrival .quiet-scene");
  await expect(
    page.getByRole("button", { name: "Pause motion", exact: true }),
  ).toBeVisible();
  const sample = () =>
    scene.evaluate((el) => {
      const ring = el.querySelector(".water-ring")!;
      const r = ring.getBoundingClientRect();
      const s = el.getBoundingClientRect();
      return {
        visible:
          r.bottom > s.top &&
          r.top < s.bottom &&
          r.right > s.left &&
          r.left < s.right,
        depth: el.querySelector(".scene-depth")!.getAnimations()[0]
          ?.currentTime,
      };
    });
  const before = await sample();
  expect(before.visible).toBe(true);
  await expect
    .poll(async () => Number((await sample()).depth))
    .toBeGreaterThan(Number(before.depth) + 50);
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  expect(
    await scene
      .locator(".scene-depth")
      .evaluate((e) => e.getAnimations()[0]?.playState),
  ).toBe("paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await scene
      .locator(".scene-depth")
      .evaluate((e) => e.getAnimations().length),
  ).toBe(0);
});

test("blocked autoplay starts from the sound button in one click, without muting first", async ({
  page,
}) => {
  await observeAudio(page, null);
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) {
        first = false;
        return Promise.reject(new DOMException("Blocked", "NotAllowedError"));
      }
      return original.call(this);
    };
  });
  await page.goto("/");
  await expect(
    page.getByText("Starts when you begin", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enable ambient sound", exact: true })
    .click();
  await expect.poll(async () => (await audioState(page)).playing).toBe(1);
  expect(
    await page.evaluate(() => localStorage.getItem("soulfire.ambient.enabled")),
  ).not.toBe("off");
});

test("initially hidden tab starts on the first interaction after becoming visible", async ({
  page,
}) => {
  await observeAudio(page, null);
  await page.addInitScript(() => {
    let hidden = true;
    Object.defineProperty(document, "hidden", {
      get: () => hidden,
      configurable: true,
    });
    Object.defineProperty(window, "__showAudioPage", {
      value: () => {
        hidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
      },
    });
  });
  await page.goto("/");
  await expect.poll(async () => (await audioState(page)).count).toBe(1);
  await page.evaluate(() =>
    (window as unknown as { __showAudioPage: () => void }).__showAudioPage(),
  );
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await expect.poll(async () => (await audioState(page)).playing).toBe(1);
});

test("late autoplay resolution cannot pause a newer gesture-started playback", async ({
  page,
}) => {
  await observeAudio(page, null);
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) {
        first = false;
        return new Promise<void>((resolve) =>
          Object.defineProperty(window, "__resolveOldPlay", {
            value: resolve,
            configurable: true,
          }),
        );
      }
      return original.call(this);
    };
  });
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          typeof (window as unknown as { __resolveOldPlay?: () => void })
            .__resolveOldPlay,
      ),
    )
    .toBe("function");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await expect.poll(async () => (await audioState(page)).playing).toBe(1);
  await page.evaluate(() =>
    (window as unknown as { __resolveOldPlay: () => void }).__resolveOldPlay(),
  );
  expect((await audioState(page)).playing).toBe(1);
  await expect(page.getByText("Sound on", { exact: true })).toBeVisible();
});

test("only the sun halo breathes, and pause/reduced motion stop it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Pause motion", exact: true }),
  ).toBeVisible();
  const glow = page.locator(".is-arrival .sun-glow");
  const values = await glow.evaluate((el) => {
    const animation = el.getAnimations()[0];
    animation.currentTime = 0;
    const low = Number(getComputedStyle(el).opacity);
    animation.currentTime = 9000;
    const high = Number(getComputedStyle(el).opacity);
    return { low, high };
  });
  expect(values.high - values.low).toBeGreaterThan(0.4);
  expect(
    await page
      .locator(".is-arrival .quiet-scene")
      .evaluate((e) => getComputedStyle(e).opacity),
  ).toBe("1");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect
    .poll(() => glow.evaluate((e) => e.getAnimations()[0]?.playState))
    .toBe("paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await glow.evaluate((e) => e.getAnimations().length)).toBe(0);
});
