# Practical comparison checkpoint

Stable Audio has not been generated or auditioned. Its terms/access requirements remain pending. The table below describes ACE outputs only; it cannot establish a two-model winner.

| Style | Seed | Total / load / inference (s) | Exported source LUFS / dBTP | Bed LUFS / dBTP | Source ≥.999 |
|---|---:|---|---|---|---|
| piano | 101 | 16.80 / 13.71 / 3.07 | -18.9 / -0.0 | -21.0 / -4.2 | 0.0000% |
| piano | 202 | 13.93 / 11.71 / 2.21 | -19.2 / -1.5 | -21.0 / -4.1 | 0.0000% |
| ambient | 101 | 13.23 / 11.05 / 2.18 | -19.0 / -4.1 | -21.0 / -6.1 | 0.0000% |
| ambient | 202 | 12.77 / 10.58 / 2.17 | -18.3 / -0.4 | -21.0 / -4.1 | 0.0000% |
| acoustic | 101 | 13.01 / 10.84 / 2.16 | -15.4 / 0.0 | -21.0 / -5.5 | 0.0001% |
| acoustic | 202 | 13.54 / 11.38 / 2.16 | -15.3 / 0.0 | -21.0 / -5.7 | 0.0000% |

Two 30-second outputs were made per style, plus one same-seed piano repeat. The repeat has exactly equal decoded float32 PCM (maximum sample difference and RMS difference both 0). Container hashes differ, so container hashes alone would falsely suggest nonreproducibility. This is one local configuration, not a guarantee for other hardware/runtime revisions.

Primary cold-process latency median: 13.39 s. The earlier first-use setup sanity run was 47.46 s, including cache/conversion preparation; subsequent processes benefited from warmed filesystem/model caches. These are actual local observations, not upstream H200 benchmark numbers.

Primary peak process RSS range: 13.89–13.90 GiB. Peak MLX allocation: 14.60 GiB. They overlap in unified memory and must not be added.

All three listening variants (bed, same Ember narration, and three-minute crossfaded loop) measured −21.0 LUFS in this corpus. Actual render true peaks, raw seam proxies and source/PCM hashes are retained in the JSON evidence and app. Raw sources showed significant head/tail level differences on some files: a short generated composition should not be assumed seamlessly loopable just because it is instrumental. The common crossfade is processing, not proof of inaudible seams.

No human pleasantness, distraction, artifact, unwanted-vocal, fatigue or intelligibility rating was produced by the agent. Muted browser playback and waveform inspection verify mechanics; the user must audition and rate. Stable remains clearly pending, rather than supplied with a fake or substituted sample.

A second same-seed ambient repeat was generated successfully through the actual HTTP API (14.42 seconds, all renders measured). Its decoded PCM matches the original ambient seed-101 output exactly. There are eight real catalog files total: six study outputs and two reproducibility repeats. Actual desktop/mobile browsers decoded and started/stopped all three real listening renders (30 / 30 / 180 seconds), with no horizontal overflow. A real worker was cancelled through the API, its process group stopped and partial output removed; an earlier cancellation also prevented a delayed POST from starting.
