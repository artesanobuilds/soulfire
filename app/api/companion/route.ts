import { requestSchema, replySchema, outputJsonSchema } from "@/src/lib/schema";
import { safetyNotice } from "@/src/lib/safety";
import { instructions } from "@/src/lib/agent";
import {
  guard,
  jsonBody,
  provider,
  failure,
  HttpError,
} from "@/src/lib/server";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    guard(req);
    const input = requestSchema.parse(await jsonBody(req));
    const notice = safetyNotice(
      input.messages.filter((m) => m.role === "user").at(-1)?.content || "",
    );
    if (notice)
      return Response.json(
        {
          reply: { message: notice, kind: "support", exercise: null },
          provenance: { source: "Application safety notice" },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    const res = await provider(
      "responses",
      JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        store: false,
        instructions: `${instructions}\nCurrent language preference: ${input.language}. Current intent: ${input.intent}. ${input.step ? `Requested step: ${input.step}.` : ""}`,
        input: input.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        text: {
          format: {
            type: "json_schema",
            name: "soulfire_reply",
            strict: true,
            schema: outputJsonSchema,
          },
        },
        max_output_tokens: 2200,
      }),
      req,
      "application/json",
    );
    const data = await res.json();
    if (data.status === "incomplete")
      throw new HttpError(
        502,
        "The practice was incomplete. Try again; your current practice has not changed.",
      );
    const text = (data.output || [])
      .flatMap(
        (o: { content?: { type: string; text?: string }[] }) => o.content || [],
      )
      .filter((c: { type: string }) => c.type === "output_text")
      .map((c: { text: string }) => c.text)
      .join("");
    const reply = replySchema.parse(JSON.parse(text));
    return Response.json(
      {
        reply,
        provenance: {
          schemaVersion: 1,
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          source: "OpenAI Responses",
          references: [
            "creator-vision",
            "prototype-use-cases",
            "proposed-core-principles",
          ],
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
