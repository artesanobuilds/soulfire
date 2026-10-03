"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Leaf,
  Waves,
  Cloud,
  Plus,
  X,
  Pause,
  Play,
  RotateCcw,
  Check,
  Download,
  Shield,
  Compass,
} from "lucide-react";
import { AutoTextarea } from "./AutoTextarea";
import { Mark } from "./Mark";
import { VoiceControls } from "./VoiceControls";
import { safetyNotice } from "../lib/safety";
import { samples, steps, topics } from "../lib/catalog";
import { replySchema, type Exercise, type Message } from "../lib/schema";

type View =
  | "home"
  | "suggestion"
  | "practice"
  | "meditation"
  | "review"
  | "finish"
  | "map";
type Card = { id: string; text: string; group: number };
type Drafts = Record<string, string>;
export function Soulfire() {
  const [mobile, setMobile] = useState(false);
  const [dictationTarget, setDictationTarget] = useState("conversation");
  const [view, setView] = useState<View>("home");
  const [draft, setDraft] = useState("");
  const [language, setLanguage] = useState<"open" | "spiritual" | "plain">(
    "open",
  );
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [example, setExample] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [fields, setFields] = useState<Drafts>({});
  const [cards, setCards] = useState<Record<string, Card[]>>({});
  const [action, setAction] = useState("");
  const [reflection, setReflection] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [quietToken, setQuietToken] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [dialog, setDialog] = useState<
    "pause" | "ground" | "privacy" | "support" | "new" | null
  >(null);
  const [seconds, setSeconds] = useState(60);
  const [duration, setDuration] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const pending = useRef<{
    messages: Message[];
    content: string;
    intent: string;
  } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const turn = useRef(0);
  const lock = useRef(false);
  const dialogReturn = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const deadline = useRef(0);
  useEffect(() => {
    const media = window.matchMedia("(max-width:760px)");
    const sync = () => {
      setMobile(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((r) => setConfigured(r.configured))
      .catch(() => setConfigured(false));
    return () => abort.current?.abort();
  }, []);
  useEffect(() => {
    if (dialog) {
      dialogReturn.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialogRef.current?.showModal();
      dialogRef.current
        ?.querySelector<HTMLButtonElement>(".dialog-close")
        ?.focus();
    } else {
      dialogRef.current?.close();
      if (dialogReturn.current?.isConnected)
        dialogReturn.current.focus({ preventScroll: true });
      dialogReturn.current = null;
    }
  }, [dialog]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);
  useEffect(() => {
    if (!running) return;
    deadline.current = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setSeconds(remaining);
      if (!remaining) {
        setRunning(false);
        setFinished(true);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  function quiet() {
    setQuietToken((v) => v + 1);
    setVoiceActive(false);
  }
  function cancel() {
    turn.current++;
    abort.current?.abort();
    if (pending.current) {
      setMessages(pending.current.messages);
      if (pending.current.intent !== "reflection")
        setDraft(pending.current.content);
      pending.current = null;
    }
    lock.current = false;
    setBusy(false);
  }
  function go(next: View) {
    quiet();
    cancel();
    setRunning(false);
    setView(next);
    setError("");
  }
  function openDialog(next: typeof dialog) {
    quiet();
    cancel();
    setRunning(false);
    setDialog(next);
  }
  function loadExercise(next: Exercise, isExample: boolean) {
    setExercise(next);
    setDictationTarget("conversation");
    setExample(isExample);
    setFields({});
    setSelected([]);
    setReflection("");
    setAction(next.actionSuggestion);
    setCards(
      Object.fromEntries(
        next.blocks
          .filter((b) => b.type === "sort")
          .map((b) => [
            b.id,
            b.items.map((text, i) => ({
              id: `${b.id}-${i}`,
              text,
              group: i % b.options.length,
            })),
          ]),
      ),
    );
  }
  function sample(id: string) {
    loadExercise(samples[id], true);
    setReply(
      "A sample of the kind of practice you can shape with soulfire. These are example words, not a live AI response.",
    );
    go("suggestion");
  }
  async function send(
    content: string,
    intent: "practice" | "conversation" | "reflection" = "conversation",
    step?: "1" | "3" | "10" | "11",
  ) {
    if (lock.current || !content.trim()) return;
    lock.current = true;
    setBusy(true);
    setError("");
    quiet();
    const current = ++turn.current;
    const controller = new AbortController();
    abort.current = controller;
    pending.current = { messages, content, intent };
    const submitted = [...messages, { role: "user" as const, content }].slice(
      -30,
    );
    setMessages(submitted);
    if (intent !== "reflection") setDraft("");
    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: submitted, language, intent, step }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "The companion could not respond. Try again.",
        );
      const parsed = replySchema.safeParse(data.reply);
      if (!parsed.success)
        throw new Error(
          "The response could not be read safely. Try again or choose an example.",
        );
      if (current !== turn.current) return;
      pending.current = null;
      setMessages([
        ...submitted,
        { role: "assistant", content: parsed.data.message },
      ]);
      setReply(parsed.data.message);
      if (parsed.data.exercise) {
        loadExercise(parsed.data.exercise, false);
        setView("suggestion");
      } else if (intent === "reflection") {
        setView("finish");
      } else if (parsed.data.kind === "support") {
        setDialog("support");
      }
    } catch (e) {
      if (current === turn.current) {
        setError(
          e instanceof Error
            ? e.message
            : "Connection failed. Your draft is still available.",
        );
        if (intent !== "reflection") setDraft(content);
        setMessages(messages);
      }
    } finally {
      if (current === turn.current) {
        pending.current = null;
        lock.current = false;
        setBusy(false);
      }
    }
  }
  const sharingItems = exercise
    ? [
        ...exercise.blocks.map((b) => ({
          id: b.id,
          label: b.title,
          value:
            b.type === "sort"
              ? (cards[b.id] || [])
                  .map((c) => `${b.options[c.group]}: ${c.text}`)
                  .join("\n")
              : fields[b.id] || "",
        })),
        { id: "reflection", label: "What I noticed", value: reflection },
        { id: "action", label: "My next action", value: action },
      ]
    : [];
  function share() {
    const chosen = sharingItems.filter(
      (i) => selected.includes(i.id) && i.value.trim(),
    );
    if (chosen.length)
      send(
        `Please reflect briefly on only these answers I chose to share for ${exercise?.title}:\n${chosen.map((i) => `${i.label}: ${i.value}`).join("\n")}`,
        "reflection",
      );
  }
  function download() {
    const text = `soulfire · my practice\n${exercise?.title}\n\nWhat I noticed\n${reflection || "Not recorded"}\n\nMy chosen action\n${action || "No action chosen"}\n\nPersonal notes, not a measure of progress.\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = "soulfire-my-practice.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function reset() {
    cancel();
    quiet();
    setDraft("");
    setMessages([]);
    setExercise(null);
    setFields({});
    setCards({});
    setReflection("");
    setAction("");
    setReply("");
    setSelected([]);
    setDialog(null);
    setView("home");
  }
  const composer = (hero = false, id = "message") => (
    <div className={`composer ${hero ? "hero-composer" : ""}`}>
      <label htmlFor={hero ? "opening" : id}>
        {hero ? "What’s weighing on you today?" : "Talk this through"}
      </label>
      <AutoTextarea
        id={hero ? "opening" : id}
        maxLength={3000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={
          hero
            ? "Begin wherever you are…"
            : "Ask a question, or tell me what feels different…"
        }
        rows={hero ? 3 : 2}
      />
      {!hero && exercise && (
        <label className="dictation-target">
          Dictation goes to
          <select
            aria-label="Dictation destination"
            value={dictationTarget}
            onChange={(e) => setDictationTarget(e.target.value)}
          >
            <option value="conversation">Conversation draft</option>
            {exercise.blocks
              .filter((b) => b.type === "reflect")
              .map((b) => (
                <option value={b.id} key={b.id}>
                  {b.title}
                </option>
              ))}
            <option value="action">My next action</option>
          </select>
        </label>
      )}
      <VoiceControls
        messages={messages}
        language={language}
        onDraft={(text) => {
          if (!hero && dictationTarget === "action")
            setAction((v) => (v ? `${v}\n${text}` : text));
          else if (!hero && dictationTarget !== "conversation")
            setFields((v) => ({
              ...v,
              [dictationTarget]: v[dictationTarget]
                ? `${v[dictationTarget]}\n${text}`
                : text,
            }));
          else setDraft((v) => (v ? `${v}\n${text}` : text));
        }}
        onMessage={(m) => {
          const notice = m.role === "user" ? safetyNotice(m.content) : null;
          if (notice) {
            setMessages(
              (v) =>
                [...v, m, { role: "assistant", content: notice }].slice(
                  -30,
                ) as Message[],
            );
            setReply(notice);
            openDialog("support");
          } else setMessages((v) => [...v, m].slice(-30));
        }}
        onError={setError}
        quietToken={quietToken}
        disabled={busy}
        practiceTitle={exercise?.title}
        onActive={setVoiceActive}
      />
      <div className="composer-status" role="status">
        <span className={`status-dot ${configured ? "ready" : ""}`} />
        {configured === null
          ? "Checking AI connection…"
          : configured
            ? "AI configured · text, dictation & live voice"
            : "AI not connected · text & voice need server setup. Explore an example below or in the practice map."}
      </div>
      <div className="composer-bottom">
        <small>Sent messages are processed by OpenAI.</small>
        {busy ? (
          <button onClick={cancel}>
            <SquareIcon /> Stop
          </button>
        ) : (
          <button
            className="primary"
            disabled={!draft.trim() || voiceActive}
            onClick={() => send(draft, hero ? "practice" : "conversation")}
          >
            {hero ? "Find a practice" : "Send"} <ArrowRight size={17} />
          </button>
        )}
      </div>
    </div>
  );
  const transcript = (
    <>
      {messages.length > 0 && (
        <details className="transcript">
          <summary>Our conversation · {messages.length} messages</summary>
          <div aria-live="polite">
            {messages.map((m, i) => (
              <p key={i}>
                <strong>{m.role === "user" ? "You" : "soulfire"}</strong>
                {m.content}
              </p>
            ))}
          </div>
        </details>
      )}
    </>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header>
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="soulfire home"
        >
          <Mark />
          soulfire
        </button>
        <nav aria-label="Main navigation">
          <button
            className={view === "map" ? "nav-active" : ""}
            onClick={() => go("map")}
          >
            The practice
          </button>
          {exercise && (
            <button onClick={() => go("practice")}>My practice</button>
          )}
          <button
            className="nav-info"
            aria-label="Privacy and support"
            onClick={() => openDialog("privacy")}
          >
            <Shield size={19} />
          </button>
        </nav>
      </header>
      <main id="main">
        {error && (
          <div className="notice error" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}
        {busy && (
          <div className="notice" role="status">
            Making room for what you shared…{" "}
            <button onClick={cancel}>Stop response</button>
          </div>
        )}
        {view === "home" && (
          <>
            <section className="home-grid">
              <div className="invitation">
                <span className="eyebrow">A LITTLE ROOM TO BEGIN</span>
                <h1 ref={heading} tabIndex={-1}>
                  Meet what’s here.
                  <br />
                  <em>Find your next step.</em>
                </h1>
                <p className="lede">
                  A spiritual practice companion for the things you’re carrying.
                  Reflection, quiet, and small actions — shaped around you.
                </p>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit one" />
                  <div className="orbit two" />
                  <Mark large />
                  <span>A practice you can return to.</span>
                </div>
                <p className="soft-note">
                  No perfect words. No particular belief required.
                </p>
              </div>
              <div className="entry">
                {composer(true)}
                <label className="language-label">
                  Language that feels right
                  <select
                    value={language}
                    onChange={(e) =>
                      setLanguage(e.target.value as typeof language)
                    }
                  >
                    <option value="open">
                      I’m open / still finding my words
                    </option>
                    <option value="spiritual">
                      Spiritual / higher-power language
                    </option>
                    <option value="plain">
                      Plain language, without spiritual terms
                    </option>
                  </select>
                </label>
                <div className="starting">
                  <span className="eyebrow">
                    OR START WITH SOMETHING FAMILIAR
                  </span>
                  {topics.map((t, i) => (
                    <button key={t.id} onClick={() => setDraft(t.text)}>
                      <span className="topic-number">0{i + 1}</span>
                      {t.label}
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <section className="below">
              <div>
                <span className="eyebrow">FROM CONVERSATION TO PRACTICE</span>
                <h2>Something you can work with.</h2>
                <p>
                  Make space for what’s happening. Explore one principle. Leave
                  with one thing that feels possible.
                </p>
              </div>
              <button className="preview-card" onClick={() => sample("worry")}>
                <span className="eyebrow">EXPLORE AN EXAMPLE · STEP 1</span>
                <h3>
                  Prepare what’s yours.
                  <br />
                  Release the rest.
                </h3>
                <div className="mini-columns">
                  <span>
                    <Leaf />
                    Prepare
                  </span>
                  <span>
                    <Waves />
                    Influence
                  </span>
                  <span>
                    <Cloud />
                    Release
                  </span>
                </div>
                <span className="text-link">
                  Try the example <ArrowRight size={16} />
                </span>
              </button>
            </section>
            <div className="service-state" role="status">
              <span className={`status-dot ${configured ? "ready" : ""}`} />
              {configured === null
                ? "Checking companion connection…"
                : configured
                  ? "AI service configured · responses may take a moment"
                  : "AI is not connected in this local preview. Examples are available; live responses need server setup."}
            </div>
            {messages.length > 0 && !voiceActive && (
              <div className="conversation-practice">
                <button
                  disabled={busy}
                  onClick={() =>
                    send(
                      "Please shape a practice from what I have shared.",
                      "practice",
                    )
                  }
                >
                  Shape a practice from our conversation{" "}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            {transcript}
            {reply && !exercise && <div className="message-card">{reply}</div>}
          </>
        )}
        {view === "suggestion" && exercise && (
          <section className="suggestion page-narrow">
            <button className="back" onClick={() => go("home")}>
              <ArrowLeft size={16} /> Back to conversation
            </button>
            <span className="eyebrow">
              {example ? "EXAMPLE PRACTICE" : "A PRACTICE FOR THIS MOMENT"} ·
              STEP {exercise.step}
            </span>
            <h1 ref={heading} tabIndex={-1}>
              {exercise.title}
            </h1>
            <p className="lede">{exercise.purpose}</p>
            <div className="principle-card">
              <Leaf size={30} />
              <div>
                <span className="eyebrow">A PRINCIPLE TO EXPLORE</span>
                <h2>{exercise.principle}</h2>
                <p>{exercise.blocks[0]?.prompt}</p>
              </div>
            </div>
            <p className="small">
              {example
                ? "This is a labeled example for exploring the experience. It was not generated from your message."
                : "This is an AI suggestion, not a verdict. You can change it, decline it, or use your own words."}
            </p>
            <div className="actions">
              <button className="primary" onClick={() => go("practice")}>
                Try this practice <ArrowRight size={17} />
              </button>
              <button onClick={() => go("map")}>
                Choose a different practice
              </button>
            </div>
            <button className="text-link" onClick={() => go("home")}>
              Not now — return to conversation
            </button>
          </section>
        )}
        {view === "practice" && exercise && (
          <div className="practice-layout">
            <aside>
              <button className="back" onClick={() => go("home")}>
                <ArrowLeft size={16} /> Back to conversation
              </button>
              <span className="eyebrow">
                STEP {exercise.step} · {exercise.principle.toUpperCase()}
              </span>
              <h2>
                A moment
                <br />
                for your practice.
              </h2>
              <p>{exercise.purpose}</p>
              <div className="landscape" aria-hidden="true">
                <Waves size={120} />
              </div>
              <button className="text-link" onClick={() => go("map")}>
                <Leaf size={17} /> Try a different practice
              </button>
              {!mobile && (
                <div className="side-composer">
                  {composer()}
                  {transcript}
                </div>
              )}
            </aside>
            <section className="practice-main">
              <div className="section-top">
                <span className="eyebrow">
                  {example
                    ? "EXAMPLE · EDITABLE PRACTICE"
                    : "YOUR PERSONALIZED PRACTICE"}
                </span>
                <span className="small">At your pace</span>
              </div>
              <h1 ref={heading} tabIndex={-1}>
                {exercise.title}
              </h1>
              <p className="intro">
                Suggestions are yours to change. Leave anything blank.
              </p>
              {exercise.blocks.map((block) => (
                <section
                  className={`exercise-block ${block.type}`}
                  key={block.id}
                >
                  <h2>{block.title}</h2>
                  <p>{block.prompt}</p>
                  {block.type === "sort" ? (
                    <div className="sort-grid">
                      {block.options.map((group, g) => (
                        <div className="sort-column" key={group}>
                          <div className="group-icon">
                            {g === 0 ? (
                              <Leaf />
                            ) : g === 1 ? (
                              <Waves />
                            ) : (
                              <Cloud />
                            )}
                          </div>
                          <h3>{group}</h3>
                          {(cards[block.id] || [])
                            .filter((c) => c.group === g)
                            .map((card) => (
                              <div className="thought" key={card.id}>
                                <input
                                  aria-label="Thought"
                                  maxLength={180}
                                  value={card.text}
                                  onChange={(e) =>
                                    setCards((v) => ({
                                      ...v,
                                      [block.id]: v[block.id].map((c) =>
                                        c.id === card.id
                                          ? { ...c, text: e.target.value }
                                          : c,
                                      ),
                                    }))
                                  }
                                />
                                <div className="thought-tools">
                                  <select
                                    aria-label={`Move ${card.text || "thought"}`}
                                    value={card.group}
                                    onChange={(e) =>
                                      setCards((v) => ({
                                        ...v,
                                        [block.id]: v[block.id].map((c) =>
                                          c.id === card.id
                                            ? {
                                                ...c,
                                                group: Number(e.target.value),
                                              }
                                            : c,
                                        ),
                                      }))
                                    }
                                  >
                                    {block.options.map((o, i) => (
                                      <option key={o} value={i}>
                                        {o}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    aria-label={`Remove ${card.text || "thought"}`}
                                    onClick={() =>
                                      setCards((v) => ({
                                        ...v,
                                        [block.id]: v[block.id].filter(
                                          (c) => c.id !== card.id,
                                        ),
                                      }))
                                    }
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          <button
                            className="add-thought"
                            disabled={(cards[block.id] || []).length >= 12}
                            onClick={() =>
                              setCards((v) => ({
                                ...v,
                                [block.id]: [
                                  ...(v[block.id] || []),
                                  {
                                    id: crypto.randomUUID(),
                                    text: "",
                                    group: g,
                                  },
                                ],
                              }))
                            }
                          >
                            <Plus size={16} /> Add a thought
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : block.type === "choose" ? (
                    <div
                      className="choices"
                      role="group"
                      aria-label={block.title}
                    >
                      {block.options.map((o) => (
                        <button
                          className={fields[block.id] === o ? "chosen" : ""}
                          aria-pressed={fields[block.id] === o}
                          key={o}
                          onClick={() =>
                            setFields((v) => ({
                              ...v,
                              [block.id]: v[block.id] === o ? "" : o,
                            }))
                          }
                        >
                          {fields[block.id] === o ? (
                            <Check size={18} />
                          ) : (
                            <span className="choice-circle" />
                          )}
                          {o}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <AutoTextarea
                      aria-label={block.title}
                      maxLength={1500}
                      rows={3}
                      placeholder="A few words, if you like…"
                      value={fields[block.id] || ""}
                      onChange={(e) =>
                        setFields((v) => ({ ...v, [block.id]: e.target.value }))
                      }
                    />
                  )}
                </section>
              ))}
              <section className="action-card">
                <Leaf />
                <div>
                  <h2>{exercise.actionPrompt}</h2>
                  <p>Choose your own words. Small is enough.</p>
                  <AutoTextarea
                    aria-label="My next action"
                    maxLength={600}
                    value={action}
                    rows={2}
                    onChange={(e) => setAction(e.target.value)}
                  />
                </div>
              </section>
              <div className="practice-bottom">
                <small>
                  Draft answers stay here until you choose to share.
                </small>
                <div className="actions">
                  <button onClick={() => openDialog("pause")}>
                    Pause practice
                  </button>
                  <button className="primary" onClick={() => go("meditation")}>
                    Continue <ArrowRight size={17} />
                  </button>
                </div>
              </div>
              <button
                className="text-link"
                onClick={() => openDialog("ground")}
              >
                Grounding, if you need it
              </button>
              {mobile && (
                <div className="mobile-composer">
                  {composer(false, "mobile-message")}
                  {transcript}
                </div>
              )}
            </section>
          </div>
        )}
        {view === "meditation" && (
          <section className="quiet-page page-narrow">
            <button className="back" onClick={() => go("practice")}>
              <ArrowLeft size={16} /> Back to practice
            </button>
            <span className="eyebrow">STEP 11 · A LITTLE QUIET</span>
            <h1 ref={heading} tabIndex={-1}>
              Nothing to get right.
            </h1>
            <p className="lede">
              Let your attention rest on the room around you, or on an easy
              breath. Eyes open is welcome. Stop whenever you like.
            </p>
            <div className={`timer-orbit ${running ? "running" : ""}`}>
              <Mark />
              <span
                className="timer"
                aria-label={`${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds`}
              >
                {Math.floor(seconds / 60)}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
              <span>
                {finished
                  ? "This moment is yours."
                  : running
                    ? "Simply be here."
                    : "At your own pace."}
              </span>
            </div>
            <div
              className="duration"
              role="group"
              aria-label="Meditation duration"
            >
              {[60, 120, 300].map((n) => (
                <button
                  className={duration === n ? "chosen" : ""}
                  key={n}
                  onClick={() => {
                    setDuration(n);
                    setSeconds(n);
                    setRunning(false);
                    setFinished(false);
                  }}
                >
                  {n / 60} min
                </button>
              ))}
            </div>
            <div className="actions centered">
              <button
                aria-label="Reset timer"
                onClick={() => {
                  setSeconds(duration);
                  setRunning(false);
                  setFinished(false);
                }}
              >
                <RotateCcw size={18} />
              </button>
              <button
                className="primary"
                onClick={() => {
                  if (seconds === 0) {
                    setSeconds(duration);
                    setFinished(false);
                  }
                  setRunning(!running);
                }}
              >
                {running ? <Pause size={17} /> : <Play size={17} />}{" "}
                {running ? "Pause" : finished ? "Begin again" : "Begin quiet"}
              </button>
              <button onClick={() => go("review")}>Finish & reflect</button>
            </div>
            <p className="small mic-off">
              Microphone off · companion audio off
            </p>
            <button
              className="text-link"
              onClick={() => {
                setRunning(false);
                openDialog("ground");
              }}
            >
              This doesn’t feel helpful — stop & ground
            </button>
            <button className="text-link" onClick={() => go("review")}>
              Skip quiet and reflect <ArrowRight size={15} />
            </button>
            <span className="sr-only" role="status">
              {finished
                ? "Timer finished. You can reflect or begin again."
                : ""}
            </span>
          </section>
        )}
        {view === "review" && exercise && (
          <section className="page-narrow review-page">
            <span className="eyebrow">REFLECTION · YOUR CHOICE</span>
            <h1 ref={heading} tabIndex={-1}>
              What are you taking with you?
            </h1>
            <p className="lede">
              A shift, a question, or nothing yet. There is no score for this.
            </p>
            <label className="field-label">
              What did you notice?
              <AutoTextarea
                maxLength={1500}
                rows={4}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="You can keep this just for yourself…"
              />
            </label>
            <div className="sharing-card">
              <Shield size={25} />
              <h2>Choose what to share.</h2>
              <p>
                Only checked answers will be sent to the AI companion for
                reflection, alongside your submitted conversation. Everything
                else stays in this tab.
              </p>
              {sharingItems.map((i) => (
                <label className="sharing-item" key={i.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(i.id)}
                    disabled={!i.value.trim()}
                    onChange={(e) =>
                      setSelected((v) =>
                        e.target.checked
                          ? [...v, i.id]
                          : v.filter((x) => x !== i.id),
                      )
                    }
                  />
                  <span>
                    <strong>{i.label}</strong>
                    <small>{i.value || "No answer — nothing to share"}</small>
                  </span>
                </label>
              ))}
            </div>
            <div className="actions">
              <button
                className="primary"
                disabled={busy || !selected.length}
                onClick={share}
              >
                Share selected & reflect <ArrowRight size={17} />
              </button>
              <button
                onClick={() => {
                  setReply("");
                  go("finish");
                }}
              >
                Keep private & continue
              </button>
            </div>
            <button className="text-link" onClick={() => go("practice")}>
              Back to my practice
            </button>
          </section>
        )}
        {view === "finish" && exercise && (
          <section className="page-narrow finish-page">
            <Mark large />
            <span className="eyebrow">A SMALL STEP INTO YOUR DAY</span>
            <h1 ref={heading} tabIndex={-1}>
              Let this be enough
              <br />
              <em>for now.</em>
            </h1>
            {reply && (
              <div className="message-card">
                <span className="eyebrow">COMPANION REFLECTION</span>
                <p>{reply}</p>
              </div>
            )}
            <div className="next-action">
              <Leaf size={29} />
              <label className="field-label">
                My next small action
                <AutoTextarea
                  aria-label="My chosen action"
                  value={action}
                  maxLength={600}
                  rows={3}
                  onChange={(e) => setAction(e.target.value)}
                />
              </label>
            </div>
            <p>
              Consider who in your life could support you in this. You don’t
              have to carry it alone.
            </p>
            <div className="actions centered">
              <button className="primary" onClick={download}>
                <Download size={17} /> Download my note
              </button>
              <button onClick={() => go("map")}>
                Return to the practice map
              </button>
            </div>
            <p className="small">
              Nothing is saved by soulfire. Downloading creates a plain-text
              file on this device. Closing or reloading this tab clears your
              drafts.
            </p>
            <button className="text-link" onClick={() => openDialog("new")}>
              Start fresh & clear this session
            </button>
          </section>
        )}
        {view === "map" && (
          <section className="map-page">
            <div className="map-heading">
              <div>
                <span className="eyebrow">
                  TWELVE STEPS · MANY WAYS TO RETURN
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  A practice, not a ladder.
                </h1>
                <p className="lede">
                  Begin where life meets you. These principles are places to
                  return to, not levels to complete.
                </p>
              </div>
              <Compass size={64} strokeWidth={1} />
            </div>
            <div className="map-grid">
              {steps.map(([id, title, principles]) => {
                const available = ["1", "3", "10", "11"].includes(id);
                return (
                  <article
                    className={available ? "step-card available" : "step-card"}
                    key={id}
                  >
                    <span className="step-number">{id.padStart(2, "0")}</span>
                    <div>
                      <h2>{title}</h2>
                      <p>{principles}</p>
                      <span className="small">
                        {available
                          ? "Explore a practice"
                          : "Full exercise in a later phase"}
                      </span>
                    </div>
                    {available && (
                      <button
                        aria-label={`Explore step ${id}`}
                        onClick={() =>
                          sample(
                            id === "1"
                              ? "worry"
                              : id === "3"
                                ? "pattern"
                                : id === "10"
                                  ? "conflict"
                                  : "quiet",
                          )
                        }
                      >
                        <ArrowRight size={19} />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
            <section className="journey-examples">
              <h2>Different moments. Different practices.</h2>
              <p>
                Explore the four example journeys. Live personalization begins
                with your own words on the invitation screen.
              </p>
              <div className="actions">
                {topics.map((t) => (
                  <button key={t.id} onClick={() => sample(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </section>
            <p className="small">
              Working interpretations of the creator’s twelve-step program. No
              progress scores. Detailed inventory, sharing with a person, and
              amends exercises need further review.
            </p>
          </section>
        )}
      </main>
      <footer>
        <span>
          <Mark /> A little room to return.
        </span>
        <div>
          <button onClick={() => openDialog("privacy")}>Privacy & about</button>
          <button onClick={() => openDialog("support")}>Human support</button>
        </div>
        <small>Proof of Concept One · Adult self-help preview</small>
      </footer>
      <dialog
        ref={dialogRef}
        aria-label="Practice information and controls"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const nodes = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
            ),
          ].filter((el) => el.getClientRects().length);
          const first = nodes[0],
            last = nodes.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onCancel={() => setDialog(null)}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.target === e.currentTarget &&
            (e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom)
          )
            setDialog(null);
        }}
      >
        <button
          className="dialog-close"
          aria-label="Close dialog"
          onClick={() => setDialog(null)}
        >
          <X />
        </button>
        {dialog === "pause" ? (
          <>
            <span className="eyebrow">YOU SET THE PACE</span>
            <h2>A pause is part of the practice.</h2>
            <p>
              Your drafts are still here in this tab. Microphone, playback and
              the timer have stopped.
            </p>
            <button className="primary" onClick={() => setDialog(null)}>
              Return when ready
            </button>
          </>
        ) : dialog === "ground" ? (
          <>
            <span className="eyebrow">COME BACK TO THE ROOM</span>
            <h2>Let the practice wait.</h2>
            <p>
              If it feels useful, notice the support beneath you. Look around
              and name three ordinary things you can see. There is no need to
              focus inward.
            </p>
            <p>
              You can stop completely, get some water, or reach out to someone
              you trust.
            </p>
            <div className="actions">
              <button className="primary" onClick={() => setDialog(null)}>
                Stay here a moment
              </button>
              <button
                onClick={() => {
                  setDialog(null);
                  go("review");
                }}
              >
                Leave quiet & reflect
              </button>
            </div>
          </>
        ) : dialog === "support" ? (
          <>
            <span className="eyebrow">SUPPORT BEYOND THIS SCREEN</span>
            <h2>You deserve human support.</h2>
            {reply.startsWith("Safety notice:") && (
              <div className="message-card">{reply}</div>
            )}
            <p>
              soulfire is an AI self-help companion, not a therapist, emergency
              service, or human recovery sponsor.
            </p>
            <p>
              If you may act on thoughts of harming yourself or someone else, or
              are in immediate danger, contact local emergency services now or
              ask a trusted person to stay with you. For a local crisis line,
              visit{" "}
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noreferrer"
              >
                Find A Helpline
              </a>
              .
            </p>
            <p>
              Substance withdrawal can need urgent medical care. Do not rely on
              an exercise or try to manage dangerous withdrawal alone. For
              ongoing distress, a qualified professional, recovery peer, or
              trusted person can help.
            </p>
            <button className="primary" onClick={() => setDialog(null)}>
              Return to my space
            </button>
          </>
        ) : dialog === "new" ? (
          <>
            <h2>Begin with a clear page?</h2>
            <p>
              This clears conversation and private drafts from this tab.
              Download a note first if you want to keep one.
            </p>
            <div className="actions">
              <button className="primary" onClick={reset}>
                Clear & begin again
              </button>
              <button onClick={() => setDialog(null)}>Keep this session</button>
            </div>
          </>
        ) : (
          <>
            <span className="eyebrow">YOUR WORDS, YOUR CHOICE</span>
            <h2>A space with clear boundaries.</h2>
            <p>
              Typed practice answers stay in this tab until you explicitly share
              selected answers. Submitted messages and selected reflections go
              through our server to OpenAI.
            </p>
            <p>
              Dictation sends recorded audio for transcription before you submit
              the editable text. Live voice sends microphone audio while
              connected, plus your submitted conversation. It does not send
              private exercise fields.
            </p>
            <p>
              No accounts, analytics, database or automatic saving in this
              prototype. Drafts disappear on reload. OpenAI’s processing and
              retention are separate; this is not a promise of zero provider
              retention.
            </p>
            <p>
              This is a self-help exploration, not clinical care or a claim of
              spiritual authority. You can change, skip, or stop any practice.
            </p>
            <button className="primary" onClick={() => setDialog(null)}>
              Back to the practice
            </button>
          </>
        )}
      </dialog>
    </div>
  );
}
function SquareIcon() {
  return <span aria-hidden="true">■</span>;
}
