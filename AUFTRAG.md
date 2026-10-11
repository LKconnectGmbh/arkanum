# Auftrag: Arkanum – spielbares Grundgerüst (Phase 1)

## Worum es geht
„Arkanum – Die Wächter von Mondfels“ ist ein kooperatives Solo-Deckbuilding-Kartenspiel fürs Handy, angelehnt an *Kampf um Hogwarts*, aber mit komplett eigener Welt. Es ist ein Geschenk für einen Freund. Das Spielkonzept ist fertig und per Simulation ausbalanciert. Jetzt soll daraus eine spielbare Web-App werden.

## Mitgelieferte Dateien
| Datei | Rolle |
| --- | --- |
| `SPEC.md` | Verbindliche Spezifikation: Regeln (v2), alle 85 Karten mit Werten, Stufen, Tutorial, Layout, Design-System, Technik, Abnahme. Bei Fragen gilt die SPEC. |
| `balance_sim.py` | Python-Referenz der Regeln und der drei Bots. Alle Zahlen in der SPEC stammen daraus. Bei Unklarheiten in der SPEC zeigt der Code, wie eine Regel gemeint ist. |
| `AUFTRAG.md` | Dieses Dokument. |

## Ziel dieser Session
Schritte 1–3 aus SPEC-Abschnitt „Umsetzung“:
1. **Engine + Kartendaten** in TypeScript, Gleichheitstest gegen die Python-Referenz besteht.
2. **Klickbares Grundgerüst**: alle sechs Zonen, Großansicht per Antippen, Ausspielen, Angreifen, Kaufen, Altar, Zugende, Sieg/Niederlage, drei Stufen. Schlichte, aber saubere Optik mit den Farb-Variablen aus dem Design-System; noch keine Illustrationen.
3. **Live-Siegchance** im Web Worker plus Verlaufskurve am Partieende.

**Nicht in dieser Session:** Tutorial, Grimoire, Rückseiten-Grafiken, Animationen über Basis-Übergänge hinaus, Hausfähigkeiten, Koop, Erweiterung. Plane die Architektur aber so, dass das Tutorial später nur an Ereignisse andockt (siehe SPEC „Technik“, Abschnitt Ereignisse).

## Technische Vorgaben
- Vite + React + TypeScript, als PWA installierbar und offline spielbar.
- Engine ohne DOM: `apply(state, action) → { state, events }`, seedbarer Zufall (z. B. mulberry32). Dieselbe Engine für Spiel, Worker und Balance-Skript.
- Karten, Feinde, Omen, Orte, Stufen als JSON in `src/data/`, Effekte als Bausteine (SPEC „Technik“). Keine Kartenlogik im UI.
- Bots aus `balance_sim.py` portieren (`gut`, `teuer`, `zufall` inkl. Altar-Verhalten). Der Bot `gut` treibt die Live-Siegchance.
- `tools/balance.ts` (Node) gibt dieselbe Tabelle aus wie `python3 balance_sim.py`.
- Spielstand lokal speichern, jeder Zugriff in `try/catch`; Neustart der App setzt die Partie fort.
- Layout: `100dvh`-Grid, Seite scrollt nie, Bezugsgröße 360 × 560 px, Tippziele ≥ 44 px (SPEC „Mobiles Layout“).

## Regeln, die im UI leicht falsch werden
- Abwerfen durch Moorspinne, Hexenmeisterin oder Omen „Verwirrung“: **der Spieler wählt** die Karte. Bei Betäubung wird zufällig abgeworfen.
- „Alle ausspielen“ spielt Ziehkarten zuerst.
- Angriff wird manuell verteilt (Antippen = +1, langes Drücken = bis zum Besiegen); Schwäche-Treffer passieren automatisch beim Ausspielen.
- Altar: einmal pro Zug, 4 ◆, 1 ☾; vor oder nach dem Kaufen.
- Regeneration: am Zugende, nur Akt II/III, nur wenn der Feind in diesem Zug keinen Schaden bekam (Schwäche-Treffer zählen als Schaden).
- Kaufen ist bis Zugende rückgängig zu machen (Schnappschuss pro Zug genügt).
- Bis zu 2 ◆ werden in den nächsten Zug mitgenommen.

## Vorgehen
1. Lies `SPEC.md` und `balance_sim.py` vollständig. Melde Widersprüche zwischen beiden **bevor** du baust; im Zweifel gilt das Verhalten von `balance_sim.py`.
2. Arbeite in den drei Etappen oben. Nach jeder Etappe: kurzer Stand, wie ich es teste, offene Fragen.
3. Weiche nicht still von der SPEC ab. Wenn etwas nicht geht oder schlecht wirkt, sag es und schlag eine Alternative vor.

## Abnahme dieser Session
- [ ] `tools/balance.ts` trifft die Siegquoten der Python-Referenz auf ±2 Punkte (3.000 Partien je Stufe und Bot).
- [ ] Eine komplette Partie ist auf Leicht, Normal und Schwer am Handy spielbar, von Start bis Sieg oder Niederlage.
- [ ] Auf 360 × 640, 390 × 844 und 430 × 932 scrollt nichts und nichts ist abgeschnitten, auch bei 130 % Systemschrift.
- [ ] Jede Karte ist überall per Antippen in voller Größe lesbar; keine Karte lässt sich versehentlich ausspielen.
- [ ] Live-Siegchance erscheint in unter 300 ms (Mittelklasse-Handy) und wird ehrlich als „bei solider Spielweise“ beschriftet.
- [ ] Keine Namen, Bilder, Wappen oder Schriftzüge aus Harry Potter, weder im Spiel noch im Code.

## Lieferung
Ein Repository mit README (Start, Test, Build), dazu eine Möglichkeit, das Spiel auf dem Handy zu öffnen (z. B. Vercel-Vorschau). Am Ende eine kurze Liste: was fertig ist, was abweicht, was offen ist.
