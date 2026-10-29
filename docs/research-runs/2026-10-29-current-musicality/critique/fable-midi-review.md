# Transcription-based musicality review — all 49 records

I read `transcription-manifest.json`, `inventory.json`, and all 49 `*-analysis.json` files programmatically (49 analyses, 0 failures; category counts match inventory: 36 starters, 9 comparison, 4 custom/study; 46 distinct PCM — the 3 duplicate-PCM pairs/triples are marked in the table). I also verified the pinned upstream capability table. I did not listen to any audio; everything below is inferred-transcription evidence, and per the synthetic validation (C/E/G recovered, but false E5/G5 harmonics added), note-level flags are **review aids, not wrong-note counts**.

**Correction accepted:** the pinned `acestep-v15-turbo` row in upstream `README.md:262` marks **Complete ❌, Lego ❌, Extract ❌** — my earlier complete/extend suggestion was unsupported and is withdrawn. The same row marks **Refer-audio ✅, Cover ✅, Repaint ✅** as the only continuity-adjacent mechanisms, and even those need their own validation before being proposed as session glue. No MIDI conditioning or independent-stem control exists for Turbo.

## How to read the table

- **n/s** = inferred notes/second (density). **key(conf)** = estimator's key and confidence (`?` = no estimate at all — the estimator found no tonal center). **chords id/win** = 2-second windows matching a major/minor triad template out of total windows. **clash** = `inferredSemitoneOverlapFraction` (adjacent-semitone co-sounding candidate; overtones inflate it).
- Flags: `no-key` (no key estimate), `dead-air` (>5 s with no inferred onset), `semitone-clash?` (clash ≥ 0.13), `chromatic?` (identified chords <80% diatonic in estimated key), `wandering?` (no key + ≥4 distinct chords), `high-reg(n)` (n notes above C6 despite "no bright/harsh highs" in every prompt — may be overtone false positives), `static` (≤2 identified chords in a non-ambient piece), `no-taper` (final 4 s denser than average; none triggered it, see synthesis).
- `audioVsMidiChromaCosine` was 0.93–0.99 everywhere (aggregate pitch-class agreement only — it says the MIDI is a usable review aid, not that it's accurate).

## Per-piece table

| Piece | cat | style/intent | s | n/s | key(conf) | chords id/win | progression (collapsed) | clash | flags |
|---|---|---|---|---|---|---|---|---|---|
| Small Morning (s01-1) | starter | piano/lift | 30 | 5.6 | C 0.18 | 3/16 | Am C F | 0.12 | ok |
| Window Light (s01-2) | starter | ambient/lift | 30 | 3.1 | ? | 2/16 | Em C | 0.16 | no-key, semitone-clash? |
| Room to Settle (s02-1) | starter | acoustic/calm | 30 | 3.5 | G 0.25 | 2/16 | F D | 0.08 | chromatic?, static |
| Open Horizon (s02-2) | starter | ambient/calm | 30 | 2.8 | C 0.24 | 5/16 | C F Dm F | 0.00 | ok |
| One Moment (s05-1) | starter | piano/overwhelm | 30 | 3.9 | ? | 4/16 | C F Am | 0.14 | no-key, semitone-clash? |
| Steady Ground (s05-2) | starter | ambient/overwhelm | 30 | 2.9 | C 0.13 | 1/16 | C | 0.01 | ok |
| Room for Both (s06-1) | starter | acoustic/overwhelm | 30 | 4.5 | C 0.13 | 5/16 | Dm Am C | 0.04 | ok |
| Gentle Next Step (s06-2) | starter | ambient/overwhelm | 30 | 3.0 | C 0.10 | 5/16 | C F Em | 0.07 | ok |
| Here and Now (s07-1) | starter | piano/calm | 30 | 3.1 | C 0.26 | 4/16 | C Dm F C | 0.16 | dead-air 5.2s, semitone-clash? |
| Wide Awake Garden (s07-2) | starter | ambient/calm | 30 | 3.0 | C 0.22 | 2/16 | Am F | 0.04 | ok |
| Unmeasured Time (s08-1) | starter | acoustic/calm | 30 | 3.0 | C 0.19 | 5/16 | Am C Dm C F | 0.10 | high-reg(2) |
| Soft Clearing (s08-2) | starter | ambient/calm | 30 | 2.7 | A 0.25 | 2/16 | Bm A | 0.00 | ok |
| Room for Uncertainty (s09-1) | starter | piano/focus | 30 | 4.0 | ? | 4/16 | C | 0.00 | no-key |
| An Ordinary Afternoon (s09-2) | starter | ambient/focus | 30 | 4.0 | Em 0.27 | 6/16 | Em C Em | 0.05 | ok |
| A Little Distance (s10-1) | starter | acoustic/overwhelm | 30 | 4.6 | G 0.19 | 3/16 | C D | 0.18 | semitone-clash? |
| Steady Shore (s10-2) | starter | ambient/overwhelm | 30 | 3.3 | ? | 7/16 | Em C Em G D C | 0.16 | no-key, semitone-clash?, wandering? |
| A Moment for Me (s11-1) | starter | piano/unwind | 30 | 3.5 | ? | 5/16 | B F G#m C F# | 0.04 | no-key, wandering? |
| Daylight Corner (s11-2) | starter | ambient/unwind | 30 | 3.1 | D 0.19 | 8/16 | C F#m C Em D | 0.09 | chromatic? |
| Nearer (s12-1) | starter | acoustic/company | 30 | 4.1 | ? | 1/16 | F | 0.01 | no-key, dead-air 8.7s, static |
| Shared Daylight (s12-2) | starter | ambient/company | 30 | 3.0 | D 0.25 | 7/16 | Em C Am Em C D | 0.10 | chromatic? |
| Off the Clock (s13-1) | starter | piano/unwind | 30 | 3.5 | ? | 7/16 | Em Bm C G Am D C | 0.04 | no-key, wandering? |
| Unhurried Clearing (s13-2) | starter | ambient/unwind | 30 | 3.4 | ? | 2/16 | Bm C | 0.24 | no-key, semitone-clash? |
| A Breathing Space (s14-1) | starter | acoustic/focus | 30 | 3.8 | ? | 2/16 | C | 0.01 | no-key, dead-air 5.1s, static |
| Room to Plan (s14-2) | starter | ambient/focus | 30 | 4.0 | ? | 6/16 | C F C G F | 0.01 | no-key |
| Your Own Light (s15-1) | starter | piano/company | 30 | 4.1 | ? | 5/16 | C Am Em Dm G | 0.05 | no-key, wandering? |
| Belonging on Your Terms (s15-2) | starter | ambient/company | 30 | 2.6 | C 0.55 | 5/16 | F C | 0.01 | high-reg(3) |
| Close at Hand (s16-1) | starter | acoustic/calm | 30 | 6.1 | Em 0.16 | 4/16 | D C | 0.07 | ok |
| A Quiet Place (s16-2) | starter | ambient/calm | 30 | 4.4 | D 0.43 | 4/16 | C F Am D | 0.00 | chromatic? |
| Begin Again (s17-1) | starter | piano/lift | 30 | 5.1 | C 0.48 | 5/16 | Am C F | 0.03 | high-reg(2) |
| No Catching Up (s17-2) | starter | ambient/lift | 30 | 3.7 | C 0.20 | 7/16 | C Am F G Am F | 0.01 | dead-air 5.5s |
| In the Meantime (s18-1) | starter | acoustic/calm | 30 | 4.1 | ? | 7/16 | D Em D C D C | 0.04 | no-key |
| A Small Anchor (s18-2) | starter | ambient/calm | 30 | 3.3 | ? | 6/16 | C G Em F Dm D | 0.08 | no-key, wandering? |
| In My Own Words (s19-1) | starter | piano/focus | 30 | 5.1 | G 0.11 | 5/16 | Em G Dm Em G | 0.08 | dead-air 5.0s, high-reg(2) |
| First Light (s19-2) | starter | ambient/focus | 30 | 3.2 | ? | 4/16 | C Em C | 0.00 | no-key |
| Familiar Afternoon (s20-1) | starter | acoustic/company | 30 | 3.0 | ? | 2/16 | C | 0.01 | no-key, static |
| Gentle Company (s20-2) | starter | ambient/company | 30 | 4.7 | ? | 3/16 | Em F Em | 0.10 | no-key, high-reg(6) |
| 2893556a | custom | piano (session closing) | 90 | 4.2 | C 0.17 | 25/46 | Em G C F C Em C F C… | 0.10 | high-reg(4) |
| 41f29261 | custom | piano (session developing) | 90 | 4.8 | C 0.48 | 18/46 | C F C F G Am C G F… | 0.03 | ok |
| 5cac1f71 | custom | piano (session opening) | 90 | 4.4 | C 0.25 | 17/46 | C Em C F C G C Em C… | 0.05 | high-reg(2) |
| 2ab9afa9 | custom | piano | 30 | 5.4 | ? | 3/16 | F G F | 0.15 | no-key, semitone-clash? |
| 1f684d51 | compare | piano | 30 | 4.6 | ? | 5/16 | C Em Dm C F | 0.08 | no-key, high-reg(3) |
| 852bc9e4 | compare | piano | 30 | 4.6 | ? | 5/16 | C Em Dm C F | 0.08 | = dup PCM of 1f684d51 |
| e78b5a07 | compare | piano | 30 | 4.6 | ? | 5/16 | C Em Dm C F | 0.08 | = dup PCM of 1f684d51 |
| 4b9859aa | compare | piano | 30 | 3.1 | ? | 3/16 | D Am Dm | 0.00 | no-key |
| 54842778 | compare | ambient | 30 | 5.3 | ? | 10/16 | C D Em F C F | 0.25 | no-key, semitone-clash? |
| 9be5ebc5 | compare | ambient | 30 | 5.3 | ? | 10/16 | C D Em F C F | 0.25 | = dup PCM of 54842778 |
| ca508cd8 | compare | ambient | 30 | 5.1 | ? | 10/16 | Dm C F Dm C F | 0.12 | no-key |
| 90798298 | compare | acoustic | 30 | 3.9 | ? | 3/16 | Dm C | 0.00 | no-key |
| b905d189 | compare | acoustic | 30 | 6.0 | ? | 4/16 | C D F | 0.10 | no-key |

One cross-cutting artifact note: nearly every record reports a pitch floor around MIDI 22 and some notes below MIDI 36 (sub-contrabass region). Solo felt piano / nylon guitar rarely plays there; treat these as rumble, pedal/body noise, low pad energy, or detector artifacts — flagged for listening, not counted against composition.

## Synthesis — what the transcription evidence consistently shows

1. **Weak or absent tonal center is the dominant pattern.** 16 of 36 starters and all 9 comparison pieces return *no* key estimate; the rest average confidence ~0.15. On average 73% of chord windows in starters match no major/minor triad template. Where chords are identified they are mostly white-key diatonic (C, F, G, Am, Dm, Em) — so the oddness Miguel hears is less "wrong chords" than **ambiguous, under-committed harmony**: long stretches that don't resolve into any triad, with occasional chromatic intrusions. This matches the conditioning findings (no key requested for the catalogue, soft text-only metas, `shift=1.0`).
2. **Specific chromatic/clash suspects for Miguel's ears first:** *A Moment for Me* (B–F tritone-rooted drift, F♯/G♯m), *Daylight Corner* (F♯m against C/D), *Unhurried Clearing* (clash 0.24, Bm–C oscillation — a semitone-root pair), *A Little Distance* (clash 0.18), *Steady Shore*, *Here and Now*, *Window Light*, *One Moment*, plus both duplicated comparison ambients (clash 0.25). ~10 pieces.
3. **Phrasing problems are structural, not note-level.** Dead air ≥5 s inside 30 s pieces (*Nearer* 8.7 s, *No Catching Up*, *Here and Now*, *A Breathing Space*, *In My Own Words*) — "generous space" was requested, but a third of the piece silent is a different thing. At the other end, several non-ambient pieces are **static** (1–2 identified chords, e.g. *Nearer*, *Familiar Afternoon*, *A Breathing Space*): no harmonic development at all. There is no density arc — openings and endings have roughly the same inferred density as middles, i.e. no taper into the "gentle ending" the prompt asks for.
4. **Density ignores intent.** "Overwhelm" prompts ask for "very sparse," yet *Room for Both* (4.5 n/s) and *A Little Distance* (4.6 n/s) are among the densest; *Close at Hand* (calm) is the densest starter (6.1 n/s). Intent wording is not controlling density.
5. **High-register content despite "no bright" in every request** (*Gentle Company*: 6 notes above C6, top at MIDI 97; the closing session piece: top 96). Could be overtone false positives — listening item.
6. **The 90-second custom session is actually the best-behaved harmony in the set.** All three movements are clean diatonic C-major candidates (C–F–G–Am–Em, diatonic fraction 1.0, clash 0.03–0.10) — the only pieces that *did* get an explicit "C major" request. This is correlational (3 pieces, same style), but it points the same direction as everything else: explicit key conditioning appears to help, and the catalogue never gets it.

## Verified supported controls (pinned `acestep-v15-turbo`, revision `ca1e85f`)

Supported: caption, lyrics `[Instrumental]`, **bpm**, **keyscale**, **timesignature**, duration, seed, **shift** (upstream recommends 3.0 for turbo; currently 1.0), inference_steps, reference_audio / cover / repaint. Not supported on Turbo: CFG (forced 1.0), **complete, lego, extract**, MIDI conditioning, independent stems.

## Safe to change now vs. needs Miguel's listening

Safe now (affects only *new* generations; existing catalogue, provenance, bookmarks untouched; palettes preserved):
- Pass `keyscale` for catalogue-concept requests too (currently only custom sessions get it) and pass `timesignature` (currently always N/A).
- Drop "A musical preference request, not a treatment protocol" from the *caption* (keep it in UI/docs — it's governance copy, not conditioning, and it's noise in the text encoder).
- Align the bpm request with intent instead of a flat 64 for all non-ambient.

Needs listening before adoption (changes musical character): `shift=3.0`, tag-style caption rewrite, fewer negations, any reference_audio/repaint use for session continuity. No change should be promoted on these metrics alone — subjective winner pending.

## Bounded experiment (as you prioritized — 12 new 30 s pieces, no bulk rebuild)

3 styles × 2 seeds × 3 arms, where **arm A (baseline) reuses existing catalogue audio** at those exact seeds — zero new baseline renders:

- **Pieces:** piano s17-1 (82232-family: pick s01-1 and s17-1 seeds), ambient s02-2 and s17-2, acoustic s06-1 and s08-1 — one flagged and one "ok" per style, so improvement and non-regression are both visible.
- **Arm A — baseline reuse:** the existing WAVs (hashes already in inventory).
- **Arm B — prompt-only (6 new):** short positive tag-style caption per palette (palette wording kept distinct), explicit `keyscale` + intent-appropriate bpm + `timesignature 4`, one compact negation ("instrumental, no vocals, no drums"), no policy sentence; `shift` stays 1.0.
- **Arm C — prompt + documented turbo shift (6 new):** arm B caption plus `shift=3.0`.
- Same seeds across arms (removes seed luck between arms; note it does not create note-level minimal pairs — a changed caption changes the whole trajectory). Run through the existing bounded worker, re-run the same Basic Pitch + metric pipeline as secondary evidence, and decide by **blind randomized A/B/C listening by Miguel** per piece. ~12 × ~20 s generation, ~0.2 GiB — inside existing budgets.

Limitations, restated: no audio was heard or uploaded; Basic Pitch adds false harmonic notes (proven on the synthetic test), chord windows are coarse 2 s template matches, key/tempo estimators returned null or low confidence on most records, and chroma cosine measures aggregate pitch-class overlap only. Every per-piece flag above is a listening queue, not a verdict; nothing here is a clinical or wellness claim.