export type CurrentMusicPlayback = {
  phase: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  elapsed: number;
  total: number;
  message: string;
};
export const idleCurrentMusic: CurrentMusicPlayback = {
  phase: "idle",
  elapsed: 0,
  total: 0,
  message: "Nothing plays until you choose Play.",
};
export class CurrentMusicAudio {
  state = { ...idleCurrentMusic };
  private context?: AudioContext;
  private gain?: GainNode;
  private filter?: BiquadFilterNode;
  private wet?: GainNode;
  private dry?: GainNode;
  private buffers: AudioBuffer[] = [];
  private nextIndex = 0;
  private transition: "crossfade" | "quiet-gap" = "crossfade";
  private sources = new Set<AudioBufferSourceNode>();
  private tick?: ReturnType<typeof setInterval>;
  private abort?: AbortController;
  private token = 0;
  private disposed = false;
  private started = 0;
  private offset = 0;
  private next = 0;
  private sample = "";
  private settings = { volume: 0.22, brightness: 0.55, space: 0.08 };
  constructor(private notify: (s: CurrentMusicPlayback) => void) {}
  private emit(p: Partial<CurrentMusicPlayback>) {
    if (!this.disposed) {
      this.state = { ...this.state, ...p };
      this.notify({ ...this.state });
    }
  }
  private release() {
    clearInterval(this.tick);
    this.tick = undefined;
    this.abort?.abort();
    this.abort = undefined;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {}
      s.disconnect();
    }
    this.sources.clear();
    const c = this.context;
    this.context = undefined;
    this.gain = undefined;
    this.filter = undefined;
    this.wet = undefined;
    this.dry = undefined;
    if (c && c.state !== "closed") void c.close().catch(() => {});
  }
  stop(message = "Stopped. Your choices are still here.") {
    ++this.token;
    this.release();
    this.offset = 0;
    this.buffers = [];
    this.nextIndex = 0;
    this.sample = "";
    this.emit({ ...idleCurrentMusic, message });
  }
  dispose() {
    this.disposed = true;
    this.stop();
  }
  pause(message = "Paused. Press Resume when you are ready.") {
    if (!["playing", "loading"].includes(this.state.phase)) return;
    this.offset =
      this.state.phase === "playing"
        ? Math.min(
            this.state.total,
            this.offset + (this.context?.currentTime ?? 0) - this.started,
          )
        : 0;
    ++this.token;
    this.release();
    this.emit({ phase: "paused", elapsed: this.offset, message });
  }
  shape(p: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...p };
    const c = this.context;
    if (!c) return;
    this.gain?.gain.setTargetAtTime(
      Math.max(0, Math.min(0.6, this.settings.volume)),
      c.currentTime,
      0.15,
    );
    this.filter?.frequency.setTargetAtTime(
      1600 + Math.max(0, Math.min(1, this.settings.brightness)) * 14400,
      c.currentTime,
      0.2,
    );
    this.wet?.gain.setTargetAtTime(
      Math.max(0, Math.min(0.35, this.settings.space)) * 0.5,
      c.currentTime,
      0.2,
    );
    this.dry?.gain.setTargetAtTime(
      1 - Math.max(0, Math.min(0.35, this.settings.space)) * 0.5,
      c.currentTime,
      0.2,
    );
  }
  private segment(time: number, offset = 0) {
    const c = this.context,
      b = this.buffers[this.nextIndex];
    if (!c || !b) return;
    const source = c.createBufferSource(),
      envelope = c.createGain();
    source.buffer = b;
    source.connect(envelope);
    envelope.connect(this.filter!);
    const duration = b.duration - offset,
      fade = Math.min(1, duration / 4);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(1, time + fade);
    envelope.gain.setValueAtTime(1, time + duration - fade);
    envelope.gain.linearRampToValueAtTime(0, time + duration);
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      envelope.disconnect();
    };
    source.start(time, offset);
    this.next =
      time + duration + (this.transition === "crossfade" ? -fade : 0.25);
    this.nextIndex = (this.nextIndex + 1) % this.buffers.length;
  }
  async play(
    sampleId: string | string[],
    minutes: number,
    settings: typeof this.settings,
    resume = false,
    transition: "crossfade" | "quiet-gap" = "crossfade",
  ) {
    const ids = [...new Set(Array.isArray(sampleId) ? sampleId : [sampleId])];
    if (!ids.length || ids.length > 3) {
      this.stop("Choose one to three movements.");
      return;
    }
    const identity = ids.join(",") + ":" + transition;
    const was =
      resume && this.sample === identity && this.state.phase === "paused";
    const buffered = was ? this.buffers : undefined,
      offset = was ? this.offset : 0;
    this.stop();
    const token = this.token;
    this.sample = identity;
    this.transition = transition;
    this.offset = offset;
    this.settings = settings;
    this.emit({
      phase: "loading",
      elapsed: offset,
      total: minutes * 60,
      message: "Opening your Current…",
    });
    try {
      const c = new AudioContext();
      this.context = c;
      const timeout = AbortSignal.timeout(12000);
      await Promise.race([
        c.resume(),
        new Promise<never>((_, reject) =>
          timeout.addEventListener(
            "abort",
            () => reject(Error("Audio unlock timed out. Try Play again.")),
            { once: true },
          ),
        ),
      ]);
      if (token !== this.token) return;
      if (c.state !== "running")
        throw Error("Your browser has paused audio. Press Play to try again.");
      const abort = new AbortController();
      this.abort = abort;
      const buffers: AudioBuffer[] = buffered || [];
      if (!buffered)
        for (const id of ids) {
          const response = await fetch(
            `/api/music-lab/audio?id=${id}&mode=bed`,
            { signal: AbortSignal.any([abort.signal, timeout]) },
          );
          if (!response.ok)
            throw Error(
              "This local piece is unavailable. Choose another starter or try again.",
            );
          const bytes = await response.arrayBuffer();
          if (bytes.byteLength > 40000000)
            throw Error("This audio exceeds the playback limit.");
          const decoded = await c.decodeAudioData(bytes);
          if (token !== this.token) return;
          if (decoded.duration < 10 || decoded.duration > 100)
            throw Error("This piece needs an audio review before playback.");
          buffers.push(decoded);
        }
      if (token !== this.token) {
        void c.close().catch(() => {});
        return;
      }
      timeout.throwIfAborted();
      if (
        buffers.reduce(
          (bytes, b) => bytes + b.length * b.numberOfChannels * 4,
          0,
        ) > 120000000
      )
        throw Error("This session exceeds the decoded audio memory limit.");
      this.buffers = buffers;
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      this.filter = filter;
      const dry = c.createGain(),
        wet = c.createGain(),
        convolver = c.createConvolver();
      this.dry = dry;
      this.wet = wet;
      const impulse = c.createBuffer(
        2,
        Math.round(c.sampleRate * 0.8),
        c.sampleRate,
      );
      for (let ch = 0; ch < 2; ch++) {
        const a = impulse.getChannelData(ch);
        let seed = 7321 + ch;
        for (let i = 0; i < a.length; i++) {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          a[i] =
            ((seed / 4294967296) * 2 - 1) *
            Math.pow(1 - i / a.length, 3) *
            0.18;
        }
      }
      convolver.buffer = impulse;
      const gain = c.createGain(),
        limiter = c.createDynamicsCompressor();
      this.gain = gain;
      limiter.threshold.value = -6;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.2;
      filter.connect(dry);
      dry.connect(gain);
      filter.connect(convolver);
      convolver.connect(wet);
      wet.connect(gain);
      gain.connect(limiter);
      limiter.connect(c.destination);
      gain.gain.value = 0;
      this.shape(settings);
      this.started = c.currentTime;
      const spans = buffers.map(
        (b) => b.duration + (transition === "crossfade" ? -1 : 0.25),
      );
      const cycle = spans.reduce((a, b) => a + b, 0);
      let within = offset % cycle,
        index = 0;
      while (index < spans.length - 1 && within >= spans[index]) {
        within -= spans[index];
        index++;
      }
      this.nextIndex = index;
      if (within >= buffers[index].duration) {
        this.nextIndex = (index + 1) % buffers.length;
        this.segment(c.currentTime + 0.03 + spans[index] - within);
      } else this.segment(c.currentTime + 0.03, within);
      this.emit({
        phase: "playing",
        message: "Playing your music. Adjust freely, or choose quiet.",
      });
      c.onstatechange = () => {
        if (token === this.token && c.state === "suspended")
          this.pause("Audio paused by your browser. Resume deliberately.");
      };
      this.tick = setInterval(() => {
        if (token !== this.token) return;
        const elapsed = this.offset + c.currentTime - this.started,
          remaining = this.state.total - elapsed;
        if (remaining <= 0) {
          this.stop(
            "Your Current has finished. Nothing restarts automatically.",
          );
          this.emit({
            phase: "ended",
            elapsed: minutes * 60,
            total: minutes * 60,
          });
          return;
        }
        if (this.next < c.currentTime + 2)
          this.segment(Math.max(this.next, c.currentTime + 0.02));
        if (remaining < 5)
          this.gain?.gain.setTargetAtTime(
            this.settings.volume * Math.max(0, remaining / 5),
            c.currentTime,
            0.2,
          );
        this.emit({ elapsed });
      }, 200);
    } catch (e) {
      if (token !== this.token) return;
      this.release();
      this.emit({
        phase: "error",
        message:
          e instanceof Error
            ? e.message
            : "Audio could not play. Stop or retry.",
      });
    }
  }
}
