import { LandscapeArtwork } from "./LandscapeArtwork";
export function QuietScene() {
  return (
    <svg
      className="quiet-scene"
      viewBox="0 0 1200 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className="scene-depth">
        <LandscapeArtwork />
      </g>
      <g
        className="water-glimmer"
        fill="none"
        stroke="#f4dfaa"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M710 686h125m-145 28h90m-140 30h190m-230 34h250m-200 35h145m-205 40h220" />
      </g>
      <g fill="none" stroke="#ecdba9" strokeWidth="2.5">
        <ellipse
          className="water-ring ring-one"
          cx="625"
          cy="745"
          rx="140"
          ry="16"
        />
        <ellipse
          className="water-ring ring-two"
          cx="625"
          cy="745"
          rx="140"
          ry="16"
        />
      </g>
    </svg>
  );
}

export function PromptArt({
  kind,
}: {
  kind: "sort" | "reflect" | "choose" | "action";
}) {
  return (
    <svg
      className={`prompt-art prompt-art-${kind}`}
      viewBox="0 0 240 110"
      aria-hidden="true"
      fill="none"
    >
      {kind === "sort" ? (
        <>
          <ellipse cx="120" cy="88" rx="95" ry="12" fill="#dce5d6" />
          <path
            d="M43 72c-13-22 10-40 29-20 15 18 6 31-10 31-9 0-15-4-19-11Z"
            fill="#70927a"
          />
          <path
            d="M97 64c-6-24 29-32 40-8 8 18-10 27-25 23-7-2-12-6-15-15Z"
            fill="#a8b59a"
          />
          <path
            d="M165 68c-10-18 16-34 32-17 17 17 1 33-15 31-8-1-13-5-17-14Z"
            fill="#c6ad77"
          />
          <path
            d="M61 34v-9m59 7V15m61 18v-9"
            stroke="#668272"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : kind === "reflect" ? (
        <>
          <ellipse cx="120" cy="78" rx="87" ry="19" fill="#e4eadd" />
          <ellipse cx="120" cy="78" rx="68" ry="13" stroke="#8fa696" />
          <ellipse cx="120" cy="78" rx="43" ry="7" stroke="#8fa696" />
          <path
            d="M120 20c0 0-15 20-15 29a15 15 0 0 0 30 0c0-9-15-29-15-29Z"
            fill="#789a8a"
          />
          <path
            d="M115 42q-7 11 1 13"
            stroke="#e4eddd"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : kind === "choose" ? (
        <>
          <path
            d="M117 102c-25-31-27-44-59-53M117 102c16-25 19-44 63-60"
            stroke="#c4b388"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M119 100c-2-40 3-58 5-80"
            stroke="#668b74"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="124" cy="20" r="10" fill="#d5b778" />
          <path d="M150 31q18-20 33-6-9 18-33 6" fill="#a3b79b" />
        </>
      ) : (
        <>
          <ellipse cx="120" cy="92" rx="63" ry="9" fill="#e1e6d5" />
          <path
            d="M120 90V41"
            stroke="#547a62"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M120 65c-26 1-38-14-34-30 23-1 37 15 34 30Z"
            fill="#91ab83"
          />
          <path
            d="M120 51c-1-24 15-35 35-30 0 20-15 32-35 30Z"
            fill="#547a62"
          />
          <circle cx="170" cy="20" r="10" fill="#dec68d" />
        </>
      )}
    </svg>
  );
}
