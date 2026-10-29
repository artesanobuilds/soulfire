"use client";
import { Play, Pause } from "lucide-react";
import {
  musicModelLabels,
  musicRatingNames,
  type MusicSample,
  type MusicRating,
} from "../domain/music-lab";
import type {
  MusicMode,
  MusicPlayback,
} from "../infrastructure/music-lab-audio";
export function MusicLabSample({
  sample,
  label,
  revealed,
  mode,
  playback,
  volume,
  rating,
  blocked,
  onPlay,
  onVolume,
  onRating,
}: {
  sample: MusicSample;
  label: string;
  revealed: boolean;
  mode: MusicMode;
  playback: MusicPlayback;
  volume: number;
  rating: MusicRating["ratings"];
  blocked: boolean;
  onPlay: () => void;
  onVolume: (v: number) => void;
  onRating: (key: keyof MusicRating["ratings"], v: number | null) => void;
}) {
  const active = playback.sampleId === sample.id && playback.mode === mode;
  const playing = active && playback.phase === "playing";
  return (
    <article className="music-sample" aria-label={`Sample ${label}`}>
      <div className="music-sample-top">
        <span className="music-letter">{label}</span>
        <div>
          <h3>
            {revealed
              ? musicModelLabels[sample.request.model]
              : `Listen ${label}`}
          </h3>
          <p>
            {mode === "loop"
              ? "3-minute crossfaded loop"
              : mode === "narration"
                ? "Same Ember guidance over the bed"
                : "Loudness-matched instrumental bed"}
          </p>
        </div>
      </div>
      <button
        className="button primary"
        disabled={blocked || (active && playback.phase === "loading")}
        onClick={onPlay}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
        {playing
          ? `Pause ${label}`
          : active && playback.phase === "paused"
            ? `Resume ${label}`
            : `Play ${label}`}
      </button>
      <label>
        {label} listening volume
        <input
          aria-label={`Volume ${label}`}
          type="range"
          min="0"
          max=".8"
          step=".05"
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
        />
      </label>
      <p className="music-matched">
        Measured render:{" "}
        {(mode === "loop"
          ? sample.metrics.loopLufs
          : mode === "narration"
            ? sample.metrics.narrationLufs
            : sample.metrics.matchedLufs
        )?.toFixed(1) ?? "not prepared"}{" "}
        LUFS ·{" "}
        {(mode === "loop"
          ? sample.metrics.loopTruePeakDb
          : mode === "narration"
            ? sample.metrics.narrationTruePeakDb
            : sample.metrics.matchedTruePeakDb
        )?.toFixed(1) ?? "not prepared"}{" "}
        dBTP
      </p>
      <fieldset>
        <legend>Your listening notes · optional</legend>
        {(
          Object.keys(musicRatingNames) as (keyof MusicRating["ratings"])[]
        ).map((key) => (
          <label key={key}>
            {musicRatingNames[key]}
            <select
              aria-label={`${label} ${musicRatingNames[key]}`}
              value={rating[key] ?? ""}
              onChange={(e) =>
                onRating(key, e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                  {n === 1 ? " · low" : n === 5 ? " · high" : ""}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
      {revealed && (
        <details>
          <summary>Measured details & provenance</summary>
          <dl className="music-metrics">
            <dt>Output duration / requested</dt>
            <dd>
              {sample.metrics.duration.toFixed(2)} / {sample.request.seconds}{" "}
              seconds
            </dd>
            <dt>Cold process total</dt>
            <dd>{sample.latencySeconds.toFixed(2)} s</dd>
            <dt>Load / inference</dt>
            <dd>
              {sample.loadSeconds.toFixed(2)} /{" "}
              {sample.inferenceSeconds.toFixed(2)} s
            </dd>
            <dt>Peak process RSS</dt>
            <dd>
              {sample.peakRssBytes === null
                ? "Not separately measured"
                : `${(sample.peakRssBytes / 1024 ** 3).toFixed(2)} GiB`}
            </dd>
            <dt>Peak MLX allocation</dt>
            <dd>
              {sample.peakAcceleratorBytes === null
                ? "Not separately measured"
                : `${(sample.peakAcceleratorBytes / 1024 ** 3).toFixed(2)} GiB`}
            </dd>
            <dt>Original loudness / true peak</dt>
            <dd>
              {sample.metrics.integratedLufs.toFixed(1)} LUFS /{" "}
              {sample.metrics.truePeakDb.toFixed(1)} dBTP
            </dd>
            <dt>Samples at |amplitude| ≥ .999</dt>
            <dd>{(sample.metrics.clippedFraction * 100).toFixed(4)}%</dd>
            <dt>Raw end-to-start jump</dt>
            <dd>{sample.metrics.seamJump.toFixed(6)}</dd>
            <dt>Head/tail RMS difference</dt>
            <dd>{sample.metrics.seamRmsDifferenceDb.toFixed(2)} dB</dd>
            <dt>Rendered seam-adjacent jump</dt>
            <dd>{sample.metrics.loopSeamJump?.toFixed(6) ?? "not prepared"}</dd>
            <dt>Source</dt>
            <dd>
              {sample.metrics.sampleRate} Hz · {sample.metrics.channels}{" "}
              channels
            </dd>
            <dt>Runtime</dt>
            <dd>{sample.modelVersion}</dd>
            <dt>Source / weights revision</dt>
            <dd>
              <code>{sample.codeRevision}</code>
              <br />
              <code>{sample.weightsRevision}</code>
            </dd>
            <dt>Decoded PCM SHA256</dt>
            <dd>
              <code>{sample.metrics.pcmSha256}</code>
            </dd>
            <dt>Container SHA256</dt>
            <dd>
              <code>{sample.metrics.sha256}</code>
            </dd>
          </dl>
        </details>
      )}
    </article>
  );
}
