import { test, expect } from "@playwright/test";
// Protocol/permission simulation only: no physical microphone or provider audio is used.
async function simulate(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const state = {
      stops: 0,
      sent: [] as string[],
      enabled: true,
      closed: false,
      emit: (_event: unknown) => {
        void _event;
      },
    };
    Object.defineProperty(window, "__voiceTest", { value: state });
    const track = {
      stop: () => {
        state.stops++;
      },
      get enabled() {
        return state.enabled;
      },
      set enabled(v: boolean) {
        state.enabled = v;
      },
    };
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => stream,
      configurable: true,
    });
    class Recorder {
      state = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onstart: (() => void) | null = null;
      start() {
        this.state = "recording";
        this.onstart?.();
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["fake test audio"], { type: "audio/webm" }),
        });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", { value: Recorder });
    class Peer {
      connectionState = "new";
      onconnectionstatechange: (() => void) | null = null;
      ontrack: null = null;
      dc = {
        readyState: "open",
        onopen: null as (() => void) | null,
        onmessage: null as ((e: { data: string }) => void) | null,
        send: (text: string) => state.sent.push(text),
        close: () => {},
      };
      addTrack() {}
      createDataChannel() {
        state.emit = (e) => this.dc.onmessage?.({ data: JSON.stringify(e) });
        return this.dc;
      }
      async createOffer() {
        return { type: "offer", sdp: "v=0 test SDP and audio offer" };
      }
      async setLocalDescription() {}
      async setRemoteDescription() {
        this.connectionState = "connected";
        this.dc.onopen?.();
      }
      close() {
        state.closed = true;
        this.connectionState = "closed";
      }
    }
    Object.defineProperty(window, "RTCPeerConnection", { value: Peer });
  });
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: true } }),
  );
  await page.route("**/api/realtime", (r) =>
    r.fulfill({ body: "v=0 simulated answer", contentType: "application/sdp" }),
  );
  await page.route("**/api/transcribe", (r) =>
    r.fulfill({ json: { text: "A dictated thought to edit." } }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
}
const state = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const s = (
      window as unknown as {
        __voiceTest: {
          stops: number;
          sent: string[];
          enabled: boolean;
          closed: boolean;
        };
      }
    ).__voiceTest;
    return {
      stops: s.stops,
      sent: s.sent,
      enabled: s.enabled,
      closed: s.closed,
    };
  });
test("dictation remains editable and targets a private field without model submission", async ({
  page,
}) => {
  await simulate(page);
  let modelCalls = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/companion")) modelCalls++;
  });
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page.getByRole("button", { name: "Try this practice" }).click();
  await page
    .getByRole("button", { name: "Show all prompts", exact: true })
    .click();
  await page.locator(".companion-disclosure:visible > summary").click();
  await page.getByLabel("Dictation destination").selectOption("feeling");
  await page.getByRole("button", { name: "Dictate", exact: true }).click();
  await expect(
    page.getByText(/audio is sent to OpenAI for transcription/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await page.getByRole("button", { name: "Stop & transcribe" }).click();
  await expect(
    page.getByLabel("Name what is here", { exact: true }),
  ).toHaveValue("A dictated thought to edit.");
  await page
    .getByLabel("Name what is here", { exact: true })
    .fill("I edited my private thought.");
  await expect(page.locator(".draft-review:visible")).toContainText(
    "private practice",
  );
  expect(modelCalls).toBe(0);
  expect((await state(page)).stops).toBeGreaterThan(0);
});
test("live protocol merges transcripts once, interrupts, mutes and cleans up for quiet", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("soulfire.ambient.enabled", "off");
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
  await simulate(page);
  await page.getByText("Sound off", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play sound", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Play sound", exact: true }).click();
  await expect(page.getByText("Sound on", { exact: true })).toBeVisible();
  await page.getByText("Sound on", { exact: true }).click();
  let handshake = "";
  page.on("request", (r) => {
    if (r.url().includes("/api/realtime")) handshake = r.postData() || "";
  });
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page.getByRole("button", { name: "Try this practice" }).click();
  await page
    .getByRole("button", { name: "Show all prompts", exact: true })
    .click();
  await page.locator(".companion-disclosure:visible > summary").click();
  await page
    .getByLabel("Name what is here", { exact: true })
    .fill("NEVER-SEND-PRIVATE");
  await page.getByLabel("Talk this through").fill("UNSENT-CONVERSATION");
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { __ambientAudio: HTMLAudioElement[] }
        ).__ambientAudio.every((a) => a.paused),
      ),
    )
    .toBe(true);
  await page.evaluate(() => {
    const s = (
      window as unknown as { __voiceTest: { emit: (e: unknown) => void } }
    ).__voiceTest;
    for (let i = 0; i < 2; i++)
      s.emit({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "u1",
        transcript: "A spoken thought.",
      });
    s.emit({
      type: "response.output_audio_transcript.done",
      item_id: "a1",
      transcript: "What is yours to prepare?",
    });
  });
  await page.getByText("Our conversation · 2 messages").click();
  await expect(
    page.locator(".transcript p").filter({ hasText: "A spoken thought." }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Interrupt", exact: true }).click();
  await page.getByRole("button", { name: "Mute mic", exact: true }).click();
  expect((await state(page)).enabled).toBe(false);
  await page.getByRole("button", { name: "Unmute mic", exact: true }).click();
  expect((await state(page)).enabled).toBe(true);
  const events = (await state(page)).sent.join("\n");
  expect(events).toContain("response.cancel");
  expect(events).toContain("output_audio_buffer.clear");
  expect(handshake + events).not.toContain("NEVER-SEND-PRIVATE");
  expect(handshake + events).not.toContain("UNSENT-CONVERSATION");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  expect((await state(page)).closed).toBe(true);
  expect((await state(page)).stops).toBeGreaterThan(0);
  await expect(
    page.getByText("Microphone off · companion audio off"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to practice", exact: true })
    .click();
  await expect(
    page.getByLabel("Name what is here", { exact: true }),
  ).toHaveValue("NEVER-SEND-PRIVATE");
  await page.locator(".companion-disclosure:visible > summary").click();
  await expect(page.getByLabel("Talk this through")).toHaveValue(
    "UNSENT-CONVERSATION",
  );
});
test("explicit danger transcript interrupts voice with an application safety notice", async ({
  page,
}) => {
  await simulate(page);
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    (
      window as unknown as { __voiceTest: { emit: (e: unknown) => void } }
    ).__voiceTest.emit({
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "risk-1",
      transcript: "I have a suicide plan.",
    });
  });
  await expect(page.getByRole("dialog")).toContainText("Safety notice:");
  expect((await state(page)).stops).toBeGreaterThan(0);
  expect((await state(page)).closed).toBe(true);
});

for (const event of [
  {
    type: "error",
    error: { code: "server_error", message: "PRIVATE-PROVIDER-DETAIL" },
  },
  { type: "error", error: { code: "future_provider_error" } },
  { type: "response.done", response: { status: "failed" } },
  { type: "conversation.item.input_audio_transcription.failed" },
])
  test(`fatal voice event releases microphone: ${JSON.stringify(event)}`, async ({
    page,
  }) => {
    await simulate(page);
    await page.getByRole("button", { name: "Live voice", exact: true }).click();
    await page
      .getByRole("button", { name: "Allow microphone & start" })
      .click();
    await expect(
      page.getByText("Live voice · microphone on", { exact: true }),
    ).toBeVisible();
    await page.evaluate(
      (event) =>
        (
          window as unknown as { __voiceTest: { emit: (e: unknown) => void } }
        ).__voiceTest.emit(event),
      event,
    );
    await expect(
      page.getByRole("button", { name: "Live voice", exact: true }),
    ).toBeVisible();
    expect((await state(page)).closed).toBe(true);
    expect((await state(page)).stops).toBeGreaterThan(0);
    await expect(page.locator("body")).not.toContainText(
      "PRIVATE-PROVIDER-DETAIL",
    );
  });
test("cancel race remains live; stale provider callbacks after stop are ignored", async ({
  page,
}) => {
  await simulate(page);
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { __voiceTest: { emit: (e: unknown) => void } }
    ).__voiceTest.emit({
      type: "error",
      error: { code: "response_cancel_not_active" },
    }),
  );
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "End voice", exact: true }).click();
  await page.evaluate(() =>
    (
      window as unknown as { __voiceTest: { emit: (e: unknown) => void } }
    ).__voiceTest.emit({
      type: "response.output_audio_transcript.done",
      item_id: "late",
      transcript: "STALE-TURN",
    }),
  );
  await expect(page.locator("body")).not.toContainText("STALE-TURN");
});

test("a connected session survives the setup deadline, and offline releases it", async ({
  page,
}) => {
  await simulate(page);
  await page.clock.install();
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(26000);
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(
    page.getByRole("button", { name: "Live voice", exact: true }),
  ).toBeVisible();
  expect((await state(page)).closed).toBe(true);
  expect((await state(page)).stops).toBeGreaterThan(0);
});
test("status setup timeout returns to retryable controls without microphone access", async ({
  page,
}) => {
  await simulate(page);
  await page.route("**/api/status", () => {});
  await page.clock.install();
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await expect(
    page.getByText("Connecting voice…", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(26000);
  await expect(
    page.getByRole("button", { name: "Live voice", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).toContainText("Voice setup timed out");
});
test("fatal voice error preserves opt-in history final turns and ends the session once", async ({
  page,
  request,
  baseURL,
}) => {
  test.skip(process.env.SOULFIRE_TEST_ISOLATED !== "1", "Requires an explicitly isolated data directory and no provider key.");
  expect((await (await request.get("/api/status")).json()).configured).toBe(
    false,
  );
  await simulate(page);
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
  const id = sessions[0].id;
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const s = (
      window as unknown as { __voiceTest: { emit: (e: unknown) => void } }
    ).__voiceTest;
    const turn = {
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "history-final",
      transcript: "Synthetic final voice turn.",
    };
    s.emit(turn);
    s.emit(turn);
    s.emit({
      type: "error",
      error: { code: "server_error", message: "NEVER-STORE-PROVIDER-PAYLOAD" },
    });
  });
  await expect(
    page.getByRole("button", { name: "Live voice", exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const detail = await (
        await page.request.get("/api/history?id=" + id)
      ).json();
      return detail.events.filter((e: { kind: string }) => e.kind === "ended")
        .length;
    })
    .toBe(1);
  const detail = await (await page.request.get("/api/history?id=" + id)).json();
  expect(
    detail.events.filter((e: { kind: string }) => e.kind === "message"),
  ).toHaveLength(1);
  expect(JSON.stringify(detail)).not.toContain("NEVER-STORE-PROVIDER-PAYLOAD");
  await page.request.delete("/api/history", {
    headers: { Origin: baseURL! },
    data: { id, confirm: true },
  });
});
