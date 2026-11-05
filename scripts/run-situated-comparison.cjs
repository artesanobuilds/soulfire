/* eslint-disable @typescript-eslint/no-require-imports -- Node-only CommonJS evaluation harness. */
// Explicit paid gate. Default execution performs no key lookup, server start or inference.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  os = require("node:os"),
  net = require("node:net"),
  { spawn } = require("node:child_process");
const { fitsStage } = require("./situated-voice-contract.cjs");
const plan = JSON.parse(
  fs.readFileSync(
    "evaluations/situated-support-comparison-plan-20261104.json",
    "utf8",
  ),
);
if (!process.argv.includes("--authorized-incremental-usd=10.15")) {
  console.log(
    JSON.stringify({
      status: "prepared; awaiting explicit user authorization",
      paidCalls: 0,
      keysRead: false,
      textRequests: 18,
      voiceSessions: 16,
      proposedCeilingUsd: 10.15,
    }),
  );
  process.exit(0);
}
const assert = require("node:assert/strict"),
  { chromium } = require("playwright"),
  { loadEnvConfig } = require("@next/env");
const { runVoiceSession } = require("./situated-browser-session.cjs");
const root = process.cwd(),
  runtime = "/tmp/soulfire-situated-runtime-20261105",
  out = path.join(root, "test-results/situated-paid-run");
const tasks = JSON.parse(
  fs.readFileSync(
    "evaluations/situated-support-schedule-20261104.json",
    "utf8",
  ),
).tasks;
const bundle = JSON.parse(
  fs.readFileSync(
    "test-results/situated-evaluation-offline-requests.json",
    "utf8",
  ),
);
const fixtures = JSON.parse(
  fs.readFileSync("test-results/situated-audio/verified-manifest.json", "utf8"),
);
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const snapshot = JSON.parse(
  fs.readFileSync("test-results/situated-runtime-manifest.json", "utf8"),
);
for (const change of snapshot.changes)
  assert.equal(
    hash(fs.readFileSync(path.join(runtime, change.path))),
    change.stagedSha256,
    "Staged source drift",
  );
assert.equal(snapshot.status, "built; compiled route capture verified");
assert.equal(
  hash(fs.readFileSync(path.join(runtime, "src/lib/agent-baseline.ts"))),
  snapshot.baselineSourceSha256,
);
for (const [file, expected] of Object.entries(snapshot.compiledHashes))
  assert.equal(
    hash(fs.readFileSync(path.join(runtime, file))),
    expected,
    "Compiled build drift",
  );
assert.equal(fixtures.status, "passed");
for (const f of fixtures.fixtures) {
  assert.equal(
    hash(
      fs.readFileSync(path.join(root, "test-results/situated-audio", f.file)),
    ),
    f.audioSha256,
  );
  assert.ok(f.durationSeconds <= 30);
}
for (const task of tasks) {
  const request = bundle.find(
    (r) => r.case === task.case && r.arm === task.arm && r.mode === task.mode,
  );
  assert.equal(
    hash(JSON.stringify(request.request)),
    task.requestSha256,
    "Scheduled request drift",
  );
}
assert.equal(tasks.filter((t) => t.mode === "text").length, 18);
assert.equal(tasks.filter((t) => t.mode === "voice").length, 16);
const resume = process.argv.includes("--resume-unattempted-after-settling-fix");
if (fs.existsSync(out) && !resume)
  throw Error("Prior run exists; refuse accidental paid rerun");
if (resume && !fs.existsSync(out)) throw Error("No prior run to resume");
loadEnvConfig("/Users/miguelalvarado/Coding/soulfire", false, {
  info() {},
  error() {},
});
if (!process.env.OPENAI_API_KEY)
  throw Error("Existing key missing; no credentials created");
const ledgerPath = path.join(
  os.homedir(),
  "Library/Application Support/soulfire-evaluation-budget-20261030.json",
);
const stage = "situated-support-20261104";
const servers = [];
const dataRoot = path.join(os.tmpdir(), "situated-stage-data-20261104");
let browser;
const results = resume
  ? JSON.parse(fs.readFileSync(path.join(out, "ledger.json"), "utf8"))
  : {
      status: "preparing",
      paidAuthorizationFlag: true,
      stageCeilingUsd: 10.15,
      requestReservationsUsd: 0,
      tasks: [],
      serverErrors: [],
    };
if (resume) {
  assert.equal(results.status, "stopped");
  assert.equal(results.tasks.length, 19);
  assert.ok(results.tasks.slice(0, 18).every((t) => t.status === "completed"));
  const failed = results.tasks[18];
  assert.equal(failed.order, 19);
  assert.equal(failed.status, "failed");
  assert.equal(failed.evidence.responses.length, 0);
  assert.equal(failed.evidence.injection, null);
  assert.equal(failed.evidence.welcomesSent, 0);
  assert.ok(
    failed.evidence.errors.some((e) => e.reason === "Effective session drift"),
  );
  fs.writeFileSync(
    path.join(out, "initial-stopped-ledger.json"),
    JSON.stringify(results, null, 2) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  results.amendment = {
    at: new Date().toISOString(),
    reason:
      "Initial acknowledgement had null transcription and unsettled VAD; corrected readiness guard offline. Continue only unattempted original tasks; failed task19 is never retried or replaced.",
    inputInstructionsModelsAudioUnchanged: true,
    additionalCallsAboveOriginalSchedule: 0,
    originalStageCeilingUsd: 10.15,
  };
  delete results.failure;
}
const save = () =>
  fs.writeFileSync(
    path.join(out, "ledger.json"),
    JSON.stringify(results, null, 2) + "\n",
    { mode: 0o600 },
  );
const freePort = (port) =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
const updateStage = (state) => {
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
  const item = ledger.obligations.find((o) => o.stage === stage);
  if (item) item.state = state;
  const temp = ledgerPath + ".situated-temp";
  fs.writeFileSync(temp, JSON.stringify(ledger, null, 2) + "\n", {
    mode: 0o600,
  });
  fs.renameSync(temp, ledgerPath);
};
(async () => {
  await freePort(3114);
  await freePort(3115);
  // Read-only availability preflight; stop without generation on unavailable models.
  for (const id of [
    plan.models.text.requestedId,
    plan.models.voice.requestedId,
    plan.models.voice.transcriptionRequestedId,
  ]) {
    const r = await fetch(
      "https://api.openai.com/v1/models/" + encodeURIComponent(id),
      {
        headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!r.ok) throw Error("Exact model unavailable: " + id);
    const body = await r.json();
    assert.equal(body.id, id);
  }
  const rawLedger = fs.readFileSync(ledgerPath, "utf8"),
    ledger = JSON.parse(rawLedger);
  if (resume) {
    const existing = ledger.obligations.find((o) => o.stage === stage);
    assert.equal(existing?.reservedUsd, 10.15);
    assert.ok(ledger.cumulativeReservedUsd <= ledger.approvedCumulativeCapUsd);
    updateStage("resuming-unattempted-original-schedule");
  } else {
    assert.ok(
      !ledger.obligations.some((o) => o.stage === stage),
      "Stage already reserved; refuse rerun",
    );
    assert.ok(
      ledger.cumulativeReservedUsd + 10.15 <= ledger.approvedCumulativeCapUsd,
      "Cumulative reservation exceeded",
    );
    ledger.obligations.push({
      stage,
      reservedUsd: 10.15,
      state: "reserved-before-generation",
      maximumTextRequests: 18,
      maximumVoiceSessions: 16,
      actualInvoiceClaim: false,
    });
    ledger.cumulativeReservedUsd += 10.15;
    assert.equal(
      fs.readFileSync(ledgerPath, "utf8"),
      rawLedger,
      "Budget changed during preflight",
    );
    const temp = ledgerPath + ".situated-temp";
    fs.writeFileSync(temp, JSON.stringify(ledger, null, 2) + "\n", {
      mode: 0o600,
    });
    fs.renameSync(temp, ledgerPath);
    fs.mkdirSync(out, { mode: 0o700 });
  }
  if (!results.startedAt) results.startedAt = new Date().toISOString();
  if (resume) results.resumedAt = new Date().toISOString();
  results.status = "running";
  save();
  for (const [arm, port] of [
    ["baseline", 3114],
    ["candidate", 3115],
  ]) {
    const child = spawn(
      process.execPath,
      [
        path.join(root, "node_modules/next/dist/bin/next"),
        "start",
        runtime,
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        cwd: root,
        env: {
          PATH: process.env.PATH,
          LANG: "en_US.UTF-8",
          NODE_ENV: "production",
          NEXT_TELEMETRY_DISABLED: "1",
          OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          OPENAI_MODEL: plan.models.text.requestedId,
          OPENAI_REALTIME_MODEL: plan.models.voice.requestedId,
          OPENAI_TRANSCRIBE_MODEL: plan.models.voice.transcriptionRequestedId,
          SOULFIRE_EVAL_ARM: arm,
          SOULFIRE_EVAL_USAGE_FILE: path.join(out, arm + "-text-usage.jsonl"),
          SOULFIRE_DATA_DIR: path.join(dataRoot, arm),
        },
        stdio: ["ignore", "ignore", "pipe"],
      },
    );
    servers.push(child);
    child.stderr.on("data", () => {
      results.serverErrors.push({
        arm,
        category: "server-stderr",
        at: new Date().toISOString(),
      });
    });
  }
  for (const port of [3114, 3115]) {
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/api/status`, {
          signal: AbortSignal.timeout(1000),
        });
        ready = r.ok && (await r.json()).configured;
        if (ready) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, "Isolated server failed readiness");
  }
  browser = await chromium.launch({
    headless: true,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
  });
  for (const task of tasks.filter(
    (t) => !results.tasks.some((previous) => previous.order === t.order),
  )) {
    const reserve = task.mode === "text" ? 0.06 : 0.55;
    if (!fitsStage(results.requestReservationsUsd, reserve))
      throw Error("Stage reservation bound");
    const item = {
      ...task,
      status: "reserved-before-request",
      reservedUsd: reserve,
      startedAt: new Date().toISOString(),
    };
    results.requestReservationsUsd += reserve;
    results.tasks.push(item);
    save();
    const url = `http://127.0.0.1:${task.arm === "baseline" ? 3114 : 3115}`;
    const request = bundle.find(
      (r) => r.case === task.case && r.arm === task.arm && r.mode === task.mode,
    );
    const started = performance.now();
    if (task.mode === "text") {
      const c = [
        ...JSON.parse(
          fs.readFileSync("evaluations/situated-support-20261104.json", "utf8"),
        ).cases,
        ...JSON.parse(
          fs.readFileSync(
            "evaluations/situated-support-heldout-20261104.json",
            "utf8",
          ),
        ).cases,
      ].find((c) => c.id === task.case);
      const res = await fetch(url + "/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: url },
        body: JSON.stringify({
          messages: [{ role: "user", content: c.input }],
          language: c.language,
          intent: c.intent,
          useMemory: false,
        }),
        signal: AbortSignal.timeout(45000),
      });
      item.httpStatus = res.status;
      item.result = await res.json();
      item.status = res.ok ? "completed" : "failed";
      if (
        res.ok &&
        item.result.provenance?.model !== plan.models.text.requestedId
      ) {
        item.status = "failed";
        item.failure = "Reported model drift";
      }
    } else {
      const fixture = fixtures.fixtures.find((f) => f.id === task.case);
      const response = await runVoiceSession(browser, {
        url,
        expected: request.request,
        fixture: {
          ...fixture,
          path: path.join(root, "test-results/situated-audio", fixture.file),
        },
      });
      if (response.evidence?.recordingBase64) {
        fs.writeFileSync(
          path.join(out, `${task.order}-${task.arm}-${task.case}.webm`),
          Buffer.from(response.evidence.recordingBase64, "base64"),
          { mode: 0o600 },
        );
        delete response.evidence.recordingBase64;
      }
      Object.assign(item, response);
    }
    item.wallSeconds = (performance.now() - started) / 1000;
    item.finishedAt = new Date().toISOString();
    save();
    console.log(
      JSON.stringify({
        order: item.order,
        case: item.case,
        arm: item.arm,
        mode: item.mode,
        status: item.status,
        reservedUsd: results.requestReservationsUsd,
      }),
    );
    if (item.status !== "completed")
      throw Error("Stopped on delivery failure; no retries");
  }
  results.status = results.tasks.some((t) => t.status !== "completed")
    ? "finished-with-preserved-delivery-failure; semantic assessment pending"
    : "completed; semantic assessment pending";
})()
  .catch((error) => {
    results.status = "stopped";
    results.failure = { name: error.name, message: error.message };
    const current = results.tasks.at(-1);
    if (current?.status === "reserved-before-request") {
      current.status = "failed-or-uncertain";
      current.failure = results.failure;
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    for (const child of servers) child.kill("SIGTERM");
    results.finishedAt = new Date().toISOString();
    if (fs.existsSync(out)) {
      save();
      updateStage(results.status);
    }
    console.log(
      JSON.stringify({
        status: results.status,
        requests: results.tasks.length,
        requestReservationsUsd: results.requestReservationsUsd,
        failure: results.failure,
      }),
    );
  });
