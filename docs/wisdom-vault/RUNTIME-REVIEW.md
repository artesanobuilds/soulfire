# Integrated public wisdom harness

## Implemented

The existing text/recorded-voice model adapter now has deterministic retrieval over **22 explicitly reviewed, newly authored public conceptual adaptations from eight sources**. These are a selected subset of the 394-record review corpus, not an automatic export of its contents.

- Text and recorded/reasoned voice: select at most three matches from the latest submitted user message, at most two per source, with at least two distinct explicit trigger matches. Preserve requested-step filtering. No-match is valid. Assistant replies, older messages, private memory and reflection responses do not drive lookup.
- Native Realtime voice: has no backend per-turn text-retrieval hook. It receives the bounded 22-item public bundle at session start, allowing the model to consider relevant ideas. This is **not dynamic per-turn retrieval** and needs separate quality/cost evaluation.
- Both retain the existing full twelve-step core and all safety/consent rules. The subset contains no Step Twelve pivot, health protocol, financial advice, theological claim or personal history.
- Existing application safety backstops still bypass the provider. The retriever also abstains for those detected cases; this is not a comprehensive crisis classifier.
- The reviewed subset is directly integrated without a feature flag, following explicit creator approval. No browser or request field can expand the collection.

## Authorization and publication boundary

On 7 November 2026, after being told that these 22 public conceptual summaries and source citations would accompany ordinary requests to the configured OpenAI Responses/Realtime provider, the creator approved integration without a feature flag and requested merging/pushing the project changes. The obsolete `SOULFIRE_PUBLIC_WISDOM_ENABLED` setting is removed and ignored.

This authorizes this reviewed subset, not raw/private Vault transmission, paid evaluations, increased budgets, public app deployment or automatic promotion of future material. Existing ordinary model-session costs still apply; the voice context can increase tokens. No actual provider request was made in integration tests.

The GitHub repository is public. Therefore only this approved public projection and safe implementation/documentation are tracked. The 394-pivot master, 149-artifact inventory, private authoring tools and full source-reference map are retained locally under Git ignore. Fresh checkouts build/test without them. No original notes, transcripts, PDFs, private reflections or local source paths are included in provider context.

Rollback is a reviewed code/package revert, not an environment switch. It must preserve private authoring records.

## Editorial and provenance review

- Eleven items come from fully reviewed available Sage/Rubin transcripts; eleven come from reviewed local public-source summaries for Hudson (three sessions), Williamson, Rohn and Chamath. Summary-based provenance is explicitly labeled; original media was not independently reviewed for those eleven.
- Each public item has a stable parent pivot ID, original public URL and exact saved locator. Source and reviewed-pivot SHA-256 checks bind it to the reviewed snapshot.
- Public guidance was freshly written about general ideas. It is not the original note's wording, a transcript excerpt, a personalized example, a speaker quotation or an endorsement.
- Private application sections, user annotations/plans, hidden prompts, social drafts, raw transcripts and source files are not exported. No original Vault path or user identity is included in provider context.
- All 22 have explicit limitations preserving practical obligations, boundaries, capacity, uncertainty and appropriate human help.

## Terms and reuse limits

Stored Sage/Rubin source metadata contains no license, copyright-permission or terms-grant field. No source-text reuse license was established for the remaining summary-linked videos either. Public availability alone is not a redistribution license. No new terms were accepted or accounts created during this work.

For that reason this candidate deliberately exports **only newly authored short conceptual guidance** with attribution, not protected expressive source text, captions, PDFs or the user's private notes. This is an editorial limitation, not legal clearance or a claim that the speakers permit commercial use. Only the newly authored public subset is approved for repository publication. No license to reproduce original source expression is asserted. The complete mapping and source reference package remain local-review-only.

## Controlled export

`mapping.json` remains the sole editable authority. Only entries with an explicit `publicAdaptation` review record can enter `public-runtime.json`. `tools/export-public.mjs` requires the reviewed source/pivot/adaptation hashes, known rights basis, limits and triggers. Missing/stale review fails the export. It never bulk-promotes candidates or changes the raw pivot `runtimeApproved` status. The 22 adaptation review records separately record user approval. The exporter and master are local authoring files, not runtime dependencies.

```sh
node docs/wisdom-vault/tools/export-public.mjs
node docs/wisdom-vault/tools/render.mjs
npm test -- --run tests/wisdom-retrieval.test.ts
```

## Validation meaning

Offline tests exercise actual provider request composition through mock transports, including direct flag-free integration, relevant and unrelated matches, deterministic bounds, private-context exclusions, source-hash integrity, native startup bundle and safety bypass. No actual model was called. Lexical relevance and guarded instructions do not prove live conversational quality, semantic recall, clinical benefit or perfect compliance. Existing historical model evaluations do not validate the enabled variant.

A separately approved, bounded evaluation on synthetic cases remains useful. Integration approval does not authorize running a paid comparison or reusing historical evaluation budgets.
