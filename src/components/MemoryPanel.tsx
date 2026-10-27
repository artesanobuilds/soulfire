"use client";
import { useEffect, useRef, useState } from "react";
import {
  blankMemory,
  type MemoryContent,
  type MemorySnapshot,
} from "../domain/memory";
import { AutoTextarea } from "./AutoTextarea";
export function MemoryPanel({
  onChanged,
}: {
  onChanged: (snapshot: MemorySnapshot) => void;
}) {
  const [snapshot, setSnapshot] = useState<MemorySnapshot | null>(null);
  const [content, setContent] = useState<MemoryContent>(blankMemory);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  async function load() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/memory", { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Memory is unavailable.");
      if (controller.signal.aborted) return;
      setSnapshot(data);
      setContent(data.memory?.content || blankMemory);
      onChanged(data);
    } catch (e) {
      if (!controller.signal.aborted)
        setStatus(
          e instanceof Error
            ? e.message
            : "Memory is unavailable. Your practice still works.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  useEffect(() => {
    void load();
    return () => request.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function change(remove = false) {
    if (!snapshot || locked.current) return;
    locked.current = true;
    setBusy(true);
    setStatus("");
    const controller = new AbortController();
    request.current = controller;
    try {
      const res = await fetch("/api/memory", {
        method: remove ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(
          remove
            ? { expectedRevision: snapshot.revision }
            : { consent: true, expectedRevision: snapshot.revision, content },
        ),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Memory could not be updated. Try again.",
        );
      if (controller.signal.aborted) return;
      setSnapshot(data);
      setContent(data.memory?.content || blankMemory);
      onChanged(data);
      setConfirmDelete(false);
      setStatus(
        remove
          ? "Memory deleted. Saved practices in this browser are separate and unchanged."
          : "Memory saved on this Mac. Only these words were saved.",
      );
    } catch (e) {
      if (!controller.signal.aborted)
        setStatus(
          e instanceof Error ? e.message : "Memory could not be updated.",
        );
    } finally {
      locked.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <div className="memory-panel">
      <span className="eyebrow">ONLY WHAT YOU CHOOSE</span>
      <h2>My memory</h2>
      <p>
        A few notes in your own words. Nothing is inferred or copied from your
        practice.
      </p>
      <p className="small">
        Stored on this Mac, unencrypted, outside the project. Anyone who can
        open this local app can view them. This is not an account or private
        journal.
      </p>
      {snapshot && (
        <>
          {(
            [
              ["goal", "A goal I want to remember"],
              ["challenge", "A challenge I choose to share"],
              ["preferences", "What helps me / what to avoid"],
            ] as const
          ).map(([key, label]) => (
            <label className="memory-field" key={key}>
              {label}
              <AutoTextarea
                aria-label={label}
                rows={2}
                maxLength={280}
                disabled={busy}
                value={content[key]}
                onChange={(e) =>
                  setContent((v) => ({ ...v, [key]: e.target.value }))
                }
              />
            </label>
          ))}
          <label className="save-choice">
            <input
              type="checkbox"
              checked={content.useWithAI}
              disabled={busy}
              onChange={(e) =>
                setContent((v) => ({ ...v, useWithAI: e.target.checked }))
              }
            />
            Allow these notes to be selected for AI requests
          </label>
          <p className="small">
            You still choose “Include my saved memory” beside each message.
            Notes are never added to dictation, live voice, or selected-answer
            reflection requests.
          </p>
          {snapshot.memory && (
            <p className="small">
              Confirmed by you · revision {snapshot.revision}. To pause use,
              uncheck the option above and save.
            </p>
          )}
          <div className="actions">
            <button
              className="primary"
              disabled={
                busy ||
                ![content.goal, content.challenge, content.preferences].some(
                  (s) => s.trim(),
                )
              }
              onClick={() => change()}
            >
              {busy
                ? "Working…"
                : snapshot.memory
                  ? "Save memory changes"
                  : "Remember these notes"}
            </button>
            {snapshot.memory && (
              <button disabled={busy} onClick={() => setConfirmDelete(true)}>
                Forget all memory
              </button>
            )}
          </div>
          {confirmDelete && (
            <div className="memory-delete">
              <p>
                Delete these notes from this Mac? This cannot recall context
                already sent to AI. Your current practice and browser-saved
                answers will stay.
              </p>
              <button disabled={busy} onClick={() => change(true)}>
                Delete memory now
              </button>
              <button disabled={busy} onClick={() => setConfirmDelete(false)}>
                Keep memory
              </button>
            </div>
          )}
        </>
      )}
      {status && <p role="status">{status}</p>}
      <button className="text-link" disabled={busy} onClick={load}>
        Reload saved memory
      </button>
    </div>
  );
}
