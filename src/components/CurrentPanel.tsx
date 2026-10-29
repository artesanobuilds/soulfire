"use client";
import { useEffect, useRef, useState, type Ref } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Bookmark,
  Trash2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { planCurrentSession, technicalFit } from "../domain/current-session";
import { currentSeedCatalogue } from "../domain/current-music";
import { ClassicCurrentPanel } from "./ClassicCurrentPanel";
import { CurrentLandscape } from "./CurrentLandscape";
import {
  currentIntentLabels,
  currentMusicOptionsSchema,
  defaultCurrentMusic,
  suggestedCurrentSamples,
  currentStarterName,
  currentMusicStorageKey,
  readSavedCurrentMusic,
  savedCurrentMusicSchema,
  currentTechnicalIssues,
  type CurrentMusicOptions,
  type SavedCurrentMusic,
} from "../domain/current-music";
import {
  musicSampleSchema,
  type MusicSample,
  type MusicJob,
  type MusicAvailability,
} from "../domain/music-lab";
import {
  CurrentMusicAudio,
  idleCurrentMusic,
} from "../infrastructure/current-music-audio";
const clock = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
async function json(res: Response) {
  const d = await res.json();
  if (!res.ok) throw Error(d.error || "This local request could not complete.");
  return d;
}
const signal = (s?: AbortSignal) =>
  AbortSignal.any([AbortSignal.timeout(15000), ...(s ? [s] : [])]);
export function CurrentPanel(props: {
  blocked: boolean;
  motionEnabled: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onBack: () => void;
}) {
  const [classic, setClassic] = useState(false);
  return classic ? (
    <ClassicCurrentPanel {...props} onBack={() => setClassic(false)} />
  ) : (
    <MusicCurrent {...props} onClassic={() => setClassic(true)} />
  );
}
function MusicCurrent({
  blocked,
  motionEnabled,
  headingRef,
  onBack,
  onClassic,
}: {
  blocked: boolean;
  motionEnabled: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onBack: () => void;
  onClassic: () => void;
}) {
  const [options, setOptions] = useState<CurrentMusicOptions>({
      ...defaultCurrentMusic,
    }),
    [samples, setSamples] = useState<MusicSample[]>([]),
    [archivedSamples, setArchivedSamples] = useState<MusicSample[]>([]),
    [catalogueDescription, setCatalogueDescription] = useState(""),
    [availability, setAvailability] = useState<MusicAvailability | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<MusicSample | null>(null),
    [name, setName] = useState(""),
    [minutes, setMinutes] = useState(5),
    [volume, setVolume] = useState(0.22),
    [brightness, setBrightness] = useState(0.55),
    [space, setSpace] = useState(0.08);
  const [player, setPlayer] = useState(idleCurrentMusic),
    [job, setJob] = useState<MusicJob | null>(null),
    [saved, setSaved] = useState<SavedCurrentMusic[]>([]),
    [saveConsent, setSaveConsent] = useState(false),
    [storageBad, setStorageBad] = useState(false),
    [notice, setNotice] = useState(""),
    [feeling, setFeeling] = useState("");
  const [candidateCount, setCandidateCount] = useState(2),
    [pieceSeconds, setPieceSeconds] = useState(60),
    [creationMode, setCreationMode] = useState<"compare" | "session">(
      "compare",
    ),
    [latestIds, setLatestIds] = useState<string[]>([]),
    [sessionIds, setSessionIds] = useState<string[]>([]),
    [quietTransitions, setQuietTransitions] = useState(false),
    [expandedShelf, setExpandedShelf] = useState(false);
  const [continueInBackground, setContinueInBackground] = useState(false);
  const backgroundRef = useRef(false);
  backgroundRef.current = continueInBackground;
  const engine = useRef<CurrentMusicAudio | null>(null),
    mounted = useRef(false),
    pending = useRef<string | null>(null),
    accepted = useRef(false),
    version = useRef(0),
    controller = useRef<AbortController | null>(null);
  async function refresh(abort?: AbortSignal) {
    try {
      const data = await json(
        await fetch("/api/current/music", {
          cache: "no-store",
          signal: signal(abort),
        }),
      );
      if (!mounted.current) return;
      setSamples(
        (data.samples as unknown[]).map((s) => musicSampleSchema.parse(s)),
      );
      setArchivedSamples(
        ((data.archivedSamples || []) as unknown[]).map((s) =>
          musicSampleSchema.parse(s),
        ),
      );
      setCatalogueDescription(data.catalogue?.description || "");
      setAvailability(data.availability);
      setError("");
    } catch (e) {
      if (mounted.current && !abort?.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "The local music shelf is unavailable.",
        );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }
  function cancel() {
    try {
      sessionStorage.removeItem("soulfire.current.pending.v1");
    } catch {}
    const id = pending.current;
    ++version.current;
    pending.current = null;
    accepted.current = false;
    if (!id) return;
    setJob((v) =>
      v
        ? {
            ...v,
            phase: "cancelled",
            message: "Cancellation requested. The local worker is stopping.",
          }
        : v,
    );
    void fetch(`/api/current/music?job=${id}`, {
      method: "DELETE",
      keepalive: true,
    })
      .then(json)
      .catch(() => {
        if (mounted.current)
          setError(
            "Cancellation could not be confirmed. Refresh before starting another; the worker has a time limit.",
          );
      });
  }
  useEffect(() => {
    mounted.current = true;
    const abort = new AbortController();
    controller.current = abort;
    const audio = new CurrentMusicAudio(setPlayer);
    engine.current = audio;
    void refresh(abort.signal);
    const recoverVersion = version.current;
    void (async () => {
      try {
        const raw = sessionStorage.getItem("soulfire.current.pending.v1");
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (
          !/^[a-f0-9-]{36}$/.test(saved.id) ||
          Date.now() - saved.at > 3600000
        ) {
          sessionStorage.removeItem("soulfire.current.pending.v1");
          return;
        }
        const data = await json(
          await fetch(`/api/current/music?job=${saved.id}`, {
            signal: signal(abort.signal),
            cache: "no-store",
          }),
        );
        if (!mounted.current || version.current !== recoverVersion) return;
        setContinueInBackground(true);
        backgroundRef.current = true;
        setJob(data.job);
        if (data.job.request?.current)
          setOptions(currentMusicOptionsSchema.parse(data.job.request.current));
        if (data.job.requestedCandidates)
          setCandidateCount(data.job.requestedCandidates);
        if (data.job.mode) setCreationMode(data.job.mode);
        if (data.job.request?.seconds)
          setPieceSeconds(data.job.request.seconds);
        if (data.job.phase === "running") {
          pending.current = saved.id;
          accepted.current = true;
        } else {
          setLatestIds(
            data.job.candidateIds ||
              (data.job.sampleId ? [data.job.sampleId] : []),
          );
          sessionStorage.removeItem("soulfire.current.pending.v1");
        }
      } catch {
        if (!abort.signal.aborted && mounted.current) {
          setNotice(
            "The earlier preparation could not be restored. No new job was started; refresh the shelf or try again.",
          );
          try {
            sessionStorage.removeItem("soulfire.current.pending.v1");
          } catch {}
        }
      }
    })();
    try {
      setSaved(
        readSavedCurrentMusic(localStorage.getItem(currentMusicStorageKey)),
      );
    } catch {
      setStorageBad(true);
      setNotice(
        "Saved music sessions are unreadable and were left unchanged. You can still listen.",
      );
    }
    const hide = () => {
      if (document.hidden)
        audio.pause("Paused in the background. Resume when you return.");
    };
    const leave = () => {
      audio.stop();
      const id = pending.current;
      if (id && !backgroundRef.current)
        void fetch(`/api/current/music?job=${id}`, {
          method: "DELETE",
          keepalive: true,
        }).catch(() => {});
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    return () => {
      mounted.current = false;
      // Invalidate outstanding callbacks on unmount, not a DOM-ref cleanup.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++version.current;
      abort.abort();
      const id = pending.current;
      pending.current = null;
      if (id && !backgroundRef.current)
        void fetch(`/api/current/music?job=${id}`, {
          method: "DELETE",
          keepalive: true,
        }).catch(() => {});
      audio.dispose();
      engine.current = null;
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
    };
  }, []);
  useEffect(() => {
    if (blocked)
      engine.current?.pause(
        "Paused for another Soulfire activity. Resume when you return.",
      );
  }, [blocked]);
  useEffect(() => {
    engine.current?.shape({ volume, brightness, space });
  }, [volume, brightness, space]);
  useEffect(() => {
    if (!job || job.phase !== "running") return;
    const id = job.id,
      v = version.current,
      abort = new AbortController();
    let busy = false;
    const poll = async () => {
      if (busy || !accepted.current) return;
      busy = true;
      try {
        const data = await json(
          await fetch(`/api/current/music?job=${id}`, {
            signal: signal(abort.signal),
            cache: "no-store",
          }),
        );
        if (!mounted.current || pending.current !== id || version.current !== v)
          return;
        if (data.job.phase === "running") {
          setJob(data.job);
        } else {
          // Finish loading the actual candidate records before the terminal
          // phase tears down this poller's AbortController.
          if (data.job.phase === "done") await refresh(abort.signal);
          if (
            !mounted.current ||
            pending.current !== id ||
            version.current !== v
          )
            return;
          pending.current = null;
          try {
            sessionStorage.removeItem("soulfire.current.pending.v1");
          } catch {}
          if (data.job.phase === "done") {
            setLatestIds(
              data.job.candidateIds ||
                (data.job.sampleId ? [data.job.sampleId] : []),
            );
            setNotice(
              "Your new music passed technical checks. Preview and choose; listening quality is not clinically validated.",
            );
          }
          setJob(data.job);
        }
      } catch (e) {
        if (!abort.signal.aborted && mounted.current && version.current === v) {
          setError(
            e instanceof Error
              ? e.message
              : "Job status unavailable. Cancel or refresh.",
          );
        }
      } finally {
        busy = false;
      }
    };
    const timer = setInterval(() => void poll(), 1500);
    void poll();
    return () => {
      abort.abort();
      clearInterval(timer);
    };
    // Poll only the current job; its version guards stale asynchronous replies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, job?.phase]);
  const playerRegion = useRef<HTMLDivElement>(null);
  function choose(s: MusicSample) {
    engine.current?.stop();
    setSelected(s);
    setSessionIds([s.id]);
    setQuietTransitions(false);
    setName(
      currentStarterName(s.request.style, s.request.seed, s.request.current),
    );
    setSaveConsent(false);
    requestAnimationFrame(() => {
      playerRegion.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width:850px)").matches)
        playerRegion.current?.scrollIntoView({
          block: "start",
          behavior: motionEnabled ? "smooth" : "instant",
        });
    });
    setNotice(
      "Selected. Nothing plays automatically. Preview and choose what feels right.",
    );
  }
  async function create() {
    if (pending.current || blocked) return;
    const id = crypto.randomUUID(),
      v = ++version.current;
    pending.current = id;
    accepted.current = false;
    setError("");
    if (continueInBackground) {
      try {
        sessionStorage.setItem(
          "soulfire.current.pending.v1",
          JSON.stringify({ id, at: Date.now() }),
        );
      } catch {
        pending.current = null;
        setError(
          "This browser cannot retain a preparation reference. Keep this section open or disable background preparation.",
        );
        return;
      }
    }
    const request = {
      model: "ace" as const,
      style: options.taste,
      seed: crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647,
      seconds: pieceSeconds,
      current: {
        intent: options.intent,
        taste: options.taste,
        avoid: [...options.avoid],
        feel: options.feel,
      },
    };
    setJob({
      id,
      request,
      phase: "running",
      message: "Starting a local music candidate…",
    });
    try {
      const data = await json(
        await fetch("/api/current/music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            request,
            candidateCount,
            mode: creationMode,
          }),
          signal: signal(controller.current?.signal),
        }),
      );
      if (!mounted.current || pending.current !== id || version.current !== v)
        return;
      accepted.current = true;
      setJob(data.job);
    } catch (e) {
      if (!mounted.current || pending.current !== id || version.current !== v)
        return;
      cancel();
      setJob(null);
      setError(
        e instanceof Error
          ? e.message
          : "Generation did not start. No audio was substituted.",
      );
    }
  }
  function save() {
    if (!selected || !saveConsent || storageBad) return;
    if (saved.length >= 20) {
      setNotice(
        "Your 20 saved-session places are full. Remove an entry before saving another; nothing was overwritten.",
      );
      return;
    }
    try {
      const value = savedCurrentMusicSchema.parse({
        version: 2,
        id: crypto.randomUUID(),
        name,
        sampleId: selected.id,
        segments: sessionPieces.map((s) => ({
          sampleId: s.id,
          pcmSha256: s.metrics.pcmSha256,
        })),
        transition: effectiveTransition,
        pcmSha256: selected.metrics.pcmSha256,
        options,
        minutes,
        volume,
        brightness,
        space,
      });
      const next = [value, ...saved];
      localStorage.setItem(currentMusicStorageKey, JSON.stringify(next));
      setSaved(next);
      setSaveConsent(false);
      setNotice(
        "Saved in this browser. Your feeling note was not saved or sent.",
      );
    } catch {
      setNotice("Could not save. Your existing sessions were left unchanged.");
    }
  }
  const knownSamples = [...samples, ...archivedSamples];
  const suggested = suggestedCurrentSamples(samples, options);
  const sessionPieces = sessionIds
    .map(
      (id) =>
        knownSamples.find((s) => s.id === id) ||
        (selected?.id === id ? selected : undefined),
    )
    .filter((s): s is MusicSample => !!s);
  const sessionPlan = sessionPieces.length
    ? planCurrentSession(sessionPieces)
    : null;
  const effectiveTransition =
    quietTransitions || sessionPlan?.transition === "quiet-gap"
      ? "quiet-gap"
      : "crossfade";
  const latestPieces = latestIds
    .map((id) => knownSamples.find((s) => s.id === id))
    .filter((s): s is MusicSample => !!s);
  const generatedConcepts = new Set(
    samples.map((s) => s.request.current?.conceptId).filter(Boolean),
  ).size;
  function assemble(pieces: MusicSample[]) {
    const plan = planCurrentSession(pieces);
    choose(plan.samples[0]);
    setSessionIds(plan.samples.map((s) => s.id));
    setName(
      {
        focus: "My clear space",
        calm: "My quiet Current",
        overwhelm: "Room to breathe",
        unwind: "My evening Current",
        lift: "A brighter Current",
        company: "A little company",
      }[options.intent],
    );
    setNotice(
      `${plan.samples.length} movements selected. ${plan.transition === "quiet-gap" ? "Pieces fade to quiet between movements because compatibility is uncertain." : "Estimated-compatible movements use gentle crossfades."} Preview and decide; nothing autoplays.`,
    );
  }
  function preview(s: MusicSample) {
    choose(s);
    void engine.current?.play(s.id, Math.min(20, s.metrics.duration) / 60, {
      volume,
      brightness,
      space,
    });
  }
  const running = !!pending.current || job?.phase === "running",
    active = ["playing", "loading", "paused"].includes(player.phase);
  return (
    <section className="current-music" aria-label="Current music">
      <div className="cm-heading">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Soulfire
        </button>
        <span className="eyebrow">A LITTLE ROOM FOR WHAT YOU NEED</span>
        <h1 ref={headingRef} tabIndex={-1}>
          Find your Current.
        </h1>
        <p>
          Music for the moment you’re in.
          <br />A little focus. A softer landing. A fresh beginning.
        </p>
      </div>
      <div className="cm-hero">
        <CurrentLandscape moving={motionEnabled} />
        <div className="cm-hero-caption">
          <span className="eyebrow">AT YOUR OWN PACE</span>
          <span>
            There’s no right way to feel.
            <br />
            Start where you are.
          </span>
        </div>
      </div>
      <div className="cm-workspace">
        <div className="cm-intention">
          <span className="eyebrow">CREATE FOR ME</span>
          <h2>
            What would you like
            <br />a little support with?
          </h2>
          <p>
            Choose a direction. We’ll offer a starting place you can make your
            own.
          </p>
          <div
            className="cm-goals"
            role="group"
            aria-label="What would you like support with?"
          >
            {Object.entries(currentIntentLabels).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={options.intent === id}
                onClick={() =>
                  setOptions((o) => ({
                    ...o,
                    intent: id as CurrentMusicOptions["intent"],
                  }))
                }
              >
                {label}
              </button>
            ))}
          </div>
          <label className="current-field">
            How are you feeling?{" "}
            <span className="small">
              Optional · stays on this screen, never sent or saved
            </span>
            <input
              value={feeling}
              maxLength={160}
              onChange={(e) => setFeeling(e.target.value)}
              placeholder="A busy mind, a long day, a new start…"
            />
          </label>
          <label className="current-field">
            What do you enjoy hearing?
            <select
              value={options.taste}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  taste: e.target.value as CurrentMusicOptions["taste"],
                }))
              }
            >
              <option value="piano">Soft piano</option>
              <option value="ambient">Open, sustained textures</option>
              <option value="acoustic">Gentle acoustic guitar</option>
            </select>
          </label>
          <details className="cm-preferences">
            <summary>Preferences & advanced options</summary>
            <p>
              Musical requests guide a candidate; they aren’t guarantees.
              Voice-like artifacts and musical fit still need your listening
              review.
            </p>
            <fieldset>
              <legend>Leave out</legend>
              {(["vocals", "percussion", "bright", "nature"] as const).map(
                (id) => (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={options.avoid.includes(id)}
                      onChange={() =>
                        setOptions((o) => ({
                          ...o,
                          avoid: o.avoid.includes(id)
                            ? o.avoid.filter((x) => x !== id)
                            : [...o.avoid, id],
                        }))
                      }
                    />
                    {
                      {
                        vocals: "Vocals",
                        percussion: "Drums and percussion",
                        bright: "Sharp, bright sounds",
                        nature: "Nature sounds",
                      }[id]
                    }
                  </label>
                ),
              )}
            </fieldset>
            <label className="current-field">
              Musical journey
              <select
                value={options.feel}
                onChange={(e) =>
                  setOptions((o) => ({
                    ...o,
                    feel: e.target.value as CurrentMusicOptions["feel"],
                  }))
                }
              >
                <option value="steady">Keep it steady</option>
                <option value="gently-shift">Gently shift the feel</option>
              </select>
            </label>
            <label className="current-field">
              What should we prepare?
              <select
                value={creationMode}
                onChange={(e) =>
                  setCreationMode(e.target.value as "compare" | "session")
                }
              >
                <option value="compare">Alternatives to compare</option>
                <option value="session">Movements for a longer session</option>
              </select>
            </label>
            <label className="current-field">
              Number of pieces
              <select
                value={candidateCount}
                onChange={(e) => setCandidateCount(Number(e.target.value))}
              >
                <option value={2}>Two</option>
                <option value={3}>Three</option>
              </select>
            </label>
            <label className="current-field">
              Length of each new composition
              <select
                value={pieceSeconds}
                onChange={(e) => setPieceSeconds(Number(e.target.value))}
              >
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
              </select>
            </label>
            <p className="small">
              Gentle shifts are a preference, not proven better for mood. No
              health or diagnosis information is inferred.
            </p>
          </details>
          <label className="check-row cm-background">
            <input
              type="checkbox"
              checked={continueInBackground}
              onChange={(e) => setContinueInBackground(e.target.checked)}
              disabled={running}
            />
            <span>Keep preparing when I leave Current</span>
          </label>
          <p className="small">
            Optional, on this Mac only. Return to Current in this browser tab to
            review or cancel. Preparation is bounded to eight minutes and never
            starts playback.
          </p>
          <button
            className="primary"
            disabled={running || blocked || loading || !availability?.ready}
            onClick={() => void create()}
          >
            <RefreshCw size={17} />
            Create a new Current
          </button>
          <p className="small">
            Made on this Mac with ACE-Step Turbo. Two or three real candidates
            are generated and checked before preview; this can take a few
            minutes. Advanced options choose piece length. Longer listening
            cycles your selected movements. No paid service or cloud generation.
            New pieces stay in local app storage; Save adds a browser bookmark.
          </p>
          {availability && !availability.ready && (
            <p role="status">
              Custom generation unavailable: {availability.message} You can
              still use available starters or Classic soundscapes.
            </p>
          )}
          {job && (
            <div className="cm-job" role="status">
              <strong>
                {job.phase === "running"
                  ? "Preparing your Current…"
                  : job.phase === "done"
                    ? job.candidateIds && job.candidateIds.length > 1
                      ? "Your new pieces are ready"
                      : "A new piece is on your shelf"
                    : job.phase === "cancelled"
                      ? "Generation cancelled"
                      : "This piece couldn’t be prepared"}
              </strong>
              <p>{job.message}</p>
              {!!job.candidateErrors?.length && (
                <details>
                  <summary>
                    {job.candidateErrors.length} candidate notes
                  </summary>
                  <ul>
                    {job.candidateErrors.map((message, i) => (
                      <li key={i}>{message}</li>
                    ))}
                  </ul>
                </details>
              )}
              {running && <button onClick={cancel}>Cancel generation</button>}
            </div>
          )}
          {latestPieces.length > 0 && (
            <section className="cm-candidates" aria-label="Prepared candidates">
              <h3>
                {job?.mode === "session"
                  ? "Your new movements"
                  : "Compare your alternatives"}
              </h3>
              <p className="small">
                {job?.mode === "session"
                  ? "The pieces follow their requested opening, development and closing order. Actual musical adherence is approximate."
                  : "Ordered by loudness, clipping and peak checks, not musical taste."}{" "}
                Listen and choose. Nothing plays automatically.
              </p>
              {latestPieces.map((s, i) => (
                <article key={s.id}>
                  <strong>Choice {String.fromCharCode(65 + i)}</strong>
                  <p>
                    {Math.round(s.metrics.duration)} seconds · audio checks
                    passed
                  </p>
                  <details>
                    <summary>What the checks mean</summary>
                    <p>
                      Technical fit {technicalFit(s)}/100 (loudness, clipping
                      and headroom only). Normalized {s.metrics.matchedLufs}{" "}
                      LUFS, peak {s.metrics.matchedTruePeakDb} dBTP, clipped
                      samples {(s.metrics.clippedFraction * 100).toFixed(4)}%.
                      This score does not measure pleasantness, health benefit
                      or absence of voice-like artifacts.
                    </p>
                  </details>
                  <div>
                    <button disabled={blocked} onClick={() => preview(s)}>
                      Preview choice {String.fromCharCode(65 + i)}
                    </button>
                    <button onClick={() => choose(s)}>
                      Use choice {String.fromCharCode(65 + i)}
                    </button>
                  </div>
                </article>
              ))}
              {latestPieces.length > 1 && (
                <button
                  className="primary"
                  onClick={() => assemble(latestPieces)}
                >
                  Make a session from these
                </button>
              )}
            </section>
          )}
        </div>
        <div className="cm-shelf">
          <div className="cm-shelf-title">
            <div>
              <span className="eyebrow">A STARTING PLACE</span>
              <h2>A Current to try.</h2>
            </div>
            <button
              aria-label="Refresh available music"
              onClick={() => {
                setLoading(true);
                void refresh(controller.current?.signal);
              }}
              disabled={loading}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          <p>
            Suggested for {currentIntentLabels[options.intent].toLowerCase()},
            with your taste in mind. A preference-based starting point, never a
            treatment or clinical match.
          </p>
          {loading && <p role="status">Opening the local music shelf…</p>}
          {!loading && !suggested.length && (
            <div className="cm-empty">
              <h3>Your shelf is ready for a beginning.</h3>
              <p>
                No technically checked music is available yet. Create a piece if
                the local model is ready, or explore Classic soundscapes.
              </p>
            </div>
          )}
          {catalogueDescription && (
            <p className="small">{catalogueDescription}</p>
          )}
          <div className="cm-starters">
            {suggested.slice(0, expandedShelf ? 80 : 6).map((s) => (
              <button
                key={s.id}
                className="cm-starter"
                data-sample-id={s.id}
                aria-pressed={selected?.id === s.id}
                onClick={() => choose(s)}
              >
                <span
                  className={`cm-mini cm-mini-${s.request.style}`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 100 64">
                    <path d="M0 40Q25 12 50 30T100 22V64H0Z" />
                    <path
                      d="M57 24Q35 39 64 44T43 64H75Q34 44 67 34Z"
                      fill="#efe1b4"
                    />
                  </svg>
                </span>
                <span>
                  <strong>
                    {currentStarterName(
                      s.request.style,
                      s.request.seed,
                      s.request.current,
                    )}
                  </strong>
                  <small>
                    {s.request.style === "piano"
                      ? "Soft piano"
                      : s.request.style === "ambient"
                        ? "Sustained textures"
                        : "Gentle acoustic"}{" "}
                    · {Math.round(s.metrics.duration)}s piece
                  </small>
                  <small>
                    {s.request.style === options.taste
                      ? "Matches your sound preference"
                      : "Another sound to explore"}{" "}
                    · measured, not clinically validated
                  </small>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
          {suggested.length > 6 && (
            <button
              className="cm-browse"
              onClick={() => setExpandedShelf((v) => !v)}
            >
              {expandedShelf
                ? "Show fewer starting places"
                : `Browse all ${suggested.length} pieces`}
            </button>
          )}
          <p className="small">
            {generatedConcepts} of{" "}
            {currentSeedCatalogue.filter((s) => s.eligible).length} adult
            catalogue recipes have real measured audio. Other measured study
            pieces remain available. Every piece still needs your listening
            choice.
          </p>
          <div
            className="cm-shape"
            role="region"
            aria-label="Shape now"
            tabIndex={-1}
            ref={playerRegion}
          >
            <span className="eyebrow">SHAPE NOW</span>
            <h2>{selected ? name : "Make it yours."}</h2>
            {selected ? (
              <>
                {archivedSamples.some((s) => s.id === selected?.id) && (
                  <p role="status" className="notice">
                    Earlier catalogue version, retained for this saved session.
                    New starters are available above; nothing was substituted.
                  </p>
                )}
                <label className="current-field">
                  Current name
                  <input
                    value={name}
                    maxLength={60}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <p className="small">
                  Locally generated instrumental request. Preview for unwanted
                  sounds; technical checks cannot certify musical quality or a
                  wellness effect.
                </p>
                <p role="status">{player.message}</p>
                {sessionPlan && (
                  <div className="cm-sequence">
                    <strong>
                      {sessionPieces.length}{" "}
                      {sessionPieces.length === 1 ? "movement" : "movements"} ·{" "}
                      {Math.round(sessionPlan.secondsOfUniqueMusic)} seconds of
                      distinct music
                    </strong>
                    <p className="small">
                      {effectiveTransition === "quiet-gap"
                        ? "Each movement fades to quiet before the next. Tonal or pulse compatibility is uncertain."
                        : "Measured compatibility permits gentle crossfades; musical fit still needs your preview."}{" "}
                      Longer listening cycles this sequence, rather than
                      claiming unlimited new music.
                    </p>
                    {sessionPieces.map((s) => (
                      <div key={s.id}>
                        <span>
                          {currentStarterName(
                            s.request.style,
                            s.request.seed,
                            s.request.current,
                          )}
                        </span>
                        {sessionPieces.length > 1 && (
                          <button
                            aria-label={`Remove movement ${currentStarterName(s.request.style, s.request.seed, s.request.current)}`}
                            onClick={() => {
                              engine.current?.stop();
                              const next = sessionPieces.filter(
                                (x) => x.id !== s.id,
                              );
                              setSessionIds(next.map((x) => x.id));
                              setSelected(next[0]);
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {sessionPieces.length < 3 && (
                      <label className="current-field">
                        Add another measured movement
                        <select
                          value=""
                          onChange={(e) => {
                            const item = samples.find(
                              (s) => s.id === e.target.value,
                            );
                            if (item) assemble([...sessionPieces, item]);
                          }}
                        >
                          <option value="">Choose a different piece…</option>
                          {suggested
                            .filter((s) => !sessionIds.includes(s.id))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {currentStarterName(
                                  s.request.style,
                                  s.request.seed,
                                  s.request.current,
                                )}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={quietTransitions}
                        onChange={(e) => {
                          engine.current?.stop();
                          setQuietTransitions(e.target.checked);
                        }}
                      />
                      <span>Always leave a quiet moment between movements</span>
                    </label>
                  </div>
                )}

                <div className="cm-transport">
                  <button
                    className="primary"
                    disabled={blocked || player.phase === "loading"}
                    onClick={() =>
                      player.phase === "playing"
                        ? engine.current?.pause()
                        : void engine.current?.play(
                            sessionPieces.map((s) => s.id),
                            minutes,
                            { volume, brightness, space },
                            player.phase === "paused",
                            effectiveTransition,
                          )
                    }
                  >
                    {player.phase === "playing" ? (
                      <Pause size={18} />
                    ) : (
                      <Play size={18} />
                    )}{" "}
                    {player.phase === "playing"
                      ? "Pause Current"
                      : player.phase === "paused"
                        ? "Resume Current"
                        : "Play Current"}
                  </button>
                  <button
                    disabled={!active}
                    onClick={() => engine.current?.stop()}
                  >
                    <Square size={16} />
                    Stop
                  </button>
                  <button
                    onClick={() =>
                      engine.current?.stop("Quiet is a good choice, too.")
                    }
                  >
                    Choose quiet
                  </button>
                </div>
                <p className="cm-time">
                  {clock(player.elapsed)} /{" "}
                  {clock(player.total || minutes * 60)}{" "}
                  <span>
                    {player.phase === "playing"
                      ? "Music is playing"
                      : player.phase === "paused"
                        ? "Paused"
                        : ""}
                  </span>
                </p>
                <label className="current-field">
                  Listening time
                  <select
                    value={minutes}
                    onChange={(e) => {
                      engine.current?.stop(
                        "Duration changed. Press Play when ready.",
                      );
                      setMinutes(Number(e.target.value));
                    }}
                  >
                    {[1, 3, 5, 10, 15, 30].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "minute" : "minutes"}
                      </option>
                    ))}
                  </select>
                </label>
                {(
                  [
                    ["Volume", volume, setVolume, 0, 0.6, 0.01],
                    ["Brightness", brightness, setBrightness, 0, 1, 0.01],
                    ["Space", space, setSpace, 0, 0.35, 0.01],
                  ] as const
                ).map(([label, value, set, min, max, step]) => (
                  <label className="cm-slider" key={label}>
                    {label}
                    <input
                      type="range"
                      aria-label={`Current ${label.toLowerCase()}`}
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={(e) => set(Number(e.target.value))}
                    />
                  </label>
                ))}
                <p className="small">
                  These change level, tone and reverb immediately. They don’t
                  change instruments or guarantee an effect. Start quietly;
                  device volume still matters.
                </p>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={saveConsent}
                    onChange={(e) => setSaveConsent(e.target.checked)}
                  />
                  <span>Save this music session in this browser</span>
                </label>
                <button
                  disabled={!saveConsent || storageBad || !name.trim()}
                  onClick={save}
                >
                  <Bookmark size={16} />
                  Save Current
                </button>
              </>
            ) : (
              <p>
                Choose a starter above. You can adjust its sound immediately, or
                prepare a different piece in the background. Nothing autoplays.
              </p>
            )}
          </div>
          {saved.length > 0 && (
            <div className="cm-saved">
              <h3>Your saved Currents</h3>
              {saved.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      const refs = item.segments || [
                        { sampleId: item.sampleId, pcmSha256: item.pcmSha256 },
                      ];
                      const pieces = refs.map((ref) =>
                        knownSamples.find(
                          (s) =>
                            s.id === ref.sampleId &&
                            s.metrics.pcmSha256 === ref.pcmSha256,
                        ),
                      );
                      const s = pieces[0];
                      if (
                        !s ||
                        pieces.some(
                          (p) => !p || currentTechnicalIssues(p).length,
                        )
                      ) {
                        setNotice(
                          "The saved audio is unavailable or changed. Nothing was substituted.",
                        );
                        return;
                      }
                      choose(s);
                      setSessionIds(pieces.map((s) => s!.id));
                      setQuietTransitions(item.transition === "quiet-gap");
                      setName(item.name);
                      setOptions(item.options);
                      setMinutes(item.minutes);
                      setVolume(item.volume);
                      setBrightness(item.brightness);
                      setSpace(item.space);
                    }}
                  >
                    {item.name}
                  </button>
                  <button
                    aria-label={`Remove saved ${item.name}`}
                    onClick={() => {
                      try {
                        const next = saved.filter((s) => s.id !== item.id);
                        localStorage.setItem(
                          currentMusicStorageKey,
                          JSON.stringify(next),
                        );
                        setSaved(next);
                      } catch {
                        setNotice("Could not remove this saved entry.");
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="cm-notice" role="status">
          {notice}
        </p>
      )}
      {active && (
        <div className="cm-floating" aria-label="Current playback controls">
          <span>
            <strong>
              {player.phase === "loading"
                ? "Opening music…"
                : player.phase === "paused"
                  ? "Current paused"
                  : "Current playing"}
            </strong>
            <small>
              {clock(player.elapsed)} / {clock(player.total || minutes * 60)}
            </small>
          </span>
          <button
            onClick={() => engine.current?.stop()}
            aria-label="Stop Current audio"
          >
            <Square size={16} />
            Stop audio
          </button>
        </div>
      )}
      <footer className="cm-footer">
        <p>
          Some days, quiet is enough. Music is optional support, not treatment
          or crisis care. If listening feels worse, stop. Nothing here monitors
          your wellbeing.
        </p>
        <button onClick={onClassic}>Explore Classic soundscapes</button>
        <p className="small">
          Your earlier procedural mixes remain available. The research catalogue
          contains 40 design concepts; only real, technically checked pieces
          appear on this shelf.
        </p>
      </footer>
    </section>
  );
}
