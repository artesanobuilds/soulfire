"use client";
import { useEffect, useRef, useState, type Ref } from "react";
import { ArrowRight, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { PromptArt } from "./QuietScene";

const moments = [
  {
    title: "Bring what’s on your mind",
    kind: "choose" as const,
    caption:
      "Welcome to SoulFire. A space to bring the principles of twelve-step practice into everyday life. Bring whatever is on your mind.",
  },
  {
    title: "Make space to reflect",
    kind: "reflect" as const,
    caption:
      "Make room to reflect, pause for a moment of stillness if you choose,",
  },
  {
    title: "Find one small next step",
    kind: "action" as const,
    caption:
      "and find one small action to carry into your day. You set the pace.",
  },
];
export function Arrival({
  returning,
  hasPractice,
  onBegin,
  onResume,
  onNew,
  onDone,
  onNarrating,
  headingRef,
  paused,
}: {
  returning: boolean;
  hasPractice: boolean;
  onBegin: () => void;
  onResume: () => void;
  onNew: () => void;
  onDone: () => void;
  onNarrating: (active: boolean) => void;
  headingRef: Ref<HTMLHeadingElement>;
  paused: boolean;
}) {
  const [replay, setReplay] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [cues, setCues] = useState([0, 11.753583, 17.45625]);
  const audio = useRef<HTMLAudioElement>(null);
  const attempt = useRef(0);
  const starting = useRef(false);
  const callbacks = useRef({ onDone, onNarrating });
  callbacks.current = { onDone, onNarrating };
  useEffect(() => {
    try {
      setHasPlayed(
        localStorage.getItem("soulfire.introduction.played.v1") === "yes",
      );
    } catch {}
    const controller = new AbortController();
    fetch("/audio/welcome-introduction.json?v=kokoro-heart-v1", {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (
          Array.isArray(d.cues) &&
          d.cues.length === 3 &&
          d.cues.every(
            (n: unknown) => typeof n === "number" && Number.isFinite(n),
          )
        )
          setCues(d.cues);
      })
      .catch(() => {});
    const el = audio.current;
    const generation = attempt;
    const hidden = () => {
      if (document.hidden) {
        attempt.current++;
        starting.current = false;
        el?.pause();
        setPlaying(false);
        callbacks.current.onNarrating(false);
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      controller.abort();
      generation.current++;
      el?.pause();
      callbacks.current.onNarrating(false);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  useEffect(() => {
    if (paused) {
      attempt.current++;
      starting.current = false;
      audio.current?.pause();
      setPlaying(false);
      callbacks.current.onNarrating(false);
    }
  }, [paused]);
  function stop() {
    attempt.current++;
    starting.current = false;
    audio.current?.pause();
    setPlaying(false);
    onNarrating(false);
  }
  async function hear() {
    const el = audio.current;
    if (!el || starting.current || paused) return;
    if (playing) {
      stop();
      return;
    }
    const id = ++attempt.current;
    starting.current = true;
    setError("");
    setReplay(true);
    if (completed || el.ended) {
      el.currentTime = 0;
      setStage(0);
      setCompleted(false);
    }
    el.muted = muted;
    try {
      await el.play();
      if (id !== attempt.current) return;
      setPlaying(true);
      onNarrating(!el.muted);
    } catch {
      if (id === attempt.current) {
        setPlaying(false);
        onNarrating(false);
        setError(
          "The introduction couldn’t play. Try again or begin your journey without audio.",
        );
      }
    } finally {
      if (id === attempt.current) starting.current = false;
    }
  }
  function begin() {
    stop();
    onDone();
    if (hasPractice) onResume();
    else onBegin();
  }
  const showIntro = !returning || replay;
  return (
    <div
      className={`arrival-copy welcome-arrival ${started ? "intro-started" : ""}`}
    >
      <audio
        ref={audio}
        data-intro="true"
        src="/audio/welcome-kokoro-heart.m4a"
        preload="none"
        onTimeUpdate={() => {
          const time = audio.current?.currentTime || 0;
          setStage(time >= cues[2] ? 2 : time >= cues[1] ? 1 : 0);
        }}
        onPlaying={() => {
          if (paused || document.hidden) {
            audio.current?.pause();
            return;
          }
          setPlaying(true);
          setStarted(true);
          setHasPlayed(true);
          try {
            localStorage.setItem("soulfire.introduction.played.v1", "yes");
          } catch {}
          onNarrating(!audio.current?.muted);
        }}
        onPause={() => {
          setPlaying(false);
          onNarrating(false);
        }}
        onEnded={() => {
          setPlaying(false);
          setCompleted(true);
          onNarrating(false);
          onDone();
        }}
        onError={() => {
          setPlaying(false);
          onNarrating(false);
          setError(
            "The introduction is unavailable. You can still begin your journey.",
          );
        }}
      />
      <span className="eyebrow">
        {returning && !replay
          ? "YOUR SPACE TO RETURN"
          : "A LITTLE ROOM TO BEGIN"}
      </span>
      <h1 ref={headingRef} tabIndex={-1}>
        {returning && !replay ? (
          "Welcome back."
        ) : (
          <>
            Come back
            <br />
            <em>to yourself.</em>
          </>
        )}
      </h1>
      <p className="arrival-purpose">
        Twelve-step wisdom, practiced in everyday life.
      </p>
      <div className="arrival-actions">
        <button className="intro-play" onClick={hear}>
          {playing ? <Pause size={17} /> : <Play size={17} />}{" "}
          {playing
            ? "Pause introduction"
            : started && !completed
              ? "Resume introduction"
              : hasPlayed
                ? "Replay introduction"
                : "Play introduction"}
        </button>

        {hasPractice ? (
          <>
            <button
              className="arrival-begin"
              onClick={() => {
                stop();
                onDone();
                onResume();
              }}
            >
              Resume practice <ArrowRight size={19} />
            </button>
            <button
              className="arrival-secondary"
              onClick={() => {
                stop();
                onNew();
              }}
            >
              Start a new practice
            </button>
          </>
        ) : (
          <button className="arrival-begin" onClick={begin}>
            Begin journey <ArrowRight size={19} />
          </button>
        )}
      </div>
      {started && showIntro && (
        <div className="intro-moment" aria-live="polite">
          <PromptArt kind={moments[stage].kind} />
          <p>{moments[stage].title}</p>
        </div>
      )}
      {showIntro && (
        <div className="intro-controls">
          {started && (
            <button
              aria-label={muted ? "Unmute introduction" : "Mute introduction"}
              aria-pressed={muted}
              onClick={() => {
                const next = !muted;
                setMuted(next);
                if (audio.current) audio.current.muted = next;
                onNarrating(playing && !next);
              }}
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}{" "}
              {muted ? "Unmute" : "Mute"}
            </button>
          )}
          {started && (
            <button
              aria-pressed={captions}
              onClick={() => setCaptions((v) => !v)}
            >
              Captions {captions ? "on" : "off"}
            </button>
          )}
        </div>
      )}
      {started && showIntro && captions && (
        <p className="intro-caption" aria-live="off">
          {moments[stage].caption}
        </p>
      )}
      {error && (
        <p className="intro-error" role="alert">
          {error}
        </p>
      )}
      {showIntro && !completed && (
        <button className="arrival-secondary intro-skip" onClick={begin}>
          Skip introduction
        </button>
      )}
      <p className="sr-only intro-accessible-copy">
        {moments.map((m) => m.caption).join(" ")}
      </p>
    </div>
  );
}
