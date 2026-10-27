"use client";
import { useEffect, useRef, useState } from "react";
import type { BrowserHistoryEvent } from "../domain/history";
export function useConversationHistory() {
  const [sessionId, setSessionId] = useState<string | null>(null),
    [status, setStatus] = useState("History off — nothing new is retained."),
    [working, setWorking] = useState(false);
  const active = useRef<string | null>(null),
    queue = useRef(Promise.resolve()),
    order = useRef(0),
    pending = useRef(0);
  async function start() {
    if (active.current || working) return;
    setWorking(true);
    try {
      await fetch("/api/history", { cache: "no-store" });
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "History could not start.");
      active.current = data.session.id;
      setSessionId(data.session.id);
      order.current = 0;
      setStatus(
        "History on — future submitted text and final voice turns are saved locally.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "History could not start.");
    } finally {
      setWorking(false);
    }
  }
  function record(event: Omit<BrowserHistoryEvent, "clientOrder">) {
    const id = active.current;
    if (!id) return;
    if (pending.current >= 30) {
      active.current = null;
      setSessionId(null);
      setStatus(
        "History stopped: too many pending events. Review what was saved.",
      );
      return;
    }
    const item = { ...event, clientOrder: ++order.current };
    pending.current++;
    queue.current = queue.current.then(async () => {
      try {
        const res = await fetch("/api/history/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: id, events: [item] }),
        });
        if (!res.ok) throw Error();
      } catch {
        if (active.current === id) {
          active.current = null;
          setSessionId(null);
          setStatus(
            "History could not save an event and has stopped. Your conversation can continue; review saved turns.",
          );
        }
      } finally {
        pending.current--;
      }
    });
  }
  async function pause() {
    const id = active.current;
    active.current = null;
    setSessionId(null);
    if (!id) return;
    setWorking(true);
    setStatus("Stopping history…");
    await queue.current;
    try {
      const res = await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause", id }),
      });
      if (!res.ok) throw Error();
      setStatus(
        "History off. Previously saved turns remain available for review.",
      );
    } catch {
      setStatus(
        "Capture stopped in this tab; the saved session could not be closed. Retry from History.",
      );
    } finally {
      setWorking(false);
    }
  }
  function deleted(id: string) {
    if (active.current === id) {
      active.current = null;
      setSessionId(null);
      setStatus("History off — conversation deleted.");
    }
  }
  function forText() {
    const id = active.current;
    return id ? { sessionId: id, turnKey: crypto.randomUUID() } : undefined;
  }
  function textSaveResult(saved: boolean) {
    if (!saved)
      setStatus(
        "The response arrived, but history did not save it. Review saved turns.",
      );
  }
  useEffect(() => {
    const end = () => {
      const id = active.current;
      if (id) {
        active.current = null;
        setSessionId(null);
        setStatus("History off after leaving the page.");
        void fetch("/api/history", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pause", id }),
          keepalive: true,
        }).catch(() => {});
      }
    };
    window.addEventListener("pagehide", end);
    return () => window.removeEventListener("pagehide", end);
  }, []);
  return {
    sessionId,
    status,
    working,
    start,
    pause,
    record,
    forText,
    textSaveResult,
    deleted,
  };
}
