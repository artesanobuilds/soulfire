import { z } from "zod";
import { memoryContentSchema, MemoryConflict } from "@/src/domain/memory";
import { localMemory } from "@/src/infrastructure/sqlite-memory";
import { guard, jsonBody, failure, HttpError } from "@/src/lib/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const revision = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER - 1);
function check(req: Request, mutation = false) {
  guard(req, mutation);
  if (
    req.headers.get("sec-fetch-site") === "cross-site" ||
    (mutation && !req.headers.get("origin"))
  )
    throw new HttpError(403, "Open the local soulfire page to manage memory.");
}
const response = (data: unknown) =>
  Response.json(data, { headers: { "Cache-Control": "no-store" } });
function failed(e: unknown) {
  return failure(
    e instanceof MemoryConflict ? new HttpError(409, e.message) : e,
  );
}
export async function GET(req: Request) {
  try {
    check(req);
    return response(await localMemory().read());
  } catch (e) {
    return failed(e);
  }
}
export async function PUT(req: Request) {
  try {
    check(req, true);
    const input = z
      .object({
        consent: z.literal(true),
        expectedRevision: revision,
        content: memoryContentSchema,
      })
      .strict()
      .parse(await jsonBody(req, 5000));
    return response(
      await localMemory().replace(input.content, input.expectedRevision),
    );
  } catch (e) {
    return failed(e);
  }
}
export async function DELETE(req: Request) {
  try {
    check(req, true);
    const input = z
      .object({ expectedRevision: revision })
      .strict()
      .parse(await jsonBody(req, 1000));
    return response(await localMemory().delete(input.expectedRevision));
  } catch (e) {
    return failed(e);
  }
}
