/** Eigene SVG-Symbole, 24-px-Raster, 2-px-Linie. */
import type { CardType } from '../engine/types';

export type SymKind = 'influence' | 'attack' | 'life' | 'shadow' | 'shield' | 'draw' | 'banish' | 'omen' | 'wut';

const COLORS: Record<SymKind, string> = {
  influence: 'var(--gold)',
  attack: 'var(--blitz)',
  life: 'var(--leben)',
  shadow: 'var(--schatten)',
  shield: 'var(--schild)',
  draw: 'var(--sternweiss)',
  banish: 'var(--sternweiss)',
  omen: 'var(--schatten)',
  wut: 'var(--feind)',
};

export function Sym({ kind, size = 16, color, title }: { kind: SymKind; size?: number; color?: string; title?: string }) {
  const c = color ?? COLORS[kind];
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': title ? undefined : true, role: title ? 'img' : undefined };
  switch (kind) {
    case 'influence':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <circle cx="12" cy="12" r="9" fill={c} fillOpacity="0.25" />
          <path d="M12 6l5 6-5 6-5-6z" fill={c} />
        </svg>
      );
    case 'attack':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <path d="M13 2L5 14h6l-1 8 9-13h-6z" fill={c} fillOpacity="0.9" />
        </svg>
      );
    case 'life':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" fill={c} fillOpacity="0.9" />
        </svg>
      );
    case 'shadow':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <path d="M15 3a9 9 0 1 0 6 15 7 7 0 0 1-6-15z" fill={c} fillOpacity="0.9" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill={c} fillOpacity="0.6" />
        </svg>
      );
    case 'draw':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <rect x="4" y="3" width="12" height="16" rx="2" />
          <path d="M14 13l6 0m-3-3l3 3-3 3" />
        </svg>
      );
    case 'banish':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <path d="M6 3h8l0 10-8 0z" />
          <path d="M16 15l2-2m1 6l1-3m-5 3l0-3" />
        </svg>
      );
    case 'omen':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" />
          <circle cx="12" cy="12" r="2.5" fill={c} />
        </svg>
      );
    case 'wut':
      return (
        <svg {...common}>{title && <title>{title}</title>}
          <path d="M12 3l3 6 6 1-4.5 4 1.5 7-6-3-6 3 1.5-7L3 10l6-1z" fill={c} fillOpacity="0.9" />
        </svg>
      );
  }
}

/** Typ-Juwel: Zauber Sternraute, Objekt eckiges Siegel, Wesen Kreis mit Pfote, Grund schlichter Punkt. */
export function TypeJewel({ type, size = 20 }: { type: CardType; size?: number }) {
  const color = type === 'grund' ? 'var(--tinte)' : `var(--${type})`;
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true };
  switch (type) {
    case 'zauber':
      return (
        <svg {...common}>
          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={color} />
        </svg>
      );
    case 'objekt':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" fill={color} />
          <rect x="8" y="8" width="8" height="8" fill="var(--pergament)" fillOpacity="0.6" />
        </svg>
      );
    case 'wesen':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" fill={color} />
          <circle cx="12" cy="14" r="3.2" fill="var(--pergament)" />
          <circle cx="8" cy="9.5" r="1.6" fill="var(--pergament)" />
          <circle cx="12" cy="8" r="1.6" fill="var(--pergament)" />
          <circle cx="16" cy="9.5" r="1.6" fill="var(--pergament)" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="6" fill={color} fillOpacity="0.5" />
        </svg>
      );
  }
}
