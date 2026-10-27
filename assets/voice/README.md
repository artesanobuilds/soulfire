# Welcome narration source

The current welcome uses the approved everyday-life, work/family friction and generalized addictive-pattern language in `src/lib/welcome-introduction.json`. This is the single text source for the written introduction, sentence captions and local synthesis. It does not change the internal practice framework or care boundaries.

Selected local Kokoro-82M voice `af_heart` via kokoro-onnx, English, synthesis speed 0.84 with deliberate pauses. Duration 62.74225 seconds. No post-synthesis time stretching, voice cloning, paid service calls or microphone recording.

Run `scripts/prepare-welcome-voice.py` with the existing local Kokoro Python environment to reproduce `assets/voice/welcome-kokoro-heart-v2.wav`, `public/audio/welcome-kokoro-heart-v2.m4a` and `public/audio/welcome-introduction-v2.json`. The manifest records generated timing and fingerprints for the canonical script and served audio. The UI uses those timings directly. Captions show one sentence at a time; the complete written copy remains available to assistive technology.

The original v1 assets are retained for already open clients. New clients use versioned v2 paths to avoid stale cached narration. Playback needs no model download or credentials. Kokoro model: Apache 2.0; kokoro-onnx inference library: MIT. This is a generic synthetic voice, not a recording of a real identified person. Audio decode, timing, playback controls and text consistency are tested; direct listening and subjective voice quality are not claimed.
