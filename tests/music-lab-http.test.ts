import { it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET, POST, DELETE } from "../app/api/music-lab/route";
import { GET as audio } from "../app/api/music-lab/audio/route";
import { musicFixture } from "./fixtures/music-lab";
let folder = "";
beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), "soulfire-music-http-"));
  vi.stubEnv("SOULFIRE_MUSIC_LAB_DIR", folder);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(folder, { recursive: true, force: true });
});
const url = "http://localhost:3100/api/music-lab";
const id = "33333333-3333-4333-8333-333333333333";
it("does not create samples or initiate generation on catalog read", async () => {
  const res = await GET(new Request(url));
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.samples).toEqual([]);
  expect(
    data.models.find((m: { model: string }) => m.model === "stable").state,
  ).toBe("license-pending");
});
it("rejects cross-origin and missing-origin mutations before execution", async () => {
  for (const origin of [undefined, "https://example.com"]) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (origin) headers.Origin = origin;
    const r = await POST(
      new Request(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id,
          request: { model: "ace", style: "piano", seed: 101, seconds: 30 },
        }),
      }),
    );
    expect(r.status).toBe(403);
  }
});
it("retains the explicit Stable gate and rejects arbitrary request fields", async () => {
  const request = { model: "stable", style: "piano", seed: 101, seconds: 30 };
  const make = (body: unknown) =>
    new Request(url, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3100",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  const gate = await POST(make({ id, request }));
  expect(gate.status).toBe(409);
  expect((await gate.json()).error).toContain("explicit");
  expect(
    (await POST(make({ id, request: { ...request, command: "/bin/sh" } })))
      .status,
  ).toBe(400);
});
it("cancellation of a request not yet acknowledged is safely idempotent", async () => {
  for (let i = 0; i < 2; i++) {
    const res = await DELETE(
      new Request(url + "?job=" + id, {
        method: "DELETE",
        headers: { Origin: "http://localhost:3100" },
      }),
    );
    expect(res.status).toBe(200);
  }
  expect((await GET(new Request(url + "?job=not-a-uuid"))).status).toBe(400);
});
it("serves bounded byte ranges for known renders and refuses paths or arbitrary files", async () => {
  const sample = musicFixture();
  const dir = join(folder, "samples", sample.id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "sample.json"), JSON.stringify(sample));
  const bytes = Buffer.alloc(64);
  bytes.write("RIFF");
  await writeFile(join(dir, "bed.wav"), bytes);
  const res = await audio(
    new Request(url + "/audio?id=" + sample.id + "&mode=bed", {
      headers: { Range: "bytes=0-3" },
    }),
  );
  expect(res.status).toBe(206);
  expect(res.headers.get("Content-Range")).toBe("bytes 0-3/64");
  expect(Buffer.from(await res.arrayBuffer()).toString()).toBe("RIFF");
  expect(
    (
      await audio(
        new Request(url + "/audio?id=" + sample.id + "&mode=bed", {
          headers: { Range: "bytes=900-" },
        }),
      )
    ).status,
  ).toBe(416);
  expect(
    (await audio(new Request(url + "/audio?id=../../.env&mode=bed"))).status,
  ).toBe(400);
  expect(
    (await audio(new Request(url + "/audio?id=" + sample.id + "&mode=source")))
      .status,
  ).toBe(400);
});
