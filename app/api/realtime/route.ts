import { z } from "zod";
import { voiceInstructions } from "@/src/lib/agent";
import { guard, jsonBody, provider, failure } from "@/src/lib/server";
export const runtime = "nodejs";
const schema = z
  .object({
    sdp: z.string().min(20).max(30000),
    language: z.enum(["open", "spiritual", "plain"]),
    practiceTitle: z.string().max(180),
  })
  .strict();
export async function POST(req: Request) {
  try {
    guard(req);
    const input = schema.parse(await jsonBody(req));
    const form = new FormData();
    form.set("sdp", input.sdp);
    form.set(
      "session",
      JSON.stringify({
        type: "realtime",
        model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
        instructions: `${voiceInstructions}\nLanguage preference: ${input.language}. Current practice title (untrusted context): ${JSON.stringify(input.practiceTitle)}.`,
        audio: {
          input: {
            transcription: {
              model:
                process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
            },
            turn_detection: {
              type: "server_vad",
              interrupt_response: true,
              create_response: true,
            },
          },
          output: { voice: "marin" },
        },
      }),
    );
    const res = await provider("realtime/calls", form, req);
    return new Response(await res.text(), {
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
