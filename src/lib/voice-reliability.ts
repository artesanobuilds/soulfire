// Keep diagnostics to fixed categories: provider payloads may contain private content.
export function classifyVoiceError(error: unknown): {
  fatal: boolean;
  category: string;
} {
  const code =
    error && typeof error === "object" && "code" in error
      ? error.code
      : undefined;
  if (code === "response_cancel_not_active")
    return { fatal: false, category: "cancel-race" };
  if (code === "rate_limit_exceeded")
    return { fatal: true, category: "rate-limit" };
  if (code === "server_error") return { fatal: true, category: "service" };
  return { fatal: true, category: "unknown" };
}

// A transport-open event may precede the server's effective configuration.
// Require observable audio readiness, not an assumed successful SDP request.
export function voiceSessionIsReady(session: unknown): boolean {
  const value = session as {
    model?: unknown;
    max_output_tokens?: unknown;
    audio?: {
      input?: {
        transcription?: { model?: unknown } | null;
        turn_detection?: {
          type?: unknown;
          create_response?: unknown;
          interrupt_response?: unknown;
        };
      };
      output?: { voice?: unknown };
    };
  } | null;
  const transcription = value?.audio?.input?.transcription?.model;
  const vad = value?.audio?.input?.turn_detection;
  return (
    typeof value?.model === "string" &&
    value.model.length > 0 &&
    value.max_output_tokens === 900 &&
    typeof transcription === "string" &&
    transcription.trim().length > 0 &&
    value.audio?.output?.voice === "marin" &&
    vad?.type === "server_vad" &&
    vad.create_response === true &&
    vad.interrupt_response === true
  );
}
