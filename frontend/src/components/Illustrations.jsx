const Defs = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.5" stopColor="#c9ccd2" />
      <stop offset="1" stopColor="#8d929b" />
    </linearGradient>
    <linearGradient id={`${id}-lime`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f0ff8a" />
      <stop offset="1" stopColor="#b9d61e" />
    </linearGradient>
    <linearGradient id={`${id}-ember`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffb06b" />
      <stop offset="1" stopColor="#ff6a00" />
    </linearGradient>
    <linearGradient id={`${id}-volt`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#7d95ff" />
      <stop offset="1" stopColor="#1f3fe0" />
    </linearGradient>
    <radialGradient id={`${id}-shadow`}>
      <stop offset="0" stopColor="#000" stopOpacity="0.55" />
      <stop offset="1" stopColor="#000" stopOpacity="0" />
    </radialGradient>
  </defs>
);

const Shadow = ({ id, cx = 60, cy = 104, rx = 40 }) => <ellipse cx={cx} cy={cy} rx={rx} ry="7" fill={`url(#${id}-shadow)`} />;

export function NewsStackArt() {
  const id = "ns";
  return (
    <svg viewBox="0 0 120 112" className="h-full w-full">
      <Defs id={id} />
      <Shadow id={id} />
      <rect x="18" y="62" width="70" height="30" rx="8" fill={`url(#${id}-ember)`} transform="skewX(-12)" />
      <rect x="22" y="48" width="70" height="30" rx="8" fill={`url(#${id}-silver)`} transform="skewX(-12)" />
      <rect x="26" y="34" width="70" height="30" rx="8" fill="#fbfaf7" stroke="#d0ccc4" transform="skewX(-12)" />
      <rect x="30" y="41" width="30" height="4" rx="2" fill="#121212" transform="skewX(-12)" />
      <rect x="30" y="49" width="44" height="3" rx="1.5" fill="#a9a49c" transform="skewX(-12)" />
      <circle cx="84" cy="34" r="17" fill="#dfe6ff" fillOpacity="0.7" stroke={`url(#${id}-silver)`} strokeWidth="6" />
      <circle cx="84" cy="34" r="6" fill={`url(#${id}-volt)`} />
      <rect x="96" y="45" width="7" height="20" rx="3.5" fill="#141414" transform="rotate(-40 99 55)" />
    </svg>
  );
}

export function ImageScanArt() {
  const id = "is";
  return (
    <svg viewBox="0 0 120 112" className="h-full w-full">
      <Defs id={id} />
      <Shadow id={id} />
      <rect x="24" y="20" width="72" height="78" rx="10" fill={`url(#${id}-silver)`} />
      <rect x="31" y="27" width="58" height="50" rx="6" fill="#1b1b1b" />
      <circle cx="47" cy="42" r="6" fill={`url(#${id}-lime)`} />
      <path d="M31 70 L50 52 L62 63 L72 54 L89 70 L89 77 L31 77 Z" fill={`url(#${id}-volt)`} />
      <path d="M60 27 L60 77" stroke="#fff" strokeOpacity="0.7" strokeDasharray="3 3" />
      <path d="M92 16 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill={`url(#${id}-lime)`} />
      <rect x="40" y="84" width="40" height="5" rx="2.5" fill="#fff" fillOpacity="0.8" />
    </svg>
  );
}

export function VideoArt() {
  const id = "va";
  return (
    <svg viewBox="0 0 120 112" className="h-full w-full">
      <Defs id={id} />
      <Shadow id={id} />
      <rect x="16" y="30" width="88" height="58" rx="10" fill={`url(#${id}-silver)`} />
      <rect x="22" y="36" width="76" height="46" rx="6" fill="#1b1b1b" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={26 + i * 12} y="30" width="6" height="4" rx="1" fill="#1b1b1b" />
      ))}
      <circle cx="60" cy="59" r="14" fill={`url(#${id}-ember)`} />
      <path d="M56 52 L67 59 L56 66 Z" fill="#fff" />
      <path d="M26 92 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0" stroke={`url(#${id}-lime)`} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function SourcesArt() {
  const id = "sa";
  const nodes = [[60, 22], [26, 48], [94, 46], [38, 84], [84, 84], [60, 56]];
  return (
    <svg viewBox="0 0 120 112" className="h-full w-full">
      <Defs id={id} />
      <Shadow id={id} />
      {nodes.slice(0, 5).map(([x, y]) => (
        <line key={`${x}${y}`} x1="60" y1="56" x2={x} y2={y} stroke="#9aa0aa" strokeWidth="2" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 5 ? 15 : 9} fill={i === 5 ? `url(#${id}-volt)` : i % 2 ? `url(#${id}-silver)` : `url(#${id}-lime)`} />
      ))}
      <path d="M53 56 l5 5 9 -10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrendingArt() {
  const id = "ta";
  return (
    <svg viewBox="0 0 120 112" className="h-full w-full">
      <Defs id={id} />
      <Shadow id={id} />
      {[[24, 40], [44, 28], [64, 52], [84, 18]].map(([x, h], i) => (
        <rect key={x} x={x} y={92 - h - 20} width="14" height={h + 20} rx="4" fill={i === 3 ? `url(#${id}-ember)` : `url(#${id}-silver)`} />
      ))}
      <path d="M22 60 L48 44 L68 58 L98 24" stroke={`url(#${id}-lime)`} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M98 24 l-12 1 M98 24 l-1 12" stroke="#b9d61e" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function ReportsArt() {
  const id = "ra";
  return (
    <svg viewBox="0 0 120 112" className="h-full w-full">
      <Defs id={id} />
      <Shadow id={id} />
      <rect x="34" y="26" width="56" height="70" rx="8" fill={`url(#${id}-ember)`} transform="rotate(8 62 61)" />
      <rect x="30" y="22" width="56" height="70" rx="8" fill={`url(#${id}-silver)`} transform="rotate(-4 58 57)" />
      <rect x="32" y="20" width="56" height="70" rx="8" fill="#fbfaf7" stroke="#d0ccc4" />
      <rect x="40" y="32" width="28" height="4" rx="2" fill="#121212" />
      {[42, 50, 58].map((y) => (
        <rect key={y} x="40" y={y} width="40" height="3" rx="1.5" fill="#bdb8af" />
      ))}
      <path d="M70 20 h12 v24 l-6 -5 -6 5 Z" fill={`url(#${id}-volt)`} />
      <circle cx="80" cy="76" r="10" fill={`url(#${id}-lime)`} />
      <path d="M75 76 l4 4 6 -7" stroke="#121212" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
