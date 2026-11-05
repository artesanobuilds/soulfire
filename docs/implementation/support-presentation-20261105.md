# Support presentation and provider errors · November 5, 2026

The creator requested removing the generic intrusive human-support screen and interrupting only for severe urgency. Previously every model `kind: support` reply opened the same modal, including generic crisis and withdrawal copy. The footer and broad voice backstops also opened it.

## Current behavior

- Ordinary support replies stay in the conversation. A model's `support` label alone cannot open an overlay.
- Human support is an optional inline footer disclosure. It does not pause the whole screen or display generic withdrawal advice.
- A narrow application presentation gate can interrupt for explicit first-person current intent/plan to hurt or kill self/someone, stated overdose, inability to keep oneself safe, specific acute symptoms during alcohol/sedative withdrawal, or an explicitly ongoing attack by a partner/ex.
- The urgent panel contains the applicable safety notice only, remains dismissible, and makes no diagnostic claim. It does not add unrelated withdrawal/crisis paragraphs.
- Negated statements, historical/hypothetical framing, quoted third-party statements, ordinary distress, common figurative language, fear or unwanted intrusive thoughts without declared intent do not independently meet this popup gate.
- Broader existing medical/boundary safety responses remain available inline. Existing model safety instructions and the voice safety stop remain. Added direct-risk patterns get an application response before any provider request.

These are narrow English-language heuristics, **not** a clinically validated risk assessment or a guarantee of safety. They can miss risk or misunderstand context. A third-party quotation can still require serious help in the conversation even when it does not open this overlay. Removing the generic modal does not suppress supportive responses or emergency guidance.

## API error diagnosis

The reported error was generated only for an upstream HTTP 429, not the app's own local rate limiter. The original code discarded the provider error body, so that past response cannot prove quota versus temporary rate limiting. The creator later reported adding credits restored service, consistent with unavailable quota. No paid diagnostic retry or billing change was made.

The provider boundary now recognizes allowlisted quota/billing codes versus `rate_limit_exceeded`. Unknown 429s remain explicitly uncertain. Logs contain only HTTP status and an allowlisted category, never raw provider messages, credentials, account identifiers or question text. The voice-test UI no longer suggests rewriting the question for a provider failure; its draft remains intact and no automatic retry is introduced.

## Validation

Typecheck, lint, production build and 319 unit tests passed. The affected desktop/mobile practice, live-voice, studio, support and provider-error UI suite passed 80 checks. The final presentation-only refinement for intrusive thoughts and the quota-error flow passed a further 16/16 checks across both viewports. All model transports were mocked or bypassed by local safety backstops. No real provider inference or physical-microphone check was performed.
