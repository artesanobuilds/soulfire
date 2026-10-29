# Inferred Current MIDI review aids

49 generated record references, 46 distinct PCM outputs. Originals and saved-user UUID references are preserved. Source audio stays local; only references/hashes are included.

These are Spotify Basic Pitch 0.4.0 ONNX transcriptions, not original scores or separated instrument performances. Every filename says inferred. Timing is in seconds on a transport grid of 120 BPM; this does not assert the music is at 120 BPM. Uncalibrated activations are not confidence probabilities.

A known synthetic C/E/G chord recovered all three target pitches but added E5/G5 harmonic false positives. Reverb, pads, overlapping instruments and overtones can create spurious notes/chords. Do not treat half-step or outside-key flags as wrong notes without checking source audio. Coarse chord estimates often remain unknown. Aggregate chroma overlap does not prove exact notes or voice-leading. No human listener has validated these transcriptions.

Inventory separates 36 eligible starters, nine earlier comparison records and four custom/study records. Browser-local bookmarks are deliberately not inspected; all existing pieces remain untouched. See MIDI validation, source hashes, analysis JSON and raw notes for provenance.
