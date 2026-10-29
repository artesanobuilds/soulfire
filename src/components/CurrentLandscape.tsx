export function CurrentLandscape({ moving = false }: { moving?: boolean }) {
  return (
    <svg
      className="current-music-art"
      data-moving={moving}
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="cm-sky"
          x1="600"
          y1="0"
          x2="600"
          y2="620"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f2eddc" />
          <stop offset=".55" stopColor="#e7ead8" />
          <stop offset="1" stopColor="#c7d8c3" />
        </linearGradient>
        <linearGradient
          id="cm-water"
          x1="700"
          y1="230"
          x2="540"
          y2="620"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ebdfae" />
          <stop offset=".45" stopColor="#b4d1c5" />
          <stop offset="1" stopColor="#6b9d8e" />
        </linearGradient>
        <radialGradient id="cm-glow">
          <stop stopColor="#fff6d8" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="cm-grain"
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="4" r=".6" fill="#365f4f" opacity=".07" />
        </pattern>
      </defs>
      <path fill="url(#cm-sky)" d="M0 0h1200v620H0z" />
      <circle
        className="cm-sun"
        cx="826"
        cy="154"
        r="165"
        fill="url(#cm-glow)"
      />
      <circle cx="826" cy="154" r="48" fill="#f2d598" />
      <g className="cm-clouds" fill="#fffdf0" opacity=".42">
        <path d="M70 95q100-37 230-1t180 0q-95 22-210 7T70 95Z" />
        <path d="M790 75q90-20 195 0t140-1q-76 20-165 7T790 75Z" />
      </g>
      <path
        d="M0 270q125-119 282-58t222-4q155-88 278-12t418 10v414H0Z"
        fill="#c8d4b9"
      />
      <path
        d="M0 316q194-102 350-48t269-20q164-74 310-4t271 29v347H0Z"
        fill="#aec6ad"
      />
      <path
        d="M0 370q216-116 399-50t308-21q209-91 493 45v276H0Z"
        fill="#8db19b"
      />
      <path
        d="M743 248C730 278 588 292 585 330C580 370 762 385 736 434C710 480 500 510 460 620H830C815 540 948 484 887 430C830 375 650 356 665 325C680 294 770 278 765 248Z"
        fill="url(#cm-water)"
      />
      <path d="M0 433q167-104 343-29t220 216H0Z" fill="#729883" />
      <path d="M1200 376q-181-58-282 55t-50 189h332Z" fill="#7d9f82" />
      <path d="M0 550q220-132 391 70H0Z" fill="#567e6b" />
      <path d="M1200 488q-167-14-246 132h246Z" fill="#628873" />
      <g className="cm-ripples" stroke="#f8f3d7" strokeWidth="2" opacity=".62">
        <path d="M710 282q-38 9-61 20m-32 36q29 12 56 15M783 421q37 12 24 27m-102 80q-49 19-66 38" />
        <path d="M717 289q-27 6-42 13m-39 34q22 11 35 13m112 79q22 9 14 17m-96 97q-26 12-39 23" />
      </g>
      <g
        className="cm-reeds"
        stroke="#3d6753"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M139 620q7-83-13-116m17 76q20-18 36-61m-27 101q26-64 59-81M1030 620q-12-74 11-106m-12 75q-36-35-52-24" />
        <path d="M80 620q2-41-16-63m46 63q-5-31-19-48M1118 620q-8-52 12-79" />
      </g>
      <g fill="#e9d39a" opacity=".8">
        <circle cx="126" cy="505" r="4" />
        <circle cx="180" cy="519" r="3" />
        <circle cx="1040" cy="515" r="4" />
      </g>
      <path fill="url(#cm-grain)" d="M0 0h1200v620H0z" />
    </svg>
  );
}
