# Chat composer feedback · 8 November 2026

## Changes

- A small sage three-dot animation appears immediately on submission, both beside the pending reply and beside Stop. The status changes from “Thinking…” to “Responding…” when text starts streaming, and clears on completion, failure, cancellation or navigation.
- The status is readable without motion; the dots are decorative to assistive technology. System reduced-motion preferences, the app's Pause motion control and hidden-page state suppress the animation.
- Enter sends; Shift+Enter inserts a newline. Existing Ctrl/Meta+Enter shortcuts remain available. IME confirmation, legacy composition keycode 229 and held-key repeat do not submit. Existing request locking, connection and voice guards still prevent duplicate or unavailable sends.
- The opening label and placeholder apply only to an empty conversation. Subsequent turns use “Talk this through” and “Ask a question, or tell me what feels different…”. Starting fresh restores the opening copy; a canceled or failed first turn preserves the draft and opening state.

## Verification

- TypeScript and full ESLint passed.
- All 380 unit tests passed, including seven keyboard shortcut cases.
- Production build passed from a credential-free temporary source copy.
- 48 focused desktop/mobile browser tests passed, covering the new interactions, multi-turn conversation, streaming, canceled and failed requests, dictation, IME confirmation and reduced motion.
- The broader isolated desktop/mobile suite passed 309 checks. Two additional cached-voice cases initially could not start because an old fixture was missing; recreating it with the local-only mocked verifier made both pass (six-case voice-file rerun passed). In total, 311 distinct browser cases passed; one desktop instance is intentionally mobile-only and skipped.
- Independent read-only review found no actionable issue.

Browser/model/media success paths are simulated. No paid model calls, physical microphone capture, provider-quality evaluation or public deployment is included. Local screenshots under `test-results` use fictional content only.

## Local delivery

The fixes are kept on `fix/chat-composer-feedback-20261108`. The separate local 3102 preview is updated to the same revision; the older 3100 process and existing browser tabs are left untouched. No remote push, main-branch merge or public deployment is included.
