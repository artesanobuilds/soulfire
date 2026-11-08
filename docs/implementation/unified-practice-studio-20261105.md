> Historical checkpoint: the [November 8 consolidation](single-local-build-20261108.md) replaces this document’s branch/3102 launch instructions with local `main` on port 3100.

# Unified practice studio test build · 5 November 2026

Local-only branch `experiment/unified-practice-studio-20261105`, built from fetched main `d6ea83f` (including the manually verified voice pause/noise tuning). Integrated experiment heads: voice `8876571`, situated guidance `3cfee8f`. Original checkouts and their histories remain intact; no main merge, push or deployment.

## Implemented in this build

- Grounded sage/ivory working surfaces, with Understand → Practice → Reflect orientation and smaller activity illustrations.
- Home and Practices navigation; My space groups history/memory and review tools group simulations/voice testing. Existing Current and Ember shortcuts remain.
- Editable understanding beside the practice offer, clear explanation of fit and an explicit return to conversation to review a correction before sending it. The note is private and included only in opted-in device saving. It does not silently re-generate a practice or become voice context.
- Existing interactive practice families, keyboard-friendly controls, pause, selective sharing and reflection remain in use. Returning from Current or Ember restores the activity in the current tab without transmitting private answers to either tool.
- Embedded voice-quality test with language selection and a separate in-tab conversation. Native Live voice retains the timing/noise tuning and uses candidate situated guidance. The alternative generates through text reasoning, then synthesizes the accepted text locally. Speech failure retains text without a second provider request. Leaving the test or opening a dialog pauses playback.

## Still proposed or unverified

New inventory and repair exercise families, broad all-step recommendation coverage, automatic context transfer into Current/Ember, unified cross-mode conversation history, clinical benefit and voice/text parity are **not** implemented or established. The exact-speech option is slower and is not a full duplex voice replacement. Its recording input uploads a file for transcription, not continuous microphone capture. Main and test conversations are intentionally separate and disclosed. The situated candidate's prior bounded findings do not establish reliability for this newly combined build.

## Manual test

1. Open the unified local URL supplied with the handoff, choose Begin journey, then Try the example. Correct the private understanding and try the practice.
2. Edit a thought; visit Ember or Current using the practice rail, then Return to this practice. Verify your place and edits remain. Continue to reflection; choose private continuation or explicitly select answers to share.
3. Compare voice options opens the experimental text-reasoning + exact-speech conversation. Type a fictional question, choose language, submit and explicitly play the resulting audio. A recording upload sends audio for transcription. Native Live voice remains in the main companion's controls.
4. Use the same fictional situation in both modes and compare factual grounding, usefulness, delay, interruptions and audio quality. No parity claim is made. Physical microphone/speaker and subjective quality require the user's test.
5. Device saving, history recording, AI memory and provider submission are separate choices. The test conversation remains only in the page while open and is cleared by its Start new conversation control.

Provider submissions can incur charges. No new budget is authorized or automatically enforced by this UI. The existing evaluation ceiling stays unchanged; no live provider evaluation was run for this integration. Test fixtures used a credential-free server and separate synthetic data directory, not the user's saved data.

## Validation

Final code: typecheck, lint, production build and all **279 unit tests passed**. The full **272-case** desktop/mobile browser run finished with **267 passed, 1 intentional desktop skip, and 4 audio-clock failures** in existing arrival/witness-playback scenarios. An unchanged isolated rerun of those three scenario titles on both viewports passed **6/6**, covering every failure. Treat this as intermittent automated media-clock behavior, not a perfectly clean single-run result. All new studio tests and existing voice timing/noise/protocol regressions passed. Local synthetic Kokoro verification passed with four in-process mocked model turns, actual local audio synthesis and child cancellation, and zero paid requests.

The new coverage verifies current-premise initialization, explicit correction submission, quiet-tool return, separate voice-test state/language, retained text on synthesis failure, opt-in private-note saving, replacement confirmation, keyboard focus and no horizontal overflow. Desktop/mobile captures were visually inspected. Real provider quality, physical microphone/speaker behavior and subjective audio quality remain for manual testing.

## Local runtime

Manual-test URL: http://127.0.0.1:3102. The original http://127.0.0.1:3100 is unchanged. The manual instance uses the existing authorized server-side configuration, the experiment flag and a separate `~/Library/Application Support/soulfire-unified-test` data directory. No secret is copied into this branch. Browser storage is separate because the port is different.

The launchd session job `com.soulfire.unified-test-20261105` survives this tool session (until stopped/logout). Runner: `scripts/start-unified-local.sh`. Logs: `/tmp/soulfire-unified-runtime.log` and `.err`. Stop only this instance with `launchctl remove com.soulfire.unified-test-20261105`. It is not a public deployment or a boot-time installation.
