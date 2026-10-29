# Current musicality review — 29 October 2026

The user's report of odd notes/progressions prompted an independent composition review, inferred MIDI archive and real matched-seed experiment. This run does not establish a subjective or clinical winner. Originals and saved-user references are preserved.

## Read this first

- [Synthesis and decisions](SYNTHESIS.md): agreements, disagreements, actual changes and listening decision.
- [Original inventory](inventory.json): 49 records, 46 distinct PCM outputs — 36 starters, nine earlier model-comparison records and four custom/study records. Browser-local bookmarks were deliberately not inspected; every original UUID remains available.
- [MIDI limits](MIDI-README.md), [original validation](midi-validation.json), [original manifest](transcription-manifest.json) and [per-piece summary](piece-summary.csv).
- [Study plan](study-plan.json), [actual generation](study-results.json), [study MIDI](study-transcription-manifest.json), [before/after CSV](study-comparison.csv) and [JSON](study-comparison.json).
- [BB provenance](bb-provenance.json): verified project, exact models and thread IDs. Full independent preliminary, all-piece and before/after outputs are retained unchanged under `critique/`; they contain explicitly unverified hypotheses and some corrected claims.
- [Audition validation](audition-validation.json), [listening map](audition-manifest.json) and [terminal low-frequency check](terminal-low-frequency-check.json).

## Listen locally

Open **http://localhost:3197** on the connected Mac. The dedicated server binds only 127.0.0.1 and serves only the review directory, not the repository or personal files. Soulfire remains at **http://localhost:3100**.

There are six trios, covering two piano, two ambient and two acoustic concepts. Pause other Soulfire audio/voice first. Every clip is actual generated music, normalized through the same -21 LUFS matching path with true-peak headroom. No browser level represents ear SPL. Only one review audio element plays; Stop clears its source. No autoplay or external requests occur. Backgrounding stops playback.

Clip letters are randomized **separately for each trio**. They are not the experiment arm names. Listen before choosing Reveal settings. Rate progression, phrasing, palette fit and artifacts, record any timestamps, choose a preferred clip per trio, then download the JSON. Ratings stay in tab memory until explicit export; nothing is uploaded or automatically saved. The test export used synthetic choices and is not an actual user rating.

The six preserved originals are arm A; B is the musical-caption treatment at shift 1; C uses exactly B's caption and metadata at shift 3. Same seeds reduce seed variation but do not make note-for-note minimal pairs. Key/metre/tempo words are bundled into the new captions; a separate structured-metadata-only experiment was not performed.

## Coverage and limitations

There are **61 record-linked inferred MIDI files**: 49 original records (46 unique audio outputs) plus 12 distinct new candidates, or 58 distinct PCM outputs overall. Two separately labelled synthetic calibration MIDIs are also retained. Every piece MIDI was reloaded and checked for note count, finite values, pitch range and duration. No transcription failed.

Spotify Basic Pitch 0.4.0 runs locally with its bundled ONNX CPU model. It is polyphonic but works best with one instrument. It cannot reliably separate voices/instruments in these stereo mixtures. A known synthetic C/E/G chord recovered those notes but also added E5/G5 harmonic false positives. Model activations are not calibrated confidence probabilities. MIDI's 120 BPM transport grid preserves absolute timing and is not an estimated musical tempo. Chord templates often return unknown; key estimates can be wrong. High aggregate chroma agreement is not exact-note accuracy. See the [official project](https://github.com/spotify/basic-pitch).

No one here has claimed to listen or judge pleasantness. MIDI, approximate key/chord and overlap flags organize a listening queue; they do not count wrong notes or measure wellness effects. No original score, stem separation, exact harmonic reconstruction or MIDI-to-Turbo control is claimed.

## Reproducibility and local assets

The installed ACE code/weights remain pinned; no model download, paid audio provider or Stable terms were introduced. Existing runtime configuration was neither copied into a new provider nor committed. The transcription tool was installed in a separate environment; versions are recorded in `transcription-requirements.txt`, with its model hash in both manifests.

Real study WAVs remain outside Git at `current-musicality-audio-study/` beside the isolated checkout. The listening directory is `current-musicality-audition/` beside it. Research records include source paths/hashes, never private voice recordings or sessions. The study runner preserves old audio, bounds each child, writes progress and enforces the result-storage/free-disk budgets. `raw/adapter-baseline.py` and `raw/adapter-shift3.py` preserve the exact study adapters; the latter changes only the timestep shift and reported setting. Do not rerun generation just to reproduce the listening page.

From the isolated checkout, `python3 scripts/build-current-musicality-audition.py` reconstructs the listening page from existing outputs. `scripts/transcribe-current-music.py` defaults to the original inventory; `--study` uses the 12-candidate inventory without overwriting the original manifest. The tool environment is separate from the app environment.

No remote push, main merge, deployment or automatic catalogue regeneration is part of this run. The separate customization concepts remain proposals until the user chooses.

Verification tools: `scripts/validate-current-midi.py` reloads the original 49 MIDIs; `scripts/compare-current-musicality.py` validates the 12 study MIDIs, computes descriptive comparisons and checks all original source hashes. These use the separate transcription environment. The study generation is complete and should not be repeated for ordinary review.
