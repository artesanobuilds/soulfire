// Shared by the browser probe and offline Node tests. No network or file access.
function voiceContract(state, event, now, expected) {
  const stop = (reason) => {
    state.errors.push({ reason, at: now });
    return reason;
  };
  if (event.type === "session.created" || event.type === "session.updated") {
    const s = event.session || {},
      e = expected;
    state.sessions.push({ at: now, type: event.type, session: s });
    const input = s.audio?.input,
      output = s.audio?.output;
    if (
      s.model !== e.model ||
      s.instructions !== e.instructions ||
      s.max_output_tokens !== 900 ||
      output?.voice !== "marin" ||
      input?.turn_detection?.type !== "server_vad" ||
      input.turn_detection.silence_duration_ms !== 1500 ||
      input.turn_detection.interrupt_response !== true ||
      input.turn_detection.create_response !== true ||
      (s.tools || []).length > 0
    )
      return stop("Effective session drift");
    const transcription = input.transcription?.model;
    if (transcription == null && !state.ready) return null; // bounded initial settling only
    if (transcription !== e.audio.input.transcription.model)
      return stop("Transcription drift");
    state.ready = true;
  }
  if (event.type === "harness.outgoing") {
    const sent = event.event;
    if (
      sent.type === "conversation.item.create" ||
      sent.type === "session.update"
    )
      return stop("Unexpected client context/config mutation");
    if (sent.type === "response.create") {
      if (
        !state.ready ||
        state.welcomesSent !== 0 ||
        sent.response?.max_output_tokens !== 512 ||
        sent.response?.metadata?.purpose !== "welcome" ||
        !Array.isArray(sent.response?.input) ||
        sent.response.input.length !== 0
      )
        return stop("Unbounded or premature welcome");
      if (
        new TextEncoder().encode(sent.response.instructions || "").length > 1024
      )
        return stop("Welcome instruction byte bound exceeded");
      state.welcomesSent++;
    }
  }
  if (event.type === "response.created") {
    if (!state.ready) return stop("Response before effective configuration");
    if (state.responses.length >= 2) return stop("Unexpected extra response");
    const count = state.responses.length;
    if (count === 0 && event.response?.metadata?.purpose !== "welcome")
      return stop("First response is not welcome");
    if (
      count === 1 &&
      (!state.injection || now < state.injection.lastNonSilentAt - 100)
    )
      return stop("Response before user utterance completed");
    state.responses.push({
      id: event.response.id,
      createdAt: now,
      role: count === 0 ? "welcome" : "guide",
    });
    state.activeResponse = event.response.id;
  }
  if (event.type === "response.done") {
    const r = state.responses.find((r) => r.id === event.response?.id);
    if (!r) return stop("Unmatched response completion");
    Object.assign(r, {
      doneAt: now,
      status: event.response.status,
      usage: event.response.usage,
      output: event.response.output,
      statusDetails: event.response.status_details,
    });
    if (
      event.response.usage?.output_tokens > (r.role === "welcome" ? 512 : 900)
    )
      return stop("Output usage exceeded cap");
    if (event.response.status !== "completed")
      return stop("Incomplete or failed response");
  }
  if (
    event.type === "error" &&
    event.error?.code !== "response_cancel_not_active"
  )
    return stop("Provider error");
  return null;
}
function fitsStage(reserved, next) {
  return (
    Number.isFinite(reserved) &&
    Number.isFinite(next) &&
    next > 0 &&
    reserved + next + 0.25 <= 10.15 + 1e-9
  );
}
module.exports = { voiceContract, fitsStage };
