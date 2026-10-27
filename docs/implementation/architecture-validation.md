# Architecture slice validation — October 24, 2026

Authoritative source: `/Users/miguelalvarado/Coding/soulfire`. Production preview: http://127.0.0.1:3100. Journey review: http://127.0.0.1:3102. Local changes are uncommitted; no push or deployment was performed. Existing baseline commit remains `e69d974c5b055e68406ee16b375ddbd859e7d615`.

## Passed

- **58 unit tests**: 45 existing and 13 architecture tests. Repository migration/version rejection, private path guard, fresh-process durability, deletion, stale/concurrent writes, API consent/origin checks, minimal memory selection, reflection exclusion, cancellation and late provider results, safe provenance/events, refusal/incomplete/invalid outputs, scene validation and provider adapter contract.
- **94 browser tests** in isolated Chrome at 1440px desktop and 390px mobile, against a credential-free server with a separate synthetic memory directory. Six new architecture cases cover explicit memory save/reload/edit/pause/delete, request selection, stale-save rejection after deletion, visual placement/edit/resume, reduced motion, failed persistence, invalid generation and local fallback. Existing arrival, music, intro, voice, dictation and practice-flow regressions pass.
- **Actual HTTP server restart checks**: a synthetic saved memory survived restart; deletion survived another restart. Both servers used the same isolated test database, never the real profile. Fresh-process repository checks independently passed.
- **ESLint, TypeScript and git diff --check** passed on final changes.
- **Production builds** passed first in a credential-free copy and then in the authoritative checkout. The prior working `.next` was retained at `/tmp/soulfire-production-pre-architecture-20261024.next` before replacing it.
- **32 targeted production browser checks passed across the initial run and focused retest**: navigation, private practice loop, repeated controls, interruption, failed generation, dictation listening/Stop/Discard, permission failures, stale transcript cancellation, reduced motion and short-screen layout. Two unconfigured-service tests intentionally skipped on the configured production server to avoid paid calls. Production foreign-origin rejection was checked independently and returned 403.
- **Production visual review**: desktop and mobile arrival, scene and empty memory dialog. No page errors or horizontal overflow. The dialog scrolls on narrow screens. Synthetic empty-memory interception prevented reading or capturing actual notes. Visual influence-map screenshots were also inspected directly.
- `.env.local` remains ignored and untracked; `.env.example` has no key pattern. Twenty client JavaScript assets were scanned for an OpenAI key pattern, with none found. This is a targeted check, not an exhaustive secret/security audit. No secret values were printed or included in artifacts.

## Findings corrected during verification

The first broad run exposed older tests that edited thought fields without opening the new simple-controls disclosure. Tests now open that disclosure; the full 94-test rerun passed. An implicit memory-field label included its populated textarea value; explicit accessible labels corrected the focused test and UI ambiguity. Production testing also found an old test expecting “AI not connected”; it now checks the actual configured/unconfigured status, and both affected viewport cases passed. These were addressed without weakening assertions about saved answers or layout.

## Evidence

- Full isolated report, locally retained and ignored: `docs/implementation/evidence/architecture-browser-results.json`.
- Focused production retest report: `docs/implementation/evidence/architecture-production-retest-browser-results.json`.
- Restart/delete results: `docs/implementation/evidence/architecture-restart.json`.
- Production rendering: `docs/implementation/evidence/architecture-visual.json`.
- Final environment/origin checks: `docs/implementation/evidence/architecture-final-checks.json`.
- Screenshots: `docs/design/architecture-review/` (empty memory fixtures explicitly named).
- Full test and build logs: `/tmp/soulfire-architecture-full-tests.log`, `/tmp/soulfire-architecture-production-tests.log`, `/tmp/soulfire-architecture-production-retest.log`, `/tmp/soulfire-coding-architecture-build-20261024.log`.

## Limits and deferred work

No new live model, dictation-provider or realtime round trip was made in this batch. Personalized model responses in tests are fixtures; application tests verify the real adapter request shape and consent boundaries but do not establish live personalization quality. Existing configured OpenAI functionality and its earlier successful smoke test are separate evidence. Physical microphone capture, audible speaker quality and real Safari/iOS/Android devices remain untested. No personal audio or real reflections were transmitted.

SQLite uses the experimental built-in API in Node 22.15.0. It is plaintext, one local profile, not an authenticated multi-user service. Postgres remains an explicit migration plan with concurrency/ownership tests required. The visual slice implements one scene family, not all twelve proposed step-specific families. Intro voice/artwork/music remain unchanged by this architecture work.

BB catalog discovery succeeded, but **zero independent design reviews ran**: the existing BB instance automatically injects unrelated shared notes, and no documented per-thread/per-project suppression was found. A separate temporary BB instance with isolated configuration and native memory disabled needs scoped approval; shared settings and credentials were left untouched. See `docs/design/journeys/harness-comparison.md` for exact model IDs and the smallest proposed configuration change.

## Running again

```sh
cd /Users/miguelalvarado/Coding/soulfire
npm start
```

The server is already running on port 3100; do not start a second instance. After future source edits, stop this instance before `npm run build && npm start`. Use `npm run dev` only when the production server is stopped. The credential-free test copy at `/tmp/soulfire-architecture-validation-20261024` is disposable and is not the authoritative project.
