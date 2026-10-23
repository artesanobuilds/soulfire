import { test, expect, type Page } from "@playwright/test";
const intro = (p: Page) => p.locator("audio[data-intro]");
const flag = (p: Page) =>
  p.evaluate(() => localStorage.getItem("soulfire.introduction.v1"));
async function example(p: Page) {
  await p.getByRole("button", { name: "Begin journey", exact: true }).click();
  await p.getByRole("button", { name: /Try the example/ }).click();
  await p.getByRole("button", { name: "Try this practice" }).click();
}
async function observeMusic(p: Page) {
  await p.addInitScript(() => {
    const list: HTMLAudioElement[] = [];
    Object.defineProperty(window, "__music", { value: list });
    const Native = window.Audio;
    window.Audio = class extends Native {
      constructor(src?: string) {
        super(src);
        list.push(this);
      }
    };
  });
}
const music = (p: Page) =>
  p.evaluate(() => {
    const list = (window as unknown as { __music: HTMLAudioElement[] }).__music;
    const a = list.at(-1)!;
    return {
      time: a.currentTime,
      volume: a.volume,
      active: list.filter((x) => !x.paused).length,
      count: list.length,
    };
  });

test("loading alone is not completion; deliberate skip and motion preference persist", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(
    page.getByText("Twelve-step wisdom, practiced in everyday life."),
  ).toBeVisible();
  expect(await flag(page)).toBeNull();
  expect(await intro(page).evaluate((a: HTMLAudioElement) => a.paused)).toBe(
    true,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Play introduction", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await page
    .getByRole("button", { name: "Skip introduction", exact: true })
    .click();
  await expect(page.getByLabel("What’s weighing on you today?")).toBeFocused();
  expect(await flag(page)).toBe("done");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play motion", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play introduction", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replay introduction", exact: true }),
  ).toHaveCount(0);
});

test("real local narration decodes, captions follow cues, mute pause replay and completion work", async ({
  page,
}) => {
  const providerRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/companion")) providerRequests.push(r.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play introduction", exact: true })
    .click();
  await expect
    .poll(() => intro(page).evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(0.1);
  expect(
    await intro(page).evaluate((a: HTMLAudioElement) => a.duration),
  ).toBeGreaterThan(22);
  await expect(
    page.getByText("Bring what’s on your mind", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mute introduction", exact: true })
    .click();
  expect(await intro(page).evaluate((a: HTMLAudioElement) => a.muted)).toBe(
    true,
  );
  await page
    .getByRole("button", { name: "Unmute introduction", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pause introduction", exact: true })
    .click();
  expect(await intro(page).evaluate((a: HTMLAudioElement) => a.paused)).toBe(
    true,
  );
  await page
    .getByRole("button", { name: "Resume introduction", exact: true })
    .click();
  await intro(page).evaluate((a: HTMLAudioElement) => {
    a.currentTime = 13;
  });
  await expect(
    page.getByText("Make space to reflect", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Captions on", exact: true }).click();
  await expect(page.locator(".intro-caption")).toHaveCount(0);
  await page.getByRole("button", { name: "Captions off", exact: true }).click();
  await intro(page).evaluate((a: HTMLAudioElement) => {
    a.currentTime = 20;
  });
  await expect(
    page.getByText("Find one small next step", { exact: true }),
  ).toBeVisible();
  await intro(page).evaluate((a: HTMLAudioElement) => {
    a.currentTime = a.duration - 0.15;
  });
  await expect.poll(() => flag(page)).toBe("done");
  await page.reload();
  await page
    .getByRole("button", { name: "Replay introduction", exact: true })
    .click();
  await expect
    .poll(() => intro(page).evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(0.1);
  expect(providerRequests).toHaveLength(0);
});

test("begin during narration stops speech, restores ducked music, and preserves the landscape and player", async ({
  page,
}) => {
  await observeMusic(page);
  await page.goto("/");
  await expect(page.locator(".sound-toggle")).toBeEnabled();
  await page
    .getByRole("button", { name: "Play introduction", exact: true })
    .click();
  await expect.poll(async () => (await music(page)).active).toBe(1);
  await expect
    .poll(async () => (await music(page)).volume)
    .toBeCloseTo(0.055, 2);
  const before = await music(page);
  const scene = await page.locator(".quiet-scene").elementHandle();
  const speech = await intro(page).elementHandle();
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  expect(await speech!.evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
  expect(await scene!.evaluate((a) => a.isConnected)).toBe(true);
  await expect
    .poll(async () => (await music(page)).volume)
    .toBeCloseTo(0.25, 2);
  const after = await music(page);
  expect(after.count).toBe(before.count);
  expect(after.active).toBe(1);
  expect(after.time).toBeGreaterThan(before.time);
});

test("rapid play and pause, modal and navigation interruptions do not complete the introduction", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play introduction", exact: true })
    .dblclick();
  await expect(intro(page)).toHaveCount(1);
  await page
    .getByRole("button", { name: "Privacy & about", exact: true })
    .click();
  expect(await intro(page).evaluate((a: HTMLAudioElement) => a.paused)).toBe(
    true,
  );
  expect(await flag(page)).toBeNull();
  await page.keyboard.press("Escape");
  // A rapid interruption can occur before the browser's first playing event.
  await page
    .getByRole("button", { name: /^(Play|Resume) introduction$/ })
    .click();
  await expect
    .poll(() => intro(page).evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(0.1);
  const speech = await intro(page).elementHandle();
  await page.getByRole("button", { name: "The practice", exact: true }).click();
  expect(await speech!.evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
  expect(await flag(page)).toBeNull();
  await page
    .getByRole("button", { name: "soulfire home", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Replay introduction", exact: true }),
  ).toBeVisible();
});

test("saving is opt-in; return hides private text, resume restores it, and new practice requires confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await example(page);
  await page
    .getByRole("textbox", { name: "Thought", exact: true })
    .first()
    .fill("PRIVATE THOUGHT");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Name what is here", { exact: true })
    .fill("PRIVATE REFLECTION");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("soulfire.saved-practice.v1"),
    ),
  ).toBeNull();
  await page.getByText("Save and return later", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Keep this practice on this device" })
    .check();
  await expect(
    page.getByText("Saved on this device. Conversations are not saved."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("PRIVATE REFLECTION");
  await expect(page.locator("body")).not.toContainText("PRIVATE THOUGHT");
  await page
    .getByRole("button", { name: "Resume practice", exact: true })
    .click();
  await expect(
    page.getByLabel("Name what is here", { exact: true }),
  ).toHaveValue("PRIVATE REFLECTION");
  await page
    .getByRole("button", { name: "Previous prompt", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Thought", exact: true }).first(),
  ).toHaveValue("PRIVATE THOUGHT");
  await page
    .getByRole("button", { name: "soulfire home", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start a new practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep this session", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume practice", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Thought", exact: true }).first(),
  ).toHaveValue("PRIVATE THOUGHT");
  await page
    .getByRole("button", { name: "soulfire home", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start a new practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Clear & begin again", exact: true })
    .click();
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("soulfire.saved-practice.v1"),
    ),
  ).toBeNull();
  expect(await flag(page)).toBe("done");
});

test("removing a saved copy retains current answers and explicit sound mute survives narration", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("soulfire.ambient.enabled", "off"),
  );
  await observeMusic(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play introduction", exact: true })
    .click();
  await expect
    .poll(() => intro(page).evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(0.1);
  expect((await music(page)).active).toBe(0);
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page.getByRole("button", { name: "Try this practice" }).click();
  await page
    .getByRole("textbox", { name: "Thought", exact: true })
    .first()
    .fill("Keep in tab");
  await page.getByText("Save and return later", { exact: true }).click();
  const save = page.getByRole("checkbox", {
    name: "Keep this practice on this device",
  });
  await save.check();
  await save.uncheck();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("soulfire.saved-practice.v1"),
    ),
  ).toBeNull();
  await expect(
    page.getByRole("textbox", { name: "Thought", exact: true }).first(),
  ).toHaveValue("Keep in tab");
});

test("failed narration has a readable fallback, keyboard entry and reduced motion still work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/audio/welcome-kokoro-heart.m4a", (r) => r.abort());
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play introduction", exact: true })
    .click();
  await expect(page.locator(".intro-error")).toBeVisible();
  await expect(page.locator(".intro-transcript")).toHaveCount(0);
  await expect(page.locator(".intro-accessible-copy")).toContainText(
    "You set the pace.",
  );
  await expect(
    page.getByRole("button", { name: "Still scene", exact: true }),
  ).toBeDisabled();
  expect(
    await page
      .locator(".water-ring")
      .first()
      .evaluate((e) => e.getAnimations().length),
  ).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("What’s weighing on you today?")).toBeFocused();
});

test("saved action and reflection survive a finished visit; replacing a saved practice from the map is explicit", async ({
  page,
}) => {
  await page.goto("/");
  await example(page);
  await page.getByText("Save and return later", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Keep this practice on this device" })
    .check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Name what is here", { exact: true })
    .fill("PRIVATE FIELD");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("My next action", { exact: true })
    .fill("PRIVATE ACTION");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip quiet and reflect" }).click();
  await page.getByLabel("What did you notice?").fill("PRIVATE NOTICE");
  await page.getByRole("button", { name: "Keep private & continue" }).click();
  await page.reload();
  await expect(page.locator("body")).not.toContainText("PRIVATE");
  await page
    .getByRole("button", { name: "Resume practice", exact: true })
    .click();
  await expect(page.getByLabel("My chosen action")).toHaveValue(
    "PRIVATE ACTION",
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("soulfire.saved-practice.v1")!),
  );
  expect(saved.reflection).toBe("PRIVATE NOTICE");
  expect(Object.values(saved.fields)).toContain("PRIVATE FIELD");
  await page.getByRole("button", { name: "The practice", exact: true }).click();
  await page
    .getByRole("button", { name: "Explore step 3", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Starting fresh clears this practice",
  );
  await page
    .getByRole("button", { name: "Keep this session", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("soulfire.saved-practice.v1")!).action,
    ),
  ).toBe("PRIVATE ACTION");
  await page
    .getByRole("button", { name: "Explore step 3", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Clear & begin again", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Before the next urge." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("soulfire.saved-practice.v1"),
    ),
  ).toBeNull();
});

test("device storage failure retains current answers with an honest save error", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "soulfire.saved-practice.v1")
        throw new DOMException("Full", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.goto("/");
  await example(page);
  await page
    .getByRole("textbox", { name: "Thought", exact: true })
    .first()
    .fill("Still here");
  await page.getByText("Save and return later", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Keep this practice on this device" })
    .check();
  await expect(
    page.getByText(
      "Couldn’t save on this device. Keep this tab open to retain your answers.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Thought", exact: true }).first(),
  ).toHaveValue("Still here");
});

test("sound selection and volume persist, and a hidden tab pauses unfinished narration", async ({
  page,
}) => {
  await observeMusic(page);
  await page.goto("/");
  await page.locator(".sound-controls summary").click();
  await page.getByLabel("Ambient track").selectOption("quiet-ember-02");
  await page.getByLabel("Ambient volume").fill("0.15");
  await page.reload();
  await page.locator(".sound-controls summary").click();
  await expect(page.getByLabel("Ambient track")).toHaveValue("quiet-ember-02");
  await expect(page.getByLabel("Ambient volume")).toHaveValue("0.15");
  await page.locator(".sound-controls summary").click();
  await page
    .getByRole("button", { name: "Play introduction", exact: true })
    .click();
  await expect
    .poll(() => intro(page).evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(0.1);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await intro(page).evaluate((a: HTMLAudioElement) => a.paused)).toBe(
    true,
  );
  expect(await flag(page)).toBeNull();
});

test("fresh arrival puts Play beside Begin and beginning alone never creates playback history", async ({
  page,
}) => {
  await page.goto("/");
  const play = page.getByRole("button", {
    name: "Play introduction",
    exact: true,
  });
  const begin = page.getByRole("button", {
    name: "Begin journey",
    exact: true,
  });
  await expect(play).toBeVisible();
  await expect(begin).toBeVisible();
  const p = await play.boundingBox(),
    b = await begin.boundingBox();
  expect(Math.abs(p!.y - b!.y)).toBeLessThan(2);
  expect(b!.x).toBeGreaterThan(p!.x + p!.width);
  await expect(
    page.getByText("Introduction transcript", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".intro-transcript")).toHaveCount(0);
  await expect(page.locator(".intro-accessible-copy")).toContainText(
    "You set the pace.",
  );
  await begin.click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("soulfire.introduction.played.v1"),
    ),
  ).toBeNull();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(play).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replay introduction", exact: true }),
  ).toHaveCount(0);
});

test("legacy arrival completion is not treated as evidence of playing the introduction", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("soulfire.introduction.v1", "done"),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play introduction", exact: true }),
  ).toBeVisible();
  expect(await flag(page)).toBe("done");
  await expect(
    page.getByRole("button", { name: "Replay introduction", exact: true }),
  ).toHaveCount(0);
});

test("successful partial playback persists Replay on return while a failed attempt remains Play", async ({
  page,
}) => {
  await page.route("**/audio/welcome-kokoro-heart.m4a", (r) => r.abort());
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play introduction", exact: true })
    .click();
  await expect(page.locator(".intro-error")).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("soulfire.introduction.played.v1"),
    ),
  ).toBeNull();
  await expect(
    page.getByRole("button", { name: "Play introduction", exact: true }),
  ).toBeVisible();
  await page.unroute("**/audio/welcome-kokoro-heart.m4a");
  await page.reload();
  await page
    .getByRole("button", { name: "Play introduction", exact: true })
    .click();
  await expect
    .poll(() => intro(page).evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(0.1);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("soulfire.introduction.played.v1"),
    ),
  ).toBe("yes");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Replay introduction", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play introduction", exact: true }),
  ).toHaveCount(0);
});
