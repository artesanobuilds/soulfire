"use client";
import { useEffect, useState } from "react";
import type {
  Feedback,
  HistoryDetail,
  HistoryEvent,
  HistorySession,
} from "../domain/history";
function FeedbackEditor({
  event,
  save,
}: {
  event: HistoryEvent;
  save: (value: Feedback) => Promise<void>;
}) {
  const [rating, setRating] = useState<Feedback["rating"]>(
      event.feedback?.rating || "unrated",
    ),
    [note, setNote] = useState(event.feedback?.note || ""),
    [busy, setBusy] = useState(false);
  return (
    <fieldset className="history-feedback">
      <legend>Was this useful?</legend>
      <label>
        Assessment
        <select
          aria-label={`Assessment for response ${event.sequence}`}
          value={rating}
          onChange={(e) => setRating(e.target.value as Feedback["rating"])}
        >
          <option value="unrated">Not rated</option>
          <option value="spot-on">Spot on</option>
          <option value="not-quite">Not quite</option>
        </select>
      </label>
      <label>
        Optional note
        <textarea
          aria-label={`Feedback note for response ${event.sequence}`}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await save({ rating, note });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : "Save feedback"}
      </button>
    </fieldset>
  );
}
export function HistoryPanel({
  capture,
  onDeleted,
  initialId,
}: {
  capture: {
    sessionId: string | null;
    working: boolean;
    status: string;
    start: () => Promise<void>;
    pause: () => Promise<void>;
  };
  onDeleted: (id: string) => void;
  initialId?: string | null;
}) {
  const [sessions, setSessions] = useState<HistorySession[]>([]),
    [detail, setDetail] = useState<HistoryDetail | null>(null),
    [consent, setConsent] = useState(false),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  async function call(path: string, method = "GET", body?: unknown) {
    const r = await fetch(path, {
      method,
      cache: "no-store",
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error || "History is unavailable.");
    return data;
  }
  async function list() {
    try {
      const data = await call("/api/history");
      setSessions(data.sessions);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "History is unavailable.");
    }
  }
  async function open(id: string) {
    setConfirm(false);
    try {
      setDetail(await call(`/api/history?id=${encodeURIComponent(id)}`));
      setStatus("");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Unable to read history.");
    }
  }
  useEffect(() => {
    void list();
    if (initialId) void open(initialId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function operation(run: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try {
      await run();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "History operation failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="history-panel">
      <span className="eyebrow">ONLY WITH YOUR PERMISSION</span>
      <h2>Conversation history</h2>
      <p>
        Review saved text and voice transcripts and mark what felt useful.
        Feedback is your assessment, not a measure of clinical benefit.
      </p>
      <p className="history-state" role="status">
        {capture.status}
      </p>
      {capture.sessionId ? (
        <button
          disabled={capture.working}
          onClick={() => void capture.pause().then(list)}
        >
          Stop saving new turns
        </button>
      ) : (
        <>
          <label className="save-choice">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Save future submitted text and final voice transcripts on this Mac.
          </label>
          <button
            className="primary"
            disabled={!consent || capture.working}
            onClick={() => void capture.start().then(list)}
          >
            Start saving future turns
          </button>
        </>
      )}
      <details>
        <summary>Storage, privacy and retention</summary>
        <p>
          History is separate from memory and external analysis. It starts off
          each visit. No past conversation is copied, and no private exercise
          fields, unsubmitted dictation or raw audio are retained. Selected
          reflection sharing is excluded.
        </p>
        <p>
          Stored unencrypted outside the project for up to 30 days from
          creation, removed when history is next accessed. Up to 100
          conversations and 200 events each. Access is tied to this browser’s
          local cookie; clearing it loses access here. This is not an
          authenticated account. Downloaded exports and system backups are not
          deleted by these controls. No external analytics export is enabled.
        </p>
        <p>
          Voice text is a final provider transcript, not a verified verbatim
          recording. Playback evidence is unavailable: generated words may not
          all have been heard.
        </p>
      </details>
      <div className="actions">
        <button disabled={busy} onClick={() => void list()}>
          Refresh history
        </button>
        <label className="history-import">
          Import a synthetic run
          <input
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void operation(async () => {
                if (file.size > 500000)
                  throw Error("Synthetic run exceeds 500 KB.");
                const run = JSON.parse(await file.text());
                await call("/api/history", "POST", {
                  consent: true,
                  synthetic: run,
                });
                await list();
                setStatus("Synthetic run imported and labeled.");
              });
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <ul className="history-list">
        {sessions.map((s) => (
          <li key={s.id}>
            <button onClick={() => void open(s.id)}>
              {s.synthetic ? "Synthetic run" : "Conversation"} ·{" "}
              {new Date(s.createdAt).toLocaleString()} · {s.eventCount} events ·{" "}
              {s.state}
            </button>
          </li>
        ))}
      </ul>
      {!sessions.length && <p>No saved conversations in this browser yet.</p>}
      {detail && (
        <section className="history-detail">
          <h3>
            {detail.session.synthetic
              ? `Synthetic · ${detail.session.scenario}`
              : "Saved conversation"}
          </h3>
          <p>
            Shown in server receipt order. Voice generation and audible playback
            are different.
          </p>
          <div className="actions">
            <button onClick={() => void open(detail.session.id)}>
              Reload conversation
            </button>
            <button
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify({ exportVersion: 1, ...detail }, null, 2)],
                  { type: "application/json" },
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `soulfire-history-${detail.session.id}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Export this conversation
            </button>
            <button disabled={busy} onClick={() => setConfirm(true)}>
              Delete this conversation
            </button>
          </div>
          {confirm && (
            <div className="history-delete">
              <p>
                Delete this conversation and its feedback? This stops new writes
                to it. Existing exports are separate.
              </p>
              <button
                disabled={busy}
                onClick={() =>
                  void operation(async () => {
                    await call("/api/history", "DELETE", {
                      id: detail.session.id,
                      confirm: true,
                    });
                    onDeleted(detail.session.id);
                    setDetail(null);
                    setConfirm(false);
                    await list();
                    setStatus("Conversation and feedback deleted.");
                  })
                }
              >
                Confirm delete conversation
              </button>
              <button onClick={() => setConfirm(false)}>
                Keep conversation
              </button>
            </div>
          )}
          <ol>
            {detail.events.map((event) => (
              <li key={event.id} className="history-event">
                <p className="small">
                  {event.sequence} · {event.channel} ·{" "}
                  {event.role || event.kind} · {event.provenance.source}
                  {event.provenance.claimedSource
                    ? ` · reported source: ${event.provenance.claimedSource}`
                    : ""}
                </p>
                {event.text && <p className="history-text">{event.text}</p>}
                {event.channel === "voice" && event.role === "assistant" && (
                  <small>
                    Generated transcript · playback evidence unavailable
                  </small>
                )}
                {event.exercise && (
                  <details>
                    <summary>
                      Generated practice: {event.exercise.title}
                    </summary>
                    <p>{event.exercise.purpose}</p>
                    {event.exercise.blocks.map((b) => (
                      <div key={b.id}>
                        <strong>{b.title}</strong>
                        <p>{b.prompt}</p>
                        <p>{b.items.join(" · ")}</p>
                      </div>
                    ))}
                  </details>
                )}
                {event.role === "assistant" && (
                  <FeedbackEditor
                    key={`${event.id}:${event.feedbackRevision}`}
                    event={event}
                    save={async (value) =>
                      operation(async () => {
                        await call("/api/history", "PATCH", {
                          action: "feedback",
                          id: detail.session.id,
                          eventId: event.id,
                          revision: event.feedbackRevision,
                          feedback: value,
                        });
                        await open(detail.session.id);
                        setStatus("Feedback saved.");
                      })
                    }
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
      {status && <p role="status">{status}</p>}
    </div>
  );
}
