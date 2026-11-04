// Browser instrumentation: replaces capture with local synthetic audio, never a microphone.
function installVoiceProbe(expected) {
  const state = (window.__voiceEval = {
    ready: false,
    welcomesSent: 0,
    sessions: [],
    responses: [],
    errors: [],
    events: [],
    sent: [],
    audio: {},
    injection: null,
    syntheticMicrophoneCalls: 0,
    recordingBase64: null,
  });
  const contexts = [],
    sources = [];
  let inputContext, inputDestination, peer, channel, recorder, interval;
  const chunks = [];
  const stop = (reason) => {
    if (!state.errors.some((e) => e.reason === reason))
      state.errors.push({ reason, at: performance.now() });
    try {
      channel?.send(JSON.stringify({ type: "response.cancel" }));
    } catch {}
    try {
      peer?.close();
    } catch {}
  };
  const consume = (event) => {
    const error = window.__voiceContract(
      state,
      event,
      performance.now(),
      expected,
    );
    if (error) stop(error);
    return error;
  };
  Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
    configurable: true,
    value: async () => {
      if (state.syntheticMicrophoneCalls++)
        throw Error("Unexpected second capture");
      inputContext = new AudioContext();
      contexts.push(inputContext);
      await inputContext.resume();
      inputDestination = inputContext.createMediaStreamDestination();
      const clock = inputContext.createOscillator(),
        zero = inputContext.createGain();
      zero.gain.value = 0;
      clock.connect(zero).connect(inputDestination);
      clock.start();
      sources.push(clock);
      return inputDestination.stream;
    },
  });
  const NativePeer = window.RTCPeerConnection;
  window.RTCPeerConnection = class extends NativePeer {
    constructor(...args) {
      super(...args);
      // Retain the wrapped native connection for bounded cancellation/cleanup.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      peer = this;
      this.addEventListener("track", async (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        const ctx = new AudioContext();
        contexts.push(ctx);
        await ctx.resume();
        const source = ctx.createMediaStreamSource(stream),
          analyser = ctx.createAnalyser(),
          silent = ctx.createGain();
        analyser.fftSize = 1024;
        silent.gain.value = 0;
        source.connect(analyser);
        analyser.connect(silent);
        silent.connect(ctx.destination);
        const buffer = new Float32Array(analyser.fftSize);
        let highCandidate = 0;
        interval = setInterval(() => {
          analyser.getFloatTimeDomainData(buffer);
          let sq = 0,
            peak = 0;
          for (const v of buffer) {
            sq += v * v;
            peak = Math.max(peak, Math.abs(v));
          }
          const now = performance.now(),
            rms = Math.sqrt(sq / buffer.length);
          if (rms > 0.005) {
            if (!highCandidate) highCandidate = now;
            state.lastOutputEnergyAt = now;
            if (state.activeResponse) {
              const a = (state.audio[state.activeResponse] ||= {});
              if (!a.firstNonSilentAt && now - highCandidate >= 8)
                a.firstNonSilentAt = highCandidate;
              a.lastNonSilentAt = now;
              a.peak = Math.max(a.peak || 0, peak);
            }
          } else highCandidate = 0;
        }, 10);
        recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        recorder.start(250);
      });
    }
    createDataChannel(...args) {
      const dc = super.createDataChannel(...args);
      channel = dc;
      const nativeSend = dc.send.bind(dc);
      dc.send = (data) => {
        let event;
        try {
          event = JSON.parse(data);
        } catch {
          stop("Invalid outgoing protocol");
          return;
        }
        state.sent.push({ at: performance.now(), event });
        if (consume({ type: "harness.outgoing", event })) return;
        return nativeSend(data);
      };
      dc.addEventListener("message", (message) => {
        let event;
        try {
          event = JSON.parse(message.data);
        } catch {
          stop("Invalid incoming protocol");
          return;
        }
        consume(event);
        if (
          !["response.output_audio.delta", "response.audio.delta"].includes(
            event.type,
          )
        )
          state.events.push({
            at: performance.now(),
            type: event.type,
            response_id: event.response_id,
            item_id: event.item_id,
            transcript: event.transcript,
            audio_start_ms: event.audio_start_ms,
            audio_end_ms: event.audio_end_ms,
          });
      });
      return dc;
    }
  };
  state.inject = async ({ base64, lastNonSilentSeconds }) => {
    if (!state.ready || state.errors.length || state.injection)
      throw Error("Cannot inject before readiness or twice");
    if (state.responses.length !== 1 || !state.responses[0].doneAt)
      throw Error("Welcome not complete");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const buffer = await inputContext.decodeAudioData(bytes.buffer);
    if (
      buffer.duration > 30 ||
      lastNonSilentSeconds > buffer.duration ||
      lastNonSilentSeconds <= 0
    )
      throw Error("Fixture bound exceeded");
    const source = inputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(inputDestination);
    sources.push(source);
    const now = performance.now();
    state.injection = {
      startAt: now,
      durationSeconds: buffer.duration,
      lastNonSilentAt: now + lastNonSilentSeconds * 1000,
    };
    source.start();
    await new Promise((resolve) => (source.onended = resolve));
    state.injection.bufferEndedAt = performance.now();
  };
  state.stop = stop;
  state.finish = async () => {
    if (interval) clearInterval(interval);
    if (recorder && recorder.state !== "inactive")
      await new Promise((resolve) => {
        recorder.onstop = resolve;
        recorder.stop();
      });
    if (chunks.length) {
      const blob = new Blob(chunks, { type: "audio/webm" });
      state.recordingBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.readAsDataURL(blob);
      });
    }
    for (const source of sources)
      try {
        source.stop();
      } catch {}
    for (const ctx of contexts) if (ctx.state !== "closed") await ctx.close();
    return JSON.parse(
      JSON.stringify(state, (key, value) =>
        typeof value === "function" ? undefined : value,
      ),
    );
  };
}
module.exports = { installVoiceProbe };
