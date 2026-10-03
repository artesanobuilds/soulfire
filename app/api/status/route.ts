export function GET() {
  return Response.json(
    { configured: !!process.env.OPENAI_API_KEY },
    { headers: { "Cache-Control": "no-store" } },
  );
}
