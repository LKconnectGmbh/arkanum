/** Kartenrückseiten als SVG, um 180° symmetrisch. */

export function BackAkademie({ size = 40 }: { size?: number }) {
  const h = Math.round((size * 7) / 5);
  const stars = [
    [12, 14], [48, 22], [26, 36], [60, 60], [14, 78], [50, 96], [30, 112], [64, 130],
  ];
  return (
    <svg width={size} height={h} viewBox="0 0 80 112" className="back back-akademie" aria-hidden>
      <rect x="1" y="1" width="78" height="110" rx="6" fill="#141a3d" stroke="#C9A24B" strokeWidth="2" />
      <rect x="6" y="6" width="68" height="100" rx="4" fill="none" stroke="#C9A24B" strokeWidth="1" />
      {stars.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1" fill="#F4F1E8" opacity="0.7" />
          <circle cx={80 - x} cy={112 - y} r="1" fill="#F4F1E8" opacity="0.7" />
        </g>
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={40 + Math.cos(a) * 24} cy={56 + Math.sin(a) * 24} r="1.4" fill="#C9A24B" />;
      })}
      <path d="M40 38a14 14 0 1 0 0 28a10 10 0 1 1 0-28z" fill="#F4F1E8" />
      <path d="M24 70h32v10H24z" fill="#C9A24B" />
      <path d="M40 70v10M26 72l12-2M54 72l-12-2" stroke="#141a3d" strokeWidth="1.2" />
    </svg>
  );
}

export function BackOmen({ size = 40 }: { size?: number }) {
  const h = Math.round((size * 7) / 5);
  return (
    <svg width={size} height={h} viewBox="0 0 80 112" className="back back-omen" aria-hidden>
      <defs>
        <radialGradient id="omenfog" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#4a2a6b" />
          <stop offset="100%" stopColor="#0a0812" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="78" height="110" rx="6" fill="url(#omenfog)" stroke="#b9b9c4" strokeWidth="2" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <path key={i} d={`M${40 + Math.cos(a) * 20} ${56 + Math.sin(a) * 20} l${Math.cos(a) * 6} ${Math.sin(a) * 6}`} stroke="#b9b9c4" strokeWidth="1.5" />;
      })}
      <path d="M24 56q16-14 32 0q-16 14-32 0z" fill="none" stroke="#b9b9c4" strokeWidth="2" />
      <circle cx="40" cy="56" r="3" fill="#D9534F" />
    </svg>
  );
}

export function BackFeind({ size = 40 }: { size?: number }) {
  const h = Math.round((size * 7) / 5);
  return (
    <svg width={size} height={h} viewBox="0 0 80 112" className="back back-feind" aria-hidden>
      <rect x="1" y="1" width="78" height="110" rx="6" fill="#4a0f18" stroke="#3a3a3f" strokeWidth="3" />
      <rect x="7" y="7" width="66" height="98" rx="3" fill="none" stroke="#3a3a3f" strokeWidth="1" />
      <path d="M40 36a20 20 0 1 0 0 40a15 15 0 1 1 0-40z" fill="#F4F1E8" opacity="0.9" />
      <path d="M30 44l8 10-6 8 10 6" stroke="#4a0f18" strokeWidth="2.5" fill="none" />
    </svg>
  );
}
