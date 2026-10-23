"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
type Track = { id: string; src: string; title: string };
const preferenceKey = "soulfire.ambient.enabled";

export function AmbientAudio({
  voiceActive,
  paused = false,
  ducked = false,
}: {
  voiceActive: boolean;
  paused?: boolean;
  ducked?: boolean;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selected, setSelected] = useState("");
  const [wanted, setWanted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [error, setError] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const fade = useRef(0);
  const playAttempt = useRef(0);
  const enabled = useRef(true);
  const waiting = useRef(false);
  const volumeRef = useRef(volume);
  const duckRef = useRef(ducked);
  duckRef.current = ducked;
  const blocked = useRef(voiceActive);
  blocked.current = voiceActive || paused;
  volumeRef.current = volume;
  const track = tracks.find((t) => t.id === selected);
  function preference(value: boolean) {
    enabled.current = value;
    try {
      localStorage.setItem(preferenceKey, value ? "on" : "off");
    } catch {
      /* Audio still works when storage is unavailable. */
    }
  }
  function ramp(target: number, stop = false) {
    cancelAnimationFrame(fade.current);
    const el = audio.current;
    if (!el) return;
    const from = el.volume,
      start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / 650);
      el.volume = from + (target - from) * t;
      if (t < 1) fade.current = requestAnimationFrame(frame);
      else if (stop) {
        el.pause();
        setPlaying(false);
      }
    };
    fade.current = requestAnimationFrame(frame);
  }
  function silence(remember = false) {
    if (remember) preference(false);
    playAttempt.current++;
    waiting.current = false;
    setAwaiting(false);
    setWanted(false);
    setStarting(false);
    cancelAnimationFrame(fade.current);
    audio.current?.pause();
    if (audio.current) audio.current.volume = 0;
    setPlaying(false);
  }
  async function start(gesture = false) {
    const el = audio.current;
    if (!el || blocked.current) return;
    if (document.hidden) {
      waiting.current = enabled.current;
      setAwaiting(enabled.current);
      return;
    }
    cancelAnimationFrame(fade.current);
    const attempt = ++playAttempt.current;
    // A gesture can retry even while the autoplay promise is still pending.
    waiting.current = !gesture && enabled.current;
    setStarting(true);
    setAwaiting(false);
    setError("");
    setWanted(true);
    // Autoplay is requested at audible volume. Never start muted and unmute to evade policy.
    el.volume = gesture ? 0 : volumeRef.current * (duckRef.current ? 0.22 : 1);
    try {
      if (el.error) el.load();
      await el.play();
      // A superseded attempt must never pause the shared element now used by a newer play.
      if (attempt !== playAttempt.current || audio.current !== el) return;
      if (blocked.current || document.hidden || !enabled.current) {
        el.pause();
        setStarting(false);
        return;
      }
      waiting.current = false;
      setAwaiting(false);
      setStarting(false);
      setPlaying(!el.paused && el.readyState >= 2);
      if (gesture) ramp(volumeRef.current * (duckRef.current ? 0.22 : 1));
    } catch (e) {
      if (attempt !== playAttempt.current) return;
      setStarting(false);
      setPlaying(false);
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        waiting.current = enabled.current;
        setAwaiting(enabled.current);
      } else {
        setWanted(false);
        setError("Sound couldn’t start. Press Play sound to try again.");
      }
    }
  }
  const startRef = useRef(start);
  startRef.current = start;
  const silenceRef = useRef(silence);
  silenceRef.current = silence;
  useEffect(() => {
    try {
      enabled.current = localStorage.getItem(preferenceKey) !== "off";
      const storedVolume = localStorage.getItem("soulfire.ambient.volume");
      const value = Number(storedVolume);
      if (
        storedVolume !== null &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 1
      ) {
        volumeRef.current = value;
        setVolume(value);
      }
    } catch {}
    setWanted(enabled.current);
    const controller = new AbortController();
    fetch("/ambient.json", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const valid = Array.isArray(data.tracks)
          ? data.tracks.filter(
              (t: Track) =>
                t &&
                typeof t.id === "string" &&
                typeof t.title === "string" &&
                typeof t.src === "string" &&
                /^\/audio\/[a-zA-Z0-9_./-]+$/.test(t.src) &&
                !t.src.includes(".."),
            )
          : [];
        setTracks(valid);
        let previous = "";
        try {
          previous = localStorage.getItem("soulfire.ambient.track") || "";
        } catch {}
        setSelected(
          valid.some((t: Track) => t.id === previous)
            ? previous
            : valid[0]?.id || "",
        );
      })
      .catch(() => {});
    const gesture = (e: Event) => {
      if (
        !e.isTrusted ||
        !waiting.current ||
        !enabled.current ||
        blocked.current
      )
        return;
      if (e instanceof KeyboardEvent && !["Enter", " "].includes(e.key)) return;
      if (e.target instanceof Element && e.target.closest(".ambient-controls"))
        return;
      void startRef.current(true);
    };
    const hidden = () => {
      if (document.hidden) silenceRef.current();
      else if (enabled.current && !blocked.current && audio.current?.paused) {
        waiting.current = true;
        setAwaiting(true);
      }
    };
    const leave = () => silenceRef.current();
    document.addEventListener("click", gesture);
    document.addEventListener("keydown", gesture);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leave);
    return () => {
      controller.abort();
      document.removeEventListener("click", gesture);
      document.removeEventListener("keydown", gesture);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", leave);
    };
  }, []);
  useEffect(() => {
    if (!track) return;
    const el = new Audio(track.src);
    el.loop = true;
    el.preload = "none";
    el.volume = volumeRef.current;
    audio.current = el;
    setPlaying(false);
    setError("");
    setWanted(enabled.current);
    const failed = () => {
      silenceRef.current();
      setError(
        "Sound couldn’t load. You can continue in silence or try again.",
      );
    };
    const audible = () => {
      if (blocked.current || document.hidden || !enabled.current) {
        el.pause();
        return;
      }
      waiting.current = false;
      setAwaiting(false);
      setStarting(false);
      setPlaying(true);
    };
    const stopped = () => {
      setPlaying(false);
      setStarting(false);
      if (enabled.current && !blocked.current && !document.hidden) {
        waiting.current = true;
        setAwaiting(true);
      }
    };
    const buffering = () => {
      setPlaying(false);
      setStarting(true);
    };
    el.addEventListener("playing", audible);
    el.addEventListener("pause", stopped);
    el.addEventListener("waiting", buffering);
    el.addEventListener("error", failed);
    if (enabled.current && !blocked.current) void startRef.current();
    return () => {
      silenceRef.current();
      el.removeEventListener("error", failed);
      el.removeEventListener("playing", audible);
      el.removeEventListener("pause", stopped);
      el.removeEventListener("waiting", buffering);
      el.removeAttribute("src");
      el.load();
      audio.current = null;
    };
  }, [track]);
  useEffect(() => {
    if (voiceActive || paused) silenceRef.current();
  }, [voiceActive, paused]);
  useEffect(() => {
    if (audio.current && !audio.current.paused)
      ramp(volumeRef.current * (ducked ? 0.22 : 1));
  }, [ducked]);
  const mute = () => {
    preference(false);
    playAttempt.current++;
    waiting.current = false;
    setAwaiting(false);
    setWanted(false);
    setStarting(false);
    setError("");
    ramp(0, true);
  };
  const play = () => {
    preference(true);
    if (volumeRef.current === 0) {
      volumeRef.current = 0.25;
      setVolume(0.25);
    }
    void start(true);
  };
  return (
    <div className="ambient-controls">
      <button
        className="sound-toggle"
        disabled={!track || voiceActive}
        aria-label={playing ? "Mute ambient sound" : "Enable ambient sound"}
        onClick={() => (playing ? mute() : play())}
      >
        {playing ? <Volume2 size={17} /> : <VolumeX size={17} />}
      </button>
      <details className="sound-controls">
        <summary>
          Sound{" "}
          {playing ? "on" : starting ? "loading" : awaiting ? "ready" : "off"}
        </summary>
        <div className="sound-popover">
          {tracks.length ? (
            <label>
              Choose a sound
              <select
                aria-label="Ambient track"
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  try {
                    localStorage.setItem(
                      "soulfire.ambient.track",
                      e.target.value,
                    );
                  } catch {}
                }}
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>Music is loading. You can begin in silence.</p>
          )}
          <button
            disabled={!track || voiceActive}
            onClick={() => (playing ? mute() : play())}
          >
            {playing ? "Pause sound" : "Play sound"}
          </button>
          {!playing && wanted && (
            <button disabled={voiceActive} onClick={mute}>
              Keep sound off
            </button>
          )}
          {track && (
            <label>
              Volume
              <input
                aria-label="Ambient volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  try {
                    localStorage.setItem("soulfire.ambient.volume", String(v));
                  } catch {}
                  volumeRef.current = v;
                  if (v === 0) mute();
                  else if (playing) ramp(v * (duckRef.current ? 0.22 : 1));
                }}
              />
            </label>
          )}
          <p className="small">
            Your sound preference is remembered on this browser.
          </p>
          {voiceActive && (
            <p role="status">
              Sound paused for your microphone. Resume when you’re done.
            </p>
          )}
        </div>
      </details>
      {awaiting && (
        <span className="sound-status" role="status">
          Starts when you begin
        </span>
      )}
      {error && (
        <span className="sound-status" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
