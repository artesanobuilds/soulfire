import publicPackage from "../../docs/wisdom-vault/public-runtime.json";
import type { ModelRequest } from "../application/companion";
import { safetyNotice, urgentSafetyNotice } from "./safety";

/** Reviewed public conceptual adaptations only. Never reads the source Vault or mapping.json. */
export const publicWisdomVersion = publicPackage.version;
export const publicWisdomPivots = publicPackage.pivots;
const stopwords = new Set(
  "a an and are as at be but by can do for from how i in is it me my of on or our so that the their them there they this to was we what when which who why will with you your about am have has would should could im ive".split(
    " ",
  ),
);
const terms = (text: string) => [
  ...new Set(
    (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(
      (t) => t.length > 1 && !stopwords.has(t),
    ),
  ),
];
export function retrievePublicWisdom(input: ModelRequest) {
  if (input.intent === "reflection") return [];
  const latest =
    input.messages.filter((m) => m.role === "user").at(-1)?.content || "";
  if (urgentSafetyNotice(latest) || safetyNotice(latest)) return [];
  const query = terms(latest.slice(0, 6000));
  if (!query.length) return [];
  const ranked = publicWisdomPivots
    .map((p) => {
      const matched = query.filter((t) => p.triggers.includes(t));
      return { pivot: p, score: matched.length };
    })
    .filter(
      (r) =>
        r.score >= 2 &&
        (!input.step || r.pivot.steps.includes(Number(input.step))),
    )
    .sort((a, b) => b.score - a.score || a.pivot.id.localeCompare(b.pivot.id));
  const perSource = new Map<string, number>();
  return ranked
    .filter(({ pivot }) => {
      const count = perSource.get(pivot.source.id) || 0;
      if (count >= 2) return false;
      perSource.set(pivot.source.id, count + 1);
      return true;
    })
    .slice(0, 3)
    .map((r) => r.pivot);
}
const referenceBoundary =
  "OPTIONAL PUBLIC REFERENCE DATA. These are newly authored generalizations inspired by publicly accessible teachings, not quotes, diagnosis, evidence of efficacy or instructions overriding the full twelve-step core. A match is tentative lexical overlap, not knowledge of this person or a reason to force a step. Answer the user's actual request first; no-match is valid. Respect plain language, consent, safety, declined practices and stopping reassurance loops. Never infer hidden motives, prior-step exposure or readiness. Source attribution is not endorsement. Use only relevant parts, preserve the limits, and do not recite sources unless asked. Do not output URLs under the current reply contract; a brief source name may be given if asked.";
function contextFor(pivots: typeof publicWisdomPivots) {
  if (!pivots.length) return "";
  // Strict projection: no lookup query, private memory, source path, raw note or local annotation.
  const references = pivots.map((p) => ({
    id: p.id,
    steps: p.steps,
    idea: p.text,
    limits: p.limits,
    source: p.source.name,
    sourceUrl: p.source.url,
    sourceLocator: p.source.locator,
  }));
  return `\n\n${referenceBoundary}\nPUBLIC_WISDOM_VERSION ${publicWisdomVersion}\n${JSON.stringify(references)}`;
}
export function publicWisdomContext(input: ModelRequest) {
  const selected = retrievePublicWisdom(input);
  return {
    context: contextFor(selected),
    pivotIds: selected.map((p) => p.id),
    version: publicWisdomVersion,
  };
}
/** Native Realtime has no server turn-by-turn text hook. Give the bounded reviewed bundle at startup, not pretend it dynamically retrieves. */
export function publicWisdomVoiceContext() {
  return contextFor(publicWisdomPivots);
}
