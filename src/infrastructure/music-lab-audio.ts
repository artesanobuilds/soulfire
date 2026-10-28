import type { MusicSample } from "../domain/music-lab";
export type MusicMode = "bed" | "narration" | "loop";
export type MusicPlayback = {
  phase: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  sampleId: string | null;
  mode: MusicMode;
  elapsed: number;
  duration: number;
  message: string;
};
export const initialMusicPlayback: MusicPlayback = {
  phase: "idle",
  sampleId: null,
  mode: "bed",
  elapsed: 0,
  duration: 0,
  message: "Press Play when you’re ready. Nothing plays automatically.",
};
export class MusicLabAudio {
  state = { ...initialMusicPlayback };
  private element?: HTMLAudioElement;
  private token = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private disposed = false;
  constructor(private notify: (s: MusicPlayback) => void) {}
  private emit(p: Partial<MusicPlayback>) {
    if (!this.disposed) {
      this.state = { ...this.state, ...p };
      this.notify({ ...this.state });
    }
  }
  private clear() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
  stop() {
    ++this.token;
    this.clear();
    const a = this.element;
    this.element = undefined;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    this.emit({
      ...initialMusicPlayback,
      message: "Stopped. Choose a sample to listen again.",
    });
  }
  dispose() {
    this.disposed = true;
    this.stop();
  }
  pause(message = "Paused. Resume deliberately when ready.") {
    if (!["loading", "playing"].includes(this.state.phase)) return;
    ++this.token;
    this.clear();
    this.element?.pause();
    this.emit({ phase: "paused", message });
  }
  volume(sampleId: string, value: number) {
    if (this.state.sampleId === sampleId && this.element)
      this.element.volume = Math.max(0, Math.min(0.8, value));
  }
  seek(value: number) {
    if (this.element && Number.isFinite(this.element.duration))
      this.element.currentTime = Math.max(
        0,
        Math.min(value, this.element.duration),
      );
  }
  async play(sample: MusicSample, mode: MusicMode, volume: number) {
    const resume =
      this.state.sampleId === sample.id &&
      this.state.mode === mode &&
      this.state.phase === "paused" &&
      this.element;
    if (!resume) this.stop();
    const token = this.token;
    const a = resume
      ? this.element!
      : new Audio(`/api/music-lab/audio?id=${sample.id}&mode=${mode}`);
    this.element = a;
    a.preload = "auto";
    a.volume = Math.max(0, Math.min(0.8, volume));
    const fail = () => {
      if (token !== this.token || this.element !== a) return;
      this.stop();
      this.emit({
        phase: "error",
        sampleId: sample.id,
        mode,
        message:
          "This local render could not play. Stop or retry; no alternate audio was substituted.",
      });
    };
    const wait = () => {
      this.clear();
      this.timer = setTimeout(fail, 12000);
    };
    a.onplay = () => {
      if (token !== this.token || this.element !== a) a.pause();
    };
    a.onplaying = () => {
      if (token !== this.token || this.element !== a) {
        a.pause();
        return;
      }
      this.clear();
      this.emit({
        phase: "playing",
        message: "Playing the measured local render.",
      });
    };
    a.onwaiting = () => {
      if (token === this.token && this.element === a) {
        this.emit({ phase: "loading", message: "Buffering the local render…" });
        wait();
      }
    };
    a.onpause = () => {
      if (token === this.token && this.element === a && !a.ended) {
        this.clear();
        this.emit({
          phase: "paused",
          message: "Paused. Resume deliberately when ready.",
        });
      }
    };
    a.onended = () => {
      if (token !== this.token) return;
      const total = this.state.duration;
      this.stop();
      this.emit({
        phase: "ended",
        sampleId: sample.id,
        mode,
        duration: total,
        elapsed: total,
        message: "Finished. Nothing replays automatically.",
      });
    };
    a.onerror = fail;
    a.ontimeupdate = () => {
      if (token === this.token && this.element === a)
        this.emit({
          elapsed: a.currentTime,
          duration: Number.isFinite(a.duration) ? a.duration : 0,
        });
    };
    a.onloadedmetadata = () => {
      if (token === this.token)
        this.emit({ duration: Number.isFinite(a.duration) ? a.duration : 0 });
    };
    this.emit({
      phase: "loading",
      sampleId: sample.id,
      mode,
      ...(!resume ? { elapsed: 0, duration: 0 } : {}),
      message: "Opening local audio…",
    });
    wait();
    try {
      await a.play();
      if (this.element !== a) a.pause();
    } catch {
      if (token === this.token) fail();
    }
  }
}
