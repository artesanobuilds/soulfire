"use client";
import { useEffect, useRef } from "react";
import { ResponseDots } from "./ResponseDots";
import type { Message } from "../lib/schema";

/** Provisional streamed text never enters the submitted conversation history. */
export function ChatTimeline({
  messages,
  pending,
  busy,
}: {
  messages: Message[];
  pending: string;
  busy: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  useEffect(() => {
    const el = viewport.current;
    if (el && following.current) el.scrollTop = el.scrollHeight;
  }, [messages, pending, busy]);
  return (
    <div
      ref={viewport}
      className="chat-timeline"
      role="log"
      aria-label="Our conversation"
      aria-live="polite"
      aria-relevant="additions"
      onScroll={() => {
        const el = viewport.current;
        if (el)
          following.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
    >
      {messages.length === 0 && !busy && (
        <div className="chat-welcome">
          <span className="eyebrow">A LITTLE ROOM TO THINK</span>
          <h1>What’s here today?</h1>
          <p>
            Start with what’s on your mind. We can talk it through, and find a
            practice if it would help.
          </p>
        </div>
      )}
      {messages.map((message, i) => (
        <article key={i} className={`chat-message chat-${message.role}`}>
          <span className="chat-speaker">
            {message.role === "user" ? "You" : "soulfire"}
          </span>
          <p>{message.content}</p>
        </article>
      ))}
      {busy && (
        <article
          className="chat-message chat-assistant chat-pending"
          aria-label="Response in progress"
        >
          <span className="chat-speaker">
            soulfire · {pending ? "responding" : "thinking"}
            <ResponseDots />
          </span>
          <p>{pending || "Making room for what you shared…"}</p>
        </article>
      )}
    </div>
  );
}
