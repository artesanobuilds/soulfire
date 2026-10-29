import { z } from "zod";
import { join } from "node:path";
import { open, stat } from "node:fs/promises";
import { historyGuard } from "@/src/infrastructure/history-http";
import { failure, HttpError } from "@/src/lib/server";
import {
  musicCatalog,
  musicLabDirectory,
} from "@/src/infrastructure/music-lab-runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    historyGuard(req);
    const u = new URL(req.url);
    const id = z.string().uuid().parse(u.searchParams.get("id"));
    const mode = z
      .enum(["bed", "narration", "loop"])
      .parse(u.searchParams.get("mode"));
    const sample = (await musicCatalog()).find((s) => s.id === id);
    if (!sample)
      throw new HttpError(404, "This measured sample is not available.");
    if (sample.currentOnly && mode !== "bed")
      throw new HttpError(
        404,
        "This comparison render was not prepared for this Current piece.",
      );
    const file = join(musicLabDirectory(), "samples", id, mode + ".wav");
    const size = (await stat(file)).size;
    if (size > 100000000)
      throw new HttpError(
        413,
        "This audio render exceeds the local playback limit.",
      );
    let start = 0,
      end = size - 1,
      status = 200;
    const range = req.headers.get("range");
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match)
        throw new HttpError(416, "This audio range is not available.");
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), size - 1) : end;
      if (start > end || start >= size)
        throw new HttpError(416, "This audio range is not available.");
      status = 206;
    }
    const h = await open(file, "r");
    const bytes = Buffer.alloc(end - start + 1);
    try {
      await h.read(bytes, 0, bytes.length, start);
    } finally {
      await h.close();
    }
    return new Response(new Uint8Array(bytes), {
      status,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(bytes.length),
        "Accept-Ranges": "bytes",
        ...(status === 206
          ? { "Content-Range": `bytes ${start}-${end}/${size}` }
          : {}),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
