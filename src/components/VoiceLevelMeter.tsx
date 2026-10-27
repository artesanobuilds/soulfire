"use client";
import { useEffect, useRef } from "react";
// This local analyser never routes capture to the speakers or uploads samples.
export function VoiceLevelMeter({
  stream,
  motionEnabled,
  onActivity,
  label,
}: {
  stream: MediaStream;
  motionEnabled: boolean;
  onActivity: (active: boolean) => void;
  label: string;
}) {
  const bars = useRef<HTMLSpanElement>(null);
  const callback = useRef(onActivity);
  callback.current = onActivity;
  useEffect(() => {
    let context: AudioContext | undefined,
      source: MediaStreamAudioSourceNode | undefined,
      analyser: AnalyserNode | undefined;
    let frame = 0,
      closed = false,
      active = false,
      lastLoud = 0,
      previous = 0;
    const elements = Array.from(bars.current?.children || []) as HTMLElement[];
    const cleanup = () => {
      closed = true;
      cancelAnimationFrame(frame);
      source?.disconnect();
      analyser?.disconnect();
      void context?.close().catch(() => {});
      callback.current(false);
    };
    try {
      if (!window.AudioContext) return;
      context = new AudioContext();
      source = context.createMediaStreamSource(stream);
      analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const draw = (time: number) => {
        if (closed) return;
        if (time - previous >= 60 && context?.state === "running") {
          previous = time;
          analyser!.getByteTimeDomainData(samples);
          const rms = Math.sqrt(
            samples.reduce(
              (sum, value) => sum + ((value - 128) / 128) ** 2,
              0,
            ) / samples.length,
          );
          if (rms > 0.015) lastLoud = time;
          const next = lastLoud > 0 && time - lastLoud < 240;
          if (active !== next) {
            active = next;
            callback.current(next);
          }
          elements.forEach((bar, i) => {
            bar.style.height = `${motionEnabled ? 4 + Math.min(1, rms * 6) * 28 * (0.3 + 0.7 * Math.sin((Math.PI * (i + 1)) / (elements.length + 1))) : 4}px`;
          });
        }
        frame = requestAnimationFrame(draw);
      };
      void context.resume().catch(() => {});
      frame = requestAnimationFrame(draw);
    } catch {
      cleanup();
    }
    return cleanup;
  }, [stream, motionEnabled]);
  return (
    <span
      className="voice-meter"
      role="img"
      aria-label={label}
      data-source={label.startsWith("Assistant") ? "assistant" : "microphone"}
    >
      <span className="voice-meter-label" aria-hidden="true">
        {label.startsWith("Assistant") ? "Soulfire" : "You"}
      </span>
      <span className="dictation-waveform" ref={bars} aria-hidden="true">
        {Array.from({ length: 15 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </span>
  );
}
