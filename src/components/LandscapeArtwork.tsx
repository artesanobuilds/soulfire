import { useId } from "react";

// Exact layers from the original local quiet-landscape.svg, with a controllable sun halo.
export function LandscapeArtwork() {
  const prefix = useId().replace(/:/g, "") + "-";
  return (
    <g fill="none">
      <defs>
        <linearGradient
          id={prefix + "sky"}
          x2="0"
          y2="1000"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#173f3c" />
          <stop offset=".52" stopColor="#77978a" />
          <stop offset="1" stopColor="#cbd0ac" />
        </linearGradient>
        <radialGradient id={prefix + "glow"}>
          <stop stopColor="#f6df9b" stopOpacity=".6" />
          <stop offset="1" stopColor="#f6df9b" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={prefix + "water"}
          x2="0"
          y2="1000"
          y1="560"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9ba98b" />
          <stop offset="1" stopColor="#244d46" />
        </linearGradient>
        <linearGradient
          id={prefix + "hill"}
          x2="600"
          y2="850"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#456c60" />
          <stop offset="1" stopColor="#153f36" />
        </linearGradient>
        <filter id={prefix + "grain"}>
          <feTurbulence
            baseFrequency=".7"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".08" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="soft-light" />
        </filter>
      </defs>
      <g filter={`url(#${prefix}grain)`}>
        <path fill={`url(#${prefix}sky)`} d="M0 0h1200v1000H0z" />
        <ellipse
          className="sun-glow"
          cx="780"
          cy="380"
          rx="370"
          ry="350"
          fill={`url(#${prefix}glow)`}
        />
        <circle cx="780" cy="375" r="66" fill="#ead39b" />
        <path
          d="M0 530Q160 390 360 470T690 455T1200 400V750H0Z"
          fill="#8eab98"
        />
        <path
          d="M0 610Q170 450 330 530T650 535Q900 340 1200 520V800H0Z"
          fill="#648c7b"
        />
        <path fill={`url(#${prefix}water)`} d="M0 600h1200v400H0z" />
        <path
          d="M0 480Q180 450 270 570T600 650Q480 700 290 720T0 840Z"
          fill={`url(#${prefix}hill)`}
        />
        <path
          d="M1200 510Q1020 480 980 580T750 655Q870 680 1060 690T1200 800Z"
          fill="#365f50"
        />
        <g stroke="#ead7a7" strokeOpacity=".4" strokeLinecap="round">
          <path d="M680 665h160m-185 22h210m-150 26h100m-150 28h210m-270 34h320m-250 34h180m-260 44h330m-250 40h180" />
          <ellipse cx="625" cy="900" rx="230" ry="24" />
          <ellipse cx="625" cy="900" rx="150" ry="14" />
        </g>
        <path d="M0 920Q130 800 290 850T560 1000H0Z" fill="#173e34" />
        <path d="M1200 840Q1040 790 920 910T760 1000h440Z" fill="#1e463b" />
        <g stroke="#93a98b" strokeWidth="3" strokeLinecap="round">
          <path d="M102 1000Q130 880 83 793m35 110q-48-30-55-65m61 33q40-30 42-66m-48 133q-45-10-70-40" />
          <path d="M1110 1000q-30-100 22-177m-35 112q55-25 67-66m-58 31q-30-25-31-55" />
        </g>
      </g>
    </g>
  );
}
