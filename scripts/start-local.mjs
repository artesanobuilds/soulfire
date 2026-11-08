// One canonical local preview. Next loads the existing ignored .env.local.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const mode = process.argv.includes("--dev") ? "dev" : "start";
const child = spawn(
  process.execPath,
  [
    resolve(root, "node_modules/next/dist/bin/next"),
    mode,
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      SOULFIRE_EXPERIMENT_REASONED_VOICE:
        process.env.SOULFIRE_EXPERIMENT_REASONED_VOICE ?? "1",
    },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
