import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { HistoryError } from "../domain/history";
import type { SyntheticAudio, SyntheticSpeech } from "../domain/simulation";
function location() {
  return (
    process.env.SOULFIRE_KOKORO_HOME ||
    join(homedir(), "Coding", "AI-native", "tts")
  );
}
export function localSpeechAvailable() {
  const home = location();
  return (
    [
      "venv/bin/python",
      "kokoro_say.py",
      "kokoro/kokoro-v1.0.onnx",
      "kokoro/voices-v1.0.bin",
    ].every((p) => existsSync(join(home, p))) &&
    existsSync(join(process.cwd(), "scripts/synthesize-simulation.py"))
  );
}
export class LocalSyntheticSpeech implements SyntheticSpeech {
  async synthesize(
    text: string,
    role: "user" | "assistant",
    signal: AbortSignal,
  ): Promise<SyntheticAudio> {
    signal.throwIfAborted();
    if (!localSpeechAvailable())
      throw new HistoryError(
        503,
        "Local Kokoro is unavailable. Saved text remains available; no audio service was substituted.",
      );
    if (!text.trim() || text.length > 3000)
      throw new HistoryError(
        400,
        "This turn exceeds the local speech limit. Its complete text is still saved.",
      );
    const voice = role === "user" ? "am_michael" : "af_heart";
    return new Promise((resolve, reject) => {
      const home = location();
      // Text goes through stdin, never shell evaluation or process arguments. Do not inherit credentials.
      const child = spawn(
        join(home, "venv/bin/python"),
        [join(process.cwd(), "scripts/synthesize-simulation.py"), home],
        {
          cwd: home,
          detached: true,
          stdio: ["pipe", "pipe", "ignore"],
          env: {
            NODE_ENV: "production",
            PATH: process.env.PATH || "/usr/bin:/bin",
            HOME: homedir(),
            LANG: "en_US.UTF-8",
            PYTHONDONTWRITEBYTECODE: "1",
            HF_HUB_OFFLINE: "1",
            TRANSFORMERS_OFFLINE: "1",
          },
        },
      );
      let ended = false,
        size = 0;
      const parts: Buffer[] = [];
      const cleanup = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
      };
      const kill = () => {
        if (child.pid)
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {
            child.kill("SIGKILL");
          }
      };
      const fail = (error: Error) => {
        if (ended) return;
        ended = true;
        cleanup();
        kill();
        reject(error);
      };
      const abort = () =>
        fail(new DOMException("Synthetic speech stopped", "AbortError"));
      const timer = setTimeout(
        () =>
          fail(
            new HistoryError(
              504,
              "Local speech timed out. The saved text is available.",
            ),
          ),
        90000,
      );
      signal.addEventListener("abort", abort, { once: true });
      child.on("error", () =>
        fail(
          new HistoryError(
            503,
            "Local speech could not start. Check the installed Kokoro environment.",
          ),
        ),
      );
      child.stdin.on("error", () =>
        fail(new HistoryError(502, "Local speech input was interrupted.")),
      );
      child.stdout.on("data", (part: Buffer) => {
        size += part.length;
        if (size > 6000000)
          fail(new HistoryError(502, "Local speech exceeded its audio bound."));
        else parts.push(part);
      });
      child.on("close", (code) => {
        if (ended) return;
        ended = true;
        cleanup();
        const bytes = Buffer.concat(parts);
        if (
          code !== 0 ||
          bytes.length < 44 ||
          bytes.toString("ascii", 0, 4) !== "RIFF" ||
          bytes.toString("ascii", 8, 12) !== "WAVE"
        )
          reject(
            new HistoryError(
              502,
              "Local speech failed. The saved turn can be read or retried without another model request.",
            ),
          );
        else
          resolve({
            bytes,
            voice,
            version: "kokoro-local-v1",
            mime: "audio/wav",
          });
      });
      if (signal.aborted) {
        abort();
        return;
      }
      child.stdin.end(JSON.stringify({ text, voice }));
    });
  }
}
