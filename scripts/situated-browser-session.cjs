/* eslint-disable @typescript-eslint/no-require-imports -- Node-only CommonJS evaluation harness. */
const fs = require("node:fs");
const { voiceContract } = require("./situated-voice-contract.cjs");
const { installVoiceProbe } = require("./situated-voice-probe.cjs");
function installMockPeer({ expected, failure }) {
  let oscillator, gain, context, stream;
  const output = () => {
    context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    oscillator = context.createOscillator();
    gain = context.createGain();
    gain.gain.value = 0;
    oscillator.connect(gain).connect(destination);
    oscillator.start();
    void context.resume();
    stream = destination.stream;
    return stream;
  };
  class Channel extends EventTarget {
    readyState = "connecting";
    onopen = null;
    onmessage = null;
    emit(event) {
      const e = new MessageEvent("message", { data: JSON.stringify(event) });
      this.dispatchEvent(e);
      this.onmessage?.(e);
    }
    open() {
      this.readyState = "open";
      this.dispatchEvent(new Event("open"));
      this.onopen?.();
    }
    send(raw) {
      const event = JSON.parse(raw);
      if (event.type === "response.create")
        setTimeout(() => this.answer("welcome", { purpose: "welcome" }), 20);
    }
    answer(id, metadata = {}) {
      this.emit({ type: "response.created", response: { id, metadata } });
      gain.gain.value = 0.08;
      setTimeout(() => {
        gain.gain.value = 0;
        this.emit({
          type: "response.output_audio_transcript.done",
          response_id: id,
          item_id: id,
          transcript: "Synthetic protocol fixture, not model output.",
        });
        this.emit({
          type: "response.done",
          response: {
            id,
            status: "completed",
            output: [],
            usage: { synthetic: true },
          },
        });
      }, 180);
    }
    close() {
      this.readyState = "closed";
    }
  }
  class Peer extends EventTarget {
    connectionState = "new";
    ontrack = null;
    onconnectionstatechange = null;
    channel = new Channel();
    addTrack() {}
    createDataChannel() {
      return this.channel;
    }
    async createOffer() {
      return {
        type: "offer",
        sdp: "v=0 synthetic offer only for isolated regression",
      };
    }
    async setLocalDescription() {}
    async setRemoteDescription() {
      const s = output(),
        event = new Event("track");
      event.streams = [s];
      event.track = s.getAudioTracks()[0];
      this.dispatchEvent(event);
      this.ontrack?.(event);
      this.connectionState = "connected";
      setTimeout(() => {
        this.channel.open();
        const initial = structuredClone(expected);
        if (failure === "model-drift") initial.model = "wrong";
        if (failure === "pending") {
          initial.audio.input.transcription = null;
          initial.audio.input.turn_detection.threshold = 0.5;
          initial.audio.input.turn_detection.silence_duration_ms = 200;
        }
        this.channel.emit({ type: "session.created", session: initial });
        if (failure === "pending")
          setTimeout(
            () =>
              this.channel.emit({ type: "session.updated", session: expected }),
            120,
          );
      }, 100);
      window.__mockGuide = () => this.channel.answer("guide");
    }
    close() {
      if (this.connectionState === "closed") return;
      this.connectionState = "closed";
      this.channel.close();
      try {
        oscillator?.stop();
        stream?.getTracks().forEach((t) => t.stop());
        if (context && context.state !== "closed") void context.close();
      } catch {}
    }
  }
  window.RTCPeerConnection = Peer;
}
async function runVoiceSession(
  browser,
  { url, expected, fixture, offline = false, failure },
) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const result = {
    mode: offline ? "offline-mock" : "native-provider",
    status: "preparing",
    pageErrors: [],
  };
  page.on("pageerror", (e) => result.pageErrors.push(e.message));
  await page.route("**/api/companion", (r) => r.abort());
  await page.route("**/api/transcribe", (r) => r.abort());
  if (offline) {
    await page.route("**/api/status", (r) =>
      r.fulfill({ json: { configured: true } }),
    );
    await page.route("**/api/realtime", (r) =>
      r.fulfill({
        body: "v=0 synthetic answer",
        contentType: "application/sdp",
      }),
    );
    await page.addInitScript(installMockPeer, { expected, failure });
  }
  await page.addInitScript({
    content: `window.__voiceContract = (${voiceContract.toString()}); (${installVoiceProbe.toString()})(${JSON.stringify(expected)});`,
  });
  try {
    await page.goto(url);
    await page
      .getByRole("button", { name: "Begin journey", exact: true })
      .click();
    await page.getByText("Make this space yours", { exact: true }).click();
    const language = /Language preference: ([a-z]+)/.exec(
      expected.instructions,
    )?.[1];
    await page.locator("label.language-label select").selectOption(language);
    await page.getByRole("button", { name: "Live voice", exact: true }).click();
    await page
      .getByLabel("What should I call you?", { exact: false })
      .fill("Taylor");
    await page
      .getByRole("button", { name: "Allow microphone & start", exact: true })
      .click();
    await page.waitForFunction(
      () => window.__voiceEval.ready || window.__voiceEval.errors.length,
      undefined,
      { timeout: 20000 },
    );
    const waitAnswer = async (count) => {
      await page.waitForFunction(
        (count) => {
          const s = window.__voiceEval,
            r = s.responses[count - 1];
          return (
            s.errors.length ||
            (r?.doneAt &&
              s.audio[r.id]?.firstNonSilentAt &&
              performance.now() - (s.lastOutputEnergyAt || 0) > 800)
          );
        },
        count,
        { timeout: 45000 },
      );
      const errors = await page.evaluate(() => window.__voiceEval.errors);
      if (errors.length) throw Error(JSON.stringify(errors));
    };
    await waitAnswer(1);
    await page.evaluate((data) => window.__voiceEval.inject(data), {
      base64: fs.readFileSync(fixture.path).toString("base64"),
      lastNonSilentSeconds: fixture.lastNonSilentSeconds,
    });
    if (offline) await page.evaluate(() => window.__mockGuide());
    await waitAnswer(2);
    result.status = "completed";
  } catch (error) {
    result.status = "failed";
    result.failure = { name: error.name, message: error.message };
    try {
      await page.evaluate(() =>
        window.__voiceEval.stop("Harness stopped session"),
      );
    } catch {}
  }
  try {
    result.evidence = await page.evaluate(() => window.__voiceEval.finish());
  } catch (error) {
    result.captureFailure = error.message;
    result.status = "failed";
  }
  await page
    .getByRole("button", { name: "End voice", exact: true })
    .click({ timeout: 1000 })
    .catch(() => {});
  await context.close();
  return result;
}
module.exports = { runVoiceSession };
