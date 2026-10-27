# Conversation logging: current integration map

October 24, 2026. Read-only implementation analysis for the Phoenix / Langfuse / own-backend comparison. No logging service, account, dependency, content capture or export was enabled. No personal transcript was inspected for this analysis.

| Source | Current event/data path | Potential seam, if separately approved |
|---|---|---|
| Typed or reviewed dictation submission | `Soulfire.send` builds a user message, calls `/api/companion`, and appends a validated assistant reply. Failed/canceled requests restore the draft. | Application-owned turn ID and accepted-submission/completed/failed/canceled events around `runCompanion`; do not infer successful generation from an optimistic UI append. |
| Model generation | `runCompanion` applies safety/consent, calls `ModelProvider`, validates the reply and returns model/response-ID provenance. Its optional observer is a no-op and accepts only outcome, duration and used-memory boolean. | Keep this metadata observer content-free. A separately consented conversation repository/export adapter can receive a reviewed turn record; do not silently widen the existing telemetry contract. |
| Dictation | Recorder Stop uploads audio to `/api/transcribe`; the returned final text is passed through `onDraft` into an editable conversation draft **or a private exercise/action field**. | Transcription completion is not permission to save conversation history. Log only a later explicit conversation submission, unless distinct draft-retention consent is introduced. Raw audio is not currently retained. |
| Live voice setup | `/api/realtime` exchanges SDP through the server. Browser WebRTC carries subsequent media directly to OpenAI. On opening the data channel, the browser seeds up to 20 existing submitted messages. | The setup route alone cannot capture the conversation. A new validated browser-to-local-backend event intake would be needed, or a separately evaluated supported provider-side event route. Do not assume server request tracing covers voice turns. |
| Live voice final transcripts | `VoiceControls.dc.onmessage` consumes `conversation.item.input_audio_transcription.completed` and `response.output_audio_transcript.done`. In-session deduplication uses `item_id + event.type`, then calls `onMessage({role, content})`. | Preserve event/item/response IDs before they are discarded, add app session/turn IDs and a schema version, validate and deduplicate in a durable server adapter. Final user/assistant transcript events can arrive independently; reconstruct order explicitly. |
| Voice lifecycle | Local epoch rejects stale callbacks. Connection state, 25-second setup timeout, ten-minute session cap, End, pagehide and navigation stop resources. Interrupt sends `response.cancel` and `output_audio_buffer.clear`. | Record metadata for connected/ended/interrupted/error and distinguish generated transcript from audio actually heard. A transcript completion does not prove full audible delivery. Do not store SDP, tokens, audio or provider error payloads as conversation content. |
| Existing history UI | React `messages` holds role/content in memory; an expandable transcript renders it. Some append paths retain a bounded recent window. There is no stable durable conversation/session ID or event sequence. | Build a versioned conversation/session/turn contract before adopting a vendor trace model. Capture only approved future turns; do not silently backfill existing private browser state. |

## What persists today

- Browser preferences: intro playback/completion, sound and motion.
- Optional browser saved practice: validated exercise, authored answers/action/reflection and position. This is **not** an analytics conversation log.
- SQLite memory: three short user-confirmed notes and an AI-use preference with revisions. It is **not** a conversation-history table. Existing notes must not be repurposed as blanket logging consent.
- Provider-side processing/retention is distinct from application storage. `store:false` does not establish zero provider retention.
- No application conversation content logger or analytics exporter is configured. Current test fixtures and metadata observers do not record user conversations.

## Contract and consent gaps to resolve before implementation

1. Separate permission to process a message now, retain conversation history, and export/use retained content for analysis. Existing microphone/AI/memory permissions do not cover all three.
2. Show recording-history status and provide inspect, pause, delete and export controls. Define whether pausing affects current in-flight turns and how failed deletion is reported.
3. Decide retention, location, access control, encryption/key ownership, backup deletion and redaction. The current localhost-only single-profile database is not a multi-user authorization system.
4. Use stable app-generated session/turn/event IDs, source (`text`, `dictation-reviewed`, `live-voice`), timestamps, consent version and lifecycle status. Preserve provider IDs as optional metadata; never trust client IDs to authorize access.
5. Make ingestion idempotent and bounded, with cancellation/retry semantics and honest offline state. A replayed event must not duplicate a turn. Distinguish interrupted/partial output from completed output.
6. Keep private practice fields, unsubmitted drafts, microphone audio and secrets out of default history. A live transcript may be imperfect and needs correction/provenance rather than being treated as a verbatim record.
7. Put the application-owned history contract behind an adapter. Phoenix or Langfuse would be optional analysis/trace destinations; the own-backend option would implement that contract locally. Their licensing, deployment cost, operational burden and deletion capabilities require the separate current-source comparison; this map makes no product recommendation yet.

The minimum future pilot would capture **synthetic** text and live-event fixtures through one consented turn repository, verify pause/delete/export and deduplication, then compare the same dataset across the selected options. No automatic instrumentation of raw prompts or audio should be enabled as a shortcut.
