All verified: 12 new distinct PCMs, the 6 baseline UUIDs are the originals (no study PCM matches a baseline PCM), zero failures, originals preserved. Here is the before/after interpretation.

# Twelve-candidate study — descriptive A/B/C comparison (no listening, no winner)

**Design as recorded:** A = preserved original (prose caption, shift 1); B = musical caption only, original metadata (`requestedKey` stayed `""`, bpm as before), shift 1; C = B's caption/metadata with shift 3. Key/time/tempo words live *inside* the B/C captions, so this is a **bundled caption treatment** — it cannot isolate the phrase-level vs. metadata-field mechanism, and the upstream metadata-field route remains untested (recorded limitation). All note/chord/key figures below are Basic Pitch inferences with the known synthetic harmonic false-positive caveat; they are review aids, not accuracy measures or a subjective verdict.

## Six matched trios (A → B → C)

| Concept (style/intent, seed) | Key est. (conf) | Identified chord windows & progression | Clash | LRA | Notes/s | Notable |
|---|---|---|---|---|---|---|
| In My Own Words (piano/focus, 84050) | G 0.11 → none 0.08 → none 0.02 | 5/16 "Em G Dm Em G" → 2/16 "C Dm" → 1/16 "C" | .08→.07→.11 | 7.2→7.9→7.0 | 5.1→5.4→5.8 | Only trio where key clarity **worsened**; C brighter (centroid 418→584), top note 94 |
| Begin Again (piano/lift, 83848) | C 0.48 → C 0.42 → C 0.46 | 5/16 "Am C F" → 8/16 "C F" → 8/16 "C" | .03→.02→.07 | 11→6.2→5.0 | 5.1→5.1→6.9 | Key flat; dynamics much evener; high-register notes 2→0→0; new 6 s dead-air in B |
| Gentle Company (ambient/company, 84282) | none 0.10 → C 0.24 → C 0.61 | 3/16 "Em F Em" → 5/16 "Dm F" → 2/16 "F" | .10→.22→.04 | 5.7→5.9→5.6 | ~4.7 flat | Biggest key-centering gain (C arm); B's clash spiked then C's dropped; high notes 6→3→2 |
| First Light (ambient/focus, 84181) | none 0.04 → C 0.19 → C 0.20 | 4/16 "C Em C" → 3/16 "C" → 3/16 "C G F" | .00→.01→.02 | **15.9**→4.2→5.2 | 3.2→4.1→3.9 | Baseline's extreme dynamic swing tamed; C only arm showing a C–G–F motion |
| Familiar Afternoon (acoustic/company, 84151) | none 0.02 → C 0.24 → C 0.25 | 2/16 "C" → 4/16 "C F C" → 9/16 "C" | ~0 all | 3.6→1.7→1.3 | 3.0→5.5→5.2 | Densest change (+80% notes, onset 1.37→2.4); C's tempo estimate 43 vs requested 64 (likely 3:2 detector confusion, or real drift — listening item) |
| In the Meantime (acoustic/calm, 83949) | none 0.05 → C 0.19 → C 0.31 | 7/16 "D Em D C D C" (57% diatonic) → 8/16 "C F C" → 10/16 "C F C F C" | .04→.07→.11 | 10.4→2.5→2.6 | 4.1→4.4→4.5 | Cleanest harmony fix: modal D/C wander became fully diatonic C–F alternation |

## Interpretation

**What moved in the hypothesized direction.** The musical caption (B) pulled 4 of 6 pieces — both ambients and both acoustics — from "no key estimate" to an identified C with higher confidence, exactly the keyless pieces I'd flagged; the previously chromatic *In the Meantime* became fully diatonic; loudness range collapsed toward the requested "even dynamics" in 5 of 6 (e.g. 15.9→4.2 LU); and above-C6 notes mostly receded ("dark warm tone" wording plausibly responsible). Shift 3 (C vs B) added a further modest key-confidence gain in 4 of 6, dramatically so for *Gentle Company* (0.24→0.61), and lifted identified-chord coverage on the acoustics (4→9, 8→10 windows).

**Where the data disagrees with my earlier hypotheses — stated plainly.**
- *Caption hypothesis (H2) is only half-supported.* Tonal centering improved, but harmonic **variety collapsed**: distinct identified chords fell to 1–2 in most B/C arms, nobody produced the requested C–Am–F–G (Am essentially vanished), and note density **rose** in 5 of 6 — against the "sparse" intents. The treatment traded wandering harmony for static harmony and busier, more pulsed texture. Whether that's better is exactly the listening question.
- *The piano/focus trio went the wrong way*: the only arm-A piece with any key estimate lost it entirely in B and C. Tag captions are not uniformly stabilizing.
- *Shift 3 (H1) looks weaker than upstream documentation suggested* on these proxies: gains are small and mixed, it brightened spectral centroid in 5 of 6 (tension with the "no bright" preference), and coincided with one tempo-estimate anomaly. No consistent clash or structure benefit.
- *Semitone-clash did not systematically improve* (B even spiked to 0.22 on *Gentle Company*), so the dissonance complaints may not be caption-addressable.

**Bottom line.** The bundled caption treatment reliably changed the music in measurable, mostly intended directions for ambient and acoustic palettes, was mixed for piano, and introduced its own risks (static harmony, higher density, brightness under shift 3, possible dynamic flatness at LRA 1.3–2.5). Nothing here justifies automatic catalogue replacement; defaults correctly remain unchanged pending Miguel's blind listening of the six trios, with the metadata-field-only arm and the same-key-confidence transition guard as the natural follow-ups.