"use client";
import { useId, useState } from "react";
import type { SceneSpec, Thought } from "../domain/scene";
export function SceneRenderer({
  scene,
  thoughts,
  onMove,
}: {
  scene: SceneSpec;
  thoughts: Thought[];
  onMove: (id: string, group: number) => void;
}) {
  const uid = useId().replaceAll(":", "");
  const [selected, select] = useState(thoughts[0]?.id || "");
  const current = thoughts.find((t) => t.id === selected) || thoughts[0];
  return (
    <div className="visual-exercise" data-scene-version={scene.version}>
      <div className="scene-art" aria-hidden="true">
        <svg viewBox="0 0 640 310" role="presentation">
          <defs>
            <linearGradient id={`${uid}-sky`} x2="0" y2="1">
              <stop stopColor="#173f39" />
              <stop offset="1" stopColor="#8ba895" />
            </linearGradient>
            <radialGradient id={`${uid}-halo`}>
              <stop stopColor="#eed6a0" stopOpacity=".5" />
              <stop offset="1" stopColor="#eed6a0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="640" height="310" rx="24" fill={`url(#${uid}-sky)`} />
          <circle cx="468" cy="88" r="110" fill={`url(#${uid}-halo)`} />
          <circle cx="468" cy="88" r="35" fill="#eddba9" />
          <path
            d="M0 165 Q100 90 235 158 T640 145 V310 H0Z"
            fill="#a7b6a0"
            opacity=".5"
          />
          <path d="M0 210 Q130 150 330 205 T640 180 V310 H0Z" fill="#214f46" />
          {scene.zones.map((_, g) => (
            <g key={g}>
              <ellipse
                cx={80 + g * (480 / (scene.zones.length - 1))}
                cy="257"
                rx={scene.zones.length === 4 ? 64 : 78}
                ry="24"
                fill={g === current?.group ? "#d5c291" : "#9aaf95"}
                opacity=".9"
              />
              <ellipse
                cx={80 + g * (480 / (scene.zones.length - 1))}
                cy="278"
                rx="65"
                ry="8"
                fill="none"
                stroke="#c4cbb0"
                opacity=".5"
              />
            </g>
          ))}
          {thoughts.map((t, i) => {
            const local = thoughts
              .filter((x) => x.group === t.group)
              .findIndex((x) => x.id === t.id);
            const x =
                80 +
                t.group * (480 / (scene.zones.length - 1)) +
                ((local % 3) - 1) * 22,
              y = 236 - Math.floor(local / 3) * 22;
            return (
              <g
                key={t.id}
                className="thought-stone"
                style={{ transform: `translate(${x}px,${y}px)` }}
              >
                <ellipse
                  rx={t.id === current?.id ? 13 : 10}
                  ry="8"
                  fill={t.id === current?.id ? "#fff2c7" : "#d7dfca"}
                />
                <text y="4" textAnchor="middle" fontSize="10" fill="#28483c">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="scene-instruction">
        Choose a thought. Place it where it belongs for you.
      </p>
      <div
        className="thought-picker"
        role="group"
        aria-label="Choose a thought to place"
      >
        {thoughts.map((t, i) => (
          <button
            key={t.id}
            aria-pressed={current?.id === t.id}
            onClick={() => select(t.id)}
          >
            <span>{i + 1}</span>
            {t.text || "An unwritten thought"}
          </button>
        ))}
      </div>
      {current && (
        <div
          className="scene-zones"
          role="group"
          aria-label="Place the selected thought"
        >
          {scene.zones.map((zone, g) => (
            <button
              key={g}
              aria-pressed={current.group === g}
              aria-label={`Place in ${zone}`}
              onClick={() => onMove(current.id, g)}
            >
              {zone}
              <span>
                {thoughts.filter((t) => t.group === g).length}{" "}
                {thoughts.filter((t) => t.group === g).length === 1
                  ? "thought"
                  : "thoughts"}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" role="status">
        {current
          ? `${current.text || "Selected thought"}: ${scene.zones[current.group]}`
          : "No thoughts yet. Add one using the simple controls."}
      </p>
    </div>
  );
}
