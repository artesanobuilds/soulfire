import { writeFile } from "node:fs/promises";
import {
  currentMusicPrompt,
  currentSeedCatalogue,
} from "../src/domain/current-music";
import { currentCompositionCaption } from "../src/domain/current-composition";
import { musicCatalog } from "../src/infrastructure/music-lab-runtime";
const samples = await musicCatalog();
const selected = ["piano", "ambient", "acoustic"].flatMap((style) =>
  samples
    .filter((s) => s.request.current?.conceptId && s.request.style === style)
    .slice(0, 2),
);
const rows = selected.map((s) => ({
  baselineId: s.id,
  request: s.request,
  originalCaption: currentMusicPrompt(s.request.current!),
  musicalCaption: currentCompositionCaption(s.request.current!),
  concept: currentSeedCatalogue.find(
    (c) => c.id === s.request.current!.conceptId,
  )?.name,
}));
if (rows.length !== 6) throw Error("Need two original pieces per palette");
await writeFile(
  "docs/research-runs/2026-10-29-current-musicality/study-plan.json",
  JSON.stringify(
    {
      arms: [
        "A: preserved original source, caption and shift1",
        "B: musical caption only, original metadata and shift1",
        "C: same musical caption/metadata as B, documented shift3",
      ],
      durationSeconds: 30,
      matchedSeeds: true,
      clinicalOrSubjectiveWinner: false,
      rows,
    },
    null,
    2,
  ),
);
console.log(
  rows.map((r) => ({
    id: r.baselineId,
    name: r.concept,
    style: r.request.style,
  })),
);
