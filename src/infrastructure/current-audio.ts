import {
  currentRandom,
  currentRecipeSchema,
  type CurrentRecipe,
  type CurrentKind,
} from "../domain/current";

export type CurrentAudioState = {
  phase: "idle" | "starting" | "playing" | "paused" | "ended" | "error";
  elapsed: number;
  total: number;
  preview: boolean;
  level: number;
  message: string;
};
type Graph = {
  context: AudioContext;
  master: GainNode;
  analyser: AnalyserNode;
  sources: (AudioBufferSourceNode | OscillatorNode)[];
  nodes: AudioNode[];
  gains: Map<CurrentKind, GainNode>;
};
const initial: CurrentAudioState = {
  phase: "idle",
  elapsed: 0,
  total: 0,
  preview: false,
  level: 0,
  message: "Ready when you are. Nothing plays automatically.",
};

export class CurrentAudio {
  state = { ...initial };
  private graph?: Graph;
  private generation = 0;
  private tick?: ReturnType<typeof setInterval>;
  private pending?: AbortController;
  private began = 0;
  private offset = 0;
  private recipe?: CurrentRecipe;
  private volume = 0.25;
  constructor(private notify: (state: CurrentAudioState) => void) {}
  private emit(patch: Partial<CurrentAudioState>) {
    this.state = { ...this.state, ...patch };
    this.notify({ ...this.state });
  }
  private release() {
    ++this.generation;
    this.pending?.abort();
    this.pending = undefined;
    clearInterval(this.tick);
    this.tick = undefined;
    const graph = this.graph;
    this.graph = undefined;
    if (!graph) return;
    graph.context.onstatechange = null;
    try {
      graph.master.gain.cancelScheduledValues(graph.context.currentTime);
      graph.master.gain.setValueAtTime(0, graph.context.currentTime);
    } catch {}
    for (const source of graph.sources) {
      try {
        source.stop();
      } catch {}
    }
    for (const node of graph.nodes) {
      try {
        node.disconnect();
      } catch {}
    }
    void graph.context.close().catch(() => {});
  }
  stop(message = "Stopped. Press Play to begin again.") {
    this.release();
    this.offset = 0;
    this.emit({ phase: "idle", elapsed: 0, level: 0, message });
  }
  pause(message = "Paused. Press Resume when you’re ready.") {
    if (!["playing", "starting"].includes(this.state.phase)) return;
    this.offset =
      this.state.phase === "playing"
        ? Math.min(
            this.state.total,
            this.offset + (performance.now() - this.began) / 1000,
          )
        : 0;
    this.release();
    this.emit({ phase: "paused", elapsed: this.offset, level: 0, message });
  }
  dispose() {
    this.release();
  }
  volumeTo(value: number) {
    this.volume = Math.min(0.7, Math.max(0, value));
    this.updateMaster();
  }
  layersTo(recipe: CurrentRecipe) {
    this.recipe = recipe;
    const graph = this.graph;
    if (!graph) return;
    for (const layer of recipe.layers)
      graph.gains
        .get(layer.kind)
        ?.gain.setTargetAtTime(
          layer.muted ? 0 : layer.level * 0.12,
          graph.context.currentTime,
          0.06,
        );
  }
  durationTo(seconds: number) {
    this.emit({ total: Math.max(1, Math.min(3600, seconds)) });
  }
  private updateMaster() {
    const graph = this.graph;
    if (!graph || this.state.phase !== "playing") return;
    const remaining = Math.max(0, this.state.total - this.state.elapsed);
    const fade = Math.min(
      1,
      remaining / 2,
      Math.max(0, (performance.now() - this.began) / 700),
    );
    graph.master.gain.setTargetAtTime(
      this.volume * fade,
      graph.context.currentTime,
      0.04,
    );
  }
  async play(raw: CurrentRecipe, preview = false, resume = false) {
    const recipe = currentRecipeSchema.parse(raw);
    const offset = resume && this.recipe?.id === recipe.id ? this.offset : 0;
    const total =
      resume && this.recipe?.id === recipe.id
        ? this.state.total
        : preview
          ? 20
          : recipe.minutes * 60;
    this.release();
    const token = this.generation;
    this.offset = offset;
    this.recipe = recipe;
    this.emit({
      phase: "starting",
      elapsed: offset,
      total,
      preview,
      level: 0,
      message: "Opening audio…",
    });
    let opening: AudioContext | undefined;
    try {
      const Audio =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Audio)
        throw Error(
          "Audio is unavailable in this browser. Your recipe can still be saved; try a browser with Web Audio support.",
        );
      const context = new Audio();
      opening = context;
      const master = context.createGain(),
        analyser = context.createAnalyser(),
        compressor = context.createDynamicsCompressor();
      master.gain.value = 0;
      analyser.fftSize = 256;
      compressor.threshold.value = -14;
      compressor.knee.value = 12;
      compressor.ratio.value = 8;
      compressor.connect(master).connect(analyser).connect(context.destination);
      const graph: Graph = {
        context,
        master,
        analyser,
        sources: [],
        nodes: [compressor, master, analyser],
        gains: new Map(),
      };
      this.graph = graph;
      this.pending = new AbortController();
      const signal = this.pending.signal;
      // Resume is called inside the person's click; the bounded wait cannot revive a stopped graph.
      const resumed = context.resume();
      await new Promise<void>((resolve, reject) => {
        const finish = (error?: unknown) => {
          clearTimeout(timer);
          signal.removeEventListener("abort", abort);
          if (error) reject(error);
          else resolve();
        };
        const abort = () => finish(new DOMException("Canceled", "AbortError"));
        const timer = setTimeout(
          () => finish(Error("Audio did not unlock. Press Play to try again.")),
          4000,
        );
        signal.addEventListener("abort", abort, { once: true });
        resumed.then(() => finish(), finish);
      });
      if (token !== this.generation || this.graph !== graph) return;
      if (context.state !== "running")
        throw Error("Audio is suspended. Press Play to unlock it.");
      for (const layer of recipe.layers) {
        const gain = context.createGain();
        gain.gain.value = layer.muted ? 0 : layer.level * 0.12;
        gain.connect(compressor);
        graph.gains.set(layer.kind, gain);
        graph.nodes.push(gain);
        const movement = context.createGain();
        movement.gain.value = 0.8;
        movement.connect(gain);
        graph.nodes.push(movement);
        if (recipe.movement > 0) {
          const lfo = context.createOscillator(),
            depth = context.createGain();
          lfo.frequency.value = 0.035 + recipe.movement * 0.08;
          depth.gain.value = recipe.movement * 0.15;
          lfo.connect(depth).connect(movement.gain);
          graph.sources.push(lfo);
          graph.nodes.push(lfo, depth);
        }
        if (layer.kind === "warmth") {
          const root =
            { focus: 196, unwind: 164.81, settle: 146.83, explore: 220 }[
              recipe.goal
            ] * [1, 1.125, 0.75][recipe.seed % 3];
          for (const ratio of [1, 1.5]) {
            const tone = context.createOscillator(),
              soft = context.createGain();
            tone.type = "sine";
            tone.frequency.value = root * ratio;
            soft.gain.value = 0.38;
            tone.connect(soft).connect(movement);
            graph.sources.push(tone);
            graph.nodes.push(tone, soft);
          }
        } else {
          const source = context.createBufferSource(),
            filter = context.createBiquadFilter();
          const length = Math.round(context.sampleRate * 8),
            buffer = context.createBuffer(2, length, context.sampleRate);
          const random = currentRandom(
            recipe.seed ^ { river: 73, rain: 137, breeze: 211 }[layer.kind],
          );
          for (let channel = 0; channel < 2; channel++) {
            const values = buffer.getChannelData(channel);
            let smooth = 0;
            for (let i = 0; i < length; i++) {
              const noise = random() * 2 - 1;
              smooth = smooth * 0.96 + noise * 0.04;
              const edge = Math.min(1, i / 256, (length - 1 - i) / 256);
              values[i] =
                (layer.kind === "breeze"
                  ? smooth * 2.2
                  : noise * 0.5 + smooth * 0.3) * edge;
            }
          }
          source.buffer = buffer;
          source.loop = true;
          filter.type = layer.kind === "rain" ? "highpass" : "lowpass";
          filter.Q.value = 0.5;
          filter.frequency.value =
            (layer.kind === "river"
              ? 600
              : layer.kind === "rain"
                ? 1800
                : 280) *
            (1 + recipe.brightness * 3);
          source.connect(filter).connect(movement);
          graph.sources.push(source);
          graph.nodes.push(source, filter);
        }
      }
      for (const source of graph.sources) {
        if ("buffer" in source && source.buffer)
          source.start(0, offset % source.buffer.duration);
        else source.start();
      }
      this.began = performance.now();
      context.onstatechange = () => {
        if (
          this.graph === graph &&
          this.state.phase === "playing" &&
          context.state !== "running"
        )
          this.pause("Audio was interrupted. Press Resume to continue.");
      };
      this.emit({
        phase: "playing",
        message: preview ? "Preview playing" : "Playing",
      });
      this.updateMaster();
      const samples = new Float32Array(analyser.fftSize);
      this.tick = setInterval(() => {
        if (this.graph !== graph || token !== this.generation) return;
        const elapsed = Math.min(
          this.state.total,
          this.offset + (performance.now() - this.began) / 1000,
        );
        if (elapsed >= this.state.total) {
          this.release();
          this.offset = 0;
          this.emit({
            phase: "ended",
            elapsed: this.state.total,
            level: 0,
            message: "Finished. Nothing will restart automatically.",
          });
          return;
        }
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(
          samples.reduce((sum, n) => sum + n * n, 0) / samples.length,
        );
        this.emit({ elapsed, level: Math.min(1, rms * 12) });
        this.updateMaster();
      }, 100);
    } catch (error) {
      if (token !== this.generation) return;
      if (!this.graph && opening) void opening.close().catch(() => {});
      this.release();
      this.emit({
        phase: "error",
        level: 0,
        message:
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Audio was blocked. Press Play to try again, or check this browser’s sound permissions."
            : error instanceof Error
              ? error.message
              : "Audio could not start. Try again or continue in silence.",
      });
    }
  }
}
