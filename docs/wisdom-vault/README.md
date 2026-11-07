# Soulfire reviewed public wisdom

The harness uses **22 reviewed, newly authored conceptual summaries from eight public sources**, alongside the complete twelve-step core. Text and recorded/reasoned voice select up to three relevant items from the latest submitted user turn. Native live voice receives the bounded public collection at session startup, not dynamic retrieval.

The creator approved this subset for the configured OpenAI provider and requested integration without a feature flag on 7 November 2026. Ordinary requested sessions use it directly. No new paid evaluation or public app deployment was authorized or performed as part of the integration.

See [runtime scope, provenance and limitations](RUNTIME-REVIEW.md) and the [public package](public-runtime.json). The package contains original conceptual paraphrases, public source links and limitations. It contains no copied transcript/PDF text, private user reflections or local source paths. Public source availability is not a source-text reuse license; the speakers do not endorse Soulfire.

## Private authoring collection

The complete local authoring collection covers 25 sources, 394 pivots and 149 inventoried artifacts. Six available transcripts were reviewed in full; nineteen sources are summary/digest-only. It includes one master mapping, generated all-step map, references and offline validation tools together in this directory on the author's machine. These local files are deliberately Git-ignored, excluded from the public repository and never loaded by the app. A fresh checkout does not contain this private collection and must not require it to build or test.

The runtime public package is a reviewed projection, not a second authority for the complete collection. Future additions require explicit source/editorial/privacy review; there is no automatic export of unreviewed candidates. Preserve source distinctions, contradictory perspectives and zero-step/unmapped material rather than forcing every idea into the framework.

## Verification

`npm test -- --run tests/wisdom-retrieval.test.ts` tests deterministic retrieval, no-match behavior, safety bypass, actual mocked provider request composition, bounded context, and exclusions. Unit/build checks require only the public package. The separately retained local authoring tools validate source/pivot/adaptation hashes before regenerating the public projection.

These are offline contract checks, not proof of model quality, clinical benefit or perfect semantic relevance. No live provider evaluation was run for this integrated variant.
