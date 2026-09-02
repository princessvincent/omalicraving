/**
 * Hand-drawn still life used as the picture panel on the sign-in / create
 * account page: palm oil, a sack of foodstuff, a basket of garri, dried
 * stockfish, a calabash of egusi and scotch bonnets — drawn in the site's
 * own palette (--accent orange, cream, deep charcoal).
 *
 * It's an SVG rather than a photo on purpose: nothing to download, stays
 * razor sharp on any screen, and it can never 404 or slow the page down.
 * Every id is prefixed `ca-` so these gradients can't collide with other
 * SVGs elsewhere on the site.
 */
export default function AuthArt() {
  return (
    <svg viewBox="0 0 600 820" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ca-bg" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#241c12" />
          <stop offset="0.55" stopColor="#1a140d" />
          <stop offset="1" stopColor="#100d08" />
        </linearGradient>
        <radialGradient id="ca-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f2871f" stopOpacity="0.42" />
          <stop offset="1" stopColor="#f2871f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ca-oil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2582a" />
          <stop offset="1" stopColor="#a32d16" />
        </linearGradient>
        <linearGradient id="ca-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id="ca-garri" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#f6c66a" />
          <stop offset="1" stopColor="#d99a34" />
        </linearGradient>
        <linearGradient id="ca-basket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c98a45" />
          <stop offset="1" stopColor="#8d5626" />
        </linearGradient>
        <linearGradient id="ca-bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe4cb" />
          <stop offset="1" stopColor="#bda87f" />
        </linearGradient>
        <linearGradient id="ca-sack" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#d9c9a3" />
          <stop offset="1" stopColor="#a8916a" />
        </linearGradient>
        <g id="ca-bonnet">
          <path
            d="M4 24 q-6 -20 14 -22 q11 -1 17 6 q6 -7 17 -6 q20 2 14 22 q-2 12 -12 18 q-8 5 -19 5 q-11 0 -19 -5 q-10 -6 -12 -18 z"
            fill="currentColor"
          />
          <path d="M22 8 q-5 18 1 33" fill="none" stroke="#000000" strokeOpacity="0.18" strokeWidth="2.4" />
          <path d="M46 8 q5 18 -1 33" fill="none" stroke="#000000" strokeOpacity="0.18" strokeWidth="2.4" />
          <path d="M34 41 q0 -16 0 -33" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="2.4" />
          <path d="M34 3 q1 -9 -7 -11 q11 -4 15 4 q6 -2 8 2 q-7 4 -13 6 z" fill="#3f7d3a" />
          <path d="M34 3 v5" stroke="#2c5a28" strokeWidth="3" strokeLinecap="round" />
        </g>
      </defs>

      <rect width="600" height="820" fill="url(#ca-bg)" />
      <circle cx="430" cy="150" r="330" fill="url(#ca-glow)" />

      {/* faint dot grid, top-left */}
      <g fill="#f7f1e2" opacity="0.07">
        <circle cx="56" cy="66" r="2.5" /><circle cx="112" cy="66" r="2.5" /><circle cx="168" cy="66" r="2.5" />
        <circle cx="56" cy="122" r="2.5" /><circle cx="112" cy="122" r="2.5" /><circle cx="168" cy="122" r="2.5" />
        <circle cx="56" cy="178" r="2.5" /><circle cx="112" cy="178" r="2.5" /><circle cx="168" cy="178" r="2.5" />
      </g>

      {/* ring behind the still life */}
      <circle cx="300" cy="302" r="215" fill="#f7f1e2" opacity="0.05" />
      <circle cx="300" cy="302" r="215" fill="none" stroke="#f2871f" strokeOpacity="0.28" strokeWidth="1.5" />
      <circle cx="300" cy="302" r="248" fill="none" stroke="#f7f1e2" strokeOpacity="0.10" strokeWidth="1" />

      <g transform="translate(0,-118)">
        <ellipse cx="300" cy="648" rx="238" ry="34" fill="#000000" opacity="0.40" />

        {/* dried stockfish, leaning behind the basket */}
        <g transform="translate(360 452) rotate(-14) scale(0.8)">
          <path d="M0 60 q42 -58 108 -50 q46 6 66 44 q-20 38 -66 44 q-66 8 -108 -38 z" fill="#d8b483" />
          <path d="M174 54 l36 -28 v62 z" fill="#c19a68" />
          <path d="M0 60 q42 -58 108 -50" fill="none" stroke="#a97f4d" strokeWidth="3" />
          <circle cx="150" cy="46" r="6" fill="#3a2a15" />
          <g stroke="#a97f4d" strokeWidth="2.5" opacity="0.85" fill="none">
            <path d="M60 26 q6 34 2 62" /><path d="M86 22 q6 36 2 66" /><path d="M112 24 q6 34 2 62" />
          </g>
        </g>

        {/* sack of foodstuff, back left */}
        <g transform="translate(126 452)">
          <path
            d="M10 40 q-12 16 -10 42 l4 78 a16 16 0 0 0 16 14 h56 a16 16 0 0 0 16 -14 l4 -78 q2 -26 -10 -42 z"
            fill="url(#ca-sack)"
          />
          <path d="M10 40 q22 -14 76 0 q-14 12 -38 12 q-24 0 -38 -12 z" fill="#c2b088" />
          <rect x="18" y="92" width="60" height="30" rx="4" fill="#efe4cb" opacity="0.9" />
          <rect x="26" y="101" width="36" height="4" rx="2" fill="#8d5626" />
          <rect x="26" y="110" width="22" height="3.5" rx="1.75" fill="#c98a45" />
          <path d="M14 60 q34 -10 72 0" fill="none" stroke="#8d7a52" strokeWidth="2" opacity="0.6" />
        </g>

        {/* palm oil bottle */}
        <g>
          <rect x="196" y="356" width="30" height="12" rx="4" fill="#c96a15" />
          <rect x="198" y="366" width="26" height="26" rx="5" fill="#f2871f" />
          <g stroke="#c96a15" strokeWidth="1.6" opacity="0.8">
            <path d="M203 368 v22" /><path d="M211 368 v22" /><path d="M219 368 v22" />
          </g>
          <path
            d="M202 392 q-28 22 -28 62 v122 a22 22 0 0 0 22 22 h52 a22 22 0 0 0 22 -22 v-122 q0 -40 -28 -62 z"
            fill="url(#ca-oil)"
          />
          <path
            d="M202 392 q-28 22 -28 62 v122 a22 22 0 0 0 22 22 h52 a22 22 0 0 0 22 -22 v-122 q0 -40 -28 -62 z"
            fill="url(#ca-glass)"
          />
          <rect x="180" y="474" width="88" height="42" rx="5" fill="#efe4cb" opacity="0.95" />
          <rect x="189" y="486" width="52" height="5" rx="2.5" fill="#8d5626" />
          <rect x="189" y="498" width="34" height="4" rx="2" fill="#c98a45" />
          <circle cx="253" cy="495" r="9" fill="#f2871f" />
        </g>

        {/* woven basket heaped with garri */}
        <g>
          <path d="M252 478 q68 -26 136 0 l-16 128 a54 30 0 0 1 -104 0 z" fill="url(#ca-basket)" />
          <g stroke="#7a4a20" strokeWidth="2.5" opacity="0.55" fill="none">
            <path d="M256 508 q64 22 128 0" /><path d="M260 538 q60 22 120 0" /><path d="M264 568 q56 20 112 0" />
            <path d="M290 482 l-8 122" /><path d="M320 476 l0 128" /><path d="M350 482 l8 122" />
          </g>
          <ellipse cx="320" cy="478" rx="68" ry="20" fill="#a9701f" />
          <path d="M260 476 q60 -66 120 0 a68 20 0 0 1 -120 0 z" fill="url(#ca-garri)" />
          <g fill="#b8842a" opacity="0.55">
            <circle cx="298" cy="454" r="3" /><circle cx="320" cy="442" r="3" /><circle cx="342" cy="456" r="3" />
            <circle cx="310" cy="466" r="2.5" /><circle cx="332" cy="468" r="2.5" />
          </g>
        </g>

        {/* calabash of ground egusi */}
        <g>
          <path d="M164 592 h150 a75 60 0 0 1 -150 0 z" fill="url(#ca-bowl)" />
          <ellipse cx="239" cy="592" rx="75" ry="17" fill="#d8c8a2" />
          <ellipse cx="239" cy="592" rx="61" ry="12" fill="#e8d24f" />
          <g fill="#c9ae2f" opacity="0.7">
            <circle cx="221" cy="590" r="3.5" /><circle cx="245" cy="586" r="3.5" /><circle cx="261" cy="594" r="3.5" />
            <circle cx="231" cy="598" r="3" />
          </g>
          <path d="M164 592 h150" stroke="#a89264" strokeWidth="2" />
        </g>

        {/* leaves, tucked behind the peppers */}
        <g>
          <path d="M92 628 q46 -34 92 -10 q-44 30 -92 10 z" fill="#3f7d3a" />
          <path d="M92 628 q46 -12 92 -10" fill="none" stroke="#2c5a28" strokeWidth="2" />
          <path d="M512 616 q-46 -34 -92 -10 q44 30 92 10 z" fill="#4d8f45" />
          <path d="M512 616 q-46 -12 -92 -10" fill="none" stroke="#356a30" strokeWidth="2" />
        </g>

        {/* scotch bonnets — one shape, three colours */}
        <g transform="translate(384 582)">
          <g transform="translate(0 8)" style={{ color: "#d33f22" }}><use href="#ca-bonnet" /></g>
          <g transform="translate(46 26)" style={{ color: "#e8622c" }}><use href="#ca-bonnet" /></g>
          <g transform="translate(6 48) scale(0.86)" style={{ color: "#f2871f" }}><use href="#ca-bonnet" /></g>
        </g>

        <g fill="#f2871f" opacity="0.8">
          <circle cx="206" cy="650" r="3" /><circle cx="222" cy="658" r="2" /><circle cx="414" cy="644" r="3" />
          <circle cx="434" cy="654" r="2" /><circle cx="340" cy="660" r="2.5" />
        </g>
      </g>
    </svg>
  );
}
