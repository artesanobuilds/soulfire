import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  currentCatalogueVersion,
  currentGenerationRecipe,
  eligibleCurrentSeeds,
} from "../src/domain/current-generation";
import type { CurrentMusicOptions } from "../src/domain/current-music";
const rows = eligibleCurrentSeeds.flatMap((s) =>
  [0, 1].map((candidate) => {
    const current: CurrentMusicOptions = {
      intent: s.intent as CurrentMusicOptions["intent"],
      taste: s.style as CurrentMusicOptions["taste"],
      avoid: ["vocals", "percussion", "bright", "nature"],
      feel: "steady",
      conceptId: s.id,
    };
    const request = {
      model: "ace",
      style: s.style,
      seed: s.seed + 1900003 + candidate * 104729,
      seconds: 60,
      current,
    };
    return {
      id: randomUUID(),
      conceptId: s.id,
      name: s.name,
      candidate,
      request,
      composition: currentGenerationRecipe(current, 60),
    };
  }),
);
await writeFile(
  "docs/research-runs/2026-10-29-current-listening-feedback/rebuild-plan.json",
  JSON.stringify(
    {
      version: currentCatalogueVersion,
      eligibleConcepts: 36,
      candidatesPerConcept: 2,
      requestedSeconds: 60,
      maxResultGiB: 6,
      rows,
    },
    null,
    2,
  ),
  { flag: "wx" },
);
console.log({ concepts: 36, jobs: rows.length });
