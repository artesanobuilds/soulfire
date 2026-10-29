import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { musicLabDirectory } from "./music-lab-runtime";
export async function musicLabCommand(
  program: string,
  args: string[],
  input: unknown,
  signal: AbortSignal,
  timeout: number,
) {
  signal.throwIfAborted();
  return new Promise<{ text: string; rss: number | null }>(
    (resolve, reject) => {
      const child = spawn("/usr/bin/time", ["-l", program, ...args], {
        detached: true,
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          NODE_ENV: "production",
          PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
          HOME: homedir(),
          LANG: "en_US.UTF-8",
          HF_HUB_OFFLINE: "1",
          TRANSFORMERS_OFFLINE: "1",
          HF_HUB_DISABLE_IMPLICIT_TOKEN: "1",
          HF_HOME: join(musicLabDirectory(), "offline-cache"),
          TOKENIZERS_PARALLELISM: "false",
          OMP_NUM_THREADS: "8",
          PYTHONDONTWRITEBYTECODE: "1",
        },
      });
      let ended = false,
        size = 0,
        out = "",
        err = "";
      const kill = () => {
        if (child.pid)
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {
            child.kill("SIGKILL");
          }
      };
      const cleanup = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
        process.removeListener("exit", kill);
        process.removeListener("SIGTERM", abort);
        process.removeListener("SIGINT", abort);
      };
      const fail = (e: Error) => {
        if (ended) return;
        ended = true;
        cleanup();
        kill();
        reject(e);
      };
      const abort = () => fail(new DOMException("Cancelled", "AbortError"));
      const timer = setTimeout(
        () => fail(new Error("Local generation exceeded its time limit.")),
        timeout,
      );
      signal.addEventListener("abort", abort, { once: true });
      process.once("exit", kill);
      process.once("SIGTERM", abort);
      process.once("SIGINT", abort);
      child.on("error", () =>
        fail(new Error("Local runtime could not start.")),
      );
      child.stdin.on("error", () =>
        fail(new Error("Local runtime input failed.")),
      );
      for (const [stream, isOut] of [
        [child.stdout, true],
        [child.stderr, false],
      ] as const)
        stream.on("data", (b: Buffer) => {
          size += b.length;
          if (size > 1500000)
            fail(new Error("Local runtime output exceeded its bound."));
          else if (isOut) out += b.toString();
          else err += b.toString();
        });
      child.on("close", (code) => {
        if (ended) return;
        ended = true;
        cleanup();
        if (code !== 0) {
          void writeFile(
            join(musicLabDirectory(), "last-runtime-error.log"),
            err.slice(-50000),
            { mode: 0o600 },
          ).catch(() => {});
          reject(
            new Error(
              "Local generation or measurement failed. No sample was added. Details remain in the local runtime log.",
            ),
          );
        } else
          resolve({
            text: out.trim().split("\n").at(-1) || "",
            rss:
              Number(err.match(/(\d+)\s+maximum resident set size/)?.[1]) ||
              null,
          });
      });
      if (signal.aborted) {
        abort();
        return;
      }
      child.stdin.end(JSON.stringify(input));
    },
  );
}
