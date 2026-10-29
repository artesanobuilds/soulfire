"use client";
import { useEffect, useRef, useState, type Ref } from "react";
import { ArrowRight, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { PromptArt } from "./QuietScene";

import welcome from "../lib/welcome-introduction.json";
import recording from "../../public/audio/welcome-introduction-v2.json";
const moments = welcome.moments.map((moment) => ({
  ...moment,
  kind: moment.kind as "choose" | "reflect" | "action",
  caption: moment.sentences.join(" "),
}));
const cues = recording.cues;
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
  const [segment, setSegment] = useState(0);
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
      setSegment(0);
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
        src={welcome.audioPath}
        preload="none"
        onTimeUpdate={() => {
          const time = audio.current?.currentTime || 0;
          setStage(time >= cues[2] ? 2 : time >= cues[1] ? 1 : 0);
          setSegment(
            Math.max(
              0,
              recording.segments.findLastIndex((s) => time >= s.start),
            ),
          );
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
        {welcome.moments[0].sentences.slice(0, 2).join(" ")}
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
          <button
            className="arrival-begin"
            onClick={(event) => {
              // Narration can reflow the cover. A double-tap aimed at Play must
              // not activate the adjacent Begin button on its second click.
              if (event.detail < 2) begin();
            }}
          >
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
          {recording.segments[segment].text}
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
