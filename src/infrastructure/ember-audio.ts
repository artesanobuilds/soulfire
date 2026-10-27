import type { EmberSession } from "../domain/ember";
import { createCurrentRecipe, defaultCurrentInput } from "../domain/current";
import { CurrentAudio } from "./current-audio";
import recording from "../lib/ember-recording.json";
export type EmberState = {
  phase: "idle" | "starting" | "playing" | "paused" | "ended" | "error";
  elapsed: number;
  caption: string;
  speaking: boolean;
  message: string;
};
export const initialEmberState: EmberState = {
  phase: "idle",
  elapsed: 0,
  caption: "",
  speaking: false,
  message: "Ready when you are. Nothing plays automatically.",
};
export class EmberAudio {
  state = { ...initialEmberState };
  private session?: EmberSession;
  private element?: HTMLAudioElement;
  private token = 0;
  private ticker?: ReturnType<typeof setInterval>;
  private watchdog?: ReturnType<typeof setTimeout>;
  private last = 0;
  private cue = -1;
  private bed: CurrentAudio;
  private disposed = false;
  constructor(private notify: (state: EmberState) => void) {
    this.bed = new CurrentAudio((s) => {
      if (
        s.phase === "error" &&
        !this.disposed &&
        this.session?.input.sound !== "quiet"
      )
        this.fail(
          "The background sound could not play. Choose Quiet and begin again.",
        );
    });
  }
  private emit(patch: Partial<EmberState>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.notify({ ...this.state });
  }
  private clearWait() {
    clearTimeout(this.watchdog);
    this.watchdog = undefined;
  }
  private release() {
    ++this.token;
    clearInterval(this.ticker);
    this.ticker = undefined;
    this.clearWait();
    const a = this.element;
    this.element = undefined;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.onwaiting = null;
      a.onplaying = null;
      a.onpause = null;
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    this.bed.stop();
  }
  stop(message = "Stopped. You can begin again whenever you like.") {
    this.release();
    this.cue = -1;
    this.emit({
      phase: "idle",
      elapsed: 0,
      speaking: false,
      caption: "",
      message,
    });
  }
  dispose() {
    this.release();
    this.bed.dispose();
    this.disposed = true;
  }
  private fail(message: string) {
    this.release();
    this.emit({ phase: "error", speaking: false, message });
  }
  pause(message = "Paused. Resume when you’re ready.") {
    if (!["playing", "starting"].includes(this.state.phase)) return;
    ++this.token;
    clearInterval(this.ticker);
    this.clearWait();
    this.element?.pause();
    this.bed.pause();
    this.emit({ phase: "paused", speaking: false, message });
  }
  private soundVolume(speaking: boolean) {
    const input = this.session?.input;
    if (input) this.bed.volumeTo(input.soundVolume * (speaking ? 0.23 : 1));
  }
  private watch(token: number) {
    this.clearWait();
    this.watchdog = setTimeout(() => {
      if (token === this.token)
        this.fail(
          "Narration could not load or was interrupted. Your transcript is available. Stop or try again.",
        );
    }, 12000);
  }
  private async speak(index: number, token: number) {
    const s = this.session;
    if (!s || token !== this.token) return;
    const cue = s.cues[index];
    this.cue = index;
    if (this.element) {
      this.element.onpause = null;
      this.element.pause();
    }
    const a = new Audio(recording.clips[cue.id].path);
    this.element = a;
    a.preload = "auto";
    a.volume = s.input.volume;
    a.playbackRate = s.input.rate;
    // A delayed browser play request may fire even after its promise was canceled.
    a.onplay = () => {
      if (token !== this.token || this.element !== a) a.pause();
    };
    a.onwaiting = () => {
      if (token !== this.token) return;
      this.emit({ speaking: false, message: "Loading the next guidance…" });
      this.watch(token);
    };
    a.onplaying = () => {
      if (token !== this.token) {
        a.pause();
        return;
      }
      this.clearWait();
      this.last = performance.now();
      this.soundVolume(true);
      this.emit({
        phase: "playing",
        speaking: true,
        caption: cue.text,
        message: "Guidance playing",
      });
    };
    a.onended = () => {
      if (token !== this.token) return;
      this.clearWait();
      this.soundVolume(false);
      this.emit({
        speaking: false,
        message: "Space to practice · natural breathing is welcome.",
      });
    };
    a.onpause = () => {
      if (
        token === this.token &&
        this.element === a &&
        !a.ended &&
        this.state.phase === "playing"
      )
        this.pause("Narration was interrupted. Resume when you’re ready.");
    };
    a.onerror = () => {
      if (token === this.token)
        this.fail(
          "Narration is unavailable. Your transcript is still here. Stop or try again.",
        );
    };
    this.emit({ caption: cue.text, speaking: false });
    this.watch(token);
    try {
      await a.play();
      if (token !== this.token) a.pause();
    } catch {
      if (token === this.token)
        this.fail(
          "Audio could not start. Check your browser’s audio permission, or choose captions without voice and try again.",
        );
    }
  }
  async play(session: EmberSession, resume = false) {
    if (this.disposed) return;
    const continuing =
      resume && this.session === session && this.state.phase === "paused";
    const old = this.element;
    const oldTime = old?.currentTime || 0;
    const wasCue = this.cue;
    if (continuing) {
      ++this.token;
      clearInterval(this.ticker);
      this.clearWait();
    } else {
      this.release();
      this.cue = -1;
      this.emit({ elapsed: 0, caption: "" });
    }
    this.session = session;
    const token = this.token;
    this.emit({
      phase: "starting",
      speaking: false,
      message: "Opening your practice…",
    });
    if (session.input.sound !== "quiet") {
      const recipe = createCurrentRecipe({
        ...defaultCurrentInput,
        goal: "unwind",
        minutes: session.input.minutes,
        preferred: [session.input.sound],
        excluded:
          session.input.sound === "river"
            ? ["rain", "breeze", "warmth"]
            : ["river", "rain", "breeze"],
        intensity: 0.25,
        movement: 0.15,
      });
      this.bed.volumeTo(session.input.soundVolume);
      await this.bed.play(recipe, false, continuing);
      if (token !== this.token) return;
      if (this.bed.state.phase !== "playing") return;
    }
    if (token !== this.token) return;
    this.last = performance.now();
    this.emit({ phase: "playing", message: "Your practice is underway." });
    if (
      continuing &&
      old &&
      !old.ended &&
      (!Number.isFinite(old.duration) || oldTime < old.duration - 0.05)
    ) {
      // Reattach handlers with the new generation; restart this short cue at its prior offset.
      await this.speak(wasCue, token);
      if (this.element && token === this.token)
        this.element.currentTime = oldTime;
    } else if (!continuing && session.input.voice) {
      await this.speak(0, token);
    }
    if (token !== this.token || this.state.phase === "error") return;
    this.ticker = setInterval(() => {
      if (token !== this.token || this.state.phase !== "playing") return;
      const now = performance.now();
      const delta = Math.min(1, (now - this.last) / 1000);
      this.last = now;
      // Freeze progress while narration is buffering; intentional silence still counts.
      if (this.watchdog) return;
      const elapsed = Math.min(session.seconds, this.state.elapsed + delta);
      if (elapsed >= session.seconds) {
        this.release();
        this.emit({
          phase: "ended",
          elapsed: session.seconds,
          speaking: false,
          caption: "Your practice is complete. Return in your own time.",
          message: "Complete. Nothing will replay automatically.",
        });
        return;
      }
      this.emit({ elapsed });
      const next = this.cue + 1;
      if (
        next < session.cues.length &&
        elapsed >= session.cues[next].start &&
        !this.state.speaking
      ) {
        if (session.input.voice) void this.speak(next, token);
        else {
          this.cue = next;
          this.emit({
            caption: session.cues[next].text,
            message:
              "Caption guidance · sound and silence follow your choices.",
          });
        }
      }
    }, 100);
  }
}
