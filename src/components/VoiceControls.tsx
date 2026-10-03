"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, AudioLines, Square, Volume2, VolumeX } from "lucide-react";
import type { Message } from "../lib/schema";

type Props = {
  messages: Message[];
  language: string;
  onDraft: (text: string) => void;
  onMessage: (message: Message) => void;
  onError: (error: string) => void;
  quietToken: number;
  disabled: boolean;
  practiceTitle?: string;
  onActive: (active: boolean) => void;
};
export function VoiceControls(p: Props) {
  const [mode, setMode] = useState<
    | "off"
    | "consent-dictation"
    | "consent-live"
    | "recording"
    | "transcribing"
    | "connecting"
    | "live"
  >("off");
  const [muted, setMuted] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const resources = useRef<{
    stream?: MediaStream;
    recorder?: MediaRecorder;
    pc?: RTCPeerConnection;
    dc?: RTCDataChannel;
    audio?: HTMLAudioElement;
    abort?: AbortController;
    timer?: ReturnType<typeof setTimeout>;
    epoch: number;
  }>({ epoch: 0 });
  const props = useRef(p);
  props.current = p;
  function stop() {
    const r = resources.current;
    r.epoch++;
    r.abort?.abort();
    clearTimeout(r.timer);
    if (r.recorder) {
      r.recorder.onstop = null;
      if (r.recorder.state !== "inactive") r.recorder.stop();
    }
    r.stream?.getTracks().forEach((t) => t.stop());
    r.dc?.close();
    r.pc?.close();
    if (r.audio) {
      r.audio.pause();
      r.audio.srcObject = null;
    }
    resources.current = { epoch: r.epoch };
    setMode("off");
    setMuted(false);
    setMicMuted(false);
    props.current.onActive(false);
  }
  useEffect(() => {
    // Cleanup stops the previous session whenever quietToken changes.
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [p.quietToken]);
  async function begin(kind: "dictation" | "live") {
    stop();
    const r = resources.current;
    const epoch = r.epoch;
    setMode(kind === "dictation" ? "recording" : "connecting");
    p.onActive(true);
    try {
      const status = await fetch("/api/status").then((response) =>
        response.json(),
      );
      if (resources.current.epoch !== epoch) return;
      if (!status.configured)
        throw new Error(
          "Voice is not connected yet. Configure the server-side OpenAI key first. Your text and practice are still here.",
        );
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Microphone is unavailable here. Use text, or a supported browser on localhost or HTTPS.",
        );
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (resources.current.epoch !== epoch) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      r.stream = stream;
      if (kind === "dictation") {
        if (!window.MediaRecorder)
          throw new Error(
            "Recording is unavailable in this browser. You can continue with text.",
          );
        const rec = new MediaRecorder(stream);
        r.recorder = rec;
        const chunks: Blob[] = [];
        rec.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        rec.onerror = () => {
          p.onError("Recording failed. Your typed draft is still here.");
          stop();
        };
        rec.onstop = async () => {
          clearTimeout(r.timer);
          stream.getTracks().forEach((t) => t.stop());
          if (resources.current.epoch !== epoch) return;
          setMode("transcribing");
          r.abort = new AbortController();
          try {
            const form = new FormData();
            form.set(
              "audio",
              new Blob(chunks, { type: rec.mimeType }),
              rec.mimeType.includes("mp4") ? "dictation.mp4" : "dictation.webm",
            );
            const res = await fetch("/api/transcribe", {
              method: "POST",
              body: form,
              signal: r.abort.signal,
            });
            const data = await res.json();
            if (!res.ok)
              throw new Error(
                data.error || "Transcription failed. Try again or type.",
              );
            if (resources.current.epoch === epoch) {
              p.onDraft(data.text);
              stop();
            }
          } catch (e) {
            if (resources.current.epoch === epoch) {
              p.onError(
                e instanceof Error ? e.message : "Transcription failed.",
              );
              stop();
            }
          }
        };
        rec.start();
        r.timer = setTimeout(() => {
          if (rec.state === "recording") rec.stop();
        }, 60000);
        return;
      }
      const pc = new RTCPeerConnection();
      r.pc = pc;
      const audio = new Audio();
      audio.autoplay = true;
      r.audio = audio;
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
        audio
          .play()
          .catch(() =>
            p.onError(
              "Audio playback was blocked. Use the speaker control to try again; transcripts remain available.",
            ),
          );
      };
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const dc = pc.createDataChannel("oai-events");
      r.dc = dc;
      const seen = new Set<string>();
      dc.onopen = () => {
        if (resources.current.epoch !== epoch) return;
        clearTimeout(r.timer);
        r.timer = setTimeout(() => {
          if (resources.current.epoch === epoch) {
            p.onError(
              "This ten-minute voice session has ended. You can start another when ready.",
            );
            stop();
          }
        }, 600000);
        setMode("live");
        for (const m of p.messages.slice(-20))
          dc.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: m.role,
                content: [
                  {
                    type: m.role === "user" ? "input_text" : "text",
                    text: m.content,
                  },
                ],
              },
            }),
          );
      };
      dc.onmessage = (e) => {
        if (resources.current.epoch !== epoch) return;
        try {
          const event = JSON.parse(e.data);
          if (event.type === "error") {
            p.onError(
              "Voice encountered a service error. End voice and try again; text is still available.",
            );
            return;
          }
          if (
            event.type ===
              "conversation.item.input_audio_transcription.completed" ||
            event.type === "response.output_audio_transcript.done"
          ) {
            const key = event.item_id + event.type;
            if (!seen.has(key) && event.transcript) {
              seen.add(key);
              props.current.onMessage({
                role: event.type.startsWith("conversation")
                  ? "user"
                  : "assistant",
                content: event.transcript,
              });
            }
          }
        } catch {
          /* Ignore unsupported protocol events. */
        }
      };
      pc.onconnectionstatechange = () => {
        if (
          resources.current.epoch === epoch &&
          ["failed", "disconnected", "closed"].includes(pc.connectionState)
        ) {
          p.onError(
            "Voice disconnected. Your conversation and practice are still here.",
          );
          stop();
        }
      };
      r.abort = new AbortController();
      r.timer = setTimeout(() => {
        if (resources.current.epoch === epoch) {
          p.onError("Voice connection timed out. Try again or use text.");
          stop();
        }
      }, 25000);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const res = await fetch("/api/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: offer.sdp,
          language: p.language,
          practiceTitle: p.practiceTitle || "",
        }),
        signal: r.abort.signal,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Voice could not connect.");
      }
      const sdp = await res.text();
      if (resources.current.epoch === epoch)
        await pc.setRemoteDescription({ type: "answer", sdp });
    } catch (e) {
      if (resources.current.epoch === epoch) {
        p.onError(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "Microphone permission was denied. You can keep typing, or allow microphone access in browser settings and try again."
            : e instanceof Error
              ? e.message
              : "Voice could not start. Use text or try again.",
        );
        stop();
      }
    }
  }
  function interrupt() {
    const r = resources.current;
    if (r.dc?.readyState === "open") {
      r.dc.send(JSON.stringify({ type: "response.cancel" }));
      r.dc.send(JSON.stringify({ type: "output_audio_buffer.clear" }));
    }
    if (r.audio) {
      r.audio.pause();
      setTimeout(() => r.audio?.play().catch(() => {}), 100);
    }
  }
  return (
    <div className="voice-controls">
      {mode === "off" && (
        <>
          <button
            type="button"
            className="icon-label"
            disabled={p.disabled}
            onClick={() => setMode("consent-dictation")}
          >
            <Mic size={17} /> Dictate
          </button>
          <button
            type="button"
            className="icon-label"
            disabled={p.disabled}
            onClick={() => setMode("consent-live")}
          >
            <AudioLines size={18} /> Live voice
          </button>
        </>
      )}
      {(mode === "consent-dictation" || mode === "consent-live") && (
        <div className="voice-consent">
          <strong>
            {mode === "consent-dictation"
              ? "Speak an editable draft"
              : "Start a voice conversation"}
          </strong>
          <p>
            {mode === "consent-dictation"
              ? "After recording, audio is sent to OpenAI for transcription. Review and edit the words before submitting them. Recording stops at one minute."
              : "Your microphone audio and submitted conversation go to OpenAI. You’ll hear an AI-generated voice. Private exercise fields are not sent. You can interrupt, mute, or end at any time."}
          </p>
          <div className="actions">
            <button
              className="primary"
              onClick={() =>
                begin(mode === "consent-dictation" ? "dictation" : "live")
              }
            >
              Allow microphone & start
            </button>
            <button onClick={stop}>Cancel</button>
          </div>
        </div>
      )}
      {mode === "recording" && (
        <>
          <span className="listening" role="status">
            Recording · up to 1 min
          </span>
          <button onClick={() => resources.current.recorder?.stop()}>
            <Square size={15} /> Stop & transcribe
          </button>
          <button onClick={stop}>Discard</button>
        </>
      )}
      {(mode === "connecting" || mode === "transcribing") && (
        <>
          <span role="status">
            {mode === "connecting" ? "Connecting voice…" : "Transcribing…"}
          </span>
          <button onClick={stop}>Cancel</button>
        </>
      )}
      {mode === "live" && (
        <div className="live-panel">
          <span className="listening" role="status">
            {micMuted ? "Microphone muted" : "Live voice · microphone on"}
          </span>
          <div className="actions">
            <button onClick={interrupt}>
              <Square size={14} /> Interrupt
            </button>
            <button
              onClick={() => {
                resources.current.stream
                  ?.getAudioTracks()
                  .forEach((t) => (t.enabled = micMuted));
                setMicMuted(!micMuted);
              }}
            >
              {micMuted ? "Unmute mic" : "Mute mic"}
            </button>
            <button
              aria-label={muted ? "Unmute speaker" : "Mute speaker"}
              onClick={() => {
                const audio = resources.current.audio;
                if (audio) {
                  audio.muted = !muted;
                  audio.play().catch(() => {});
                }
                setMuted(!muted);
              }}
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <button onClick={stop}>End voice</button>
          </div>
          <small>
            Switching away or hiding this tab disconnects the microphone.
          </small>
        </div>
      )}
    </div>
  );
}
