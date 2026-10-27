"use client";
import { useEffect, useRef, useState, type Ref } from "react";
import { ArrowLeft, Flame, Play, Pause, Square, Bookmark } from "lucide-react";
import {
  createEmberSession,
  defaultEmberInput,
  emberIntentions,
  emberStorageKey,
  readEmberPreferences,
  type EmberInput,
  type EmberPhrase,
  type EmberSession,
} from "../domain/ember";
import { EmberAudio, initialEmberState } from "../infrastructure/ember-audio";
import recording from "../lib/ember-recording.json";
const durations = Object.fromEntries(
  Object.entries(recording.clips).map(([id, clip]) => [id, clip.seconds]),
) as Record<EmberPhrase, number>;
const clock = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
export function EmberPanel({
  blocked,
  motionEnabled,
  headingRef,
  onBack,
}: {
  blocked: boolean;
  motionEnabled: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onBack: () => void;
}) {
  const [input, setInput] = useState<EmberInput>({ ...defaultEmberInput });
  const [session, setSession] = useState<EmberSession | null>(null);
  const [state, setState] = useState(initialEmberState);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState<EmberInput | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  const [grounding, setGrounding] = useState(false);
  const engine = useRef<EmberAudio | null>(null);
  const player = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const e = new EmberAudio(setState);
    engine.current = e;
    try {
      setSaved(readEmberPreferences(localStorage.getItem(emberStorageKey)));
    } catch {
      setUnreadable(true);
      setNotice(
        "Saved preferences are unreadable and were left unchanged. You can still create a practice.",
      );
    }
    const hidden = () => {
      if (document.hidden)
        e.pause(
          "Paused while the app is in the background. Resume deliberately when you return.",
        );
    };
    const leave = () => e.pause();
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", leave);
      e.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    if (blocked)
      engine.current?.pause("Paused while another Soulfire activity is open.");
  }, [blocked]);
  function change<K extends keyof EmberInput>(key: K, value: EmberInput[K]) {
    engine.current?.stop(
      "Preferences changed. Create a new practice when ready.",
    );
    setSession(null);
    setInput((v) => ({ ...v, [key]: value }));
    setGrounding(false);
    setError("");
  }
  function create(value = input) {
    engine.current?.stop();
    setError("");
    setGrounding(false);
    try {
      setSession(createEmberSession(value, durations));
      const from = document.activeElement;
      requestAnimationFrame(() => {
        if (
          document.activeElement !== from &&
          document.activeElement !== document.body
        )
          return;
        player.current?.focus({ preventScroll: true });
        player.current?.scrollIntoView({
          block: "start",
          behavior: motionEnabled ? "smooth" : "instant",
        });
      });
    } catch {
      setError(
        "This guidance needs a little more room. Choose a longer duration or less guidance.",
      );
    }
  }
  function stopGround() {
    engine.current?.stop();
    setGrounding(true);
    setTimeout(() => document.getElementById("ember-grounding")?.focus(), 0);
  }
  function save() {
    if (!consent || unreadable) return;
    try {
      localStorage.setItem(emberStorageKey, JSON.stringify(input));
      setSaved({ ...input });
      setNotice(
        "Preferences saved on this browser only. No playback or transcript history is saved.",
      );
    } catch {
      setNotice(
        "Preferences could not be saved. Your practice is still available; nothing was reported as saved.",
      );
    }
  }
  const active = state.phase === "playing" || state.phase === "starting";
  const progress = session
    ? Math.min(100, (state.elapsed / session.seconds) * 100)
    : 0;
  return (
    <section className="ember-page" aria-label="Ember meditation">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Soulfire
      </button>
      <div className="ember-heading">
        <span className="eyebrow">
          <Flame size={17} /> A little room to simply be
        </span>
        <h1 tabIndex={-1} ref={headingRef}>
          Ember
        </h1>
        <p>
          Return to what matters. A guided practice shaped around your time,
          your pace, and what feels comfortable.
        </p>
      </div>
      <div className="ember-layout">
        <div className="ember-settings">
          <h2>What would help right now?</h2>
          <fieldset>
            <legend>Your intention</legend>
            <div className="ember-goals">
              {Object.entries(emberIntentions).map(([id, label]) => (
                <label
                  key={id}
                  className={input.intention === id ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="ember-intention"
                    value={id}
                    checked={input.intention === id}
                    onChange={() =>
                      change("intention", id as EmberInput["intention"])
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            How much time do you have?
            <select
              aria-label="Ember duration"
              value={input.minutes}
              onChange={(e) => change("minutes", Number(e.target.value))}
            >
              {[2, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <label>
            Guidance density
            <select
              value={input.density}
              onChange={(e) =>
                change("density", e.target.value as EmberInput["density"])
              }
            >
              <option value="spacious">Spacious · more silence</option>
              <option value="balanced">Balanced</option>
              <option value="more">More guidance</option>
            </select>
          </label>
          <div className="ember-options">
            <label>
              Voice
              <select
                aria-label="Voice"
                value={input.voice ? "warm" : "captions"}
                onChange={(e) => change("voice", e.target.value === "warm")}
              >
                <option value="warm">Warm · local synthetic voice</option>
                <option value="captions">Captions only · no voice</option>
              </select>
            </label>
            <label>
              Sound
              <select
                aria-label="Sound"
                value={input.sound}
                onChange={(e) =>
                  change("sound", e.target.value as EmberInput["sound"])
                }
              >
                <option value="warmth">Soft warm tones</option>
                <option value="river">Gentle procedural river</option>
                <option value="quiet">Quiet · no background</option>
              </select>
            </label>
          </div>
          <details>
            <summary>Make it comfortable</summary>
            <label>
              Breathing
              <select
                value={input.breathing}
                onChange={(e) =>
                  change("breathing", e.target.value as EmberInput["breathing"])
                }
              >
                <option value="natural">Natural · no pacing</option>
                <option value="comfortable">
                  Optional gentle invitation · your own pace
                </option>
              </select>
            </label>
            <p>
              No holds or forced deep breaths. You can ignore any cue and return
              to your natural rhythm.
            </p>
            <label>
              Voice speed
              <input
                aria-label="Ember voice speed"
                type="range"
                min="0.85"
                max="1.1"
                step=".05"
                value={input.rate}
                onChange={(e) => change("rate", Number(e.target.value))}
              />
            </label>
            <label>
              Voice volume
              <input
                aria-label="Ember voice volume"
                type="range"
                min="0"
                max=".8"
                step=".05"
                value={input.volume}
                onChange={(e) => change("volume", Number(e.target.value))}
              />
            </label>
            <label>
              Sound volume
              <input
                aria-label="Ember sound volume"
                type="range"
                min="0"
                max=".5"
                step=".025"
                value={input.soundVolume}
                onChange={(e) => change("soundVolume", Number(e.target.value))}
              />
            </label>
          </details>
          <p className="ember-expectations">
            Your eyes can stay open. Meditation can sometimes feel
            uncomfortable; pause, change focus, or stop whenever you wish. This
            is a self-help practice, not treatment.
          </p>
          <button className="button primary" onClick={() => create()}>
            Create my practice
          </button>
          {error && <p role="alert">{error}</p>}
          <details className="ember-save">
            <summary>
              <Bookmark size={15} /> Keep my preferences
            </summary>
            <label className="ember-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />{" "}
              Save only these choices on this browser
            </label>
            <button
              className="button"
              disabled={!consent || unreadable}
              onClick={save}
            >
              Save Ember preferences
            </button>
            {saved && (
              <>
                <button
                  className="button"
                  onClick={() => {
                    engine.current?.stop();
                    setInput({ ...saved });
                    setSession(null);
                    setNotice(
                      "Saved preferences loaded. Nothing starts automatically.",
                    );
                  }}
                >
                  Load saved preferences
                </button>
                <button
                  className="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem(emberStorageKey);
                      setSaved(null);
                      setNotice("Ember preferences removed.");
                    } catch {
                      setNotice("Preferences could not be removed.");
                    }
                  }}
                >
                  Delete Ember preferences
                </button>
              </>
            )}
            <p role="status">{notice}</p>
          </details>
        </div>
        <div
          className="ember-experience"
          ref={player}
          tabIndex={-1}
          aria-label="Ember player"
        >
          <div
            className={`ember-art ${motionEnabled && state.phase === "playing" ? "ember-moving" : ""}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 640 440" role="presentation">
              <defs>
                <radialGradient id="ember-light">
                  <stop stopColor="#ffe8ac" />
                  <stop offset=".45" stopColor="#eabf75" stopOpacity=".64" />
                  <stop offset="1" stopColor="#eabf75" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="ember-ceramic" x2="0" y2="1">
                  <stop stopColor="#fffdf5" />
                  <stop offset="1" stopColor="#d9cbb2" />
                </linearGradient>
                <filter id="ember-blur">
                  <feGaussianBlur stdDeviation="9" />
                </filter>
              </defs>
              <path d="M0 0H640V440H0Z" fill="#eee9da" />
              <path d="M0 316 Q320 276 640 321V440H0Z" fill="#e7dfce" />
              <ellipse
                cx="320"
                cy="358"
                rx="142"
                ry="21"
                fill="#b8ab8b"
                opacity=".24"
                filter="url(#ember-blur)"
              />
              <circle
                className="ember-glow"
                cx="320"
                cy="212"
                r="158"
                fill="url(#ember-light)"
              />
              <path
                d="M211 244 Q200 355 320 365 Q440 355 429 244Z"
                fill="url(#ember-ceramic)"
              />
              <ellipse cx="320" cy="244" rx="109" ry="33" fill="#c8b798" />
              <ellipse cx="320" cy="241" rx="91" ry="24" fill="#f4dfb0" />
              <path
                d="M320 250 C271 237 291 203 311 183 C304 214 344 202 339 228 Q335 247 320 250Z"
                fill="#f9b969"
              />
              <path
                d="M320 246 Q303 230 322 213 Q338 235 320 246Z"
                fill="#fff2c4"
              />
            </svg>
          </div>
          <span className="eyebrow">Your own pace is welcome</span>
          <h2>{session?.name || "A warm place to begin"}</h2>
          <p>
            {session
              ? `${session.input.minutes} minutes · ${session.input.density} guidance · ${session.input.sound === "quiet" ? "quiet" : session.input.sound === "river" ? "procedural river" : "procedural warm tones"}`
              : "Choose what feels right, then create your practice. Audio starts only when you press Begin."}
          </p>
          {session && (
            <>
              <div
                className="ember-caption"
                aria-live="polite"
                aria-atomic="true"
              >
                {state.caption ||
                  "Let your eyes stay open if you like. Nothing needs to be forced."}
              </div>
              <div className="ember-progress">
                <progress
                  aria-label="Ember progress"
                  value={state.elapsed}
                  max={session.seconds}
                />
                <span>
                  {clock(state.elapsed)} / {clock(session.seconds)}
                </span>
              </div>
              <div className="ember-buttons">
                <button
                  className="button primary"
                  disabled={blocked || state.phase === "starting"}
                  onClick={() => {
                    setGrounding(false);
                    if (state.phase === "playing") engine.current?.pause();
                    else
                      void engine.current?.play(
                        session,
                        state.phase === "paused",
                      );
                  }}
                >
                  {active ? <Pause size={17} /> : <Play size={17} />}{" "}
                  {state.phase === "starting"
                    ? "Opening audio…"
                    : state.phase === "playing"
                      ? "Pause practice"
                      : state.phase === "paused"
                        ? "Resume practice"
                        : "Begin practice"}
                </button>
                <button
                  className="button"
                  onClick={() => engine.current?.stop()}
                >
                  <Square size={16} /> Stop practice
                </button>
              </div>
              <p role={state.phase === "error" ? "alert" : "status"}>
                {state.message}
              </p>
              <p className="ember-provenance">
                Local synthetic stock narration · written guidance · procedural
                sound, not composed music. No microphone or external generation
                service is used.
              </p>
              <details>
                <summary>Read the complete practice</summary>
                <ol className="ember-transcript">
                  {session.cues.map((cue, i) => (
                    <li key={i}>
                      <span>{clock(cue.start)}</span>
                      <p>{cue.text}</p>
                      {i < session.cues.length - 1 && (
                        <small>
                          Then space to practice before the next guidance.
                        </small>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            </>
          )}
        </div>
      </div>
      <div className="ember-ground-bar">
        <span>
          {state.speaking
            ? "Guidance speaking"
            : state.phase === "playing"
              ? "Space to practice"
              : session
                ? `${Math.round(progress)}% · ${state.phase}`
                : "Ready when you are"}
        </span>
        <button className="button" onClick={stopGround}>
          <Square size={16} /> Stop & ground
        </button>
      </div>
      {grounding && (
        <div
          id="ember-grounding"
          tabIndex={-1}
          className="ember-grounding"
          role="status"
        >
          <h2>Come back to the room</h2>
          <p>
            The practice has stopped. Let your breathing be natural. If you
            like, look around and name something you can see. Notice the floor
            beneath your feet or another steady point of contact. You can move,
            take a break, or reach out to someone you trust.
          </p>
          <button className="button" onClick={onBack}>
            Return to Soulfire
          </button>
        </div>
      )}
      <p className="ember-footer">
        Choose your voice · Adjust the sound · Pause anytime
      </p>
    </section>
  );
}
