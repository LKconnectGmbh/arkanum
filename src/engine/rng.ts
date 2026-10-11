/** Seedbarer Zufall (mulberry32). Der Zustand ist eine einzelne 32-Bit-Zahl und liegt im Spielstand. */

export interface RngState {
  rng: number;
}

/** Nächste Zufallszahl in [0, 1). Verändert st.rng. */
export function rngNext(st: RngState): number {
  const a = (st.rng + 0x6d2b79f5) | 0;
  st.rng = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Ganze Zahl in [0, n). */
export function rngInt(st: RngState, n: number): number {
  return Math.floor(rngNext(st) * n);
}

/** Mischt das Array an Ort und Stelle (Fisher-Yates). */
export function shuffle<T>(st: RngState, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rngInt(st, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/** k zufällige Elemente in zufälliger Reihenfolge (wie Python random.sample). */
export function sample<T>(st: RngState, arr: readonly T[], k: number): T[] {
  const copy = arr.slice();
  shuffle(st, copy);
  return copy.slice(0, k);
}

export function choice<T>(st: RngState, arr: readonly T[]): T {
  return arr[rngInt(st, arr.length)];
}

/** Erzeugt einen Startwert aus der Uhrzeit, wenn keiner vorgegeben ist. */
export function randomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}
