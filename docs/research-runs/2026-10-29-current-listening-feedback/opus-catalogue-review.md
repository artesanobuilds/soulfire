# Review of the catalogue replacement (read-only)

The code would preserve saved references and hide the old starters, but only once activation runs, and that hasn't happened yet. There's no `catalogue.json` in the music-lab folder, so no policy is in effect. `samples/` still holds exactly the 49 old records, and the 72 new candidates are only in `catalogue-staging/current-listening-20261029-v1/`.

`rebuild-audio-verification.json` and `late-release-audit.json` don't exist anywhere under `docs/`, so I couldn't review what they claim.

## Blocking

1. **Activation isn't atomic** (`scripts/publish-current-catalogue.ts`). The script moves the 36 selected folders into `samples/` one at a time, and only *then* writes `catalogue.json`.
   - With no policy file, `musicCatalog()` retires nothing. During that window, or for good if the script crashes partway, the shelf shows the old 49 plus some or all of the new 36. That means two different pieces under the same concept name.
   - Re-running recovers, because the destination hash is checked, but nothing hides the mixed state.
   - Fix: hide any sample whose `preparation.catalogueVersion` doesn't match the active policy version, or write a pending policy before moving folders.

2. **One missing active file blanks the whole page, saved sessions included.** `musicCatalog()` throws "incomplete" if any active sample is missing. `GET /api/current/music` calls it even with `includeRetired=true`, so the whole response fails, including `archivedSamples`. Saved archived sessions then can't be restored either.
   - Failing safe should only empty the active shelf and still return archived and known samples.

3. **The retirement list covers more than the starters.** `retiredSampleIds` is all 49 inventory records:
   - the 36 starters;
   - **4 custom pieces** (`5cac`, `41f2`, `2893`, `2ab9`) that may be Miguel's own creations. The inventory itself says it can't tell these apart from development pieces;
   - **9 Music Lab comparisons**.

   The custom pieces would disappear from the shelf, from "Add another measured movement" (`CurrentPanel.tsx:1002`, which only searches active samples) and from assembling. They'd stay reachable only through saved bookmarks or recent-job IDs. `app/api/music-lab/route.ts` also uses the default `musicCatalog()`, so Music Lab would show none of the comparisons. Miguel needs to confirm this scope, or limit the list to the 36 `current-seed-*` starters.

## Answer to your question: yes, after activation

- **Saved references:** `CurrentPanel` now looks up `[...samples, ...archivedSamples]` and matches on both `sampleId` and `pcmSha256` for bookmarks. Session and recent-job IDs are looked up by ID in the same combined list.
- **Audio:** the audio route uses `musicSample(id)`, which reads `samples/<id>/sample.json` directly and ignores retirement. Retired audio stays playable as a bed and is never swapped for a new piece.
- **Gates:** I checked all 49 retired records against `currentTechnicalIssues` and all pass, so they'd appear in `archivedSamples`.
  - That list is still filtered through the *current* gates, so a later gate change could quietly make a saved reference unresolvable. Saved refs should probably bypass the gates.
- **Old starters:** they're excluded from `samples` by `retiredSampleIds`. Rejected candidates stay in staging and never become active.

## Limitations (not blocking)

4. **Storage headroom is tight.** `samples` is 1.3 GB and `catalogue-staging` 3.7 GB, against a 6 GiB budget minus 200 MiB. That leaves roughly 0.8 GB, or about 16 more 60 s pieces (about 51 MB each) before generation starts failing with "budget nearly full". The 36 rejected candidates take about 1.85 GB of that. Symlinks in staging aren't double-counted, since `visit` skips them.

5. **The endings are fades, not musical endings.** `scripts/current_audio_finish.py` sets the end to 0.35 s after the last frame above (95th-percentile level − 35 dB), measured above 80 Hz. It then fades over 3 s (4 s for ambient).
   - The hard-drop detector fired on 0 of 36, so every selected piece got a plain fade.
   - The fade isn't aligned to phrases or onsets, so it can fade through a new note's attack.
   - Measuring only above 80 Hz can treat a final low bass decay as silence.
   - The "interior identical" check is true by construction, since the middle is copied. The real provenance is the `rawSha256`/`masterSha256` pair.
   - Results: playable length 54.2–60.0 s, up to 5.81 s of tail removed, and the last 100 ms at −85 to −125 dBFS. That does remove the long padding without touching internal rests.

6. **Selection isn't based on listening.** Candidates were picked by `boundaryPenalty`. 7 of the 36 use shift 3 ("clear" profiles), even though the blind trios showed no advantage for shift 3 and its raw endings were the most abrupt. Miguel's listening is still the gate; the labelling says so correctly.

7. **Duplicate names.** `currentStarterName` uses each concept's name, so an archived saved piece and its new replacement are both called, say, "Small Morning". The "earlier version" notice only appears once the piece is selected. A name suffix would help.

8. **Labelling and claims are fine.** `stems: false` is enforced in the schema and the copy makes no clinical claims. The shift setting and composition recipe are recorded in `generationSettings` per sample.
