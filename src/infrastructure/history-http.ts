import { createHash, randomBytes } from "node:crypto";
import { HistoryError } from "../domain/history";
import { guard, HttpError, failure } from "../lib/server";
export function historyOwner(req: Request) {
  const token = req.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("soulfire_history="))
    ?.slice(17);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return createHash("sha256").update(token).digest("hex");
}
export function historyGuard(req: Request, mutation = false) {
  guard(req, false);
  if (
    req.headers.get("sec-fetch-site") === "cross-site" ||
    (mutation && !req.headers.get("origin"))
  )
    throw new HttpError(403, "Open soulfire locally to manage history.");
}
export function requiredOwner(req: Request) {
  const owner = historyOwner(req);
  if (!owner)
    throw new HttpError(
      401,
      "Open History first to establish this browser’s local access.",
    );
  return owner;
}
export function historyJson(data: unknown, issueCookie = false) {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (issueCookie) {
    const token = randomBytes(32).toString("base64url");
    headers["Set-Cookie"] =
      `soulfire_history=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000`;
  }
  return Response.json(data, { headers });
}
export function historyFailure(e: unknown) {
  return failure(
    e instanceof HistoryError ? new HttpError(e.status, e.message) : e,
  );
}
