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
