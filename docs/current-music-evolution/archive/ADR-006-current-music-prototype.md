# ADR-006: Implement goal-first Current and archive comparison UI

Date: 29 October 2026. Status: implementation authorized by Miguel.

The approved design moves into the local prototype: goal-first starter choices, optional preferences, asynchronous ACE-Step 1.5 Turbo generation and Shape now. The experimental Music Lab entry and panel are removed from user-facing navigation. Its model adapter, measured audio store, domain tests, research, decision history and original comparison component are retained. Its no-longer-reachable UI suite is preserved as `tests/browser/music-lab.archived.ts`; current audio and job behavior receive active replacement coverage.

The prototype offers only actual measured ACE assets, with a separate honest state for unavailable/custom generation. The forty catalogue entries remain design concepts, not forty playable compositions. Six existing distinct style/seed starter briefs plus the new focus candidate provide real audio; no condition-specific effect or subjective audition is asserted. Editorial suggestion fit uses explicit taste and goal, not a diagnosis or demographic score.

Classic procedural Current remains reachable, retaining version-one saved mixes. New browser bookmarks use version two and bind a measured PCM hash. Optional feeling notes stay in ephemeral screen state and are neither sent, saved nor used to infer health information. Custom structured musical preferences are stored with the generated sample locally; a browser Save is a separate opt-in bookmark.

Live controls are bounded gain, low-pass tone and reverb; no independent instrument stems are promised. Crossfaded approved PCM candidates support the chosen listening timer. New compositions are asynchronous and never autoplay on completion. The existing pinned Turbo adapter remains at its verified shift=1 default pending the separately designed shift calibration; no untested model upgrade is introduced.

Generated WAVs, model weights, runtime configuration and private session stores remain outside Git. This decision authorizes local implementation and review only, not remote push, deployment or journey integration.
