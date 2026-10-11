/** Einstellungen im Browser-Speicher, jeder Zugriff in try/catch. */
import { useCallback, useState } from 'react';
import type { Difficulty } from '../engine/types';
import { DIFFICULTY } from '../engine/data';

const KEY = 'arkanum.settings.v1';

/** auto = Vorgabe der Stufe (Leicht und Normal: Zahl, Schwer: nur Trendpfeil) */
export type ChanceMode = 'auto' | 'off' | 'trend' | 'number';

export interface Settings {
  chanceMode: ChanceMode;
}

const DEFAULTS: Settings = { chanceMode: 'auto' };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, setSettings] = useState<Settings>(load);
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* kein Speicher: Einstellung gilt nur für diese Sitzung */
      }
      return next;
    });
  }, []);
  return [settings, update];
}

/** Tatsächlicher Anzeigemodus für eine Stufe. */
export function effectiveChanceMode(mode: ChanceMode, difficulty: Difficulty): 'off' | 'trend' | 'number' {
  if (mode !== 'auto') return mode;
  return DIFFICULTY[difficulty].winChance === 'trend' ? 'trend' : 'number';
}
