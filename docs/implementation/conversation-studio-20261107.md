# Conversation-first Soulfire studio

Local implementation on `feature/conversation-first-studio-20261107`, based on unified candidate `113e58a`. The original running checkout was not switched or restarted. Its existing mapping changes were preserved; the separately requested Step Three–Twelve clarifications have been added there and to the candidate map/runtime.

## Experience

- The first submitted message starts a conversation, not an automatic exercise. Text and finalized voice turns stay visible in a scrollable multi-turn chat.
- Desktop places the animated landscape on the left, conversation in the middle, and an optional practice on the right. Smaller screens stack the surfaces; a View practice shortcut brings the practice into view. Motion preferences and reduced-motion settings remain respected.
- Validated conversational replies may include an exercise, Current or meditation **offer**. This reveals a choice without generating an exercise, music, or audio in the background. Accepting an exercise requests the existing validated practice schema; Current/meditation open their existing tools and require their normal explicit controls.
- Offers work while another practice is open. Not now dismisses and suppresses that offer kind for this session; the optional-practices menu remains available. Start fresh resets that suppression with the conversation.
- Private practice fields remain local unless selected for explicit reflection. Selected answers are sent for that one reflection only, not appended to later conversation or live-voice context. Private working notes are not silently transferred to Current or Ember.
- Existing exercise controls remain available for steps 1, 3, 10 and 11. Conceptual guidance spans all twelve steps. Conversational inventory suggestions do not imply a dedicated Step Four interactive worksheet exists.

## Streaming contract

`POST /api/companion` retains its JSON response for existing callers. `Accept: text/event-stream` opts into:

- `message_delta`: provisional incremental text from the provider's structured `message` field.
- `result`: the complete validated result, including an optional practice offer and opt-in history save status.
- `error`: a sanitized message and HTTP-equivalent status for recovery, including invalid history sessions.

The frontend renders provisional text separately from committed conversation. An invalid, refused, incomplete, timed-out or truncated response restores the draft and discards provisional text. Stop invalidates the request generation and aborts upstream, so a late response cannot replace a practice. No practice payload is used until final validation. Streamed text itself is provisional, not a clinical safety guarantee.

The backend preserves localhost protection, bounded inputs, per-process limits, safety checks, no automatic retries and the 2,200-token output cap. The endpoint has a 45-second timeout. Provider metadata and raw errors are not forwarded. Only final validated assistant turns enter opt-in history; private reflection requests remain excluded. An invalid saved session pauses history locally so conversation can continue without repeatedly submitting an invalid identifier.

## Wisdom

See [source coverage and limits](conversation-wisdom-20261107.md). The complete curated project knowledge is supplied on every model turn, including the first, with tentative step mapping behind the scenes. It is an explicitly sourced synthesis, not verbatim ingestion of all documents. The subsequent [reviewed public wisdom integration](../wisdom-vault/RUNTIME-REVIEW.md) adds 22 approved conceptual summaries without exposing the private Vault.

## Validation and remaining gates

Tests use synthetic requests and mocked provider/media transports or a credential-free isolated localhost server. They do not establish live model quality, clinical benefit, physical microphone behavior, or successful paid music generation. No new paid inference, publication, push, or production deployment is performed.

Final command results and exact counts are recorded in the task completion report. Relevant coverage includes incremental stream boundaries, escaped JSON and UTF-8, refusal/incomplete/truncated output, cancellation, sanitized errors, invalid-history recovery, first-turn conversation, multi-turn context, offer dismissal, active-practice offers, private field exclusion, desktop/mobile layout, arrival playback controls and urgent-support presentation.

### Verification checkpoint

- TypeScript, ESLint and whitespace checks passed.
- Conversation/arrival/support/HTTP coverage: 54 passed, followed by a 12-case conversation-only rerun covering two additional desktop/mobile regression pairs. Across those two runs, 58 distinct browser cases passed.
- Legacy adapted chat/media coverage: 229 distinct browser cases passed; 13 skipped (12 require prebuilt dynamic synthesis fixtures, one is mobile-only behavior on the desktop project). This is not an all-tests-unconditionally-passed claim.
- Latest unit checkpoint before final step wording review: 354 tests passed in 32 files.
- The larger wisdom prompt no longer fits the historical paid comparison plan. No allocation was increased. The obsolete prompt-size assumption was replaced by a regression proving the actual unchanged ledger rejects the expanded prompt under its $0.10 text-attempt allocation, with zero reservations/attempts recorded. Any new live comparison needs a fresh reviewed plan and authorization.

Chat-launched Current/Ember open in the right pane with an Expand workspace control. Top-navigation Current/Ember retain their original standalone layouts and player visibility. Browser screenshots reviewed at desktop and mobile sizes use fictional text, never personal reflection content.

Production-build checkpoint (through approved Step Seven wording): `npm run build` passed, including its TypeScript/lint stages; full unit suite 356/356 passed. The resulting credential-free local production server then passed all 26 desktop/mobile conversation and support-presentation checks. The isolated test server was stopped afterward; the user's existing port-3100 app was not restarted or replaced.

Final handoff checkpoint, including approved Step Eight wording: production build (with type/lint stages), full unit suite **357/357 in 32 files**, and whitespace checks passed. The prior 26-case production browser smoke covers unchanged UI/streaming/support code; Step Eight adds source guidance and deterministic tests only. No server from this task remains running.

## Step Nine targeted checkpoint

After the Step Three–Nine additions, 37 targeted tests passed across wisdom, instruction snapshots and voice-parity adapters; typecheck, scoped lint and diff checks for both source-map checkouts passed. This is a later targeted checkpoint, not a claim that the earlier full build/browser run included Step Nine. No paid inference or server changes were made. Step Nine links responsible repair to releasing control over the response, with optional real-time acknowledgment and changed conduct, not repeated apologies or unsafe contact.

## Step Ten targeted checkpoint

After the Step Ten refinement, 38 targeted tests passed across wisdom, instruction snapshots and voice-parity adapters; typecheck, scoped lint and both source-tree diff checks passed. Daily mini-inventory is primarily Ten; Nine can accompany it as a reference to discern whether repair is appropriate, without assumed harm or pressure. Actual repair remains contingent on conduct, impact, choice and safety. This validates the prompt/source contract, not live-model routing or a new full-build/browser run.

Full unit follow-up through Step Ten: **359/359 tests in 32 files** passed with provider credentials disabled; matching Step Ten additions were verified in both mappings. This supplements the targeted contract checks, not a live model-routing evaluation.

## Step Eleven targeted checkpoint

After the early-meditation expansion, 47 targeted tests passed across wisdom, instruction snapshots, voice-parity adapters and Ember; typecheck, scoped lint and both source-tree diff checks passed. Verified current Ember choices are 2/5/10/15/20 minutes and quiet timer choices 1/2/5; the optional 30-minute aspiration is not a builder setting. Tests verify source/prompt contracts and existing tool behavior, not live-model quality, clinical outcomes or a new full-build/browser run.

Full unit follow-up through Step Eleven: **360/360 tests in 32 files** passed with provider credentials disabled; matching Step Eleven additions were verified in both mappings. These are deterministic source/contract checks, not a live meditation or model-quality evaluation.

## Step Twelve targeted checkpoint

After the Step Twelve expansion, 41 targeted tests passed across wisdom, instruction snapshots and voice-parity adapters; typecheck, scoped lint and both source-tree diff checks passed. Proactive Twelve uses explicit current-context exposure to all 1–11 or explicit self-report of familiarity; unknown/incomplete exposure suppresses the invitation. This is prompt guidance, not deterministic enforcement or persisted exposure tracking. Direct questions, ordinary service/help and human/urgent support remain available. Global no-ladder guidance now explicitly preserves this proactive-only exception. No live-model quality or new full-build/browser validation is claimed.

Final checkpoint through all approved Step Three–Twelve refinements: **362/362 unit tests in 32 files**, production build (including typecheck/lint) and whitespace checks passed with provider credentials disabled. Matching Step Twelve additions were verified in both mappings. Prior browser checkpoints cover unchanged UI/streaming code. The Twelve exposure condition is current-context/self-report prompt guidance, not persisted progress tracking or deterministic enforcement. No live inference, server restart, deployment, commit or push was performed. Private Wisdom Vault integration remains the separate next phase.
