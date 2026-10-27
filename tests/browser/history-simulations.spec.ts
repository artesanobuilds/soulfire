import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { simulateVoice } from "./helpers/simulated-voice";
test.beforeEach(async ({ page, request }) => {
  test.skip(
    !process.env.SOULFIRE_TEST_URL?.includes(":3101"),
    "History mutation checks require the isolated credential-free server.",
  );
  expect((await (await request.get("/api/status")).json()).configured).toBe(
    false,
  );
  await page.addInitScript(() =>
    localStorage.setItem("soulfire.ambient.enabled", "off"),
  );
  await page.route("**/api/memory", (r) =>
    r.fulfill({ json: { revision: 0, memory: null } }),
  );
});
test.afterEach(async ({ page, baseURL }) => {
  if (!process.env.SOULFIRE_TEST_URL?.includes(":3101")) return;
  const r = await page.request.get("/api/history");
  if (!r.ok()) return;
  const data = await r.json();
  for (const s of data.sessions || [])
    await page.request.delete("/api/history", {
      headers: { Origin: baseURL! },
      data: { id: s.id, confirm: true },
    });
});
async function enable(page: Page) {
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page
    .getByLabel(
      "Save future submitted text and final voice transcripts on this Mac.",
    )
    .check();
  await page
    .getByRole("button", { name: "Start saving future turns", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("History on");
  const sessions = (await (await page.request.get("/api/history")).json())
    .sessions;
  await page.getByRole("button", { name: "Close dialog" }).click();
  return sessions[0].id as string;
}
async function studio(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Simulations", exact: true }).click();
  await page
    .getByLabel(
      "Save this synthetic run locally for review and feedback (30 days).",
    )
    .check();
}

test("opt-in captures only new text and final voice events, supports feedback/export/delete", async ({
  page,
}, info) => {
  await simulateVoice(page);
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("Unsubmitted synthetic private draft.");
  const id = await enable(page);
  expect(
    (await (await page.request.get("/api/history?id=" + id)).json()).events,
  ).toHaveLength(0);
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("Synthetic submitted text.");
  await page
    .getByRole("button", { name: "Send & find a practice", exact: true })
    .click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "not connected",
  );
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Synthetic submitted text.",
  );
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const w = window as unknown as {
      __voiceTest: { emit: (x: unknown) => void };
    };
    w.__voiceTest.emit({
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "synthetic-user-1",
      transcript: "Synthetic final voice user.",
    });
    const reply = {
      type: "response.output_audio_transcript.done",
      item_id: "synthetic-guide-1",
      response_id: "resp_fixture",
      transcript: "Synthetic guide response.",
    };
    w.__voiceTest.emit(reply);
    w.__voiceTest.emit(reply);
  });
  await expect
    .poll(async () => {
      const d = await (await page.request.get("/api/history?id=" + id)).json();
      return d.events.filter((e: { role: string }) => e.role === "assistant")
        .length;
    })
    .toBe(1);
  await page.getByRole("button", { name: "End voice", exact: true }).click();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page.locator(".history-list button").first().click();
  await expect(page.locator(".history-detail")).toContainText(
    "Synthetic guide response.",
  );
  await expect(page.locator(".history-detail")).toContainText(
    "playback evidence unavailable",
  );
  await page.getByLabel(/Assessment for response/).selectOption("spot-on");
  await page
    .getByLabel(/Feedback note for response/)
    .fill("Synthetic: concise and useful.");
  await page
    .getByRole("button", { name: "Save feedback", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Feedback saved.");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export this conversation", exact: true })
    .click();
  const file = await download;
  const content = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(JSON.stringify(content)).not.toContain(
    "Unsubmitted synthetic private draft",
  );
  expect(
    content.events.filter((e: { role: string }) => e.role === "assistant")[0]
      .feedback.rating,
  ).toBe("spot-on");
  expect(content.session).not.toHaveProperty("owner");
  await page.screenshot({
    path: info.outputPath("history-review.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete this conversation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep conversation", exact: true })
    .click();
  await expect(page.locator(".history-detail")).toBeVisible();
  await page
    .getByRole("button", { name: "Delete this conversation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm delete conversation", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Conversation and feedback deleted.",
  );
  expect((await page.request.get("/api/history?id=" + id)).status()).toBe(404);
  await page.reload();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("History off");
});

test("stopping history prevents later voice writes and new text capture without affecting drafts", async ({
  page,
  baseURL,
}) => {
  await simulateVoice(page);
  const id = await enable(page);
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("Synthetic retained draft.");
  await page.getByRole("button", { name: "Stop saving", exact: true }).click();
  await expect(page.locator(".history-capture")).toContainText("History off");
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Synthetic retained draft.",
  );
  const late = await page.request.post("/api/history/events", {
    headers: { Origin: baseURL! },
    data: {
      sessionId: id,
      events: [
        {
          eventKey: "late",
          turnKey: "late",
          kind: "message",
          channel: "voice",
          role: "user",
          text: "Synthetic late voice.",
          clientOrder: 1,
        },
      ],
    },
  });
  expect(late.status()).toBe(409);
  let sent: unknown;
  await page.route("**/api/companion", (r) => {
    sent = r.request().postDataJSON();
    return r.fulfill({
      json: {
        reply: {
          kind: "conversation",
          message: "Synthetic reply",
          exercise: null,
        },
      },
    });
  });
  await page
    .getByRole("button", { name: "Send & find a practice", exact: true })
    .click();
  await expect.poll(() => !!sent).toBe(true);
  expect(sent).not.toHaveProperty("history");
});

async function monitorMedia(page: Page) {
  await page.addInitScript(() => {
    const media: HTMLAudioElement[] = [];
    Object.defineProperty(window, "__simulationAudio", { value: media });
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      constructor(src?: string) {
        super(src);
        media.push(this);
        this.playbackRate = 8;
      }
    };
    let mic = 0;
    Object.defineProperty(window, "__simulationMic", { get: () => mic });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        mic++;
        throw Error("No microphone allowed in simulation");
      },
    });
  });
}

test("witnessed text alternates four saved turns, launches once, and opens feedback review", async ({
  page,
}, info) => {
  await monitorMedia(page);
  await studio(page);
  let creates = 0;
  page.on("request", (r) => {
    if (
      r.url().endsWith("/api/simulations") &&
      r.method() === "POST" &&
      r.postDataJSON().action === "create"
    )
      creates++;
  });
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .evaluate((el) => {
      (el as HTMLButtonElement).click();
      (el as HTMLButtonElement).click();
    });
  await expect(page.locator(".simulation-status")).toContainText("Completed");
  expect(creates).toBe(1);
  await expect(page.locator(".simulation-turns li")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => (window as unknown as { __simulationMic: number }).__simulationMic,
    ),
  ).toBe(0);
  await page.screenshot({
    path: info.outputPath("witness-text.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Review and rate this run", exact: true })
    .click();
  await expect(page.locator(".history-detail")).toContainText("Synthetic");
  await expect(page.getByLabel(/Assessment for response/)).toHaveCount(2);
});

test("witnessed voice decodes distinct fixture tracks, pauses/stops audio, and replays without new jobs", async ({
  page,
}, info) => {
  await monitorMedia(page);
  await studio(page);
  await page
    .getByLabel("Simulation mode", { exact: true })
    .selectOption("voice");
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .click();
  await expect(
    page.locator(".simulation-turns [data-speaking=true]"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await expect(page.locator(".simulation-status")).toContainText("Paused");
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __simulationAudio: HTMLAudioElement[] }
      ).__simulationAudio
        .filter((a) => a.src.includes("/audio/simulations/"))
        .every((a) => a.paused),
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Resume simulation", exact: true })
    .click();
  await expect(page.locator(".simulation-status")).toContainText("Completed", {
    timeout: 25000,
  });
  const sources = await page.evaluate(() =>
    (
      window as unknown as { __simulationAudio: HTMLAudioElement[] }
    ).__simulationAudio.map((a) => a.src),
  );
  expect(sources.some((s) => s.includes("first-presentation-1.m4a"))).toBe(
    true,
  );
  expect(sources.some((s) => s.includes("first-presentation-2.m4a"))).toBe(
    true,
  );
  await page.screenshot({
    path: info.outputPath("witness-voice.png"),
    fullPage: true,
  });
  const before = (await (await page.request.get("/api/simulations")).json())
    .runs.length;
  await page
    .getByRole("button", { name: "Replay saved turns", exact: true })
    .click();
  await expect(
    page.locator(".simulation-turns [data-speaking=true]"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Stop simulation", exact: true })
    .click();
  expect(
    (await (await page.request.get("/api/simulations")).json()).runs.length,
  ).toBe(before);
  expect(
    await page.evaluate(
      () => (window as unknown as { __simulationMic: number }).__simulationMic,
    ),
  ).toBe(0);
});

test("background voice stays silent and reload exposes saved state rather than restarting", async ({
  page,
}) => {
  await monitorMedia(page);
  await studio(page);
  await page
    .getByLabel("Simulation mode", { exact: true })
    .selectOption("voice");
  await page
    .getByLabel("Simulation delivery", { exact: true })
    .selectOption("background");
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect
    .poll(async () => {
      const d = await (await page.request.get("/api/simulations")).json();
      return d.runs[0]?.status;
    })
    .toBe("completed");
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __simulationAudio: HTMLAudioElement[] }
      ).__simulationAudio.some((a) => a.src.includes("/audio/simulations/")),
    ),
  ).toBe(false);
  await page.reload();
  await page.getByRole("button", { name: "Simulations", exact: true }).click();
  await page.locator(".simulation-panel .history-list button").first().click();
  await expect(page.locator(".simulation-status")).toContainText(
    "Nothing is playing",
  );
  await expect(page.locator(".simulation-turns li")).toHaveCount(4);
});

test("reload during witnessed audio does not restart or leave playback running", async ({
  page,
}) => {
  await monitorMedia(page);
  await studio(page);
  await page
    .getByLabel("Simulation mode", { exact: true })
    .selectOption("voice");
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .click();
  await expect(
    page.locator(".simulation-turns [data-speaking=true]"),
  ).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Simulations", exact: true }).click();
  await page.locator(".simulation-panel .history-list button").first().click();
  await expect(page.locator(".simulation-status")).toContainText(
    "No job is running in this tab",
  );
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __simulationAudio: HTMLAudioElement[] }
      ).__simulationAudio.some((a) => a.src.includes("/audio/simulations/")),
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Stop unfinished run", exact: true })
    .click();
  await expect(page.locator(".simulation-status")).toContainText("Stopped");
});
