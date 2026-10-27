# Local conversation history and Witness mode

Implemented 2026-10-24 in `/Users/miguelalvarado/Coding/soulfire`. Preview: http://127.0.0.1:3100. This is a local prototype; no push, deployment, external logging service, credentials or billing changes were made for this slice.

## Try it

Open **History**, explicitly consent, then **Start saving future turns**. The composer shows History on/off and Stop saving. Only turns submitted after this choice are captured. Live voice uses the same visible setting. Return to History to select a session, assess assistant responses as Spot on/Not quite, add a note, export JSON, or confirm deletion. Recording is off again after reload; existing history remains reviewable in the same browser profile.

Open **Simulations**. Choose a scenario/persona, Text or Voice, and Witnessed or Background. Check Save this synthetic run and launch. The default engine is a deterministic fixture. Choose **Model-generated conversation** with explicit paid consent for dynamically generated user/guide turns. In Voice mode, each saved turn is synthesized locally before playback. Voice plays alternating local Kokoro `am_michael` (synthetic user) and `af_heart` (guide), with the corresponding turn highlighted. Controls offer pause, stop, mute, gesture retry, saved-turn replay and review/feedback. Music ducks while a simulation voice is playing. Background mode is silent and never opens the microphone.

Background runs are bounded jobs owned by the running local Node server. They continue after closing the studio or browser tab; a tab neither plays sound nor opens a microphone in background mode. Reopening can monitor the existing job. A server/process restart does not automatically resume paid work: saved cursor/state remains visible, and explicit Resume invalidates any old claim before continuing. The job registry is process-local, not a distributed durable queue. A paused audio turn has already been saved: Resume continues with the next turn; Replay is available for hearing saved turns again. The ten-minute run window can expire while paused.

## What the evidence means

| Mode | Actual behavior | Evidence it does not provide |
| --- | --- | --- |
| Fixture text | Four pre-authored fictional utterances, durable events | Model quality or live generation |
| Fixture voice | Same deterministic turns plus two locally generated voice clips | Realtime input, speech recognition, live-agent audio round trip |
| Model-generated text | Model generates fictional user, then the actual companion application generates guide responses; max four requests | Speech/audio-path behavior or real-user usefulness |
| Model-generated voice | Same dynamic model turns, synthesized locally with two Kokoro voices and privately cached for replay | Live speech recognition, Realtime speech-to-speech or microphone acceptance |
| Real conversation history | Submitted text and final browser Realtime transcript events, when consented | Proof an entire generated audio response was heard |

Fixture voice uses existing installed Kokoro-82M tooling, with provenance/durations/levels in `public/audio/simulations/manifest.json`. Eight clips were generated locally. Browser tests decode/play them silently; no direct listening or physical speaker quality assessment is claimed. No personal microphone audio, real conversation content or paid model request was used for this validation.

Model-generated voice is now implemented as **model-generated conversation + synthesized playback**, distinct from fixture replay and from speech-to-speech testing. The existing live text adapter generates both roles; local Kokoro synthesizes each finalized synthetic turn. Both live text and dynamic-voice orchestration were validated with mocked provider responses. No paid provider simulation or real Realtime speech-to-speech simulation was executed.

## Bounded live text

The UI requires an explicit paid-request checkbox before live text launch. Limits: four total provider reservations even across interruption/retry, 400 output tokens/request, a ten-minute run window, 45-second provider deadline, no automatic retries, at most 60 KB serialized request, and a $0.10 estimated reservation ceiling in the UI. The CLI supports a chosen ceiling up to $0.25. Input cost uses conservative byte-count estimation plus framing allowance. Reservations are retained after canceled calls. This is not an account billing cap and does not assert actual billed usage.

`OPENAI_MODEL` selects the existing server-side provider model. The default gpt-4.1-mini rate book uses $0.40 input / $1.60 output per million tokens, checked against the [official model page](https://developers.openai.com/api/docs/models/gpt-4.1-mini) on 2026-10-24, and expires 2026-11-24. That page also marks the model deprecated: availability requires a deliberate future live check and model decision; this task did not silently switch the working app’s model. Unknown models or an expired rate book require verified positive `SOULFIRE_SIM_INPUT_USD_PER_MILLION` and `SOULFIRE_SIM_OUTPUT_USD_PER_MILLION` server configuration. No environment file was modified.

## Reproducible CLI

From the authoritative project, these commands use only fixtures and do not load the key:

```sh
npm run simulate -- --scenario first-presentation --mode text --runs 1
npm run simulate -- --scenario gentle-boundary --mode voice --runs 1
```

Outputs default to `~/Library/Application Support/soulfire-simulations/<run-id>/result.json` and `import.json`, plus a separate synthetic SQLite store. Fixture voice CLI output means simulated voice events; live voice CLI also caches synthesized speech. The CLI does not play or capture audio. Use History’s synthetic-import chooser to review/rate an `import.json` in the app. Imported claims are labeled `imported-synthetic`, with original source recorded as a claim rather than trusted proof. IDs and ownership are newly assigned by the server.

Optional live command, **not executed during implementation**, incurs API charges only when deliberately launched:

```sh
npm run simulate -- --live --confirm-paid --scenario first-presentation --mode text --runs 1 --max-cost-usd 0.10
```

Change `--mode text` to `--mode voice` for local Kokoro synthesis of each model-generated turn; this also requires the existing local TTS installation.

Live CLI loads only the existing local environment through Next’s loader. It permits one run, with a three-minute CLI abort deadline and the same per-request/reservation bounds. Fixture CLI allows one to three runs. Scenario version, application/prompt version, engine, actual reported model, saved transcript, state, cursor and estimated reservations are retained. A reservation counter is not proof a network call reached the provider.

## Storage, consent and privacy

- `~/Library/Application Support/soulfire/history.sqlite` is separate from `memory.sqlite`. `SOULFIRE_DATA_DIR` supports isolated storage outside the checkout. The directory is created with mode 0700 and database with 0600; storage is plaintext, not encrypted.
- Current processing, personalization memory, saved practice answers, history and export are distinct choices. No existing reflection/draft/history was imported or scanned. Enabling history never bulk-copies prior browser conversation state.
- A random HttpOnly SameSite=Strict local cookie is hashed to derive ownership. Callers cannot select an owner. Every read/update/delete/run checks it. This is a local capability, not multi-user authentication. Anyone with the same browser/Mac access may read history. Clearing the cookie loses access; there is no account recovery.
- Store only newest submitted text plus validated response, or finalized voice transcript events; dictation stays an editable unsaved draft until Send. Private reflection-sharing requests are excluded. No raw real audio, unsent inputs, credentials or operational request bodies are logged. Common credential patterns are redacted on persistence; this is not comprehensive secret detection.
- Voice messages keep provider item/response IDs when available, client order, receipt sequence, channel, role, model configuration and provenance. Server IDs are assigned separately. Final transcript is not proof of playback: it is labeled playback unknown; interruption is a separate lifecycle event. Browser messages are untrusted client-reported evidence, not provider attestation.
- Thirty-day retention is based on session creation and enforced on storage access, not a scheduled background task. Up to 100 sessions per owner and 200 events per session; bounded event batches and content lengths. Delete cascades events, feedback and simulation state. SQLite secure-delete is enabled; exports, filesystem snapshots and external backups are not erased by app deletion.
- Export is explicit JSON download. Nothing is sent to Phoenix, Langfuse or other analysis systems. Feedback is a user’s usefulness assessment, not clinical efficacy.

## Architecture and replacement seams

`domain/history.ts` and `domain/simulation.ts` define validated records and repository contracts. `application/recorded-companion.ts` wraps the existing companion and captures server-side submitted turns. `application/simulations.ts` coordinates the bounded loop and `SyntheticUserAdapter`; it never gets real-user history or memory. `infrastructure/simulation-model.ts` decorates the provider transport with token/cost/count bounds. All generated content is validated data; it cannot select identities, delete permission, navigation or execute HTML/JS.

`SqliteHistoryRepository` implements history and simulation repositories. Version 1 creates sessions/events; version 2 adds simulation runs; version 3 adds private synthetic audio BLOBs with cascading deletion, without changing prior records. Event keys make identical intake idempotent and conflicting replay an error. Transactional receipt sequence and server turn IDs preserve ordering. Feedback uses optimistic revisions. Simulation cursor plus claim token rejects duplicate starts, stale completion after pause/stop/delete, and overlapping work for the same run. Abort signals stop the request; claim invalidation prevents a canceled result from being stored even if the provider finishes anyway.

A Postgres replacement should implement both contracts and run the same ownership/idempotency/deletion/restart tests. Translate SQLite `BEGIN IMMEDIATE`, JSON payloads, time/boolean types, foreign keys and PRAGMA behavior deliberately; use row locks or conditional updates for cursor/claim/reservation transitions, preserve unique keys and revision checks, and test concurrency with multiple connections. Authentication, migrations, retention jobs and encrypted backup policies are additional pilot work, not an effortless connection-string swap.

## Validation and limits

- 75 unit tests passed, including migration, ownership, retention, redaction, import provenance, feedback revisions, deletion/stale writes, duplicate intake, cancellation, four-request retry ceiling and a mocked complete live-text loop.
- Lint and TypeScript passed. Isolated production build passed.
- Full desktop/mobile regression: 112 passed. Latest targeted history/Witness pass: 12 passed. Tests use a keyless isolated server, simulated Realtime events, synthetic transcripts and real decoding of fixture clips in muted isolated Chrome. The user’s active Chrome window was not controlled.
- Evidence: `docs/implementation/evidence/history-restart.json`, final check report, and `docs/design/history-witness-review/` screenshots. Production/restart results are recorded after execution, not inferred from unit tests.
- Not verified: paid live simulation/model usefulness, real microphone-to-provider-to-speaker round trip, direct audio audition, Safari/iOS/Android, distributed/serverless job execution, multi-user/pilot authorization or clinical benefit.

## Executed durable fixture examples

Both completed four turns with zero provider requests and zero reserved cost:

- Text: `~/Library/Application Support/soulfire-simulations/d2a83b38-549b-42c1-8c0c-36eacb36c612/`
- Voice events: `~/Library/Application Support/soulfire-simulations/a295fa3a-1e8e-4f5c-b78e-9ac9387bdddb/`

Each contains `result.json` and `import.json`. Production desktop/mobile checks imported the text file in isolated browser contexts, verified its imported provenance, and removed only their own synthetic sessions afterward. The user’s browser, history and saved answers were not inspected.

Final production verification passed both viewports with no page errors: fixture completion, feedback, export, confirmed delete and synthetic import. Key presence was recognized without exposing its value; all provider endpoints were blocked by the test. Server restart evidence confirms history/feedback survival, stable export, saved-cursor resume, and deletion after a second restart. See `evidence/history-final-checks.json`. The previous production build remains recoverable at `/tmp/soulfire-production-pre-history-20261024.next`.


## Dynamic voice and server jobs — second milestone

The local speech adapter sends only finalized **synthetic** text through stdin to the existing Kokoro Python environment. It does not inherit the OpenAI key or other credentials. It uses no shell, network TTS, microphone, browser speech default or temporary audio files. The default installation is `~/Coding/AI-native/tts`; `SOULFIRE_KOKORO_HOME` can identify another existing compatible installation. Missing tooling disables dynamic voice before any paid request; fixtures remain available. No package, voice model or external service was installed.

The user/guide voices are `am_michael`/`af_heart`. Synthesis is bounded to 3,000 characters, 90 seconds of execution, 120 seconds of resulting audio and 6 MB per WAV. Two synthesis jobs can run at once. Stop aborts the subprocess group; page navigation cancels witnessed work. Text is saved before synthesis, and a persisted pending-audio list distinguishes completed conversation generation from missing/canceled audio. Replay can retry local synthesis from saved text with no model request, or serve the cached WAV. The audio endpoint accepts only a session ID and turn index and retrieves the owner-scoped finalized text; callers cannot submit arbitrary TTS text or paths.

Generated synthetic WAVs are private BLOBs in the separate history database. They share its owner checks, retention and cascading deletion; they are not public assets or raw user recordings. Standard conversation export remains transcript/metadata JSON and does not include audio bytes. Replays never claim verified human listening. Generated content, TTS completion and actual audible playback remain distinct evidence.

`SimulationJobs` owns at most two local background jobs, at most one per browser owner. Each job retains the existing four-request/cost/ten-minute limits, independent of request/tab lifetime. Closing the tab leaves background work running silently. Pause/Stop/Delete abort server work; stale completions cannot restore deleted or canceled content. A server restart discards only the in-memory worker registry; stored turns/audio/claims survive and require explicit resume. This is designed for the current single local Node process, not serverless functions or a multi-process production deployment.

The new validation command below has no real provider transport and never loads credentials. It runs four mocked model turns through the background orchestrator, generates actual local speech, tests an actual child-process abort, and writes only synthetic evidence into isolated `/tmp` folders:

```sh
./node_modules/.bin/vite-node scripts/verify-synthetic-voice.ts --synthetic-only
```

Its browser fixture drives `tests/browser/dynamic-simulation.spec.ts` on the isolated keyless server. Those browser tests mock model HTTP turns while using real authenticated audio serving/cache and real browser decoding/playback. They also verify a background fixture completes after its page closes without browser step requests. This separation is intentional: it proves the orchestration/audio integration without claiming a paid live conversation or a real microphone round trip.


### Verified second-milestone results

- 83 unit tests, lint and TypeScript passed.
- Full desktop/mobile regression: 116 passed. Focused history/dynamic voice pass: 18 passed. After the final current-turn scrolling refinement, all 6 dynamic desktop/mobile checks passed again.
- Four mocked model turns passed through the real server-job orchestrator and local Kokoro, producing four alternating WAV clips in 6.335 seconds. An actual synthesis subprocess was aborted successfully. No paid provider calls.
- Browser decoding/playback, pause/stop/replay, sticky-control/current-turn visibility, and closing a replay were verified in isolated Chrome. Mocked HTTP model turns were paired with actual authenticated audio cache/serving. Direct listening remains unverified.
- An isolated production server retained identical generated audio bytes across restart, denied anonymous reads, and removed the audio across deletion/restart. A Stop request through the separate simulation route aborted actual synthesis and preserved the already-saved fictional transcript.
- A background run completed with no browser step requests after its page closed. Jobs remain limited to the running local Node process; restarting that process requires explicit resume.

Evidence: `evidence/dynamic-voice-local-synthesis.json`, `evidence/dynamic-voice-restart.json`, `evidence/dynamic-final-checks.json`; screenshots in `docs/design/history-witness-review/`. Model-driven voice is implemented; a paid live simulation, real microphone round trip, and subjective voice quality are not claimed as tested.

Final production desktop/mobile verification recognized the existing key and local Kokoro availability, confirmed the dynamic-voice paid-consent gate without launching a paid run, and passed fixture completion, feedback, export, delete and synthetic import with zero page errors. The final build is running on port3100. Source backup before this slice: `/tmp/soulfire-pre-live-voice-20261024/`; recoverable prior production builds: `/tmp/soulfire-production-pre-dynamic-voice-20261024.next` and `/tmp/soulfire-production-pre-final-witness-controls-20261024.next`. All authoritative source changes remain in `/Users/miguelalvarado/Coding/soulfire`; nothing was pushed.

For a future Postgres audio adapter, translate BLOBs deliberately to `bytea` or private object storage with owner-scoped access and transactional deletion/outbox cleanup. Keep the transcript/pending-audio record and cache identity consistent; object storage alone is not an equivalent repository migration.
