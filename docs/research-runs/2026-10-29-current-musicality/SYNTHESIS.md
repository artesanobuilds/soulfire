# Musicality: evidence, changes and next decision

## What we learned

Fable 5 and Opus 5.5 independently reviewed the generation code, pinned model capabilities and all 49 source-linked transcription records. They then reviewed the 12 actual study outputs. Full outputs are archived in `critique/`, including their corrections. Neither model heard the audio; their reports are analytical critiques rather than auditions.

Both identify useful composition hypotheses: replace policy-heavy prose with musical direction; ask for recognizable motifs, phrasing and tonal resolution; preserve distinct piano/ambient/acoustic palettes; and treat independent segments and loops as potentially unrelated music. The pinned Turbo documentation recommends timestep shift 3; the legacy adapter uses 1. This is a documented configuration difference, not proof that shift 1 caused the reported odd notes. The checkpoint also supports other shifts, so the experiment—not the recommendation alone—must guide preference.

Both withdrew material preliminary errors: Turbo's fixed CFG 1 is distilled behavior, not a weak-guidance defect; Turbo does not support complete/lego/extract or MIDI/stem control. No new planner checkpoint is installed. Reference/cover/repaint would need separate validation and were not used here.

## Actual before/after evidence

Six original seeds were reused, two per palette. Twelve new 30-second pieces were generated sequentially: six with the revised musical caption at shift 1, six with the same caption and metadata at shift 3. All twelve passed technical gates, produced distinct PCM hashes and have inferred MIDI. All original source hashes still match. The experiment changes the whole musical trajectory, not one isolated note.

| Observation across six matched trios | Original A | Caption B | Caption + shift 3 C |
|---|---:|---:|---:|
| Median approximate key margin | .072 | .218 | .279 |
| Median inferred note count | 132.5 | 146.5 | 147.5 |
| Median inferred semitone overlap | .035 | .041 | .055 |
| Matched integrated loudness | -21 LUFS | -21 LUFS | -21 LUFS |

These are descriptive measures, **not quality scores**. The captions moved several ambient/acoustic examples toward an estimated C centre and more even dynamics. The piano/focus example lost key confidence. Some candidates became busier, brighter or more harmonically static; the explicitly requested progression was not reliably observed. The higher median semitone flag does not prove more dissonance, just as higher key confidence does not prove better music.

Both critics now agree that neither the caption treatment nor shift 3 is a universal fix. Fable emphasizes more stable tonal estimates in several ambient/acoustic cases; Opus emphasizes lost variety, pulse/ending problems and extra brightness. Neither recommends bulk replacement on these measurements. Their descriptions of 'odd chords gone', 'dead air' or 'no tonal centre' must be read cautiously: unlabelled template windows are not proof of absent harmony, lack of an inferred onset is not silence, and a null key estimate is not proof that music lacks a key. The root synthesis does not promote those claims to facts.

The original 30-second records all contain a terminal MIDI-22 detection. An independent source-spectrum check found median 24–36 Hz energy share of about 1.57% in the previous half-second and 1.67% in the final half-second. This does not establish a new played bass note or a startling artifact. It remains an audio/transcriber-edge listening question; no automatic filtering or destructive repair was applied.

## What changed safely now

A narrow playback safeguard raises the heuristic key-margin requirement for overlapping **different** pieces from .1 to .3. Weak estimates now use a fade through quiet. This is a conservative engineering policy, not a calibrated probability or clinical threshold. The regression test covers two pieces that share a weak key estimate despite a strong tempo estimate. Existing files, UUIDs and persisted settings remain untouched.

The twelve revised compositions are actual review candidates, with stronger musical prompts and the documented shift setting tested explicitly. The candidate-caption compiler and reproducible study tooling are retained, but **the production caption and generation defaults are not silently switched**. No new layout or model-comparison area is installed.

## What needs listening

Use the six blinded trios at http://localhost:3197. Choose which has more coherent progression and phrasing, which endings work, and whether the palette stays pleasant rather than merely static. Check brightness, density and any timestamped odd notes. Export the ratings; the preferred treatment may differ by palette.

After those results, we can adopt the preferred prompt/settings and generate versioned replacements with new UUIDs, retaining originals and bookmarks. The study does not justify automatically regenerating all 36 starters today. A separate follow-up should put key/metre/tempo in their documented metadata fields rather than bundling those words into captions, and test longer phrases/60-second material. Exact progression, voice-leading or continuation cannot be guaranteed by Turbo; edited MIDI is not supported conditioning.

No subjective winner, clinical efficacy, pleasantness result or 'best possible music' claim is made. The concrete remaining input is Miguel's listening preference, not a technical or licensing blocker.
