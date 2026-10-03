import {
  guard,
  boundedBody,
  provider,
  failure,
  HttpError,
  key,
} from "@/src/lib/server";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    guard(req);
    key();
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data"))
      throw new HttpError(400, "An audio recording is required.");
    const bytes = await boundedBody(req, 8 * 1024 * 1024);
    const form = await new Response(bytes, {
      headers: { "Content-Type": contentType },
    }).formData();
    const audio = form.get("audio");
    if (
      !(audio instanceof File) ||
      !audio.size ||
      audio.size > 7 * 1024 * 1024 ||
      !["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"].some((t) =>
        audio.type.startsWith(t),
      )
    )
      throw new HttpError(400, "Use a supported audio recording under 7 MB.");
    const upstream = new FormData();
    upstream.set("file", audio);
    upstream.set(
      "model",
      process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
    );
    const res = await provider("audio/transcriptions", upstream, req);
    const data = await res.json();
    if (typeof data.text !== "string" || data.text.length > 6000)
      throw new HttpError(
        502,
        "The transcript could not be read. Try a shorter recording.",
      );
    return Response.json(
      { text: data.text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
