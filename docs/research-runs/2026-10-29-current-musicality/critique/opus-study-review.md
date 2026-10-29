# Before/after: baseline A vs. new caption B and caption + shift 3 C, six matched seeds

I haven't listened to any of these clips, and nothing below names a subjective winner or suggests replacing catalogue pieces. The pitch data comes from the transcription tool, which in the synthetic check added overtone notes (E5/G5) that weren't played, so every note and chord figure is an inferred review aid.

**The setup checked out.**
- All 18 source hashes match their records.
- All 12 new bed and PCM hashes differ from the baselines and from each other.
- B and C use the same caption in every pair. B kept shift 1 and C used shift 3; both kept the same seed, bpm (64 for piano and acoustic, none for ambient) and an empty `keyscale`.
- None of the 12 has technical issues, and there were no failures.
- All the key, metre and tempo words are in the caption only. That is a bundled caption change, against the upstream advice to put those in metadata.

## Table of changes (A → B → C)

| Concept / seed | Key est. (conf) | Chord candidates (labelled windows) | Share outside C major | Loudness range (LU) | Brightness (Hz) | 64 BPM grid fit | Tail bass | Notes |
|---|---|---|---|---|---|---|---|---|
| 19-1 piano / 84050 | G .11 → none .08 → none .02 | Em G Dm (5) → C Dm (2) → C (1) | .031 → .002 → .006 | 7.2 → 7.9 → 7.0 | 418 → 435 → 584 | .48 → .34 → .26 | G → G → G | Key got *less* clear; bass went lower (MIDI 36); semitone overlap .076 → .066 → .111 |
| 17-1 piano / 83848 | C .48 → C .42 → C .46 | Am C F (5) → C…C F (8) → C only (8) | .005 → 0 → 0 | 11.0 → 6.2 → 5.0 | 658 → 313 → 395 | .20 → .28 → .15 | G → none → none | Onset rate .67 → 1.53 → 1.57, so busier; last onset 27.9 → 23.5 → 23.7 s |
| 20-2 ambient / 84282 | none .10 → C .24 → C .61 | Em F Em (3) → Dm F F (5) → F F (2) | .068 → 0 → .007 | 5.7 → 5.9 → 5.6 | 634 → 644 → 696 | .13 → .09 → .16 | G → F → F | B semitone overlap jumped to .221; C back to .044 |
| 19-2 ambient / 84181 | none .04 → C .19 → C .20 | C Em C (4) → C C C (3) → C G F (3) | .066 → .002 → 0 | **15.9 → 4.2 → 5.2** | 471 → 591 → 597 | .12 → .16 → .15 | F# → E → G | Off-key F# tail is gone; C sits in the highest register |
| 20-1 acoustic / 84151 | none .02 → C .24 → C .25 | C C (2) → C C F C (4) → C only (9) | .145 → 0 → .032 | 3.6 → 1.7 → 1.3 | 517 → 423 → 656 | **.63 → .13 → .08** | F → **C** → F | Onsets 1.37 → 2.37 → 2.2/s; C's tempo estimate is 43 BPM; low notes 4% → 27% |
| 18-1 acoustic / 83949 | none .05 → C .19 → C .31 | D Em D C D C (7) → C C F C (8) → C F C F C (10) | **.181 → .016 → .018** | 10.4 → 2.5 → 2.6 | 582 → 729 → 856 | .47 → .56 → .47 | C → C → G | Modal D/C alternation replaced by C–F; overlap .039 → .066 → .105 |

## What the data suggests

**Consistent across seeds (caption effect, B and C alike):**
- **Tonal centre.** The detector reports C for 10 of the 12 new pieces, against 1 of 6 baselines.
- **Fewer notes outside C major.** The share of out-of-scale time fell in all six trios. The biggest drops were the two earlier flagged pieces: 18-1 (.181 → ~.017) and 20-1 (.145 → ≤.032).
- **No odd chords.** Every labelled chord candidate in B and C fits C major. The D/Em and F# material from the baselines disappeared.
- **Much flatter dynamics.** Loudness range dropped sharply in four trios, from 10–16 LU down to 2.5–6 LU. 20-1 may now be overly flat at 1.3–1.7 LU.

**Not achieved, or mixed:**
- **The requested progressions don't show up.** The captions asked for C–Am–F–G-type changes, one chord per bar. The candidates show mostly C, sometimes F, and almost never Am or G. That points to static tonic or vamp-like harmony. The 2 s chord template may miss quick changes, but the likely trade is "odd" harmony for monotony, which only listening can judge.
- **Endings aren't settled.** Tail bass lands on the tonic in only 2 of 12 (20-1 B, 18-1 B). Pieces still stop sounding around 23.5–27.9 s.
- **Pulse didn't improve.** Grid fit to 64 BPM got worse in 19-1 and badly worse in 20-1, despite "consistent texture and pulse" in the caption.
- **The texture got busier.** Piano 17-1 and acoustic 20-1 roughly doubled their onset rate, despite "restrained".
- **The end-of-clip event remains.** The ~29.55 s MIDI-22 detection appears in all 12 new clips. Whatever causes it, it isn't the caption or the shift setting.

**Shift 3 vs. shift 1 (C vs. B):**
- C is brighter in all six pairs, even though the caption says "dark warm tone". That fits the docs' description of higher shift as "clearer".
- Key confidence is higher in 3 pairs, similar in 2 and lower in 1.
- Semitone overlap is higher in 4 pairs (19-1, 17-1, 18-1, 20-1) and lower in 2 (20-2, 19-2).
- Overall, shift 3 shows no consistent cleaner-harmony signal.

## Where the data disagrees with my earlier hypotheses

- **Shift 3 as the main fix.** I ranked it highly for cleaner harmony; the data is mixed and mostly shows extra brightness.
- **The caption fixing phrasing and cadence.** It fixed tonal centre and scale membership, but not cadences, endings or pulse. Harmonic variety probably got *worse*.
- **Low-register mud.** I flagged piano and acoustic register as a risk. The new caption's "sparse bass roots" / "clear bass notes" pushed them lower (MIDI 36, or 27% of notes below C3), and that wasn't checked for mud.
- **Earlier flags confirmed by the data.** The off-key tail basses (19-2's F#) and modal material (18-1) do respond to caption wording.

## For Miguel's listening

Code and default composition settings stay unchanged, and the six originals remain the catalogue. In each trio, listen for:
- whether odd notes are gone or the piece has just become static;
- harmonic motion, since the requested progressions didn't appear in the candidates;
- the endings;
- brightness in C;
- busyness in 17-1 and 20-1;
- the last half-second of every clip.

A follow-up arm could move the key, metre and tempo into `keyscale`/`timesignature`/`bpm` metadata and drop them from the caption, which would separate the metadata effect from the caption wording.