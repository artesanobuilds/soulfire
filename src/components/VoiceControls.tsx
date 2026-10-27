"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, AudioLines, Square, Volume2, VolumeX } from "lucide-react";
import { DictationWaveform } from "./DictationWaveform";
import type { Message } from "../lib/schema";

import { classifyVoiceError } from "../lib/voice-reliability";
import type { BrowserHistoryEvent } from "../domain/history";

type Props = {
  onHistoryEvent?: (event: Omit<BrowserHistoryEvent, "clientOrder">) => void;
  messages: Message[];
  motionEnabled: boolean;
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
    | "requesting-microphone"
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
    playbackTimer?: ReturnType<typeof setTimeout>;
    submitRecording?: boolean;
    epoch: number;
    historyVoiceId?: string;
  }>({ epoch: 0 });
  const props = useRef(p);
  props.current = p;
  function stop() {
    const r = resources.current;
    const release = (action: () => void) => {
      try {
        action();
      } catch {
        /* Continue releasing the remaining resources. */
      }
    };
    if (r.historyVoiceId) {
      props.current.onHistoryEvent?.({
        eventKey: `${r.historyVoiceId}:ended`,
        turnKey: r.historyVoiceId,
        kind: "ended",
        channel: "voice",
      });
      r.historyVoiceId = undefined;
    }
    r.epoch++;
    resources.current = { epoch: r.epoch };
    r.abort?.abort();
    clearTimeout(r.timer);
    clearTimeout(r.playbackTimer);
    if (r.pc) {
      r.pc.ontrack = null;
      r.pc.onconnectionstatechange = null;
    }
    if (r.dc) {
      r.dc.onopen = null;
      r.dc.onmessage = null;
      r.dc.onerror = null;
      r.dc.onclose = null;
    }
    if (r.recorder) {
      r.recorder.onstop = null;
      r.recorder.onstart = null;
      r.recorder.ondataavailable = null;
      r.recorder.onerror = null;
      if (r.recorder.state !== "inactive") release(() => r.recorder?.stop());
    }
    r.stream?.getTracks().forEach((t) => release(() => t.stop()));
    release(() => r.dc?.close());
    release(() => r.pc?.close());
    if (r.audio) {
      release(() => r.audio?.pause());
      r.audio.srcObject = null;
    }
    setMode("off");
    setMuted(false);
    setMicMuted(false);
    props.current.onActive(false);
  }
  useEffect(() => {
    // Cleanup stops the previous session whenever quietToken changes.
    const offline = () => {
      if (resources.current.stream) {
        props.current.onError(
          "Network connection lost. Start voice again when connected, or keep typing.",
        );
        stop();
      }
    };
    window.addEventListener("offline", offline);
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("offline", offline);
      stop();
    };
  }, [p.quietToken]);
  async function begin(kind: "dictation" | "live") {
    stop();
    const r = resources.current;
    const epoch = r.epoch;
    setMode(kind === "dictation" ? "requesting-microphone" : "connecting");
    p.onActive(true);
    r.abort = new AbortController();
    const current = () => resources.current === r;
    const fail = (message: string) => {
      if (!current()) return;
      props.current.onError(message);
      stop();
    };
    r.timer = setTimeout(
      () => fail("Voice setup timed out. Try again or keep typing."),
      25000,
    );
    try {
      const statusResponse = await fetch("/api/status", {
        signal: r.abort.signal,
      });
      if (!statusResponse.ok)
        throw new Error(
          "Voice availability could not be checked. Try again or keep typing.",
        );
      const status = await statusResponse.json();
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
      stream.getAudioTracks().forEach((track) =>
        track.addEventListener?.(
          "ended",
          () => {
            if (!r.submitRecording)
              fail(
                "Microphone disconnected. Reconnect it and try again, or keep typing.",
              );
          },
          { once: true },
        ),
      );
      if (kind === "dictation") {
        if (!window.MediaRecorder)
          throw new Error(
            "Recording is unavailable in this browser. You can continue with text.",
          );
        const rec = new MediaRecorder(stream, { audioBitsPerSecond: 64000 });
        r.recorder = rec;
        const chunks: Blob[] = [];
        let bytes = 0;
        rec.onstart = () => {
          if (resources.current.epoch === epoch && rec.state === "recording")
            setMode("recording");
        };
        rec.ondataavailable = (e) => {
          if (resources.current.epoch !== epoch) return;
          bytes += e.data.size;
          // Bound local memory and match the server upload limit, without a timer.
          if (bytes > 7 * 1024 * 1024) {
            props.current.onError(
              "This recording is too large. It was discarded without uploading. Try a shorter recording; your typed draft is still here.",
            );
            stop();
            return;
          }
          if (e.data.size) chunks.push(e.data);
        };
        rec.onerror = () => {
          if (resources.current.epoch !== epoch) return;
          props.current.onError(
            "Recording failed. Your typed draft is still here.",
          );
          stop();
        };
        stream.getAudioTracks().forEach((track) => {
          track.addEventListener?.(
            "ended",
            () => {
              if (resources.current.epoch !== epoch || r.submitRecording)
                return;
              props.current.onError(
                "Microphone disconnected. Nothing was uploaded. Reconnect it and try again, or keep typing.",
              );
              stop();
            },
            { once: true },
          );
        });
        rec.onstop = async () => {
          clearTimeout(r.timer);
          stream.getTracks().forEach((t) => t.stop());
          if (resources.current.epoch !== epoch) return;
          if (!r.submitRecording || !bytes) {
            props.current.onError(
              "No recording was captured. Try again or keep typing.",
            );
            stop();
            return;
          }
          setMode("transcribing");
          r.abort = new AbortController();
          r.timer = setTimeout(
            () => fail("Transcription timed out. Try again or keep typing."),
            45000,
          );
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
              if (typeof data.text !== "string" || !data.text.trim())
                throw new Error(
                  "No speech was recognized. Try again or keep typing.",
                );
              props.current.onDraft(data.text);
              stop();
            }
          } catch (e) {
            if (resources.current.epoch === epoch) {
              props.current.onError(
                e instanceof Error ? e.message : "Transcription failed.",
              );
              stop();
            }
          }
        };
        clearTimeout(r.timer);
        rec.start(1000);
        return;
      }
      const pc = new RTCPeerConnection();
      r.pc = pc;
      const audio = new Audio();
      audio.autoplay = true;
      r.audio = audio;
      pc.ontrack = (e) => {
        if (!current()) return;
        audio.srcObject = e.streams[0];
        audio
          .play()
          .catch(
            () =>
              current() &&
              props.current.onError(
                "Audio playback was blocked. Use the speaker control to try again; transcripts remain available.",
              ),
          );
      };
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const dc = pc.createDataChannel("oai-events");
      r.dc = dc;
      const seen = new Set<string>();
      dc.onerror = () =>
        fail("Voice transport failed. Start voice again or keep typing.");
      dc.onclose = () =>
        fail("Voice disconnected. Start voice again or keep typing.");
      dc.onopen = () => {
        if (resources.current.epoch !== epoch) return;
        clearTimeout(r.timer);
        r.timer = setTimeout(() => {
          if (resources.current.epoch === epoch) {
            props.current.onError(
              "This ten-minute voice session has ended. You can start another when ready.",
            );
            stop();
          }
        }, 600000);
        r.historyVoiceId = crypto.randomUUID();
        props.current.onHistoryEvent?.({
          eventKey: `${r.historyVoiceId}:started`,
          turnKey: r.historyVoiceId,
          kind: "started",
          channel: "voice",
        });
        setMode("live");
        try {
          for (const m of props.current.messages.slice(-20))
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
        } catch {
          fail("Voice transport failed. Start voice again or keep typing.");
        }
      };
      dc.onmessage = (e) => {
        if (resources.current.epoch !== epoch) return;
        try {
          const event = JSON.parse(e.data);
          if (event.type === "error") {
            const diagnostic = classifyVoiceError(event.error);
            if (!diagnostic.fatal) return;
            console.warn("[soulfire voice]", diagnostic.category);
            props.current.onHistoryEvent?.({
              eventKey: crypto.randomUUID(),
              turnKey: r.historyVoiceId || crypto.randomUUID(),
              kind: "error",
              channel: "voice",
            });
            fail(
              "Voice encountered a service error and has stopped. Start voice again or keep typing.",
            );
            return;
          }
          if (
            event.type === "response.done" &&
            event.response?.status === "failed"
          ) {
            fail(
              "Voice response failed and voice has stopped. Start voice again or keep typing.",
            );
            return;
          }
          if (
            event.type === "conversation.item.input_audio_transcription.failed"
          ) {
            fail(
              "Voice could not transcribe your speech. Start voice again or keep typing.",
            );
            return;
          }
          if (
            event.type ===
              "conversation.item.input_audio_transcription.completed" ||
            event.type === "response.output_audio_transcript.done"
          ) {
            if (
              typeof event.item_id !== "string" ||
              typeof event.transcript !== "string" ||
              !event.transcript.trim()
            )
              return;
            const key = event.item_id + event.type;
            if (!seen.has(key)) {
              seen.add(key);
              props.current.onHistoryEvent?.({
                eventKey: `${r.historyVoiceId}:${event.item_id}:${event.type === "conversation.item.input_audio_transcription.completed" ? "user" : "assistant"}`,
                turnKey: `${r.historyVoiceId}:${event.item_id}`,
                kind: "message",
                channel: "voice",
                role: event.type.startsWith("conversation")
                  ? "user"
                  : "assistant",
                text: event.transcript,
                ...(typeof event.item_id === "string"
                  ? { providerItemId: event.item_id }
                  : {}),
                ...(typeof event.response_id === "string"
                  ? { providerResponseId: event.response_id }
                  : {}),
              });
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
          props.current.onError(
            "Voice disconnected. Your conversation and practice are still here.",
          );
          stop();
        }
      };
      r.abort = new AbortController();
      clearTimeout(r.timer);
      r.timer = setTimeout(() => {
        if (resources.current.epoch === epoch) {
          props.current.onError(
            "Voice connection timed out. Try again or use text.",
          );
          stop();
        }
      }, 25000);
      const offer = await pc.createOffer();
      if (!current()) return;
      await pc.setLocalDescription(offer);
      if (!current()) return;
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
      if (!current()) return;
      const sdp = await res.text();
      if (resources.current.epoch === epoch)
        await pc.setRemoteDescription({ type: "answer", sdp });
    } catch (e) {
      if (resources.current.epoch === epoch) {
        props.current.onError(
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
  function finishDictation() {
    const r = resources.current;
    if (!r.recorder || r.recorder.state !== "recording" || r.submitRecording)
      return;
    r.submitRecording = true;
    // Stop capture now, not after MediaRecorder's asynchronous final data event.
    setMode("transcribing");
    r.recorder.stop();
    r.stream?.getTracks().forEach((track) => track.stop());
  }
  function interrupt() {
    const r = resources.current;
    if (r.historyVoiceId)
      props.current.onHistoryEvent?.({
        eventKey: crypto.randomUUID(),
        turnKey: r.historyVoiceId,
        kind: "interrupted",
        channel: "voice",
      });
    if (r.dc?.readyState === "open") {
      try {
        r.dc.send(JSON.stringify({ type: "response.cancel" }));
        r.dc.send(JSON.stringify({ type: "output_audio_buffer.clear" }));
      } catch {
        props.current.onError(
          "Voice disconnected. Start voice again or keep typing.",
        );
        stop();
        return;
      }
    }
    if (r.audio) {
      r.audio.pause();
      clearTimeout(r.playbackTimer);
      r.playbackTimer = setTimeout(() => {
        if (resources.current === r) void r.audio?.play().catch(() => {});
      }, 100);
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
              ? "After recording, audio is sent to OpenAI for transcription. Review and edit the words before submitting them. Tap Stop when you’re finished, or Discard to delete the recording without sending it."
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
          <div className="dictation-listening">
            <DictationWaveform
              stream={resources.current.stream!}
              motionEnabled={p.motionEnabled}
            />
            <span className="listening" role="status">
              Listening · microphone on
            </span>
          </div>
          <button onClick={finishDictation}>
            <Square size={15} /> Stop & transcribe
          </button>
          <button onClick={stop}>Discard</button>
        </>
      )}
      {(mode === "requesting-microphone" ||
        mode === "connecting" ||
        mode === "transcribing") && (
        <>
          <span role="status">
            {mode === "requesting-microphone"
              ? "Waiting for microphone…"
              : mode === "connecting"
                ? "Connecting voice…"
                : "Transcribing · microphone off…"}
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
