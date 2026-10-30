"use client";
import { useEffect, useRef, useState } from "react";
import {
  simulationScenarios,
  usesLocalSynthesis,
  type SimulationConfig,
  type SimulationRun,
} from "../domain/simulation";
import type { HistoryDetail } from "../domain/history";
type Turn = { role: "user" | "assistant"; content: string };
export function SimulationPanel({
  visible,
  onPlayback,
  onReview,
}: {
  visible: boolean;
  onPlayback: (value: boolean) => void;
  onReview: (id: string) => void;
}) {
  const [scenario, setScenario] =
      useState<SimulationConfig["scenario"]>("first-presentation"),
    [mode, setMode] = useState<"text" | "voice">("text"),
    [delivery, setDelivery] = useState<"witnessed" | "background">("witnessed"),
    [engine, setEngine] = useState<"fixture" | "live-text">("fixture"),
    [consent, setConsent] = useState(false),
    [paid, setPaid] = useState(false),
    [live, setLive] = useState(false),
    [localSpeech, setLocalSpeech] = useState(false);
  const [runs, setRuns] = useState<SimulationRun[]>([]),
    [run, setRun] = useState<SimulationRun | null>(null),
    [turns, setTurns] = useState<Turn[]>([]),
    [status, setStatus] = useState("Ready. No simulation has started."),
    [active, setActive] = useState(false),
    [blocked, setBlocked] = useState(false),
    [muted, setMuted] = useState(false),
    [speaking, setSpeaking] = useState<number | null>(null);
  const replaying = useRef(false);
  const setup = useRef<HTMLDetailsElement>(null);
  const latestTurn = useRef<HTMLLIElement>(null);
  const current = useRef<SimulationRun | null>(null),
    generation = useRef(0),
    lock = useRef(false),
    abort = useRef<AbortController | null>(null),
    audio = useRef<HTMLAudioElement | null>(null),
    settleAudio = useRef<(() => void) | null>(null),
    mutedRef = useRef(false),
    visibleRef = useRef(visible),
    notify = useRef(onPlayback);
  notify.current = onPlayback;
  visibleRef.current = visible;
  async function call(body?: unknown, signal?: AbortSignal) {
    const r = await fetch("/api/simulations", {
      method: body ? "POST" : "GET",
      cache: "no-store",
      signal,
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error || "Simulation could not continue.");
    return data;
  }
  async function refresh() {
    try {
      const data = await call();
      setRuns(data.runs);
      setLive(data.liveAvailable);
      setLocalSpeech(data.localSpeechAvailable === true);
    } catch {
      setStatus(
        "Simulation service is unavailable. Retry when the local server is ready.",
      );
    }
  }
  function silence() {
    if (audio.current) {
      audio.current.pause();
      audio.current.removeAttribute("src");
      audio.current.load();
      audio.current = null;
    }
    settleAudio.current?.();
    settleAudio.current = null;
    setBlocked(false);
    setSpeaking(null);
    notify.current(false);
  }
  async function stop(action: "pause" | "stop" = "stop") {
    const epoch = ++generation.current;
    replaying.current = false;
    abort.current?.abort();
    silence();
    lock.current = true;
    const item = current.current;
    if (item) {
      try {
        const data = await call({ action, id: item.id });
        if (epoch !== generation.current) return;
        current.current = data.run;
        setRun(data.run);
        setStatus(
          action === "pause"
            ? "Paused. Resume continues with the next saved turn; replay is available."
            : "Stopped. Saved synthetic turns remain available.",
        );
      } catch {
        setStatus(
          "Stopped locally. Server state could not be confirmed; refresh before resuming.",
        );
      }
    } else setStatus("Playback stopped.");
    if (epoch === generation.current) {
      lock.current = false;
      setActive(false);
    }
    void refresh();
  }
  async function play(url: string, index: number, epoch: number) {
    if (mutedRef.current) return;
    const a = new Audio(url);
    audio.current = a;
    a.muted = mutedRef.current;
    setSpeaking(index);
    notify.current(true);
    await new Promise<void>((resolve) => {
      settleAudio.current = resolve;
      a.onended = () => resolve();
      a.onerror = () => {
        setStatus(
          "Fixture audio could not load. Continue muted or stop; the transcript is available.",
        );
        setBlocked(true);
      };
      void a.play().catch(() => {
        if (generation.current === epoch) {
          setStatus(
            "Audio is waiting for your gesture. Choose Play this turn or continue muted.",
          );
          setBlocked(true);
        }
      });
    });
    if (audio.current === a) {
      a.pause();
      audio.current = null;
    }
    settleAudio.current = null;
    setSpeaking(null);
    notify.current(false);
  }
  async function prepareAudio(
    item: SimulationRun,
    index: number,
    epoch: number,
  ) {
    if (item.config.engine === "fixture" && !usesLocalSynthesis(item))
      return `/audio/simulations/${item.config.scenario}-${index}.m4a`;
    if (epoch !== generation.current)
      throw new DOMException("Stopped", "AbortError");
    setStatus("Synthesizing this saved turn locally. No new model request…");
    abort.current = new AbortController();
    const response = await fetch("/api/simulations/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, turn: index }),
      signal: abort.current.signal,
    });
    const data = await response.json();
    if (!response.ok)
      throw Error(
        data.error || "Local speech failed. Saved text remains available.",
      );
    if (epoch === generation.current && data.run) {
      current.current = data.run;
      setRun(data.run);
    }
    return data.url as string;
  }
  async function watchBackground(item: SimulationRun, epoch: number) {
    try {
      while (epoch === generation.current) {
        abort.current = new AbortController();
        const response = await fetch(`/api/simulations?id=${item.id}`, {
          cache: "no-store",
          signal: abort.current.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw Error(data.error || "Background status unavailable.");
        if (epoch !== generation.current) return;
        current.current = data.run;
        setRun(data.run);
        setTurns(data.messages);
        if (!data.serverActive) {
          setActive(false);
          lock.current = false;
          setStatus(
            data.run.status === "completed"
              ? data.run.audioPending?.length
                ? "Conversation completed; some local audio is unavailable. Replay retries synthesis without new model requests."
                : "Completed on the local server. Saved turns are ready for review or replay."
              : `Server job is not running. Saved state: ${data.run.status}. Resume or replay explicitly.`,
          );
          void refresh();
          return;
        }
        setStatus(
          data.serverActive.phase === "synthesizing"
            ? "Local server is synthesizing saved fictional speech. This tab may be closed."
            : "Local server is generating synthetic turns. This tab may be closed.",
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (e) {
      if (epoch === generation.current) {
        setActive(false);
        lock.current = false;
        setStatus(
          e instanceof Error
            ? e.message
            : "Cannot confirm server job state. Refresh before restarting.",
        );
      }
    }
  }
  async function execute(item: SimulationRun, epoch: number) {
    let next = item;
    try {
      if (item.config.delivery === "background") {
        await call({ action: "start", id: item.id });
        if (epoch === generation.current) await watchBackground(item, epoch);
        return;
      }
      while (next.cursor < 4 && epoch === generation.current) {
        abort.current = new AbortController();
        const index = next.cursor;
        setStatus(
          next.config.engine === "fixture"
            ? "Replaying a deterministic synthetic turn…"
            : "Generating a bounded synthetic turn…",
        );
        const data = await call(
          { action: "step", id: next.id, cursor: next.cursor },
          abort.current.signal,
        );
        if (epoch !== generation.current) return;
        next = data.run;
        current.current = next;
        setRun(next);
        setTurns((v) => [...v, data.message]);
        if (next.config.delivery === "witnessed" && visibleRef.current) {
          if (next.config.mode === "voice" && !mutedRef.current) {
            const url = await prepareAudio(next, index, epoch);
            if (epoch !== generation.current) return;
            setStatus(
              next.config.engine === "fixture"
                ? "Playing a fixture turn…"
                : "Model-generated conversation + synthesized playback · current turn",
            );
            await play(url, index, epoch);
          } else {
            setSpeaking(index);
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
        }
      }
      if (epoch === generation.current) {
        setStatus(
          "Completed. Synthetic transcripts are saved; review, replay or rate them.",
        );
        setActive(false);
        setSpeaking(null);
        lock.current = false;
        void refresh();
      }
    } catch (e) {
      if (epoch === generation.current) {
        silence();
        setActive(false);
        lock.current = false;
        setStatus(e instanceof Error ? e.message : "Run interrupted.");
        void refresh();
      }
    }
  }
  async function launch() {
    if (lock.current || !consent) return;
    lock.current = true;
    setActive(true);
    setTurns([]);
    const epoch = ++generation.current;
    try {
      await call();
      const data = await call({
        action: "create",
        consent: true,
        config: {
          scenario,
          mode,
          delivery,
          engine,
          allowPaid: engine === "live-text" && paid,
          maxCostUsd: engine === "live-text" ? 0.1 : 0,
        },
      });
      if (epoch !== generation.current) {
        await call({ action: "stop", id: data.run.id });
        return;
      }
      current.current = data.run;
      setRun(data.run);
      if (setup.current) setup.current.open = false;
      void execute(data.run, epoch);
    } catch (e) {
      lock.current = false;
      setActive(false);
      setStatus(e instanceof Error ? e.message : "Unable to launch.");
    }
  }
  async function select(item: SimulationRun) {
    if (lock.current) return;
    current.current = item;
    setRun(item);
    try {
      const r = await fetch(`/api/history?id=${item.id}`, {
        cache: "no-store",
      });
      if (!r.ok) throw Error();
      const detail: HistoryDetail = await r.json();
      setTurns(
        detail.events
          .filter((e) => e.kind === "message")
          .map((e) => ({ role: e.role!, content: e.text! })),
      );
      const stateResponse = await fetch(`/api/simulations?id=${item.id}`, {
        cache: "no-store",
      });
      if (!stateResponse.ok) throw Error();
      const state = await stateResponse.json();
      if (state.serverActive) {
        lock.current = true;
        setActive(true);
        const epoch = ++generation.current;
        void watchBackground(item, epoch);
        return;
      }
      setStatus(
        item.status === "completed"
          ? "Saved completed run. Nothing is playing."
          : `Saved state: ${item.status}. No job is running in this tab.`,
      );
    } catch {
      setStatus("Run could not be loaded; it may have been deleted.");
    }
  }
  async function resume() {
    const item = current.current;
    if (!item || lock.current) return;
    lock.current = true;
    setActive(true);
    const epoch = ++generation.current;
    try {
      await call({ action: "pause", id: item.id });
      const data = await call({ action: "resume", id: item.id });
      current.current = data.run;
      setRun(data.run);
      void execute(data.run, epoch);
    } catch (e) {
      lock.current = false;
      setActive(false);
      setStatus(e instanceof Error ? e.message : "Resume failed.");
    }
  }
  async function replay() {
    if (!run || lock.current) return;
    replaying.current = true;
    lock.current = true;
    setActive(true);
    const epoch = ++generation.current;
    setStatus(
      "Replaying saved synthetic turns. No new model request or history write.",
    );
    try {
      for (let i = 0; i < turns.length && epoch === generation.current; i++) {
        setSpeaking(i);
        if (run.config.mode === "voice" && !mutedRef.current) {
          const url = await prepareAudio(run, i, epoch);
          if (epoch !== generation.current) return;
          await play(url, i, epoch);
        } else await new Promise((resolve) => setTimeout(resolve, 700));
      }
      if (epoch === generation.current) setStatus("Replay finished.");
    } catch (e) {
      if (epoch === generation.current)
        setStatus(e instanceof Error ? e.message : "Replay interrupted.");
    } finally {
      if (epoch === generation.current) {
        silence();
        replaying.current = false;
        lock.current = false;
        setActive(false);
      }
    }
  }
  useEffect(() => {
    if (visible) void refresh();
    else if (
      (replaying.current || current.current?.config.delivery === "witnessed") &&
      lock.current
    )
      void stop("pause");
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const leave = () => {
      generation.current++;
      abort.current?.abort();
      silence();
      const id = current.current?.id;
      if (id && current.current?.config.delivery !== "background")
        void fetch("/api/simulations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pause", id }),
          keepalive: true,
        }).catch(() => {});
      lock.current = false;
      setActive(false);
    };
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, []);
  useEffect(() => {
    if (
      active &&
      visible &&
      (replaying.current || current.current?.config.delivery === "witnessed")
    ) {
      const turn = latestTurn.current;
      const controls = turn
        ?.closest(".simulation-panel")
        ?.querySelector(".simulation-controls");
      const dialog = turn?.closest("dialog");
      if (turn && dialog) {
        const offset =
          turn.getBoundingClientRect().top -
          dialog.getBoundingClientRect().top -
          (controls?.getBoundingClientRect().height || 150) -
          24;
        dialog.scrollTop = Math.max(0, dialog.scrollTop + offset);
      }
    }
  }, [turns.length, speaking, active, visible]);
  if (!visible) return null;
  const selectedScenario = simulationScenarios.find((s) => s.id === scenario)!;
  const needsSpeech =
    mode === "voice" &&
    (engine === "live-text" || selectedScenario.fixtureAudio === "local-tts");
  return (
    <div className="simulation-panel">
      <span className="eyebrow">FICTIONAL PEOPLE · BOUNDED RUNS</span>
      <h2>Simulation studio</h2>
      <p>
        Witness alternating user and guide turns, or run silently in the
        background. This does not use your microphone or personal conversations.
        The support/safety scenarios are fictional evaluations, not evidence of
        clinical effectiveness.
      </p>
      <details ref={setup} className="simulation-setup" open={!run}>
        <summary>Configure a new simulation</summary>
        <fieldset disabled={active}>
          <legend>New simulation</legend>
          <label>
            Scenario and persona
            <select
              aria-label="Synthetic scenario"
              value={scenario}
              onChange={(e) => setScenario(e.target.value as typeof scenario)}
            >
              {(
                [
                  ["general", "Everyday demonstrations"],
                  [
                    "support-safety-v1",
                    "20 source topics · fictional evaluations",
                  ],
                  ["cross-cutting-safety-v1", "Cross-cutting safety boundary"],
                  ["discernment-v1", "Discernment under uncertainty"],
                ] as const
              ).map(([suite, label]) => (
                <optgroup key={suite} label={label}>
                  {simulationScenarios
                    .filter((s) => s.suite === suite)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.profile?.name || s.persona.split(" · ")[0]} ·{" "}
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          {selectedScenario.profile && selectedScenario.evaluation && (
            <details className="scenario-evaluation">
              <summary>About this fictional evaluation</summary>
              <p>
                {selectedScenario.sourceTopicNumber
                  ? `Source topic ${selectedScenario.sourceTopicNumber}: `
                  : "Cross-cutting variant: "}
                {selectedScenario.sourceTopic}
              </p>
              <p>
                {selectedScenario.profile.name}, {selectedScenario.profile.age}.{" "}
                {selectedScenario.profile.context}
              </p>
              <p>Goal: {selectedScenario.profile.goal}</p>
              <p>Preferences: {selectedScenario.profile.spiritualPreference}</p>
              <p>{selectedScenario.evaluation.claim}</p>
              <strong>Expected supportive behavior</strong>
              <ul>
                {selectedScenario.evaluation.expected.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <strong>Boundaries</strong>
              <ul>
                {selectedScenario.evaluation.avoid.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </details>
          )}
          <label>
            Mode
            <select
              aria-label="Simulation mode"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as typeof mode);
                if (e.target.value === "voice" && !localSpeech)
                  setEngine("fixture");
              }}
            >
              <option value="text">Text</option>
              <option value="voice">Voice · two local voices</option>
            </select>
          </label>
          <label>
            Delivery
            <select
              aria-label="Simulation delivery"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value as typeof delivery)}
            >
              <option value="witnessed">Witnessed</option>
              <option value="background">Background · silent</option>
            </select>
          </label>
          <label>
            Engine
            <select
              aria-label="Simulation engine"
              value={engine}
              onChange={(e) => setEngine(e.target.value as typeof engine)}
            >
              <option value="fixture">
                Deterministic fixture replay · no API charges
              </option>
              <option
                value="live-text"
                disabled={!live || (mode === "voice" && !localSpeech)}
              >
                Model-generated conversation · paid text requests
              </option>
            </select>
          </label>
          {!live && (
            <p className="small">
              Model generation needs a configured provider and verified pricing.
              Fixture replay remains available.
            </p>
          )}
          <p className="small">
            Four utterances maximum and a ten-minute run window. Voice uses
            local Kokoro am_michael (user) and af_heart (guide). Model-generated
            voice means text generation plus synthesized playback, not a
            speech-to-speech test. Background runs continue on this local server
            when the tab closes; server restarts require explicit resume.
          </p>
          <label className="save-choice">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Save this synthetic run locally for review and feedback (30 days).
          </label>
          {engine === "live-text" && (
            <label className="save-choice">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
              />
              Allow up to four paid text requests, 400 output tokens each, with
              a $0.10 estimated-cost ceiling using configured rates. This is not
              an account billing cap.
            </label>
          )}
          <button
            className="primary"
            disabled={
              !consent ||
              (engine === "live-text" && !paid) ||
              (needsSpeech && !localSpeech)
            }
            onClick={() => void launch()}
          >
            Launch simulation
          </button>
        </fieldset>
      </details>
      {run && (
        <p className="small">
          {run.config.engine === "fixture"
            ? "Deterministic fixture replay"
            : run.config.mode === "voice"
              ? "Model-generated conversation + synthesized playback"
              : "Model-generated synthetic text"}
        </p>
      )}
      {mode === "voice" && !localSpeech && (
        <p className="small">
          Local speech is unavailable. The two original fixture demos still have
          recorded voices; new evaluation scenarios can run in text mode.
        </p>
      )}
      <p role="status" className="simulation-status">
        {status}
      </p>
      <div className="actions simulation-controls">
        {active && (
          <>
            <button onClick={() => void stop("pause")}>Pause simulation</button>
            <button onClick={() => void stop("stop")}>Stop simulation</button>
          </>
        )}
        {!active &&
          run &&
          !["completed", "stopped", "failed"].includes(run.status) && (
            <>
              <button onClick={() => void resume()}>Resume simulation</button>
              <button onClick={() => void stop("stop")}>
                Stop unfinished run
              </button>
            </>
          )}
        {run && (
          <button disabled={active} onClick={() => onReview(run.id)}>
            Review and rate this run
          </button>
        )}
        {run && turns.length > 0 && !active && (
          <button onClick={() => void replay()}>Replay saved turns</button>
        )}
        <button
          onClick={() => {
            const next = !mutedRef.current;
            mutedRef.current = next;
            setMuted(next);
            if (next) {
              silence();
              setBlocked(false);
            }
          }}
        >
          {muted ? "Unmute simulation" : "Mute simulation"}
        </button>
        {blocked && (
          <>
            <button
              onClick={() => {
                setBlocked(false);
                void audio.current?.play().catch(() => setBlocked(true));
              }}
            >
              Play this turn
            </button>
            <button
              onClick={() => {
                mutedRef.current = true;
                setMuted(true);
                silence();
              }}
            >
              Continue muted
            </button>
          </>
        )}
      </div>
      <ol className="simulation-turns" aria-label="Synthetic conversation">
        {turns.map((t, i) => (
          <li
            key={i}
            ref={
              speaking === i || (speaking === null && i === turns.length - 1)
                ? latestTurn
                : undefined
            }
            data-speaking={speaking === i}
          >
            <strong>
              {t.role === "user" ? "Synthetic user" : "Guide"}
              {speaking === i ? " · current turn" : ""}
            </strong>
            <p>{t.content}</p>
          </li>
        ))}
      </ol>
      <h3>Saved simulation runs</h3>
      <button disabled={active} onClick={() => void refresh()}>
        Refresh runs
      </button>
      <ul className="history-list">
        {runs.map((r) => (
          <li key={r.id}>
            <button disabled={active} onClick={() => void select(r)}>
              {r.config.scenario} · {r.config.mode} ·{" "}
              {r.config.engine === "fixture"
                ? "fixture replay"
                : "model-generated"}{" "}
              · {r.status} · {r.cursor}/4
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
