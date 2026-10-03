# Proof of Concept One — implementation plan

Starting point: clean main at 8d3c23e. Existing identity, landing and practice images retained. No AGENTS.md or repository skills found. Working branch: codex/proof-of-concept-one. No publication is authorized.

## Product contract

Follow vision.md, product-strategy.md, prototype-use-cases.md, agent-foundation.md, step-principles-map.md and D-001/D-002. Keep the sheltered flame, warm ivory #FDF8EF, sage #4C6456, charcoal #292C28, restrained gold #B88945. Generative UI means validated data rendered by known components, never executable model output. Proposed program language remains a prototype interpretation, not doctrine or a clinical claim.

## Sequence and completion criteria

1. Design all primary sections in responsive browser-native components: invitation and language choice; principle suggestion; personalized practice; quiet meditation; sharing review; reflection and action; twelve-step map; privacy/support; dictation/live voice states. Export desktop and mobile images for parent review. Include four distinct journey samples, visibly labeled as examples.
2. During review, build the server-only Responses API boundary, strict schema, input limits, cancellation, error recovery and provenance. Keep drafts ephemeral; only explicitly submitted conversation and selected reflections cross the model boundary.
3. Add editable audio dictation and WebRTC live voice using authorized OpenAI configuration. Keep a shared transcript and active practice. Disconnect microphone/playback for meditation, pause, page hiding and unmount. Support interruption, mute and explicit end. Never silently substitute fake replies when service is unavailable.
4. Implement card movement/edit/removal/addition, choice/reflection components, meditation pause/resume/reset, explicit reflection sharing and a user-chosen action. All twelve steps visible; detailed sensitive inventories/amends deferred.
5. Incorporate parent feedback and run lint, TypeScript, unit/API tests, production build, browser desktop/mobile navigation, failure/denial/cancellation tests, and actual provider/voice round trips when credentials/consent permit. Clearly separate simulated transport tests from live evidence.
6. At the very end, explore separate unconventional interaction directions with parent. Preserve the working POC.

## Technical choices and boundaries

Next.js + React + TypeScript, Zod runtime validation and CSS design tokens. Responses API structured outputs; configurable gpt-4.1-mini baseline, pending live evaluation. Separate cloud transcription (editable draft) and Realtime WebRTC paths. API key only on server, store:false for Responses, no application logging of personal content, no database/analytics. No account, persistence or silent saving. Optional downloadable summary explicitly writes a local file. Provider retention is separate; no zero-retention promise.

This is a localhost-only adult self-help prototype, not a public service. External deployment needs authentication, distributed rate limiting, spending controls, reviewed privacy terms and qualified review of sensitive flows. No diagnosis, detox plans, forced blame, spiritual authority or substitute-sponsor claims. User choice, stop, skip and human support remain outside model control.

## Known access gate

No OPENAI_API_KEY in task environment or repository configuration at initial inspection. Parent notified promptly. Implement all integrations and tests but do not claim actual AI/voice success until tested. Physical microphone use requires user consent. No credentials created or billing commitments accepted.

## Checkpoint outcome

Responsive designs reviewed and refined; complete local loop and real API integrations implemented; lint/typecheck, 43 unit/API tests, 20 production browser scenarios and 2 real HTTP checks passed. Production build passed. Missing authorized API key and physical microphone consent prevent the final real model/voice acceptance gate. Do not call the POC fully complete. The separate alternative-interface brainstorm remains deferred. Final source, screenshots, secure setup and live evaluation checklist are preserved for continuation.
