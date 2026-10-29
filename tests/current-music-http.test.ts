import { expect, it, vi } from "vitest";
import { musicFixture } from "./fixtures/music-lab";
import { defaultCurrentMusic } from "../src/domain/current-music";
const f = vi.hoisted(() => ({ start: vi.fn(), cancel: vi.fn(), get: vi.fn() }));
vi.mock("../src/infrastructure/music-lab-runtime", () => ({
  musicCatalog: async () => [musicFixture(), musicFixture("stable")],
  musicCataloguePolicy: async () => null,
  modelAvailability: async () => [{ model: "ace", ready: true }],
}));
vi.mock("../src/infrastructure/music-lab-jobs", () => ({
  startMusicJob: f.start,
  cancelMusicJob: f.cancel,
  getMusicJob: f.get,
}));
import { GET, POST, DELETE } from "../app/api/current/music/route";
const url = "http://127.0.0.1:3100/api/current/music";
const id = "11111111-1111-4111-8111-111111111111";
const post = (request: unknown) =>
  new Request(url, {
    method: "POST",
    headers: {
      origin: "http://127.0.0.1:3100",
      "content-type": "application/json",
    },
    body: JSON.stringify({ id, request }),
  });
it("returns only technically eligible ACE pieces", async () => {
  const r = await GET(new Request(url));
  expect(r.status).toBe(200);
  const d = await r.json();
  expect(d.samples).toHaveLength(1);
});
it("rejects mismatched palette, absent Current recipe and other model", async () => {
  for (const r of [
    {
      model: "ace",
      style: "ambient",
      seconds: 30,
      seed: 1,
      current: defaultCurrentMusic,
    },
    { model: "ace", style: "piano", seconds: 30, seed: 1 },
    {
      model: "stable",
      style: "piano",
      seconds: 30,
      seed: 1,
      current: defaultCurrentMusic,
    },
  ])
    expect((await POST(post(r))).status).toBe(400);
  expect(f.start).not.toHaveBeenCalled();
});
it("passes a bounded structured goal recipe to the worker", async () => {
  f.start.mockResolvedValue({ id, phase: "running" });
  const r = await POST(
    post({
      model: "ace",
      style: "piano",
      seconds: 30,
      seed: 1,
      current: defaultCurrentMusic,
    }),
  );
  expect(r.status).toBe(202);
  expect(f.start).toHaveBeenCalledWith(
    expect.objectContaining({ current: defaultCurrentMusic }),
    id,
  );
});
it("cross-site mutation cannot start or cancel local inference", async () => {
  const req = new Request(url, {
    method: "DELETE",
    headers: { origin: "https://example.com", "sec-fetch-site": "cross-site" },
  });
  expect((await DELETE(req)).status).toBe(403);
});
it("cancel-before-ack is passed through without losing the cancellation tombstone", async () => {
  f.get.mockReturnValue(undefined);
  const r = await DELETE(
    new Request(url + "?job=" + id, {
      method: "DELETE",
      headers: { origin: "http://127.0.0.1:3100" },
    }),
  );
  expect(r.status).toBe(200);
  expect(f.cancel).toHaveBeenCalledWith(id);
});
