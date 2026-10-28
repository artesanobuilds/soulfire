"use client";
import { useEffect, useRef, useState, type Ref } from "react";
import {
  ArrowLeft,
  Headphones,
  Square,
  RefreshCw,
  Download,
  Eye,
  Shuffle,
} from "lucide-react";
import {
  musicBriefs,
  musicStyles,
  musicModelLabels,
  musicModels,
  musicComparisonPlan,
  blindMusicPair,
  readMusicRatings,
  musicRatingStorageKey,
  emptyMusicRatings,
  type MusicSample,
  type MusicAvailability,
  type MusicJob,
  type MusicModel,
  type MusicRating,
  type MusicStyle,
} from "../domain/music-lab";
import {
  MusicLabAudio,
  initialMusicPlayback,
  type MusicMode,
} from "../infrastructure/music-lab-audio";
import { MusicLabSample } from "./MusicLabSample";
const clock = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
function localSignal(signal?: AbortSignal) {
  return AbortSignal.any([
    AbortSignal.timeout(15000),
    ...(signal ? [signal] : []),
  ]);
}
async function response(res: Response) {
  const data = await res.json();
  if (!res.ok)
    throw Error(data.error || "This local request could not complete.");
  return data;
}
export function MusicLabPanel({
  blocked,
  headingRef,
  onBack,
}: {
  blocked: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onBack: () => void;
}) {
  const [models, setModels] = useState<MusicAvailability[]>([]),
    [samples, setSamples] = useState<MusicSample[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [style, setStyle] = useState<MusicStyle>("piano"),
    [seed, setSeed] = useState(101),
    [seconds, setSeconds] = useState(30),
    [mode, setMode] = useState<MusicMode>("bed"),
    [reverse, setReverse] = useState(false),
    [revealed, setRevealed] = useState(false);
  const [playback, setPlayback] = useState(initialMusicPlayback),
    [volumes, setVolumes] = useState<Record<string, number>>({}),
    [job, setJob] = useState<MusicJob | null>(null),
    [ratings, setRatings] = useState<MusicRating[]>([]),
    [saveConsent, setSaveConsent] = useState(false),
    [storageBad, setStorageBad] = useState(false),
    [notice, setNotice] = useState(""),
    [preference, setPreference] = useState("undecided");
  const engine = useRef<MusicLabAudio | null>(null),
    pending = useRef<string | null>(null),
    accepted = useRef(false),
    mounted = useRef(false),
    network = useRef<AbortController | null>(null);
  async function refresh(
    signal: AbortSignal | undefined = network.current?.signal,
  ) {
    try {
      setLoading(true);
      const data = await response(
        await fetch("/api/music-lab", {
          signal: localSignal(signal),
          cache: "no-store",
        }),
      );
      if (!mounted.current) return;
      setModels(data.models);
      setSamples(data.samples);
      setError("");
    } catch (e) {
      if (mounted.current && !signal?.aborted)
        setError(
          e instanceof Error ? e.message : "The local catalog is unavailable.",
        );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }
  function cancel() {
    const id = pending.current;
    if (!id) return;
    pending.current = null;
    setJob((v) =>
      v
        ? {
            ...v,
            phase: "cancelled",
            message:
              "Cancellation requested. The local worker is being stopped.",
          }
        : null,
    );
    void fetch(`/api/music-lab?job=${id}`, {
      method: "DELETE",
      keepalive: true,
    })
      .then(response)
      .catch(() => {
        if (mounted.current)
          setError(
            "Cancellation could not be confirmed. The worker has a 15-minute bound; refresh its status before starting another generation.",
          );
      });
  }
  useEffect(() => {
    mounted.current = true;
    const audio = new MusicLabAudio(setPlayback);
    engine.current = audio;
    const abort = new AbortController();
    network.current = abort;
    void refresh(abort.signal);
    setReverse(crypto.getRandomValues(new Uint8Array(1))[0] > 127);
    try {
      setRatings(readMusicRatings(localStorage.getItem(musicRatingStorageKey)));
    } catch {
      setStorageBad(true);
      setNotice(
        "Saved ratings are unreadable and were left unchanged. You can still listen and export new ratings.",
      );
    }
    const hidden = () => {
      if (document.hidden)
        audio.pause("Paused while the app is in the background.");
    };
    const leave = () => {
      audio.stop();
      const id = pending.current;
      if (id)
        void fetch(`/api/music-lab?job=${id}`, {
          method: "DELETE",
          keepalive: true,
        }).catch(() => {});
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leave);
    return () => {
      mounted.current = false;
      abort.abort();
      network.current = null;
      const id = pending.current;
      pending.current = null;
      if (id)
        void fetch(`/api/music-lab?job=${id}`, {
          method: "DELETE",
          keepalive: true,
        }).catch(() => {});
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", leave);
      audio.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    if (blocked)
      engine.current?.pause("Paused while another Soulfire activity is open.");
  }, [blocked]);
  const jobId = job?.id,
    jobPhase = job?.phase;
  useEffect(() => {
    if (!jobId || jobPhase !== "running") return;
    const abort = new AbortController();
    let busy = false;
    const poll = async () => {
      if (busy || !accepted.current) return;
      busy = true;
      try {
        const data = await response(
          await fetch(`/api/music-lab?job=${jobId}`, {
            signal: abort.signal,
            cache: "no-store",
          }),
        );
        if (
          abort.signal.aborted ||
          !mounted.current ||
          pending.current !== jobId
        )
          return;
        setJob(data.job);
        if (data.job.phase !== "running") {
          pending.current = null;
          if (data.job.phase === "done") void refresh(network.current?.signal);
        }
      } catch (e) {
        if (!abort.signal.aborted && mounted.current)
          setError(
            e instanceof Error ? e.message : "Job status is unavailable.",
          );
      } finally {
        busy = false;
      }
    };
    const timer = setInterval(() => void poll(), 1000);
    void poll();
    return () => {
      clearInterval(timer);
      abort.abort();
    };
  }, [jobId, jobPhase]);
  function resetListening() {
    engine.current?.stop();
    setRevealed(false);
    setPreference("undecided");
  }
  async function generate(model: MusicModel, repeat?: MusicSample) {
    if (pending.current || blocked) return;
    resetListening();
    setError("");
    const id = crypto.randomUUID();
    pending.current = id;
    accepted.current = false;
    const request = repeat ? repeat.request : { model, style, seed, seconds };
    setJob({
      id,
      request,
      phase: "running",
      message: "Starting a bounded local generation…",
    });
    try {
      const data = await response(
        await fetch("/api/music-lab", {
          method: "POST",
          signal: localSignal(network.current?.signal),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, request }),
        }),
      );
      if (!mounted.current || pending.current !== id) {
        void fetch(`/api/music-lab?job=${id}`, {
          method: "DELETE",
          keepalive: true,
        }).catch(() => {});
        return;
      }
      accepted.current = true;
      setJob(data.job);
    } catch (e) {
      void fetch(`/api/music-lab?job=${id}`, {
        method: "DELETE",
        keepalive: true,
      }).catch(() => {});
      if (mounted.current && pending.current === id) {
        pending.current = null;
        setJob({
          id,
          request,
          phase: "error",
          message: e instanceof Error ? e.message : "Local generation failed.",
        });
      }
    }
  }
  const matching = samples.filter((s) => s.request.seconds === seconds);
  const pair = blindMusicPair(matching, style, seed, reverse),
    blinded = pair.length === 2 && !revealed;
  const busy = job?.phase === "running";
  function updateRating(
    sampleId: string,
    key: keyof MusicRating["ratings"],
    value: number | null,
  ) {
    setRatings((rows) => {
      const existing = rows.find(
        (r) => r.sampleId === sampleId && r.mode === mode,
      );
      const next = {
        sampleId,
        mode,
        ratings: { ...(existing?.ratings || emptyMusicRatings), [key]: value },
      };
      return [
        ...rows.filter((r) => r.sampleId !== sampleId || r.mode !== mode),
        next,
      ];
    });
  }
  function save() {
    if (!saveConsent || storageBad) return;
    try {
      localStorage.setItem(musicRatingStorageKey, JSON.stringify(ratings));
      setNotice(
        "Ratings saved on this browser only. Export includes the measured samples and your selected ratings.",
      );
    } catch {
      setNotice(
        "Ratings could not be saved. They remain in this tab; export is still available.",
      );
    }
  }
  function download() {
    const data = {
      format: "soulfire-music-lab-v1",
      exportedAt: new Date().toISOString(),
      protocol: {
        targetLufs: -21,
        truePeakCeilingDb: -3,
        loopSeconds: 180,
        crossfadeSeconds: 1,
        narration:
          "Same local Ember arrival and natural clips at fixed placement and gain; bed attenuated identically",
        hardware: "Local measurements, not vendor benchmark scores",
        seedCaveat:
          "Matching numeric seeds are controls within each model, not equivalent latent content across models",
      },
      models,
      briefs: musicBriefs,
      samples,
      ratings: ratings.filter((r) => samples.some((s) => s.id === r.sampleId)),
      preference: {
        style,
        seed,
        seconds,
        mode,
        value: preference,
        meaning: "Explicit user choice only; no automatic winner",
      },
      blindedAtExport: blinded,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "soulfire-music-lab-results.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="music-lab" aria-label="Music Lab comparison">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Soulfire
      </button>
      <div className="music-lab-heading">
        <span className="eyebrow">
          <Headphones size={17} /> An honest listening experiment
        </span>
        <h1 ref={headingRef} tabIndex={-1}>
          Music Lab
        </h1>
        <p>
          Same musical brief. Two local models. Space to hear what you prefer.
        </p>
      </div>
      <div className="music-models">
        {musicModels.map((id) => {
          const model = models.find((m) => m.model === id);
          return (
            <article key={id}>
              <div className="music-model-title">
                <h2>{musicModelLabels[id]}</h2>
                <span
                  className={model?.ready ? "music-ready" : "music-pending"}
                >
                  {model?.ready
                    ? "Local runtime ready"
                    : model?.state === "license-pending"
                      ? "Terms pending"
                      : loading
                        ? "Checking…"
                        : "Setup pending"}
                </span>
              </div>
              <p>
                {model?.message ||
                  "Checking the local runtime. No samples are assumed available."}
              </p>
              <small>{model?.version}</small>
              {id === "stable" && !model?.ready && (
                <p>
                  <a
                    href="https://huggingface.co/stabilityai/stable-audio-3-small-music"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Review model access & terms
                  </a>{" "}
                  · Nothing is accepted here.
                </p>
              )}
            </article>
          );
        })}
      </div>
      <div className="music-protocol">
        <div>
          <h2>Set the shared brief</h2>
          <label>
            Musical style
            <select
              aria-label="Music Lab style"
              value={style}
              onChange={(e) => {
                resetListening();
                setStyle(e.target.value as MusicStyle);
              }}
            >
              {Object.entries(musicStyles).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="music-input-row">
            <label>
              Seed
              <select
                aria-label="Music Lab seed"
                value={seed}
                onChange={(e) => {
                  resetListening();
                  setSeed(Number(e.target.value));
                }}
              >
                <option value="101">101 · first variation</option>
                <option value="202">202 · second variation</option>
              </select>
            </label>
            <label>
              Duration
              <select
                aria-label="Music Lab duration"
                value={seconds}
                onChange={(e) => {
                  resetListening();
                  setSeconds(Number(e.target.value));
                }}
              >
                {[30, 60, 90].map((n) => (
                  <option key={n} value={n}>
                    {n} seconds
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="music-brief">{musicBriefs[style]}</p>
          <p className="music-small">
            Instrumental · 8 diffusion steps · CFG 1 · no prompt rewriting.
            Identical values do not imply identical model mechanics or
            equivalent latent seeds.
          </p>
        </div>
        <div>
          <h2>Generate before listening</h2>
          <p>
            Files stay on this Mac, outside Git. Each run loads the selected
            model, generates, measures loudness and prepares three listening
            renders. One worker runs at a time.
          </p>
          <div className="music-generate">
            {musicModels.map((id) => (
              <button
                key={id}
                className="button"
                disabled={
                  blocked || busy || !models.find((m) => m.model === id)?.ready
                }
                onClick={() => void generate(id)}
              >
                Generate {id === "ace" ? "ACE-Step" : "Stable Audio"}
              </button>
            ))}
          </div>
          {job && (
            <div
              className="music-job"
              role={job.phase === "error" ? "alert" : "status"}
            >
              <p>{job.message}</p>
              {busy && (
                <button className="button" onClick={cancel}>
                  <Square size={15} /> Cancel generation
                </button>
              )}
            </div>
          )}
          <button
            className="text-button"
            onClick={() => {
              resetListening();
              void refresh();
            }}
            disabled={loading}
          >
            <RefreshCw size={14} /> Refresh local catalog
          </button>
          {error && <p role="alert">{error}</p>}
          <details>
            <summary>Study coverage · two seeds in each style</summary>
            <ul>
              {musicComparisonPlan(30).map((r) => (
                <li key={`${r.model}-${r.style}-${r.seed}`}>
                  {musicModelLabels[r.model]} · {musicStyles[r.style]} ·{" "}
                  {r.seed}:{" "}
                  {samples.some(
                    (s) =>
                      s.request.model === r.model &&
                      s.request.style === r.style &&
                      s.request.seed === r.seed &&
                      s.request.seconds === 30,
                  )
                    ? "Measured file ready"
                    : models.find((m) => m.model === r.model)?.ready
                      ? "Not generated"
                      : "Pending runtime or terms"}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
      <div className="music-listening">
        <div className="music-listening-title">
          <div>
            <span className="eyebrow">
              Listen without a scorecard deciding for you
            </span>
            <h2>Listening room</h2>
          </div>
          <div className="music-reveal">
            <button
              className="button"
              disabled={pair.length !== 2}
              onClick={() => {
                engine.current?.stop();
                setRevealed((v) => !v);
              }}
            >
              <Eye size={15} />
              {revealed ? "Hide identities" : "Reveal models"}
            </button>
            <button
              className="button"
              disabled={pair.length !== 2}
              onClick={() => {
                resetListening();
                setReverse((v) => !v);
              }}
            >
              <Shuffle size={15} /> Swap blind order
            </button>
          </div>
        </div>
        <label>
          Audition mode
          <select
            aria-label="Music Lab audition mode"
            value={mode}
            onChange={(e) => {
              engine.current?.stop();
              setMode(e.target.value as MusicMode);
              setPreference("undecided");
            }}
          >
            <option value="bed">Instrumental bed alone</option>
            <option value="narration">Under the same Ember narration</option>
            <option value="loop">Extended 3-minute loop</option>
          </select>
        </label>
        <p className="music-small">
          Bed files are measured at −21 LUFS (±0.2 LU) with a −3 dBTP ceiling.
          Both listening volumes start at 65%; independent adjustments can
          change the perceived match. In narration mode the same voice and
          attenuation are applied to each bed. Loops use the same one-second
          crossfade.
        </p>
        {pair.length === 0 ? (
          <div className="music-empty">
            <Headphones size={32} />
            <h3>No measured sample for this brief yet</h3>
            <p>
              Generate a file with an available local model. No demo,
              placeholder or substituted audio will appear here.
            </p>
          </div>
        ) : (
          <>
            <p className="music-blind-status">
              {pair.length === 1
                ? "Only one model has a measured file for this brief. A/B comparison is pending."
                : blinded
                  ? "A/B labels are hidden until you reveal them. Generation history may still influence your expectations."
                  : "Model identities are visible."}
            </p>
            <div className="music-sample-grid">
              {pair.map((sample, i) => {
                const label = pair.length === 2 ? ["A", "B"][i] : "Sample";
                return (
                  <MusicLabSample
                    key={sample.id}
                    sample={sample}
                    label={label}
                    revealed={!blinded}
                    mode={mode}
                    playback={playback}
                    volume={volumes[sample.id] ?? 0.65}
                    rating={
                      ratings.find(
                        (r) => r.sampleId === sample.id && r.mode === mode,
                      )?.ratings || emptyMusicRatings
                    }
                    blocked={blocked}
                    onPlay={() => {
                      if (
                        playback.sampleId === sample.id &&
                        playback.phase === "playing"
                      )
                        engine.current?.pause();
                      else
                        void engine.current?.play(
                          sample,
                          mode,
                          volumes[sample.id] ?? 0.65,
                        );
                    }}
                    onVolume={(value) => {
                      setVolumes((v) => ({ ...v, [sample.id]: value }));
                      engine.current?.volume(sample.id, value);
                    }}
                    onRating={(key, value) =>
                      updateRating(sample.id, key, value)
                    }
                  />
                );
              })}
            </div>
            <p className="music-small">
              High pleasantness/intelligibility means better for you; high
              distraction, artifacts, vocals or fatigue means more of those
              qualities. Leave any rating blank. These are your observations,
              not clinical or automated scores.
            </p>
            {pair.length === 2 ? (
              <label>
                Your preference for this pair and mode
                <select
                  aria-label="Music Lab preference"
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                >
                  <option value="undecided">
                    Not decided · keep listening
                  </option>
                  <option value="tie">No preference</option>
                  {pair.map((s, i) => (
                    <option key={s.id} value={s.id}>
                      {pair.length === 2
                        ? ["A", "B"][i]
                        : musicModelLabels[s.request.model]}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="music-small">
                Rate this file on its own. A model preference becomes available
                when both models have measured files for this brief.
              </p>
            )}
            <button
              className="text-button"
              onClick={() => {
                engine.current?.stop();
                setVolumes({});
              }}
            >
              Reset listening volumes to the same level
            </button>
          </>
        )}
        <div className="music-save">
          <label className="music-consent">
            <input
              type="checkbox"
              checked={saveConsent}
              onChange={(e) => setSaveConsent(e.target.checked)}
            />{" "}
            Save only my ratings on this browser
          </label>
          <button
            className="button"
            disabled={!saveConsent || storageBad}
            onClick={save}
          >
            Save ratings locally
          </button>
          <button
            className="button"
            onClick={() => {
              try {
                localStorage.removeItem(musicRatingStorageKey);
                setRatings([]);
                setStorageBad(false);
                setNotice(
                  "Only Music Lab ratings were removed. Generated files are unchanged.",
                );
              } catch {
                setNotice("Saved ratings could not be removed.");
              }
            }}
          >
            Clear saved ratings
          </button>
          <button className="button" onClick={download}>
            <Download size={15} /> Export results JSON
          </button>
          <p role="status">{notice}</p>
        </div>
      </div>
      <div className="music-player-bar">
        <div>
          <strong>
            {playback.phase === "playing"
              ? "Playing"
              : playback.phase === "loading"
                ? "Loading audio"
                : playback.phase === "paused"
                  ? "Paused"
                  : "Listening controls"}
          </strong>
          <span>
            {clock(playback.elapsed)} / {clock(playback.duration)}
          </span>
        </div>
        <input
          aria-label="Seek Music Lab audio"
          type="range"
          min="0"
          max={playback.duration || 1}
          step=".1"
          value={Math.min(playback.elapsed, playback.duration || 1)}
          disabled={!playback.duration}
          onChange={(e) => engine.current?.seek(Number(e.target.value))}
        />
        <button className="button" onClick={() => engine.current?.stop()}>
          <Square size={16} /> Stop Music Lab
        </button>
      </div>
      <p
        className="music-playback-status"
        role={playback.phase === "error" ? "alert" : "status"}
      >
        {playback.message}
      </p>
      <p className="music-small">
        A technical comparison, not a promise about health or cognition.
        Subjective preference needs your listening. No winner is inferred from
        speed or loudness.
      </p>
    </section>
  );
}
