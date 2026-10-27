"use client";
import { useEffect, useRef } from "react";

// This analyser is local-only and has no connection to the speakers or network.
// A static baseline remains if Web Audio is unavailable or motion is disabled.
export function DictationWaveform({
  stream,
  motionEnabled,
}: {
  stream: MediaStream;
  motionEnabled: boolean;
}) {
  const bars = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const elements = Array.from(bars.current?.children || []) as HTMLElement[];
    elements.forEach((bar) => {
      bar.style.height = "4px";
    });
    if (!motionEnabled || !window.AudioContext) return;
    let context: AudioContext | undefined;
    let source: MediaStreamAudioSourceNode | undefined;
    let analyser: AnalyserNode | undefined;
    let frame = 0;
    let closed = false;
    const cleanup = () => {
      closed = true;
      cancelAnimationFrame(frame);
      source?.disconnect();
      analyser?.disconnect();
      void context?.close().catch(() => {});
    };
    try {
      context = new AudioContext();
      analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      let previous = 0;
      let amplitude = 0;
      const draw = (time: number) => {
        if (closed) return;
        if (time - previous >= 60 && context?.state === "running") {
          previous = time;
          analyser!.getByteTimeDomainData(samples);
          const rms = Math.sqrt(
            samples.reduce(
              (sum, sample) => sum + ((sample - 128) / 128) ** 2,
              0,
            ) / samples.length,
          );
          amplitude = amplitude * 0.4 + Math.min(1, rms * 5) * 0.6;
          elements.forEach((bar, index) => {
            // Mirror the envelope for a calm, legible waveform; silence is flat.
            const envelope =
              0.25 +
              0.75 * Math.sin((Math.PI * (index + 1)) / (elements.length + 1));
            bar.style.height = `${4 + 28 * amplitude * envelope}px`;
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
    <span className="dictation-waveform" ref={bars} aria-hidden="true">
      {Array.from({ length: 15 }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}
