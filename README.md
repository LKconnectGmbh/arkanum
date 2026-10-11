# Arkanum – Die Wächter von Mondfels

Kooperatives Solo-Deckbuilding-Kartenspiel fürs Handy. Spezifikation in [SPEC.md](SPEC.md), Auftrag in [AUFTRAG.md](AUFTRAG.md), Python-Referenz der Regeln in [tools/balance_sim.py](tools/balance_sim.py).

## Start

```bash
npm install
npm run dev
```

`npm run dev` startet Vite mit `--host`, die Adresse fürs Handy im selben WLAN steht in der Konsole (z. B. `http://192.168.x.y:5173`). Der Spielstand liegt im Browser-Speicher; die App setzt eine Partie nach dem Neustart fort.

Bedienung: Antippen öffnet die Großansicht, der Knopf darunter spielt aus oder kauft. Feind antippen = 1 ⚡ zuweisen, lange drücken = so viel wie nötig; ohne ⚡ öffnet das Antippen die Feindansicht. „Rückgängig“ (↶) nimmt die letzte Aktion des Zugs zurück.

**Einführung:** Beim ersten Start beginnt ohne Nachfrage die Einführung: eine echte Partie auf Leicht mit fester Aufstellung (`src/data/tutorial.json`), drei Lektionen, Hinweisblasen mit Aussparung, „Überspringen“ immer oben rechts. Fortschritt und Schrittzeiten liegen im Browser-Speicher (`arkanum.tutorial.v1`). Wiederholen über Menü → Grimoire → Regeln → „Einführung wiederholen“. Danach erklärt das Spiel beim ersten Auftreten je einmal: Betäubung, Wut, Regeneration, Fluchkrähe, Seelenzehrer, Siegchance, Sparen, Altar.

**Grimoire** (Menü): alle 85 Karten mit Filter nach Typ und Kosten, Feinde, Omen, Orte, Regeln auf einer Seite, Symbol-Legende, Rückseiten. Das „?“ in der Ortszeile öffnet die Regeln über dem Spielfeld.

**Siegchance:** Zu Beginn jedes Zugs spielt ein Web Worker 200 Partien mit dem guten Bot zu Ende und zeigt „58 % ±7 ↗“ in der Kopfleiste („solide“ = bei solider Spielweise). Antippen öffnet die Einstellung: je nach Stufe (Leicht und Normal Zahl, Schwer nur Trendpfeil), Zahl, nur Trend oder aus. Die Anzeige ändert sich bewusst nur am Zugbeginn, nicht nach Käufen, damit „Rückgängig“ kein Köder wird (`CHANCE_AFTER_BUY` in `src/ui/useWinChance.ts`). Am Partieende zeigt das Ergebnisblatt die Verlaufskurve mit dem größten Sprung. `npm run bench` misst die Rechenzeit.

Entwicklungshilfe im Dev-Modus: In der Browser-Konsole spielt `__arkanum.botStep()` einen Zug mit dem guten Bot, `__arkanum.getState()` zeigt den Spielstand.

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

## Online stellen

**Vercel** (empfohlen, Adresse ohne Unterpfad): Repository bei GitHub anlegen und pushen, dann auf vercel.com „Import“ wählen. `vercel.json` setzt Build und Ausgabeordner. Oder im Projektordner:

```bash
npx vercel
```

**GitHub Pages:** Der Workflow in `.github/workflows/pages.yml` baut bei jedem Push auf `main` und veröffentlicht nach `https://<nutzer>.github.io/<repo>/`. Er schaltet Pages beim ersten Lauf selbst ein; falls das fehlschlägt, einmalig unter `https://github.com/<nutzer>/<repo>/settings/pages` die Quelle „GitHub Actions“ wählen (geht auch im Handy-Browser). Der Unterpfad kommt über `VITE_BASE` in den Build.

Einmalig vom PC aus hochladen:

```bash
gh auth login
```

```bash
gh repo create arkanum --private --source . --push
```

Danach lässt sich alles Weitere am Handy erledigen: Der Workflow läuft von selbst, der Lauf ist in der GitHub-App unter „Actions“ sichtbar, die Adresse steht am Ende des Laufs unter „deploy“.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `src/engine/types.ts` | Spielstand, Aktionen, Ereignisse |
| `src/engine/rules.ts` | Regeln v2: `apply(state, action) → { state, events }` |
| `src/engine/rng.ts` | mulberry32, Zustand liegt im Spielstand |
| `src/engine/bots.ts` | Bots `gut`, `teuer`, `zufall` aus der Python-Referenz |
| `src/engine/sim.ts` | Partien zu Ende spielen, Siegchance schätzen (verdeckte Information wird neu gemischt) |
| `src/engine/sim.worker.ts` | Web Worker für die Live-Siegchance, liefert in zwei Hälften |
| `src/data/*.json` | Karten, Feinde, Omen, Orte, Stufen als Daten |
| `src/ui/` | Oberfläche (React): `Board.tsx` Spielfeld, `CoachMark.tsx` Hinweisblase, `useTutorial.ts` Schrittmotor, `useHints.ts` Kontexthinweise, `Grimoire.tsx`, `effects.tsx` Bewegung, `backs.tsx` Rückseiten |
| `src/data/tutorial.json` | Feste Aufstellung und Skript der Einführung |
| `tools/balance.ts` | Balance-Tabelle (Node) |
| `tools/bench.ts` | Rechenzeit der Siegchance |
| `tools/balance_sim.py` | Python-Referenz |

## Bewusste Festlegungen gegenüber der SPEC

Im Zweifel gilt das Verhalten von `balance_sim.py`:

- **Seelenzehrer:** Heilung ist für den ganzen Zug gesperrt, sobald er in der Feindphase aktiv war, auch wenn er in diesem Zug fällt.
- **Fluchweber:** legt in geraden Spielzügen (2, 4, 6 …) einen Schatten.
- **Schwäche-Treffer** werden beim Ausspielen jeder Karte sofort verrechnet (Auftrag), die Referenz rechnet sie nach allen Karten.
- **Staubwedelzauber:** Verbannen darf übersprungen werden; wählbar sind Hand und Ablage, nicht die in diesem Zug gespielten Karten.
- **Wut** gilt für jeden Feind, auch für den Fürsten und für Feinde ohne eigenen Schaden.
- **Zugbegrenzung:** Simulationen werten Partien ab Zug 41 als Niederlage, das Spiel selbst hat keine Grenze.
- **Einführung:** Beim ersten Start beginnt ohne Nachfrage die Einführung: eine echte Partie auf Leicht mit fester Aufstellung (`src/data/tutorial.json`), drei Lektionen, Hinweisblasen mit Aussparung, „Überspringen“ immer oben rechts. Fortschritt und Schrittzeiten liegen im Browser-Speicher (`arkanum.tutorial.v1`). Wiederholen über Menü → Grimoire → Regeln → „Einführung wiederholen“. Danach erklärt das Spiel beim ersten Auftreten je einmal: Betäubung, Wut, Regeneration, Fluchkrähe, Seelenzehrer, Siegchance, Sparen, Altar.

**Grimoire** (Menü): alle 85 Karten mit Filter nach Typ und Kosten, Feinde, Omen, Orte, Regeln auf einer Seite, Symbol-Legende, Rückseiten. Das „?“ in der Ortszeile öffnet die Regeln über dem Spielfeld.

**Siegchance:** Vor jeder simulierten Partie werden Nachziehstapel, Omen-Stapel, Marktstapel und die noch nicht erschienenen Feinde neu gemischt.
