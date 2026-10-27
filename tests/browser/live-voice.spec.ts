import { test, expect, type Page } from "@playwright/test";
async function setup(
  page: Page,
  options = { deny: false, blocked: false, configured: true },
) {
  await page.addInitScript(({ deny, blocked }) => {
    const contexts: AudioContext[] = [];
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor() {
        super();
        contexts.push(this);
      }
    };
    const tracks: MediaStreamTrack[] = [];
    const sent: string[] = [];
    let input: GainNode, output: GainNode;
    let onMessage: ((event: { data: string }) => void) | null = null;
    let onOpen: (() => void) | null = null;
    let late: ((event: { data: string }) => void) | null = null;
    let blocks = blocked,
      requests = 0;
    const stream = (direction: "input" | "output") => {
      const context = new AudioContext();
      const source = context.createOscillator(),
        gain = context.createGain(),
        destination = context.createMediaStreamDestination();
      gain.gain.value = 0;
      source.connect(gain).connect(destination);
      source.start();
      void context.resume();
      if (direction === "input") input = gain;
      else output = gain;
      const track = destination.stream.getAudioTracks()[0];
      tracks.push(track);
      const stop = track.stop.bind(track);
      track.stop = () => {
        stop();
        source.disconnect();
        gain.disconnect();
        if (context.state !== "closed") void context.close();
      };
      return destination.stream;
    };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        requests++;
        if (deny) throw new DOMException("Denied", "NotAllowedError");
        return stream("input");
      },
    });
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      play() {
        if (this.srcObject && blocks)
          return Promise.reject(new DOMException("Blocked", "NotAllowedError"));
        return super.play();
      }
    };
    class Peer {
      connectionState = "new";
      ontrack: ((e: { streams: MediaStream[] }) => void) | null = null;
      onconnectionstatechange: (() => void) | null = null;
      dc = {
        readyState: "open",
        onopen: null as (() => void) | null,
        onmessage: null as ((e: { data: string }) => void) | null,
        onerror: null as (() => void) | null,
        onclose: null as (() => void) | null,
        send: (value: string) => {
          sent.push(value);
          if (JSON.parse(value).type === "output_audio_buffer.clear" && output)
            output.gain.value = 0;
        },
        close: () => {},
      };
      addTrack() {}
      createDataChannel() {
        return this.dc;
      }
      async createOffer() {
        return { type: "offer", sdp: "v=0 synthetic voice offer only" };
      }
      async setLocalDescription() {}
      async setRemoteDescription() {
        this.connectionState = "connected";
        this.ontrack?.({ streams: [stream("output")] });
        onMessage = this.dc.onmessage;
        late = onMessage;
        onOpen = this.dc.onopen;
        onOpen?.();
        onMessage?.({
          data: JSON.stringify({
            type: "response.created",
            response: { id: "greeting" },
          }),
        });
      }
      close() {
        this.connectionState = "closed";
        tracks.forEach((t) => t.stop());
      }
    }
    Object.defineProperty(window, "RTCPeerConnection", { value: Peer });
    Object.defineProperty(window, "__live", {
      value: {
        sent,
        emit: (event: unknown) => onMessage?.({ data: JSON.stringify(event) }),
        reopen: () => onOpen?.(),
        late: (event: unknown) => late?.({ data: JSON.stringify(event) }),
        input: (value: number) => {
          input.gain.value = value;
        },
        output: (value: number) => {
          output.gain.value = value;
        },
        unblock: () => {
          blocks = false;
        },
        lost: () => {
          tracks[0]?.stop();
          tracks[0]?.dispatchEvent(new Event("ended"));
        },
        snapshot: () => ({
          requests,
          tracks: tracks.map((t) => t.readyState),
          contexts: contexts.map((c) => c.state),
          sent,
        }),
      },
    });
  }, options);
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: options.configured } }),
  );
  await page.route("**/api/realtime", (r) =>
    r.fulfill({ body: "v=0 synthetic answer", contentType: "application/sdp" }),
  );
  await page.route("**/api/companion", (r) => r.abort());
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
}
async function action(page: Page, method: string, value?: unknown) {
  return page.evaluate(
    ({ method, value }) => {
      const state = (
        window as unknown as {
          __live: Record<string, (x?: unknown) => unknown>;
        }
      ).__live;
      return state[method](value);
    },
    { method, value },
  );
}
async function start(page: Page, name?: string) {
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  if (name)
    await page
      .getByLabel("What should I call you?", { exact: false })
      .fill(name);
  await page
    .getByRole("button", { name: "Allow microphone & start", exact: true })
    .click();
  await expect(
    page.getByText("Live voice · microphone on", { exact: true }),
  ).toBeVisible();
}
const greetings = (snapshot: unknown) =>
  (snapshot as { sent: string[] }).sent
    .map((x) => JSON.parse(x))
    .filter((e) => e.type === "response.create");
test("unconfigured preview explains disabled voice without requesting capture", async ({
  page,
}) => {
  await setup(page, { deny: false, blocked: false, configured: false });
  await expect(
    page.getByRole("button", { name: "Live voice", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Voice is unavailable in this preview.", { exact: false }),
  ).toBeVisible();
  expect(
    ((await action(page, "snapshot")) as { requests: number }).requests,
  ).toBe(0);
});
test("startup greets once, repeated open is inert, and a new manual start greets once", async ({
  page,
}) => {
  await setup(page);
  await start(page, "Casey");
  await action(page, "reopen");
  let responses = greetings(await action(page, "snapshot"));
  expect(responses).toHaveLength(1);
  expect(responses[0].response.instructions).toContain("Hi, Casey.");
  expect(responses[0].response.input).toEqual([]);
  await page.getByRole("button", { name: "End voice", exact: true }).click();
  await action(page, "late", {
    type: "response.output_audio_transcript.done",
    item_id: "late",
    transcript: "STALE",
  });
  await expect(page.locator("body")).not.toContainText("STALE");
  await start(page);
  responses = greetings(await action(page, "snapshot"));
  expect(responses).toHaveLength(2);
});
test("real local input levels animate capture, output playback drives speaking, and barge-in clears it", async ({
  page,
}) => {
  await setup(page);
  await start(page);
  await expect(
    page.getByText("Soulfire is thinking", { exact: true }),
  ).toBeVisible();
  await action(page, "input", 0.3);
  await expect
    .poll(() =>
      page
        .locator('[aria-label="Microphone input level"] i')
        .evaluateAll((b) =>
          Math.max(
            ...b.map((e) => parseFloat((e as HTMLElement).style.height) || 4),
          ),
        ),
    )
    .toBeGreaterThan(8);
  await expect(page.getByText("Hearing you", { exact: true })).toBeVisible();
  await action(page, "input", 0);
  await action(page, "emit", { type: "input_audio_buffer.speech_stopped" });
  await action(page, "output", 0.3);
  await action(page, "emit", { type: "output_audio_buffer.started" });
  await expect(
    page.getByText("Soulfire is speaking", { exact: true }),
  ).toBeVisible();
  await action(page, "emit", { type: "input_audio_buffer.speech_started" });
  await expect(
    page.getByText("Soulfire is speaking", { exact: true }),
  ).toHaveCount(0);
  await action(page, "emit", { type: "input_audio_buffer.speech_stopped" });
  await page.getByRole("button", { name: "Interrupt", exact: true }).click();
  await expect(
    page.getByText("Interrupted · ready when you are", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mute mic", exact: true }).click();
  await expect(
    page.getByText("Microphone muted", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Microphone input level" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "End voice", exact: true }).click();
  await expect
    .poll(async () => {
      const s = (await action(page, "snapshot")) as {
        tracks: string[];
        contexts: string[];
      };
      return (
        s.tracks.every((t) => t === "ended") &&
        s.contexts.every((c) => c === "closed")
      );
    })
    .toBe(true);
});
test("blocked playback does not claim speech; gesture retry resumes actual output", async ({
  page,
}) => {
  await setup(page, { deny: false, blocked: true, configured: true });
  await start(page);
  await action(page, "emit", { type: "output_audio_buffer.started" });
  await expect(
    page.getByRole("button", { name: "Retry audio", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Soulfire is speaking", { exact: true }),
  ).toHaveCount(0);
  await action(page, "unblock");
  await action(page, "output", 0.3);
  await page.getByRole("button", { name: "Retry audio", exact: true }).click();
  await expect(
    page.getByText("Soulfire is speaking", { exact: true }),
  ).toBeVisible();
  await action(page, "output", 0);
  await action(page, "emit", { type: "output_audio_buffer.stopped" });
  await expect(
    page.getByText("Soulfire is speaking", { exact: true }),
  ).toHaveCount(0);
});
test("permission denial and microphone loss never leave a listening meter", async ({
  page,
}) => {
  await setup(page, { deny: true, blocked: false, configured: true });
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await page
    .getByRole("button", { name: "Allow microphone & start", exact: true })
    .click();
  await expect(page.locator("body")).toContainText(
    "Microphone permission was denied",
  );
  await expect(
    page.getByRole("img", { name: "Microphone input level" }),
  ).toHaveCount(0);
});
test("reduced motion keeps input truthful and static; device loss releases resources", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page);
  await start(page);
  await action(page, "input", 0.3);
  await expect(page.getByText("Hearing you", { exact: true })).toBeVisible();
  const heights = await page
    .locator('[aria-label="Microphone input level"] i')
    .evaluateAll((b) => b.map((e) => (e as HTMLElement).style.height));
  expect(heights.every((h) => h === "4px")).toBe(true);
  await action(page, "lost");
  await expect(
    page.getByRole("button", { name: "Live voice", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Microphone input level" }),
  ).toHaveCount(0);
});

test("returning greeting recognizes only the submitted conversation without quoting private details", async ({
  page,
}) => {
  await setup(page);
  await start(page);
  await action(page, "emit", {
    type: "conversation.item.input_audio_transcription.completed",
    item_id: "shared",
    transcript: "PRIVATE-SHARED-CONTEXT",
  });
  await page.getByRole("button", { name: "End voice", exact: true }).click();
  await start(page);
  const responses = greetings(await action(page, "snapshot"));
  expect(responses[1].response.instructions).toContain(
    "Welcome back to our conversation",
  );
  expect(responses[1].response.instructions).not.toContain(
    "PRIVATE-SHARED-CONTEXT",
  );
  expect(responses[1].response.input).toEqual([]);
});
test("a stalled response stops capture rather than thinking indefinitely", async ({
  page,
}) => {
  await setup(page);
  await page.clock.install();
  await start(page);
  await page.clock.fastForward(46000);
  await expect(page.locator("body")).toContainText("Voice response timed out");
  await expect(
    page.getByRole("button", { name: "Live voice", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Microphone input level" }),
  ).toHaveCount(0);
});
