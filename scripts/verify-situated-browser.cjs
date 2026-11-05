/* eslint-disable @typescript-eslint/no-require-imports -- Node-only CommonJS evaluation harness. */
const { chromium } = require("playwright");
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const { runVoiceSession } = require("./situated-browser-session.cjs");
const requests = JSON.parse(
  fs.readFileSync(
    "test-results/situated-evaluation-offline-requests.json",
    "utf8",
  ),
);
const fixture = JSON.parse(
  fs.readFileSync("test-results/situated-audio/verified-manifest.json", "utf8"),
).fixtures[0];
fixture.path = "test-results/situated-audio/" + fixture.file;
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
  });
  const results = [];
  try {
    for (const config of [
      { arm: "baseline" },
      { arm: "candidate", failure: "pending" },
      { arm: "candidate", failure: "model-drift" },
    ]) {
      const expected = requests.find(
        (r) =>
          r.case === "shift-handoff" &&
          r.mode === "voice" &&
          r.arm === config.arm,
      ).request;
      const result = await runVoiceSession(browser, {
        url: "http://127.0.0.1:3114",
        expected,
        fixture,
        offline: true,
        failure: config.failure,
      });
      if (result.evidence?.recordingBase64)
        delete result.evidence.recordingBase64;
      assert.deepEqual(result.pageErrors, []);
      results.push({ ...config, ...result });
      fs.writeFileSync(
        "test-results/situated-browser-offline.json",
        JSON.stringify(
          { paidCalls: 0, syntheticTransport: true, results },
          null,
          2,
        ) + "\n",
      );
      if (config.failure === "model-drift") {
        assert.equal(result.status, "failed");
        assert.equal(result.evidence.welcomesSent, 0);
        assert.equal(result.evidence.responses.length, 0);
      } else {
        assert.equal(
          result.status,
          "completed",
          JSON.stringify(result.failure),
        );
        assert.equal(result.evidence.responses.length, 2);
        assert.equal(result.evidence.syntheticMicrophoneCalls, 1);
      }
      console.log(
        JSON.stringify({
          arm: config.arm,
          condition: config.failure || "ready",
          status: result.status,
          welcomesSent: result.evidence?.welcomesSent,
          responses: result.evidence?.responses.length,
        }),
      );
    }
  } finally {
    await browser.close();
  }
  console.log(
    "Offline browser harness: 3 expected outcomes verified; zero paid calls.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
