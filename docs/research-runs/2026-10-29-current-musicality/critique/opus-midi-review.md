# Soulfire Current musicality review: all 49 transcribed records

I haven't listened to any of the audio, and I didn't edit, install or generate anything. I read every record in `transcription-manifest.json` and `inventory.json` with Python: 49 records, 46 distinct PCM, no failures. The 49 are 36 starters, 9 Music Lab comparisons and 4 custom pieces.

The transcription produces candidate notes, not a ground-truth score. In the synthetic check it found C, E and G but also added E5 and G5, so treat every note, half-step and chord flag below as a pointer for listening, not a count of wrong notes.

## Corrections to my preliminary critique

- **Guidance (CFG) is not a weak-adherence bug.** The pinned ACE-Step checkout (rev `ca1e85f`, `docs/en/INFERENCE.md:354-362`) says Turbo bakes guidance into distillation and auto-corrects it to 1.0. I withdraw that claim.
- **Shift 3 is confirmed in the pinned docs.** The same file says shift is *not* auto-corrected and recommends `shift=3.0` for Turbo (`INFERENCE.md:360-362` and `:377`). `Tutorial.md` adds that the default turbo checkpoint was distilled jointly on shift 1, 2 and 3. The adapter's `shift=1.0` is therefore off the documented setting, though not proven to be the cause of the odd notes.
- **My example caption broke the documented practice.** `Tutorial.md:700` says tempo and key belong in the `bpm`, `keyscale` and `timesignature` parameters, not in the caption.
- **The planner arm isn't possible.** The checkpoints folder has only `Qwen3-Embedding-0.6B`, `acestep-v15-turbo` and `vae`. There is no 5Hz planner model, and the arm would need a download.
- **I withdraw the half-step "clash" reading** of the strongest five pitch classes from the old audio pitch profiles. Those were averaged spectrum bins, not simultaneous notes.

## Per-piece table

How to read it:
- **Chord candidates:** `·` is a 2-second window the template couldn't label; (labelled/total windows) follows. The median match margin is only 0.02–0.04, so these are weak hints.
- **Tail bass:** the lowest candidate note starting in the last 6 seconds.
- **Register:** the 10th–90th percentile of candidate MIDI pitches, then the share of notes below C3.
- **Semitone overlap:** `inferredSemitoneOverlapFraction` from the transcription.
- **Grid fit:** how well onsets line up with a 64 BPM beat (0 = none, 1 = perfect).
- **Silence:** the longest stretch with no sounding note, in seconds.
- **Priority:** A = listen first; B = check one specific thing; C = most conventional, good control candidates.

| Piece `uuid` | Style | Key est. (conf) | Chord candidates | Tail bass | Register / <C3 | Semi overlap | Grid fit | Silence | Priority and why |
|---|---|---|---|---|---|---|---|---|---|
| 02-1 `7da4` | aco | G .25 | ·F D· (2/16) | E | 43–67 / 20% | .085 | .15 | 3.7 | A: F against a G centre, possible ♭VII; fragmentary |
| 06-1 `2ac9` | aco | C .13 | ·Dm Am· Am· C· (5/16) | F | 41–67 / 37% | .038 | .32 | 3.1 | B: low-heavy, ends on IV |
| 08-1 `fb56` | aco | C .19 | Am· C· Dm· C· F· (5/16) | G | 41–69 / 25% | .096 | .56 | 1.2 | C: diatonic, best pulse; ends on V |
| 10-1 `f5e0` | aco | G .19 | ·C· C D· (3/16) | G | 42–66 / 28% | **.182** | .42 | 3.4 | B: highest acoustic semitone overlap |
| 12-1 `c996` | aco | – .00 | F· (1/16) | – | 41–69 / 17% | .009 | .11 | **7.2** | A: no tonal centre, 7 s hole, irregular timing |
| 14-1 `8aa6` | aco | – .00 | ·C· C· (2/16) | **F#** | 44–69 / 12% | .008 | .43 | 4.1 | A: Ab-to-F# bass against C candidates |
| 16-1 `c732` | aco | Em .16 | ·D· D· C· (4/16) | **Ab** | 43–69 / 22% | .074 | .04 | 2.3 | A: tail bass outside Em; no pulse |
| 18-1 `251d` | aco | – .05 | ·D Em· D C· D· C· (7/16) | C | 42–66 / 37% | .039 | .46 | 2.0 | B: D–C alternation suggests a modal mix |
| 20-1 `6e69` | aco | – .02 | ·C· C· (2/16) | F | 48–67 / 7% | .015 | .61 | 1.5 | C: simple, good pulse |
| 01-2 `b6c9` | amb | – .05 | ·Em· C· (2/16) | G | 43–72 / 13% | .162 | .15 | 2.6 | B: semitone overlap |
| 02-2 `26bf` | amb | C .24 | ·C· F· Dm· F· (5/16) | F | 41–76 / 16% | .000 | .13 | 3.1 | C: plagal, ends on IV |
| 05-2 `ef7d` | amb | C .13 | C· (1/16) | C | 41–72 / 12% | .007 | .08 | 2.0 | C: static drone |
| 06-2 `7784` | amb | C .10 | ·C F· Em· (5/16) | E | 48–76 / 8% | .073 | .03 | 2.4 | B: ends on iii |
| 07-2 `97c1` | amb | C .22 | ·Am F· (2/16) | F | 43–72 / 16% | .038 | .09 | 3.5 | C |
| 08-2 `e674` | amb | A .25 | ·Bm· A· (2/16) | D | 42–71 / 26% | .000 | .18 | 3.4 | B: starts on F# bass, ends on IV |
| 09-2 `cb40` | amb | Em .27 | Em· C· Em· Em· (6/16) | E | 52–76 / 3% | .050 | .03 | 1.8 | C: clear minor centre, high register |
| 10-2 `16d4` | amb | – .02 | Em· C Em G D· C· (7/16) | C | 48–76 / 6% | .156 | .12 | 2.7 | B: overlap; diatonic G |
| 11-2 `3377` | amb | D .19 | C· F#m· C Em· D· (8/16) | D | 48–76 / 10% | .094 | .03 | 2.0 | A: C and F#m against D (out-of-key 15%) |
| 12-2 `8056` | amb | D .25 | ·Em C Am· Em C· D· (7/16) | D | 48–76 / 8% | .103 | .06 | 2.6 | B: C/Am inside a D ending |
| 13-2 `1bf8` | amb | – .05 | Bm· C· (2/16) | C | 40–71 / 24% | **.241** | .16 | 2.1 | A: highest starter overlap; Bm next to C |
| 14-2 `7edf` | amb | – .05 | ·C· F· C G· F· (6/16) | C | 43–72 / 13% | .007 | .09 | 0 | C |
| 15-2 `60e0` | amb | C .55 | ·F· C· C· (5/16) | C | 48–81 / 8% | .007 | .13 | 2.6 | C: strongest key |
| 16-2 `da32` | amb | D .43 | ·C F· Am· D· (4/16) | D | 38–72 / 27% | .000 | .09 | 2.9 | A: C/F/Am into D (out-of-key 18%) |
| 17-2 `e156` | amb | C .20 | C Am· F· G· Am F· (7/16) | C | 43–72 / 12% | .015 | .13 | 2.4 | C: I–vi–IV–V shape |
| 18-2 `e257` | amb | – .02 | C· G· Em· F Dm· D· (6/16) | C | 38–76 / 17% | .085 | .09 | 1.1 | B: D after Dm |
| 19-2 `ef35` | amb | – .04 | ·C Em· C· C· (4/16) | **F#** | 43–76 / 11% | .000 | .12 | 3.0 | A: F# tail bass against C |
| 20-2 `0bdf` | amb | – .10 | Em· F Em· (3/16) | G | 43–77 / 14% | .096 | .13 | 2.5 | B: Em–F half-step root move |
| 01-1 `667d` | pia | C .18 | ·Am C· F· (3/16) | F | **36**–69 / 37% | .118 | .08 | 2.1 | A: lowest register, close low notes, loose pulse |
| 05-1 `af7b` | pia | – .04 | ·C· F· Am· Am· (4/16) | C | 40–67 / **44%** | .137 | .61 | 4.1 | A: most low-heavy (median MIDI 48) |
| 07-1 `34d2` | pia | C .26 | C· Dm F· C· (4/16) | C | 40–71 / 28% | .155 | .38 | 3.8 | B: diatonic, but overlap |
| 09-1 `4e38` | pia | – .05 | C· C· C· (4/16) | G | 42–71 / 35% | .000 | .55 | 3.1 | C: static |
| 11-1 `aef3` | pia | – .03 | ·B· F Abm· C F#· (5/16) | G | 42–75 / 19% | .038 | .45 | 1.5 | **A, top priority: B, F, Abm, F# roots are non-diatonic** |
| 13-1 `44d3` | pia | – .01 | Em· Bm C G Am D· C· (7/16) | G | 42–69 / 28% | .044 | .30 | 2.2 | B: fast-moving G-major cycle |
| 15-1 `c787` | pia | – .08 | C· Am· Em· Dm G· (5/16) | G | 40–74 / 28% | .051 | .50 | 2.3 | C: descending diatonic, ends on V |
| 17-1 `021e` | pia | C .48 | ·Am· C F· (5/16) | G | 43–72 / 19% | .031 | .18 | 1.6 | C |
| 19-1 `5cdb` | pia | G .11 | Em· G Dm· Em· G· (5/16) | G | 40–79 / 24% | .076 | .47 | 3.6 | B: Dm in G (minor v) |
| Lab s101 `b905` | aco | – | C· D· D· F· (4/16) | F | 42–67 / 28% | .097 | .07 | 2.9 | B: D major next to F |
| Lab s202 `9079` | aco | – | ·Dm· C· C· (3/16) | F | 43–67 / 19% | .000 | .54 | 4.8 | C |
| Lab s101 `5484/9be5` (2 records) | amb | – | C· D· Em F· C· F· (10/16) | F | 48–76 / 7% | **.252** | .07 | 1.9 | A: highest overlap overall |
| Lab s202 `ca50` | amb | – | Dm· C· F Dm C· F· (10/16) | F | 43–72 / 13% | .120 | .02 | 1.2 | B |
| Lab s101 `1f68/852b/e78b` (3 records) | pia | – | C Em· Dm· C· F· (5/16) | F | 41–76 / 14% | .082 | .21 | 3.0 | C: same PCM 3 times, so this seed reproduces |
| Lab s202 `4b98` | pia | – | D· Am· Dm· (3/16) | F | 40–74 / 22% | .000 | .26 | 4.5 | B: D major next to Dm |
| Custom s404027 `5cac` | pia 90 s | C .25 | C·Em C F C…G C…Em Am·C· (17/46) | G | 40–71 / 28% | .050 | .38 | 0.8 | C: one G→C; ends on V |
| Custom s508756 `41f2` | pia 90 s | C .48 | C·F C·F G Am C·G F…F· (18/46) | C | 40–74 / 26% | .032 | .41 | 0 | C: G→Am deceptive move; ends on tonic |
| Custom s613485 `2893` | pia 90 s | C .17 | …G C F C…Am F G·F· (25/46) | – | 41–71 / 23% | .096 | .05 | 0 | B: two G→C, no tail onset |
| Custom s73019 `2ab9` | pia 30 s | – .00 | F· G· F· (3/16) | F | 41–69 / 26% | .148 | .62 | 4.0 | B: F–G vamp with no tonic |

## What the transcription suggests overall

1. **Chord candidates are mostly diatonic.** Most labelled windows are plain C, F, Am, Em, Dm, G, D or Bm triads. So the odd progressions are probably not mainly chromatic chords. The data instead points to:
   - Weak sense of direction: iii and ii chords are common, and none of the 36 starters has a G-to-C candidate in adjacent windows. That move appears only in two custom C-major pieces.
   - Endings that don't settle: the last onset usually falls at 24–28 s, and 12 of the 23 starters with a key estimate end with a bass outside the estimated tonic, often on IV (F) or V (G). Looping then joins that open ending straight onto an unrelated opening bass.
   - Modal or out-of-key material in a smaller group: 11-1, 11-2, 16-2, 14-1, 16-1, 19-2, 02-1, 19-1 and 18-1.
2. **Harmonic rhythm can't be pinned down.** Only 253 of 826 windows (31%) got a label, so how often chords change is unknown.
3. **Register is low-heavy in a few pieces, not across the board.** Piano and acoustic median pitch is MIDI 55–57 (G3–A3), with 22–26% of notes below C3. Overlapping close intervals low down appear in only a handful (01-1, 05-1, 06-1, `5cac`). My earlier blanket "low-register mud" guess is too broad.
4. **Phrasing and timing are fragmentary.**
   - Onset spacing is irregular (spread is about 1.3–1.5× the average gap), with 2–4 s silences, and one of 7.2 s in 12-1.
   - Ambient pieces barely line up with any pulse (median grid fit .09, as intended for beatless music). Piano (.38) and acoustic (.42) line up only partly with the requested 64 BPM.
   - A 30 s clip holds roughly one or two gestures, not a repeated phrase.
5. **Possible end-of-clip artifact.** Every 30 s render has an isolated MIDI-22 (about 29 Hz) detection at 29.53–29.60 s, with no other onsets. The 90 s renders show nothing below MIDI 31.
   - It could be a low-frequency event at the end of the source or an edge effect of the transcriber. I can't tell which.
   - It matters because loops play straight across that point. A spectrogram or a listen to the last half-second would settle it.
   - High candidate notes at or above MIDI 84 are rare, which fits the overtone false positives seen in the synthetic check.
6. **Overlap is not proof of clashes.** Semitone overlap above .14 (13-2, Lab ambient s101, 10-1, 01-2, 10-2, 07-1, 05-1, `2ab9`) may come from reverb tails or overtones. Those pieces get "listen", not "wrong".
7. **The prompt is the cause I can see in code that explains the most.** Policy-style negations, no musical vocabulary, no ending or phrase guidance, and `[Instrumental]` as the only "lyrics" line add up to unplanned material.

## Controls the pinned docs support

- `caption`: style, instrument, emotion, timbre and progression words.
- `lyrics` structure tags: `[Intro]`, `[Outro]`, `[Piano Interlude]`, `[Fade Out]`. It's unverified whether these take effect when `instrumental=True`, so leave them for a later arm.
- `bpm`, `keyscale` and `timesignature`.
- `duration`, `seed`, `inference_steps` (1–20, 8 recommended) and `shift`.
- repaint and cover-from-source-audio modes.

There is no CFG on Turbo, and no planner without a download.

## Safe to change now vs. needs Miguel's listening

**Safe now (these don't change any audio):**
- Raise the crossfade key-confidence threshold so uncertain pairs default to the quiet gap. Today a margin of 0.0125 passes as "same key".
- Never show chord, half-step or out-of-key flags as quality scores.
- Record shift as an explicit experiment setting, with no default change yet.
- Run a read-only spectrogram check of the last 0.5 s of the 30 s sources and beds.
- Document the transcription limits next to the manifest.

**Needs Miguel's listening:**
- Any default change to shift or the prompt.
- Regenerating the catalogue.
- Changing the `keyscale` or `timesignature` policy.
- Deciding the end-of-clip question.
- Choosing between "conventional" and "modal" taste. Some modal colour may be desirable.

## Proposed experiment: 12 new 30 s pieces

- **Pieces:** one flagged and one control concept per palette, using their original seeds and concepts, so the existing WAVs serve as the baseline arm. Same-seed renders already match exactly, as the three identical Lab s101 records show.

  | Palette | Flagged | Control |
  |---|---|---|
  | Piano | 11-1 (seed 83242) | 15-1 (seed 83646) |
  | Acoustic | 14-1 (seed 83545) | 08-1 (seed 82939) |
  | Ambient | 16-2 (seed 83878) | 17-2 (seed 83979) |

- **Arm A, baseline (reused, nothing generated):** the current prompt with shift 1.
- **Arm P, prompt only (6 new):** a positive caption with musical vocabulary and no negations. Metadata stays identical to the baseline (no keyscale; bpm 64 for piano and acoustic, none for ambient), with no key or BPM words in the caption. The palette stays distinct:
  - Piano: "solo felt piano, intimate close-mic, soft warm tone, slow and gentle, simple diatonic harmony, smooth stepwise voice-leading, singable middle-register melody, repeated four-bar phrases, settles at the end, calm, instrumental"
  - Acoustic: "solo nylon-string classical guitar, soft fingerpicked arpeggios, warm intimate tone, simple diatonic chords, clear melody on top, repeated phrases, relaxed, settles at the end, instrumental"
  - Ambient: "beatless ambient, warm sustained pads and soft strings, slow consonant chord changes, smooth voice-leading, long gentle swells, spacious, calm, resolves softly"
  - Each concept's character is reworded positively, e.g. 11-1 becomes "brief gentle phrases".
- **Arm PS, prompt plus shift 3 (6 new):** identical to P except `shift=3.0`.
- **Cost:** roughly 3–4 minutes of generation and about 140 MB, within the existing budget.
- **Listening (main outcome):** Miguel hears each seed's A/P/PS trio blind and randomised, and records:
  - timestamps of odd notes
  - whether the progression makes sense (1–5)
  - phrasing and ending (1–5)
  - artifacts, including the end of the clip
  - fit to the palette (1–5)
  - a preference rank
- **Decision rule, fixed in advance:**
  - Adopt P if it beats A in at least 4 of 6 trios without lowering palette fit.
  - Adopt shift 3 if PS beats P in at least 4 of 6.
  - Otherwise keep the baseline.
- **Secondary:** run the same transcription, descriptively only, plus the end-of-clip check.
- **Later, separate arms:** explicit `keyscale`/`timesignature`, lyrics structure tags, and 60 s durations. These are kept out to avoid mixing several changes at once.

The winning arm stays undecided until Miguel listens.