# Integrated discernment prototype — 2026-10-30

The prototype now shares factuality, agency, optional spirituality and safety principles across text and voice, with separate delivery instructions. Text defaults to **GPT-6.1 Sol**, following actual matched provider-path comparisons and final endpoint checks. Voice remains native **gpt-realtime / marin** and uses the earlier evaluated direct-help bundle, with a 900-token output cap. The failed factual-slot revision and evidence-frame prototype are **not** runtime behavior. This remains experimental; voice factual drafting is unresolved.

## What changed and why

- Conversations and selected-answer reflections cannot generate practice controls in their provider schema. Alternate providers are also checked at the application boundary. Reflection controls have empty options/items; choice controls have empty items. The original invalid/unsolicited shapes have regression coverage; validators were strengthened, not relaxed.
- A complete conversation can end after useful help. The spiritual framework accompanies a person's choice rather than deciding it; required correction/deadlines remain actionable. Optional reflection remains available without assuming hidden insecurity, trauma or motives.
- Shared principles are composed from the same constants into both modes. Text retains its evaluated instruction bytes. Voice exactly matches the evaluated v1 bundle, rather than appending text control-generation rules. Regression tests pin those evidence hashes and verify the actual route's model, voice, VAD, transcription and cap.
- Five fictional discernment cases appear in the existing Simulations/Witness catalogue. Fixed-user CLI evaluation exercises actual companion output without feeding the rubric or ideal guide answer to the model. Token-limit, diagnostics, settings and hash records support reproducibility.
- Sol is the text default only. Explicit operator `OPENAI_MODEL` overrides remain supported; `.env.example` and the local next-start selection use Sol. No existing app was restarted or deployed. The separate voice model and its latency path are unchanged by text selection.

## Evidence of improvement and its limits

| Comparison | Actual observation |
| --- | --- |
| Original product-size text baseline vs structural changes | Original confirmed-error follow-up produced invalid unsolicited practice controls. Subsequent ten matched conversations completed without those controls; schema and alternate-provider tests enforce the distinction. This is stronger evidence than a prompt-only prohibition. |
| Three-model comparison, same retained prompt/contracts | 13 conversations/model: factual-grounding review passed 6/13 mini, 9/13 efficient alternative, 13/13 Sol. Sol used the actual Responses/application path. This small model-aware review is not a general failure-rate estimate. |
| Paired native voice, old compiled prompt vs integrated v1 | Same five cases and settings: old prompt repeatedly offered exercises; v1 answered direct questions, supported real correction/deadlines and gave concrete stopping conditions. All 20 guide replies completed. Factual availability/audience problems remained. Median onset 1.125 s old vs 1.350 s v1; paired median difference +1 ms, uneven range; no latency invariance claim. |
| Rejected factual-slot voice revision | Both arms made unsupported external factual claims in 3/8 guide replies. Candidate was slower and one reply capped. It is negative evidence, not an improvement or promoted fix. |
| Final compiled text endpoint | Eight accepted requests/model across three original two-turn cases and two new handoff/reflection cases. Mini still invented availability and speculative communication risks. Sol used explicit unknown-time placeholders, supported actual correction, preserved companion-versus-recipient audience and asked a non-leading reflection question. One Sol draft added an unrequested courtesy (“Thank you for your help”); no unsupported dates, layoff causes or reputational predictions were observed. |
| Final Sol practice compatibility | One real practice request returned two validated editable blocks through the full application contract. Broader practice quality is unassessed. |
| Final compiled native voice | Four of five sessions completed, seven guide replies plus four welcomes, all 11 responses complete. Actual route instructions matched the integrated bundle; no test prompt injection. Corrected an actual false record and preserved new recipient information. Availability wording remained underspecified; one draft supplied an unendorsed attitude about respecting how notes are kept. Not safe to claim facts-only drafting solved. |

Final voice reflection case stopped **before user input and before any response**: provider `session.created` reported transcription `null`, contrary to requested `gpt-4o-mini-transcribe`. Other sessions matched. The case is unassessed, its full reservation retained, and it was not retried or silently reconfigured. The application currently does not enforce the evaluator's complete effective-session contract; provider configuration drift remains a readiness risk.

Final complete-text median latency: mini **1.479 s** (1.018–2.521), Sol **4.581 s** (1.964–10.600), eight calls each. Final native audio-onset median **1.084 s** (0.911–1.727), seven guide replies. Audio onset means scheduled last non-silent synthetic input sample to first sustained decoded remote audio, not first spoken word, physical speaker or complete answer. Text and voice metrics are different. Controlled shortened pauses do not assess natural interruptions or turn-taking. No physical-microphone or clinical-benefit claim is made.

These are finite, small, implementing-agent reviews. Prompt changes alone repeatedly failed factuality; more examples or clauses were not treated as a reliable cure. Sol's text results justify this experimental default, not a guarantee. Native voice still needs an explicit product decision about unsupported factual drafting and effective-session readiness; no fragile renderer or unvalidated routing classifier was introduced.

## Verification and privacy

Unit/route tests, TypeScript, lint and an isolated production build cover the integrated code. Desktop/mobile browser checks use mocked provider transport and synthetic media; real offline Kokoro audio caching/decoding is separate from paid native voice. Initial browser failures were a stale fixed catalogue count and a synthetic fixture pointing to a different SQLite store; corrected assertions and a freshly generated offline fixture were rerun. See the final validation record below for exact counts.

All live inputs were fictional. Personal chat, private reference notes, credentials, model files, session IDs, raw provider diagnostics and audio recordings remain outside Git. Local evidence roots under `~/Library/Application Support/` preserve settings, original failures, transcripts and manifests:

- `soulfire-model-comparison-20261030/`
- `soulfire-voice-prompt-alignment-20261030/`
- `soulfire-voice-factual-slots-20261030/`
- `soulfire-final-integration-20261030/`

The final root contains `plan.json`, separate Sol-selection/practice plans, actual native `paired-run/*/result.json`, audio, text endpoint results, `summary.json` and readable `transcripts.md`. Historical detailed reports: [text baseline and structural changes](discernment-simulations.md), [models](model-comparison-20261030.md), [initial voice](realtime-voice-evaluation-20261030.md), [paired voice](voice-prompt-alignment-results-20261030.md), [rejected drafting revision](voice-factual-slots-results-20261030.md).

Cumulative conservative reservations, including earlier failed/uncertain obligations: **$15.22686524 of $30**; remaining **$14.77313476**. This is not invoiced spending. Final known native response-token estimate is $0.3113824; parallel ASR is separately billed/unavailable and its allowance remains reserved. Text endpoint usage is not returned, so its conservative allocations remain counted. No additional paid rounds are planned.

### Final local validation

- **238 unit/contract tests pass** across 22 files; TypeScript, lint and `git diff --check` pass.
- **Production build passes** in a separate source copy; the user's original `.next` and active app were preserved. No deployment or restart occurred.
- Full desktop/mobile browser sweep: 253 passed, four initial failures, one intentionally skipped desktop-only/mobile-shaping case. After correcting the catalogue assertions and using the matching offline audio store, all 12 affected-subset tests passed: the four failed checks are resolved, giving **257 passing distinct checks and one intentional skip**, across the full sweep plus targeted rerun. No retries conceal a model failure; these browser checks use synthetic/mock transport.
- Final source default and explicit override behavior have tests. Native session configuration drift and voice factual drafting remain limitations, not passing acceptance claims. No further paid generation is pending.

[Sanitized machine-readable final metrics](evidence/discernment-integration-20261030.json) retain measured counts, settings hashes, costs and latency definitions; private raw evidence is deliberately excluded from Git.
