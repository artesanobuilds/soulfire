# Bounded BB design comparison — discovery checkpoint

Date: October 24, 2026. No design-review threads launched yet. No comparison outcome or model ranking is claimed.

## Verified catalog

Existing installed BB CLI: `/Users/miguelalvarado/Coding/AI-native/bb/node_modules/.bin/bb`, version **0.42.1**. Read-only discovery used the existing server at `http://127.0.0.1:38886`.

| Harness | Exact catalog model ID | Catalog display name | Availability / run status |
|---|---|---|---|
| Codex | `gpt-6-astra` | GPT-6-Astra | available; default catalog model; not launched |
| Claude Code | `claude-fable-5-1` | Fable 5.1 | available; not launched |
| Claude Code | `claude-opus-5[1m]` | Opus 5 (1M) | available; not launched |

Installed native CLI versions: Codex **0.154.0**, Claude Code **2.1.310**. The spoken names “Fable Python 1” and “Opus Python 5” plausibly refer to the catalog entries above; that interpretation is not proof of the user's exact intended model variants. The actual IDs are recorded rather than invented.

## Exact blocker

The BB CLI's `guide agent-configuration` states that the shared data-directory `AGENTS.md` is appended to every provider-backed thread. Inspection found unrelated personal/account/project notes in that file. The user's scope permits only a minimal soulfire design brief, excluding private notes and unrelated files. The documented `thread spawn` surface exposes no per-thread suppression of those global instructions. Native provider memory is also documented as enabled by default, with shared provider settings rather than a per-thread CLI control.

Therefore no prompt or attachment was sent to a provider and no thread was created. No credentials, subscriptions, shared settings or global instruction files were changed. A separate BB server was not provisioned, because it would introduce new local host-enrollment/configuration state beyond the requested existing setup.

Follow-up read-only checks of `guide providers`, `thread spawn --help`, project/environment options and plugin configuration did not reveal a supported per-project/per-thread context override. A project AGENTS.md appends to, rather than replaces, global instructions. No substitute harness was used.

The smallest proposed configuration change requiring approval is a temporary separate BB instance using the documented `bb-app --data-dir <temporary-directory> --server-bind-host 127.0.0.1 --server-port <unused-port> --host-daemon-port <unused-port> start`, with a sanitized review-only project and provider-native memory disabled **in that instance**. Do not copy the shared global notes or change the existing instance. This creates new local host-enrollment/configuration state; approval is needed before doing so under the current no-credentials/no-shared-settings boundary. Existing provider authentication should be reused only through the supported mechanism, without copying or exposing keys. Isolation must then be verified before sending any brief.

## Prepared comparison protocol

Every reviewer receives the same [minimal brief](brief.md), independently, with no repository files or personal reflections. Request design only, no tools/file edits, no native subagents. Record actual selected model, completion status, final output and any limitation. Compare concrete recommendations on agency, information architecture, originality, consent clarity, recovery and accessibility. Identify disagreements rather than counting votes or pretending a single design trial proves one model is objectively best.

Current [journey proposal](journeys.md) is the implementation owner's baseline, informed by repository state and supplied research. It is not a completed multi-model synthesis. Once independent outputs exist, retain them verbatim in separate files and add a decision log of accepted/rejected ideas with reasons.
