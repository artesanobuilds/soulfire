I haven't listened to any audio, and the MIDI you said would follow hasn't reached me. Everything below comes from reading the code and the stored measurements. The only measurements involving pitch are a 12-bin pitch profile averaged over each clip, plus key and tempo guesses. They can't show what was played or when, so they only support guesses about what you're hearing.

## A. What the code shows

**1. The prompt is mostly prohibitions and policy wording, with very little musical language.** `currentMusicPrompt` (`src/domain/current-music.ts:39-71`) builds about ten "No…/without…" clauses, plus lines like "A musical preference request, not a treatment protocol". The seed descriptions in `current-seeds.json` add phrases like "without food, body or exercise themes", "without infant or nursery associations" and "without identity stereotypes".
- The prompt never mentions mode, chord vocabulary, voicing, register, form, phrase length or a genre reference. The only harmony instruction is "Simple consonant harmony".
- Text-to-music models tend to handle negation poorly, so words like "nursery", "crisis" or "exercise" may pull the music toward those things rather than away. Nothing tested that either way.
- The model has almost nothing to steer harmony with, so it probably falls back on its default "ambient piano" habits.

**2. The generation settings are the minimum.** `scripts/run-music-model.py:37` uses 8 steps, `shift=1.0`, `guidance_scale=1.0`, and `thinking=False` with every `use_cot_*` flag off.
- The ACE-Step 1.5 language-model planner, which works out metadata and structure, is never used.
- With guidance at 1.0, the text prompt has only weak influence.
- I haven't checked whether `shift=1.0` matches the Turbo checkpoint's recommended value. I think something higher, around 3, is typical, but that needs checking against the ACE-Step docs.

**3. Key is uncontrolled in the catalogue.** `requested_key` is `'C major'` only for custom sessions. Catalogue seeds get `''`. Tempo is fixed at 64 BPM for piano and acoustic and left unset for ambient.

**4. The structure leaves no room for musical development.**
- Catalogue pieces are 30 s, which is about 8 bars at 64 BPM. That's barely one antecedent/consequent phrase pair.
- Longer listening loops these clips. The seam check (`seamJump`, `seamRmsDifferenceDb`) only measures the jump in signal level, not harmony. A loop can jump from whatever chord the clip ends on back to its opening chord. That would sound like a strange chord progression even if each clip is fine.
- In session mode, the opening, developing and closing movements are three separately seeded generations (seeds 404027, 508756, 613485). Each gets a one-sentence movement hint. They share no motif, and none continues from the previous audio. Any "development" exists in the labels, not the music.

**5. The crossfade rule barely looks at harmony** (`src/domain/current-session.ts:36-55`). Key confidence is calculated as (best key score − second best) × 8, and the cutoff is 0.1. That means a margin of 0.0125 counts as the same key, which is basically noise. Two different harmonies could be crossfaded into a brief two-key clash. The real 270 s session avoided this because it fell back to quiet gaps.

**6. No check looks at musical content.** `currentTechnicalIssues` checks duration, loudness and peak, clipping, spectral centroid and onset rate. The pitch profile is stored but used only to guess key. Nothing flags notes outside the key, semitone clashes, tuning drift or erratic chord-change rates. The evidence files say so: `"audioAudition": "Not subjectively auditioned"` and `subjectiveListening: false`.

**7. Most sources peak at full scale.** Most piano and acoustic sources hit a true peak of 0 dBFS, with small but nonzero clipping. Two pieces have loudness ranges of 19–21 LU (seed-11-1, seed-16-2) despite the prompt asking for "soft even dynamics". Prompt adherence on dynamics is weak.

## B. Patterns in the stored measurements (approximate)

- **The key is usually unclear.** 16 of the 36 catalogue pieces had key confidence below 0.1, so no key was reported. The three pieces requested in C major scored only 0.17–0.48.
- **Several pitch profiles have half-step clashes near the top:**

  | Piece | Five strongest pitch classes |
  |---|---|
  | 01-1 | G F C **F#** E (F and F#) |
  | 10-1 | G **F#** D E **F** |
  | 12-1 | F E C A **F#** |
  | 14-1 | G E **F#** **F** C |
  | 11-1 | A E C **C#** F# |
  | 18-1 | **F# G Ab** (three adjacent half-steps) |
  | 16-1 | E G **F# Ab** |

  This could be deliberate modal colour (Lydian #4, or Mixolydian ♭7 over G), tuning drift, or real wrong-note clashes. Averaged profiles can't tell these apart.
- **Piano and acoustic pieces spread energy across more pitch classes than ambient pieces.** Measured flatness is about 0.1–0.32 for piano and acoustic against about 0.03–0.12 for ambient. If what you hear as odd notes is mostly in piano and guitar pieces, that would fit.
- **Tempo is only partly locked.** Pieces requested at 64 BPM read as about 63, with confidence around 0.5. Ambient pieces have no detectable pulse, as intended.

## C. Guesses about what you're hearing (unverified)

- **Harmony:** Chords probably drift as sus/add9 colours without real cadences, and change at irregular, off-beat moments. Chromatic chords may come from the model's "cinematic" habits. Without a mode or chord instruction, F and F# probably collide.
- **Voice-leading:** With a low spectral centroid (355–750 Hz), the left hand is probably clustered low, and close intervals there sound muddy or dissonant. Inner voices probably jump instead of moving by step.
- **Melody and phrasing:** Probably meandering with no repeated motif, and phrases that end on non-chord tones. The prompt's "sparse melodic detail" plus "spacious pauses" probably adds up to fragments rather than phrases.
- **Rhythm:** Probably rubato with no percussion and long rests, so the meter is unclear and chord changes feel random.
- **Development:** A 30 s clip, looped or placed next to unrelated movements, can't develop.
- **Artifacts:** 8-step distilled generation can cause pitch wobble, smeared attacks, phasey sustains and inharmonic piano overtones. These make correct notes sound "off". Clipped sources add harshness. The space/reverb effect may blur one chord into the next. I didn't read that effect code.
- **Taste:** The over-hedged prompt probably produces bland "spa" music that is generic and slightly wrong at the same time.

## D. Proposed experiment: matched seeds on ACE-Step 1.5 Turbo

The idea is to change one thing at a time, keep the same seeds across arms, and only use what is already installed (no downloads).

- **Pieces:** 6 concepts (2 piano, 2 acoustic, 2 ambient) × 3 fixed seeds × 4 arms = 72 clips of 30 s each. At roughly 6–16 s per clip, that's about 10–20 minutes of generation.
- **Arm A (baseline):** today's prompt and settings.
- **Arm B (prompt only):** a short, tag-style musical caption with at most one negation ("instrumental, no drums"). Explicit `keyscale` for every arm, including the catalogue. For example: "solo felt piano, slow 64 BPM, C major, diatonic, simple I–vi–IV–V progressions changing every bar, legato voice-leading, mid-register voicings, singable four-bar phrases ending on the tonic, intimate, warm".
- **Arm C (B plus settings):** the Turbo-recommended `shift` once confirmed, and guidance per the checkpoint docs. Turn on the language-model planner (`thinking` / `use_cot_metas`) only if its local checkpoint is already installed. Otherwise skip that factor and note it.
- **Arm D (C at 60 s):** tests whether a longer piece makes phrasing and cadences possible. It adds generation time but no new factors.
- **Blinded listening (main outcome):** clips randomised and anonymised. For each clip, score:
  - wrong or odd notes per 30 s (count with timestamps)
  - chord-progression coherence (1–5)
  - melodic phrase coherence (1–5)
  - pitch-wobble or piano-timbre artifacts (yes/no)
  - "would keep" (yes/no)
- **Objective aids (secondary only):** key confidence, half-step pairs among the top five pitch classes, and peak/clipping. If a transcriber is already installed, add the share of notes outside the key, simultaneous half-step intervals, and chord-change regularity. Transcription errors need to be checked by ear.
- **Decision rule (fixed in advance):** B, C or D must win at least 2 of 3 matched seeds for at least 4 of 6 concepts, and cut flagged odd notes by at least half compared with A. Only then would you regenerate the catalogue. If B wins but C doesn't, the cause is the prompt. If only C wins, the cause is the settings or planner.
- **Kept out of scope:** cross-piece crossfades and loop seams. Evaluate those separately once single clips are acceptable.

When the MIDI arrives, I'll use it to check notes outside the key, half-step collisions, the sequence of chord roots, phrase lengths and onset spacing. I'll treat every finding as a transcription-dependent estimate until it's checked against the audio.