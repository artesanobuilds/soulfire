# Bounded adapter pilot — prepared, awaiting paid authorization

This is the executable subset of the larger [baseline protocol](README.md). No vault candidate is accessed. Four **development** cases (unknown availability, supplied availability, actual correction, repeated uncertainty), two repeats, five arms: 40 units. There are 32 potential paid generations and eight local exact-text TTS outputs. All four held-out cases remain unused.

## Exact reservation envelope

| Paid arm | Maximum attempts | Allocation per attempt | Stage reservation |
|---|---:|---:|---:|
| Production text, actual builder + application validator | 8 | $0.10 | $0.80 |
| Matched spoken-delivery text | 8 | $0.10 | $0.80 |
| Native model with text input, audio output | 8 | $0.20 | $1.60 |
| Native model with complete recorded input, audio output | 8 | $0.20 | $1.60 |
| **Total** | **32** | | **$4.80** |

Proposed authorized ceiling remains **$5.00**; the unallocated $0.20 cannot fund extra calls. No retries, model substitutions or automatic continuation after delivery/configuration failure. Full allocations remain reserved even on failure, timeout, uncertain completion or very low reported usage. Allocations are ceilings, not expected charges or invoices. Ledger arithmetic uses fixed precision; it persists each reservation before opening provider transport and refuses a second execution/resume of that ledger.

The earlier tentative 24-attempt outline has been superseded **before any generation**. Actual request-size bounds fit $0.10 text and $0.20 native allocations, allowing the supplied-availability counterexample as a fourth case without increasing $4.80.

Price book checked against official pages on 2026-11-04: [Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [native realtime](https://developers.openai.com/api/docs/models/gpt-realtime), [transcriber](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe), [audio token accounting](https://developers.openai.com/api/docs/guides/voice-latency-cost). Per-million native text input/output rates are $4/$16, audio $32/$64. Sol output is $10; reserve input at the highest documented cache-write rate, $5, without assuming cache savings. Transcription reserves 4096 input and 4096 output tokens at $1.25/$5 per million, over the model's documented 2000-output-token maximum. These rates presume the documented standard service pricing; do not use a premium/priority service tier.

Each text bound counts full serialized UTF-8 request bytes plus 1024 framing tokens as an input-token upper allowance, and the entire output cap (production 2200, matched 900). Native reserves full session/text bytes plus 1024 framing, audio input at 10 tokens/sec plus 128 framing, up to 20 seconds of input, and **both** 900 audio and 900 text output tokens. Exact per-case bounds appear in `plan.json`'s worksheet. The per-call bound must fit its allocation before transport. The plan binds source, adapter, instructions, scenarios, fixtures, and local TTS model/voice asset hashes. No tools, memory, greetings or prior assistant history enter any generation.

## Adapters and verification

`adapters.ts` implements production text through `runCompanion` + `OpenAIResponses` with an injected transport; it refuses deviation from the frozen request. Matched text uses the same instruction bytes as both native arms, without the production JSON contract. Native adapters use **WebSocket PCM**, wait for verified effective session settings, disable automatic VAD, and commit the complete recording once before generating. They retain raw protocol events, input/output byte counts, native transcript, parallel ASR, usage and all failures. Output PCM is saved separately. A single completed generation, non-silent received PCM, transcript and full input/commit are required. The same WebSocket/PCM transport applies to both native arms.

A real localhost WebSocket loopback verifies the bundled socket transport and PCM capture, in addition to injected protocol failure tests. It requires local-port permission outside the default sandbox; it makes no provider calls. Real offline Kokoro synthesis of a canned exact answer also passes; the initial empty macOS `say` output is preserved as failed evidence. The canned answer is a harness test, never scored as model output.

The ASR model configured in Soulfire is now marked **deprecated** in current documentation. Before any generation, the executor checks the authorized account's model catalogue for all three exact requested IDs. This does not guarantee the realtime endpoint will accept the transcriber; a configuration rejection stops execution. An unavailable ID requires a separately documented design decision, never a silent replacement.

## Run after explicit approval only

From the isolated repository:

```sh
node_modules/.bin/vite-node experiments/voice-parity/cli.ts prepare ../voice-baseline-kokoro-private ../NEW-pilot
```

Preparation makes no provider calls. It writes an authorization template with `approved:false`, a plan hash, the requested $5 ceiling and a ledger-coordination field. **Creating or editing that file does not itself create user authorization.** The responsible parent must first receive explicit approval, preserve its evidence, and confirm this track's allowance does not overlap concurrent spending. An approved authorization must bind the exact plan hash.

```sh
# Run only after actual authorization, with the existing authorized key supplied in process environment.
node_modules/.bin/vite-node experiments/voice-parity/cli.ts execute ../NEW-pilot /path/to/approved-authorization.json /path/to/existing/kokoro-home
```

No key file is read automatically. Never pass a secret as a CLI argument or publish private output. Execution is single-use; inspect `ledger.json`, `records.json`, per-run evidence and any `STOPPED.json`. A stop leaves all planned but unexecuted units missing, never passing.

Native-audio rows are initially **ineligible for quality scoring** until a human compares source with ASR. Preserve original results and record a separate review:

```sh
python3 experiments/voice-parity/review_asr.py template ../NEW-pilot /tmp/asr-review.json
# Human fills verdict, reviewer and evidence after reading each source/transcript pair.
python3 experiments/voice-parity/review_asr.py apply ../NEW-pilot /tmp/records-reviewed.json --review /tmp/asr-review.json
python3 experiments/voice-parity/study.py blind ../NEW-pilot /tmp/records-reviewed.json /tmp/NEW-review
```

The reviewer cannot rewrite source or ASR. A factual omission/inversion, failed session, incomplete output or failed input commit cannot be promoted. Parallel ASR remains a diagnostic, not proof of the native model's internal interpretation. Blind semantic ratings and separate audio listening review follow the main protocol. Independent human raters are still needed; offline tests do not supply those ratings.

## What this pilot can establish

It can locate reproducible failures, test whether complete audio input differs from text input to the **same native configuration**, assess whether the stronger text path remains useful under spoken-delivery instructions, and measure the local TTS alternative's complete PCM availability. It includes a supplied-fact counterexample to detect excessive refusal or unnecessary questions. Two repeats expose some variability; eight observations per arm do not estimate a general failure rate.

It **cannot isolate model causality**: Sol and realtime still differ in model architecture, output modality, API behavior, default reasoning and token semantics. Equal numeric output caps do not equal compute. It cannot certify parity, human benefit, clinical efficacy, natural turn-taking, microphone behavior, multilingual performance, long conversations or vault-inspired instruction effects.

The native transport differs from Soulfire's production WebRTC/Opus path. Its timing metric is final input submission/pacing end to first non-silent **received PCM chunk**, not decoded-browser playback, acoustic first word or physical output. TTS records full text response plus complete local synthesis; it does not claim streaming or playback latency. Do not compare these numbers to historical WebRTC audio-onset measurements as if transport were controlled. Natural VAD testing and production transport confirmation remain separate follow-ups.

The eventual old/candidate instruction × text/native matrix still needs coordination with the vault implementation owner and a fresh frozen plan. This pilot never reads that checkout or retrieves from the vault.
