"use client";
import { useState, useRef, useEffect } from "react";
import type { Message } from "@/src/lib/schema";
import {
  nextReasonedInput,
  acceptedReasonedHistory,
  maxReasonedMessages,
} from "@/src/lib/reasoned-voice-conversation";
type Result = {
  reply: { message: string };
  audio: { mime: string; base64: string } | null;
  audioError: string | null;
};
export default function ReasonedVoiceExperiment({
  active = true,
}: {
  active?: boolean;
}) {
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<Result | null>(null),
    [previousDraft, setPreviousDraft] = useState(""),
    [history, setHistory] = useState<Message[]>([]);
  const [language, setLanguage] = useState<"plain" | "spiritual" | "open">(
    "plain",
  );
  const busyRef = useRef(false),
    audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!active) audioRef.current?.pause();
  }, [active]);
  async function transcribe(file: File) {
    if (busyRef.current) return;
    busyRef.current = true;
    audioRef.current?.pause();
    setPreviousDraft(text);
    setText("");
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.set("audio", file);
      const r = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Transcription failed.");
      setText(data.text);
      setPreviousDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function ask() {
    if (busyRef.current) return;
    let messages: Message[];
    try {
      messages = nextReasonedInput(history, text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review your question.");
      return;
    }
    busyRef.current = true;
    audioRef.current?.pause();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch("/api/experimental/reasoned-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, language }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Reply failed.");
      setResult(data);
      setHistory(acceptedReasonedHistory(messages, data.reply.message));
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reply failed.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="reasoned-voice-studio"
      style={{ maxWidth: 760, margin: "2rem auto", padding: 24 }}
    >
      <p className="eyebrow">EXPERIMENTAL · TEXT REASONING + EXACT SPEECH</p>
      <p>
        This is a separate test conversation, not a continuation of the main
        companion. Native Live voice is the existing low-latency option; this
        option waits for a text answer before local speech. Neither option is
        claimed to match text quality in all situations.
      </p>
      <h1>A reply you can read and hear</h1>
      <p>
        Write your question, or upload a recording for transcription. Review the
        words before asking. The audio reads the same reply shown below.
      </p>
      <p>
        Submitting a question or recording uses the configured paid API. This
        build does not raise or enforce a new spending allowance. No request
        runs until you submit.
      </p>
      <p>
        Follow-up questions use this conversation while the page is open.
        Starting over clears it from this page.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          audioRef.current?.pause();
          setHistory([]);
          setResult(null);
          setText("");
          setPreviousDraft("");
          setError("");
        }}
      >
        Start new conversation
      </button>
      {history.length > 0 && (
        <details>
          <summary>Conversation so far</summary>
          {history.map((m, i) => (
            <p key={i}>
              <strong>{m.role === "user" ? "You" : "Guide"}: </strong>
              {m.content}
            </p>
          ))}
        </details>
      )}
      <label>
        Transcribe a recording
        <input
          aria-label="Transcribe a recording"
          type="file"
          accept="audio/wav,audio/webm,audio/mp4,audio/ogg"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void transcribe(file);
          }}
        />
      </label>
      <p>
        Recordings are sent to the configured transcription service. Speech
        playback is generated locally.
      </p>
      <label>
        Language{" "}
        <select
          aria-label="Voice test language"
          value={language}
          disabled={busy}
          onChange={(e) => setLanguage(e.target.value as typeof language)}
        >
          <option value="plain">Everyday language</option>
          <option value="spiritual">Spiritual language</option>
          <option value="open">Open to either</option>
        </select>
      </label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <label htmlFor="question">Your question</label>
        <textarea
          id="question"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={3000}
          rows={6}
          style={{ display: "block", width: "100%", margin: "1rem 0" }}
          disabled={busy}
        />
        <button
          disabled={
            busy || !text.trim() || history.length + 1 > maxReasonedMessages
          }
        >
          {busy ? "Working…" : "Ask and prepare speech"}
        </button>
      </form>
      {error && (
        <div>
          <p role="alert">
            {error} Review or type your question before asking.
          </p>
          {previousDraft && (
            <button
              type="button"
              onClick={() => {
                setText(previousDraft);
                setPreviousDraft("");
                setError("");
              }}
            >
              Restore previous draft
            </button>
          )}
        </div>
      )}
      {result && (
        <section aria-label="Your reply">
          <h2>Your reply</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{result.reply.message}</p>
          {result.audio && (
            <audio
              ref={audioRef}
              aria-label="Play the exact reply"
              controls
              src={`data:${result.audio.mime};base64,${result.audio.base64}`}
            />
          )}
          {result.audioError && <p role="status">{result.audioError}</p>}
        </section>
      )}
    </section>
  );
}
