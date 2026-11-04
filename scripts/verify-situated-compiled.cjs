/* eslint-disable @typescript-eslint/no-require-imports -- Node-only CommonJS evaluation harness. */
// Execute compiled production route functions with a capture-only transport.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const root = "/tmp/soulfire-situated-runtime-20261104";
const bundle = JSON.parse(
  fs.readFileSync(
    "test-results/situated-evaluation-offline-requests.json",
    "utf8",
  ),
);
process.env.OPENAI_API_KEY = "synthetic-transport-only";
process.env.OPENAI_MODEL = "gpt-6.1-sol";
process.env.OPENAI_REALTIME_MODEL = "gpt-realtime-2025-08-28";
process.env.OPENAI_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe-2025-12-15";
process.env.SOULFIRE_DATA_DIR = "/tmp/situated-compiled-data-20261104";
const voice = require(path.join(root, ".next/server/app/api/realtime/route.js"))
  .routeModule.userland.POST;
const text = require(path.join(root, ".next/server/app/api/companion/route.js"))
  .routeModule.userland.POST;
const captures = [];
global.fetch = async (url, request) => {
  assert.ok(
    url === "https://api.openai.com/v1/realtime/calls" ||
      url === "https://api.openai.com/v1/responses",
  );
  const mode = url.endsWith("/responses") ? "text" : "voice";
  const body =
    mode === "text"
      ? JSON.parse(request.body)
      : JSON.parse(request.body.get("session"));
  captures.push({ arm: process.env.SOULFIRE_EVAL_ARM, mode, body });
  if (mode === "voice") return new Response("v=0 synthetic captured SDP");
  return Response.json({
    model: "gpt-6.1-sol",
    output: [
      {
        content: [
          {
            type: "output_text",
            text: JSON.stringify({
              kind: "conversation",
              message: "Compiled route contract fixture, not model output.",
              exercise: null,
            }),
          },
        ],
      },
    ],
  });
};
const req = (body) =>
  new Request("http://localhost:3114/api/test", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3114",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
(async () => {
  const c = JSON.parse(
    fs.readFileSync("evaluations/situated-support-20261104.json", "utf8"),
  ).cases[0];
  for (const arm of ["baseline", "candidate"]) {
    process.env.SOULFIRE_EVAL_ARM = arm;
    const response = await text(
      req({
        messages: [{ role: "user", content: c.input }],
        language: c.language,
        intent: c.intent,
        useMemory: false,
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(
      (
        await voice(
          req({
            sdp: "v=0 " + "a".repeat(40),
            language: c.language,
            practiceTitle: "",
          }),
        )
      ).status,
      200,
    );
  }
  for (const capture of captures) {
    const expected = bundle.find(
      (r) =>
        r.case === c.id && r.arm === capture.arm && r.mode === capture.mode,
    ).request;
    if (capture.mode === "voice") assert.equal(capture.body.type, "realtime");
    const { type, ...withoutType } = capture.body;
    void type;
    assert.deepEqual(
      capture.mode === "voice" ? withoutType : capture.body,
      expected,
    );
  }
  const hashes = {};
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const p = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".js") || entry.name === "BUILD_ID")
        hashes[path.relative(root, p)] = crypto
          .createHash("sha256")
          .update(fs.readFileSync(p))
          .digest("hex");
    }
  }
  walk(path.join(root, ".next/server"));
  walk(path.join(root, ".next/static"));
  hashes[".next/BUILD_ID"] = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, ".next/BUILD_ID")))
    .digest("hex");
  const manifest = JSON.parse(
    fs.readFileSync("test-results/situated-runtime-manifest.json", "utf8"),
  );
  manifest.status = "built; compiled route capture verified";
  manifest.compiledHashes = hashes;
  manifest.baselineSourceSha256 = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, "src/lib/agent-baseline.ts")))
    .digest("hex");
  fs.writeFileSync(
    "test-results/situated-runtime-manifest.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  const result = {
    status: "passed",
    compiledRouteCaptures: captures.length,
    arms: ["baseline", "candidate"],
    networkCalls: 0,
    paidCalls: 0,
    assertions:
      "Exact text and voice payloads match frozen offline requests; only matched staged substitutions",
    compiledFilesHashed: Object.keys(hashes).length,
  };
  fs.writeFileSync(
    "test-results/situated-compiled-route-audit.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
