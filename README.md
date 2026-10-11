# Arkanum – Die Wächter von Mondfels

Kooperatives Solo-Deckbuilding-Kartenspiel fürs Handy. Spezifikation in [SPEC.md](SPEC.md), Auftrag in [AUFTRAG.md](AUFTRAG.md), Python-Referenz der Regeln in [tools/balance_sim.py](tools/balance_sim.py).

## Start

```bash
npm install
npm run dev
```

`npm run dev` startet Vite mit `--host`, die Adresse fürs Handy im selben WLAN steht in der Konsole (z. B. `http://192.168.x.y:5173`).

## Test

```bash
npm test            # Regeltests und Balance-Kurztest (Vitest)
npm run balance     # Siegquoten-Tabelle, 3.000 Partien je Stufe und Bot (ca. 15 s)
npm run balance -- --games 1000 --seed 7
python tools/balance_sim.py   # Python-Referenz, gleiche Tabelle
```

Der Gleichheitstest gilt als bestanden, wenn `npm run balance` die Python-Werte auf ±2 Punkte trifft.

## Build

```bash
npm run build       # Typprüfung + Produktions-Build nach dist/ (PWA, offline spielbar)
npm run preview     # dist/ lokal ausliefern
```

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `src/engine/types.ts` | Spielstand, Aktionen, Ereignisse |
| `src/engine/rules.ts` | Regeln v2: `apply(state, action) → { state, events }` |
| `src/engine/rng.ts` | mulberry32, Zustand liegt im Spielstand |
| `src/engine/bots.ts` | Bots `gut`, `teuer`, `zufall` aus der Python-Referenz |
| `src/engine/sim.ts` | Partien zu Ende spielen, Siegchance schätzen |
| `src/data/*.json` | Karten, Feinde, Omen, Orte, Stufen als Daten |
| `src/ui/` | Oberfläche (React) |
| `tools/balance.ts` | Balance-Tabelle (Node) |
| `tools/balance_sim.py` | Python-Referenz |

## Bewusste Festlegungen gegenüber der SPEC

Im Zweifel gilt das Verhalten von `balance_sim.py`:

- **Seelenzehrer:** Heilung ist für den ganzen Zug gesperrt, sobald er in der Feindphase aktiv war, auch wenn er in diesem Zug fällt.
- **Fluchweber:** legt in geraden Spielzügen (2, 4, 6 …) einen Schatten.
- **Schwäche-Treffer** werden beim Ausspielen jeder Karte sofort verrechnet (Auftrag), die Referenz rechnet sie nach allen Karten.
- **Staubwedelzauber:** Verbannen darf übersprungen werden; wählbar sind Hand und Ablage, nicht die in diesem Zug gespielten Karten.
- **Wut** gilt für jeden Feind, auch für den Fürsten und für Feinde ohne eigenen Schaden.
- **Zugbegrenzung:** Simulationen werten Partien ab Zug 41 als Niederlage, das Spiel selbst hat keine Grenze.
- **Siegchance:** Vor jeder simulierten Partie werden Nachziehstapel, Omen-Stapel, Marktstapel und die noch nicht erschienenen Feinde neu gemischt.
