import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
// Run scripts/verify-synthetic-voice.ts --synthetic-only first. Model HTTP turns below are mocked;
// synthesis, SQLite audio caching, authenticated serving and browser decoding are real local paths.
test.beforeEach(async ({ page, request }) => {
  test.skip(
    !process.env.SOULFIRE_TEST_URL?.includes(":3101"),
    "Synthetic-only isolated server required",
  );
  expect((await (await request.get("/api/status")).json()).configured).toBe(
    false,
  );
  await page.addInitScript(() => {
    localStorage.setItem("soulfire.ambient.enabled", "off");
    const media: HTMLAudioElement[] = [];
    Object.defineProperty(window, "__dynamicMedia", { value: media });
    const Original = window.Audio;
    window.Audio = class extends Original {
      constructor(src?: string) {
        super(src);
        this.playbackRate = 4;
        media.push(this);
      }
    };
  });
  await page.route("**/api/memory", (r) =>
    r.fulfill({ json: { revision: 0, memory: null } }),
  );
  for (const path of ["companion", "transcribe", "realtime"])
    await page.route("**/api/" + path, (r) => r.abort());
});
test("dynamic voice plays both cached Kokoro voices, stops and replays without generating extra model turns", async ({
  page,
  context,
}, info) => {
  const fixture = JSON.parse(
    await readFile(
      "/tmp/soulfire-dynamic-voice-validation-20261024/browser-fixture.json",
      "utf8",
    ),
  );
  await context.addCookies([
    {
      name: "soulfire_history",
      value: fixture.cookie,
      url: "http://127.0.0.1:3101",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  let steps = 0,
    creates = 0;
  await page.route("**/api/simulations", async (route) => {
    const request = route.request();
    if (request.method() === "GET")
      return route.fulfill({
        json: {
          runs: [],
          liveAvailable: true,
          localSpeechAvailable: true,
          serverJobs: [],
        },
      });
    const body = request.postDataJSON();
    if (body.action === "create") {
      creates++;
      expect(body.config.allowPaid).toBe(true);
      expect(body.config.mode).toBe("voice");
      return route.fulfill({
        json: {
          run: {
            ...fixture.run,
            config: body.config,
            cursor: 0,
            status: "ready",
          },
        },
      });
    }
    if (body.action === "step") {
      const cursor = body.cursor;
      steps++;
      expect(cursor).toBe(steps - 1);
      return route.fulfill({
        json: {
          run: {
            ...fixture.run,
            config: { ...fixture.run.config, delivery: "witnessed" },
            cursor: cursor + 1,
            status: cursor === 3 ? "completed" : "ready",
          },
          message: fixture.messages[cursor],
          audio: null,
          provenance:
            "Mocked provider text + actual local synthesized playback",
        },
      });
    }
    return route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Simulations", exact: true }).click();
  await page
    .getByLabel("Simulation mode", { exact: true })
    .selectOption("voice");
  await page
    .getByLabel("Simulation engine", { exact: true })
    .selectOption("live-text");
  await page
    .getByLabel(
      "Save this synthetic run locally for review and feedback (30 days).",
    )
    .check();
  const launch = page.getByRole("button", {
    name: "Launch simulation",
    exact: true,
  });
  await expect(launch).toBeDisabled();
  await page.getByLabel(/Allow up to four paid text requests/).check();
  await launch.click();
  await expect(page.locator(".simulation-status")).toContainText("Completed", {
    timeout: 30000,
  });
  await expect(page.locator(".simulation-turns li")).toHaveCount(4);
  expect(creates).toBe(1);
  expect(steps).toBe(4);
  const audio = await page.evaluate(() =>
    (
      window as unknown as { __dynamicMedia: HTMLAudioElement[] }
    ).__dynamicMedia.map((a) => ({
      url: a.src,
      duration: a.duration,
      ended: a.ended,
    })),
  );
  expect(
    audio.filter((a) => a.url.includes("/api/simulations/audio")).length,
  ).toBe(4);
  expect(
    audio
      .filter((a) => a.url.includes("/api/simulations/audio"))
      .every((a) => a.duration > 0 && a.ended),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Replay saved turns", exact: true })
    .click();
  await expect(
    page.locator(".simulation-turns [data-speaking=true]"),
  ).toHaveCount(1);
  await expect
    .poll(async () => {
      const turn = await page
        .locator(".simulation-turns [data-speaking=true]")
        .boundingBox();
      const controls = await page.locator(".simulation-controls").boundingBox();
      const dialog = await page.getByRole("dialog").boundingBox();
      const stop = await page
        .getByRole("button", { name: "Stop simulation", exact: true })
        .boundingBox();
      return (
        !!turn &&
        !!controls &&
        !!dialog &&
        !!stop &&
        turn.y >= controls.y + controls.height - 1 &&
        stop.y >= dialog.y &&
        stop.y + stop.height <= dialog.y + dialog.height
      );
    })
    .toBe(true);
  await page.screenshot({
    path: info.outputPath("dynamic-witness.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Stop simulation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Replay saved turns", exact: true }),
  ).toBeVisible();
  expect(steps).toBe(4);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __dynamicMedia: HTMLAudioElement[] }
      ).__dynamicMedia.every((a) => a.paused),
    ),
  ).toBe(true);
});
test("background fixture finishes on server without client step requests or an open page", async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto("/");
  await page.request.get("/api/simulations");
  const headers = { Origin: baseURL! };
  const created = await page.request.post("/api/simulations", {
    headers,
    data: {
      action: "create",
      consent: true,
      config: {
        scenario: "gentle-boundary",
        mode: "voice",
        delivery: "background",
        engine: "fixture",
        allowPaid: false,
        maxCostUsd: 0,
      },
    },
  });
  expect(created.ok()).toBe(true);
  const { run } = await created.json();
  try {
    const start = await page.request.post("/api/simulations", {
      headers,
      data: { action: "start", id: run.id },
    });
    expect(start.ok()).toBe(true);
    await page.close();
    await expect
      .poll(async () => {
        const r = await context.request.get(
          baseURL + "/api/simulations?id=" + run.id,
        );
        return (await r.json()).run.status;
      })
      .toBe("completed");
    const read = await (
      await context.request.get(baseURL + "/api/simulations?id=" + run.id)
    ).json();
    expect(read.messages.length).toBe(4);
    expect(read.serverActive).toBe(null);
  } finally {
    await context.request.delete(baseURL + "/api/history", {
      headers,
      data: { id: run.id, confirm: true },
    });
  }
});

test("closing a replayed background run stops its audio without leaving a job", async ({
  page,
  baseURL,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Simulations", exact: true }).click();
  await page
    .getByLabel("Simulation mode", { exact: true })
    .selectOption("voice");
  await page
    .getByLabel("Simulation delivery", { exact: true })
    .selectOption("background");
  await page
    .getByLabel(
      "Save this synthetic run locally for review and feedback (30 days).",
    )
    .check();
  try {
    await page
      .getByRole("button", { name: "Launch simulation", exact: true })
      .click();
    await expect(page.locator(".simulation-status")).toContainText("Completed");
    await page
      .getByRole("button", { name: "Replay saved turns", exact: true })
      .click();
    await expect(
      page.locator(".simulation-turns [data-speaking=true]"),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as unknown as { __dynamicMedia: HTMLAudioElement[] }
          ).__dynamicMedia.every((a) => a.paused),
        ),
      )
      .toBe(true);
    const state = await (await page.request.get("/api/simulations")).json();
    expect(state.serverJobs).toEqual([]);
  } finally {
    const history = await (await page.request.get("/api/history")).json();
    for (const item of history.sessions)
      await page.request.delete("/api/history", {
        headers: { Origin: baseURL! },
        data: { id: item.id, confirm: true },
      });
  }
});
