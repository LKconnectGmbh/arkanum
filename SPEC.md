# Arkanum – Spielkonzept & Umsetzungs-Spezifikation v1

Oct 11, 2026 · @Lukas

## Kurzfassung

Arkanum ist ein kooperatives Solo-Deckbuilding-Spiel für das Handy nach dem Vorbild von *Kampf um Hogwarts*, mit eigener Welt, 85 Karten und drei per Simulation geprüften Schwierigkeitsstufen. Alle Kartenwerte unten sind nicht geschätzt, sondern in über 100.000 simulierten Partien gemessen.

Die wichtigsten Entscheidungen:

- **Eigene Welt statt Lizenz:** Akademie Mondfels, eigene Häuser, Wesen und Feinde. Keine Namen, Bilder, Wappen oder Schriftzüge aus Harry Potter.
- **Solo zuerst:** Eine Heldin oder ein Held gegen das Spiel. Koop zu zweit kommt nach dem Prototyp.
- **Partie ca. 20 Züge, etwa 15 Minuten.** Passt in eine Pause.
- **Drei Stufen:** Leicht ≈ 97 %, Normal ≈ 53 %, Schwer ≈ 27 % Siegchance bei guter Spielweise.
- **Können zählt messbar:** Auf Normal gewinnt gutes Spiel 53 %, schematisches 37 %, zufälliges 10 %.
- **Zwei Regeln sorgen für Tiefe:** der Arkane Altar (4 ◆ gegen 1 ☾) und Regeneration der starken Feinde.
- **Tutorial als gespielte Partie** mit drei Mini-Lektionen, nie als Textwand, jederzeit überspringbar.
- **Kein Scrollen, kein Ziehen:** Antippen zum Vergrößern, Knöpfe zum Ausspielen.

Der Hauptkritikpunkt am Original – „kauf einfach die teuerste Karte“ – galt in Version 1 auch hier (nur 4 Punkte Abstand). Version 2 löst ihn mit zwei Regeln; Details im Abschnitt *Spieltiefe v2*.

## Vorbild: Kampf um Hogwarts

Das gesuchte Spiel ist *Harry Potter: Kampf um Hogwarts* (engl. *Hogwarts Battle*), ein kooperatives Deckbuilding-Kartenspiel von 2016, auf Deutsch ab 2019 bei Kosmos. Pro Zug wird eine Dunkle-Künste-Karte aufgedeckt, dann handeln die Bösewichte, dann spielt man Karten für Einfluss (kaufen) und Blitze (angreifen). Man gewinnt, wenn alle Bösewichte fallen, bevor alle Orte verloren sind.

| Kritik am Original | Quelle | Unsere Antwort |
| --- | --- | --- |
| Oft keine echte Entscheidung: man kauft einfach die teuerste Karte | [Miniature Market](https://www.miniaturemarket.com/reviewcorner/harry-potter-hogwarts-battle-review) | Kartenwerte per Simulation in ein Band gebracht; Schwächen der Feinde und Verbannen schaffen Entscheidungen. Noch nicht gelöst, siehe Balance-System |
| Schwierigkeit hat einen frühen Gipfel; der Endgegner wirkt am Ende schwach | [Man O' Kent Games](https://www.manokentgames.com/single-post/2019/11/11/harry-potter-hogwarts-battle) | Endgegner kommt zuletzt, Feinde werden mit jedem Akt stärker, „Wut“ bestraft Liegenlassen |
| Spätere Partien deutlich länger | [Board Game Quest](https://boardgamequest.com/harry-potter-hogwarts-battle-review) | Feste Partielänge um 17 Züge in allen Stufen |
| Viel Material, mühsamer Aufbau | [Miniature Market](https://www.miniaturemarket.com/reviewcorner/harry-potter-hogwarts-battle-review) | Entfällt digital; Partie startet mit einem Tipp |
| Mehr Spieler bedeutet mehr Schaden, Skalierung schwankt | [Meeple Mountain](https://www.meeplemountain.com/reviews/harry-potter-hogwarts-battle-review-muggles-and-wizards-delight/) | Prototyp ist solo; Koop wird eigens simuliert |

Lob, das wir übernehmen: leichter Einstieg für Neulinge im Deckbuilding und ein Schwierigkeitsanstieg über mehrere Stufen.

## Eigene Welt und IP-Rahmen

Das Spiel heißt **Arkanum – Die Wächter von Mondfels** und spielt an einer eigenen Zauberakademie. Stimmung, Farbwelt und Spielgefühl dürfen an Zauberschul-Geschichten erinnern; Namen, Figuren, Wappen, Filmbilder und Schriftzüge aus Harry Potter kommen nirgends vor, auch nicht als Platzhalter.

| Häuser von Mondfels | Tugend | Farben | Wappentier |
| --- | --- | --- | --- |
| Glutfalke | Mut | Karminrot und Gold | Falke mit Flammenschwingen |
| Nebelwurz | List | Tannengrün und Silber | Alraune im Nebel |
| Sternrabe | Weisheit | Nachtblau und Bronze | Rabe mit Sternenkrone |
| Erdhirsch | Treue | Ocker und Tiefbraun | Hirsch mit Wurzelgeweih |

Im Prototyp ist das Haus nur Farbthema und Wappen auf dem Heldenbrett. Hausfähigkeiten kommen erst, wenn sie einzeln simuliert sind.

Die Welt in drei Kartenfamilien:

- **Zauber** (Arkanblau): Lichtfunke, Bannkreis, Läuterung – gesprochene Magie.
- **Objekte** (Bronze): Folianten, Kristalle, Kessel, Spiegel – Werkzeuge der Akademie.
- **Wesen** (Waldgrün): Botenkauz, Silberotter, Sturmfeder-Greif, Nachtschwingen-Drache – magische Verbündete.

Gegenspieler sind die Schatten: Irrlichter, Moorspinnen, Knochenwölfe, Seelenzehrer, ein Schattendrache und als Endgegner der Namenlose Fürst.

Regeln für alle Inhalte, auch für die spätere Erweiterung:

- [ ] Jeder Karten- und Figurenname wird vor Aufnahme gegen bekannte Fantasy-Marken geprüft.
- [ ] Bilder sind eigene Illustrationen oder eigene SVG-Siegel, keine Film- oder Spielgrafiken.
- [ ] Schriften nur mit freier Lizenz (z. B. Google Fonts, OFL).

## Regelwerk v2

Du gewinnst, wenn der Namenlose Fürst fällt. Du verlierst, wenn der dritte Ort voller Schatten ist. Genau diese Regeln sind in der Simulation umgesetzt; was hier steht, muss der Code exakt so tun.

**Ressourcen**

| Symbol | Name | Wofür | Am Zugende |
| --- | --- | --- | --- |
| ◆ | Einfluss | Karten im Markt kaufen | bis zu 2 bleiben gespart, Rest verfällt |
| ⚡ | Angriff | Schaden an Feinden | verfällt; Schaden am Feind bleibt dauerhaft |
| ♥ | Leben | Puffer gegen Schaden, Start 10 (Leicht 12) | bleibt |
| ☾ | Schatten | Zähler auf dem aktuellen Ort | bleibt |
| ⛨ | Schild | blockt Schaden | gilt bis Ende der Feind-Phase des nächsten Zugs |

**Aufbau:** Startdeck (10 Karten) mischen, 5 Handkarten ziehen. Sechs Marktkarten offen. Feindstapel: 2 zufällige aus Akt I, darunter 2 aus Akt II, darunter 1 aus Akt III; der Endgegner liegt getrennt. Zwei Feinde sind aktiv. Drei Orte mit Platz für 4, 5 und 5 Schatten (Schwer: 4, 4 und 5).

**Ein Zug in vier Phasen:**

1. **Omen:** Oberstes Omen aufdecken und ausführen. Ab dem dritten Ort zwei Omen (nicht auf Leicht). Ist der Omen-Stapel leer: neu mischen und 1 Schatten legen.
2. **Feinde:** Jeder aktive Feind löst seine Fähigkeit aus. **Wut:** Ein Feind, der schon 3 Züge im Spiel ist, macht ab dem 4. Zug 1 Schaden mehr.
3. **Aktion:** Handkarten ausspielen (einzeln oder alle per Knopf), dann Angriff auf Feinde verteilen, dann kaufen.
   - **Schwäche:** Jede ausgespielte Karte vom Schwäche-Typ eines aktiven Feindes macht diesem automatisch 1 Schaden.
   - Fällt ein Feind, rückt der nächste sofort nach; übriger Angriff darf auf ihn.
   - **Arkaner Altar:** Einmal pro Zug 4 ◆ zahlen und 1 ☾ vom aktuellen Ort entfernen, vor oder nach dem Kaufen.
   - Gekaufte Karten kommen auf den Ablagestapel.
4. **Aufräumen:** Zuerst **Regeneration:** Feinde aus Akt II und III, die in diesem Zug keinen Schaden bekamen, heilen 2. Dann gespielte Karten ablegen, 5 nachziehen (Ablage wird gemischt, wenn der Stapel leer ist). Die Marktkarte ganz links verfällt, alle rücken nach, rechts kommt eine neue.

**Sonderfälle**

- **Betäubt:** Fällt Leben auf 0: 1 Schatten legen, die Hälfte der Handkarten zufällig abwerfen, Leben wieder voll.
- **Ort fällt:** Ist ein Ort voll, kommt der nächste ins Spiel; überzählige Schatten wandern mit.
- **Endgegner:** Kommt erst, wenn alle fünf anderen Feinde besiegt sind.
- **Verbannen:** Eine Karte verlässt das Spiel endgültig. Wichtigstes Mittel, das Deck zu verbessern.

## Kartenset v1

Das Grundspiel hat 85 Karten: 10 Startkarten, 47 Marktkarten (20 verschiedene), 9 Feinde, 16 Omen und 3 Orte. Für den Prototyp ist das genug Abwechslung; die Erweiterung setzt hier an.

**Startdeck (10 Karten, Typ „Grund“, keine Schwäche-Treffer)**

| Karte | Anzahl | Effekt |
| --- | --- | --- |
| Funkenzauber | 7 | +1 ◆ |
| Übungsstab | 3 | +1 ⚡ |

**Markt (47 Karten).** „Wert je Kosten“ = gemessener Gewinn an Siegchance in Prozentpunkten je Kostenpunkt gegenüber einer Füllkarte (Normal). Zielband 7–10.

| Karte | Typ | Kosten | Effekt | Anzahl | Wert je Kosten |
| --- | --- | --- | --- | --- | --- |
| Lichtfunke | Zauber | 2 | +1 ⚡, +1 ♥ | 4 | 10,0 |
| Spiegel der Weitsicht | Objekt | 2 | +1 ◆, +1 ♥. Sieh das nächste Omen an; ist es schädlich, wirf es ab | 2 | 7,4 |
| Kräutertrank | Objekt | 3 | +1 ◆, +2 ♥ | 3 | 7,3 |
| Glimmerkristall | Objekt | 3 | +2 ◆ | 4 | 7,7 |
| Feuerkobold | Wesen | 3 | +2 ⚡, du verlierst 1 ♥ | 3 | 10,1 |
| Botenkauz | Wesen | 4 | Ziehe 1 Karte, +1 ◆ | 3 | 9,1 |
| Staubwedelzauber | Zauber | 4 | Verbanne 1 Karte aus Hand oder Ablage, +1 ◆ | 3 | 9,4 |
| Schildbann | Zauber | 4 | +1 ⚡, +2 ⛨ | 3 | 8,1 |
| Silberotter | Wesen | 4 | +1 ⚡, +1 ◆, +1 ♥ | 3 | 9,0 |
| Funkenregen | Zauber | 5 | +3 ⚡ | 3 | 9,5 |
| Alter Foliant | Objekt | 5 | Ziehe 2 Karten | 2 | 8,1 |
| Läuterung | Zauber | 5 | Entferne 1 ☾ | 2 | 8,3 |
| Goldener Kessel | Objekt | 5 | +3 ◆ | 2 | 8,2 |
| Erinnerungsphiole | Objekt | 5 | +2 ◆, ziehe 1 Karte | 2 | 9,2 |
| Sturmfeder-Greif | Wesen | 6 | +3 ⚡. Besiegst du in diesem Zug einen Feind: +1 ◆ | 2 | 8,6 |
| Junger Phönix | Wesen | 6 | +3 ♥, +1 ⚡, ziehe 1 Karte | 1 | 8,2 |
| Sternenzirkel | Zauber | 6 | +1 ⚡, +2 ⚡ je weiterem Zauber in diesem Zug (max. +6) | 1 | 5,5\* |
| Bannkreis | Zauber | 7 | +2 ⚡, entferne 1 ☾ | 2 | 7,8 |
| Nachtschwingen-Drache | Wesen | 7 | +4 ⚡, +1 ◆ | 1 | 7,9 |
| Herz der Akademie | Objekt | 7 | +2 ⚡, +2 ◆, ziehe 1 Karte | 1 | 7,8 |

\* Kombokarte: unterbewertet, weil der Test sie in ein Deck ohne andere Zauber legt.

Typverteilung im Markt: 18 Zauber, 16 Objekte, 13 Wesen. So trifft jedes Deck Schwächen, ein gezielt gebautes trifft sie öfter.

**Feinde (Schaden bleibt, bis der Feind fällt)**

| Akt | Feind | Leben | Schwäche | Fähigkeit pro Zug | Belohnung |
| --- | --- | --- | --- | --- | --- |
| I | Irrlicht-Schemen | 4 | Zauber | 1 Schaden | +2 ♥ |
| I | Moorspinne | 5 | Wesen | Wirf 1 Handkarte ab | +1 ◆, +1 ♥ |
| I | Fluchkrähe | 5 | Objekt | Erster Kauf im Zug kostet +1 | Entferne 1 ☾ |
| II | Knochenwolf | 6 | Zauber | 2 Schaden | +3 ♥ |
| II | Fluchweber | 6 | Wesen | In jedem zweiten Zug +1 ☾ | Entferne 1 ☾, +1 ◆ |
| II | Seelenzehrer | 7 | Objekt | 1 Schaden; solange er lebt, keine Heilung | +4 ♥ |
| III | Schattendrache | 8 | Zauber | 2 Schaden | Entferne 2 ☾ |
| III | Graue Hexenmeisterin | 8 | Wesen | 1 Schaden, wirf 1 Handkarte ab | Entferne 1 ☾, +3 ♥ |
| Ende | Der Namenlose Fürst | 16 | keine | 1 Schaden, +1 ☾ | Sieg |

Feinde aus Akt II und III haben **Regeneration 2** (siehe Regelwerk). Der Fürst hat 13 / 16 / 16 Leben auf Leicht / Normal / Schwer; auf Schwer haben alle anderen Feinde 1 Leben mehr. Abgeworfen wird immer die schwächste Handkarte (der Spieler wählt, der Bot nimmt Startkarten).

**Omen (16 Karten)**

| Omen | Anzahl | Wirkung |
| --- | --- | --- |
| Schattenflüstern | 4 | +1 ☾ |
| Fluchstich | 4 | 1 Schaden |
| Kältehauch | 2 | 2 Schaden (auf Leicht durch Atempause ersetzt) |
| Verwirrung | 2 | Wirf 1 Handkarte ab |
| Finsternis | 2 | +1 ☾, 1 Schaden |
| Atempause | 2 | keine |

**Orte:** Bibliothek der Stille (4 ☾), Gewächshaushof (5 ☾), Sternwarte (5 ☾); auf Schwer hat der Gewächshaushof nur 4 ☾.

## Spielmodi und Schwierigkeit

Der Prototyp hat zwei Modi: **Einführung** (das Tutorial als echte Partie auf Leicht) und **Freies Spiel** in drei Stufen. Danach folgen in dieser Reihenfolge: Tagesrätsel (gleicher Zufallsstart für alle, einmal pro Tag), Koop zu zweit am selben Gerät, und die Erweiterung als zuschaltbares Kartenpaket.

Die drei Stufen unterscheiden sich nur in wenigen Stellschrauben, alle in der Datei für Schwierigkeit:

| Stellschraube | Leicht | Normal | Schwer |
| --- | --- | --- | --- |
| Start-Leben | 12 | 10 | 10 |
| Platz für Schatten je Ort | 4 / 5 / 5 | 4 / 5 / 5 | 4 / 4 / 5 |
| Omen pro Zug am 3. Ort | 1 | 2 | 2 |
| Kältehauch im Omen-Stapel | ersetzt durch Atempause | 2× | 2× |
| Leben der Feinde | Grundwert | Grundwert | +1 |
| Leben des Fürsten | 13 | 16 | 16 |
| Live-Siegchance sichtbar | immer | per Schalter | nur Trendpfeil |

&#91;embedded content: Eigene Simulation (balance\_sim.py, Regeln v2), 6.000 Partien je Balken, Stand 11.10.2026\]

Leicht verzeiht Fehler (auch zufälliges Spiel gewinnt 59 %) und liegt mit 97 % bewusst knapp über dem Zielband. Normal belohnt Können deutlich (53 % gegen 10 %), Schwer verlangt es (27 % gegen 2 %). Schwer liegt am unteren Rand des Zielbands (24–27 % je nach Stichprobe); wird es im Test als zu hart empfunden, bekommt der Fürst 15 statt 16 Leben. Ein guter menschlicher Spieler liegt über dem Bot.

## Balance-System

Balance wird gemessen, nicht geschätzt: Dieselbe Spiellogik wie in der App läuft ohne Oberfläche tausende Partien mit drei Bots (gut, teuer, zufällig). Jede neue Karte und jede Wertänderung muss diese Prüfungen bestehen, bevor sie ins Spiel kommt.

| Kennzahl | Ziel | Stand v2 |
| --- | --- | --- |
| Siegquote gutes Spiel | Leicht 85–95 %, Normal 45–55 %, Schwer 25–35 % | 97,2 / 52,7 / 26,8 % |
| Könnens-Spanne Normal (gut minus zufällig) | ≥ 25 Punkte | 42 Punkte |
| Entscheidungstiefe Normal (gut minus schematisch) | ≥ 8 Punkte | 16 Punkte (v1: 4) |
| Wert je Kostenpunkt jeder Marktkarte | 7–10 | 8,0–10,6 (außer Kombokarte) |
| Partielänge bis Sieg | höchstens 21 Züge | 18,6–21,0 Züge |

&#91;embedded content: Eigene Simulation (Ablationstest), Normal, finaler Regelstand v1, 3.000 Partien je Zeile\]

Daraus folgt für das Tutorial: Kaufen und Verbannen müssen sitzen; Zielwahl ist zweitrangig.

**Prüfablauf für neue Karten (auch Erweiterung)**

1. Karte als Datensatz anlegen.
2. Wert je Kosten messen: Karte einmal ins Startdeck, 3.000 Partien, Vergleich mit einer Füllkarte. Außerhalb 7–10 → Kosten oder Effekt anpassen.
3. Alle Stufen neu simulieren; Zielquoten müssen halten.
4. Erst dann in den Markt.

**Live-Siegchance im Spiel**

- Zu Beginn jedes Zugs und nach jedem Kauf spielt ein Web Worker 200 Partien vom aktuellen Stand mit dem guten Bot zu Ende (unter 300 ms auf Mittelklasse-Handys als Ziel).
- Anzeige als Zahl mit Band, z. B. „58 % ±7“, und Trendpfeil gegenüber dem letzten Zug. Genauigkeit bei 200 Partien etwa ±7 Punkte (95 %).
- Beschriftung ehrlich: „Siegchance bei solider Spielweise“. Der Bot ist eine Heuristik, kein perfekter Spieler.
- Nach der Partie: Verlaufskurve der Siegchance über alle Züge, mit Markierung des Zugs mit dem größten Sprung.

**Kauf-Tiefe:** In v1 lag kluges Spiel nur rund 4 Punkte vor „immer die teuerste Karte“. Die Lösung steht im nächsten Abschnitt.

## Spieltiefe v2: Altar und Regeneration

Zwei neue Regeln vervierfachen den Vorsprung guten Spiels: Auf Normal gewinnt kluges Spiel 53 %, schematisches 37 %, zufälliges 10 %. Vorher waren es 53 / 49 / 19 %.

&#91;embedded content: Eigene Simulation, Normal; v1: 10.000 Partien je Balken, v2: 6.000 Partien je Balken\]

**Warum gutes Spiel bisher wenig zählte:** Alle Karten werden immer ausgespielt, und seit dem Balancing entsprechen die Kosten fast genau dem Wert. Damit war die teuerste Karte fast immer richtig. Tiefe entsteht nur durch Entscheidungen, deren richtige Antwort vom Spielstand abhängt und die etwas kosten.

**Fünf Ideen, einzeln gemessen** (Normal, 4.000 Partien je Wert)

| Idee | Regel im Test | Vorsprung gut vor schematisch | Urteil |
| --- | --- | --- | --- |
| Arkaner Altar | 4 ◆ zahlen: 1 ☾ entfernen, einmal pro Zug | 14 Punkte (gegen einen Spieler, der ihn im Notfall nutzt) | übernommen |
| Regeneration | Feinde ab Akt II heilen 2, wenn im Zug nicht getroffen | +1 Punkt, aber +4 gegen zufälliges Spiel | übernommen: belohnt Bündeln, gleicht den Altar aus |
| Wahlkarten | 3 Karten mit „Wähle: A oder B“ | ±0 | nicht im Grundspiel; mit Menschen testen |
| Ort-Eigenschaften | Bibliothek: Zauber −1 Kosten; Gewächshaushof: Wesen +1 ♥; Sternwarte: Objekte +1 ◆ | ±0, Spiel 22 Punkte leichter | als Abwechslung für die Erweiterung, nicht für Tiefe |
| Flüche | 3 Omen legen eine tote Karte (−1 ♥) ins Deck | −3, Spiel 32 Punkte schwerer | Kandidat für einen Modus „Schwer+“ |

Der Altar wirkt, weil er die beste Spannung im Genre erzeugt: Jeder Gebrauch ist eine Karte weniger im Deck. Für 3 ◆ war er zu billig (93 % Siegquote), für 5 ◆ zu teuer (kaum Wirkung).

**Neue Regeln, exakt**

- **Arkaner Altar:** In der Aktionsphase einmal pro Zug: 4 ◆ zahlen, 1 ☾ vom aktuellen Ort entfernen. Darf vor oder nach dem Kaufen genutzt werden.
- **Regeneration 2:** Feinde aus Akt II und III heilen am Zugende 2 Schaden, wenn sie in diesem Zug keinen Schaden bekommen haben. Schwäche-Treffer zählen als Schaden. Der Endgegner regeneriert nicht.

**Was gutes Spiel jetzt ausmacht** (aus den Bot-Unterschieden): den Altar früh nutzen, sobald der Ort zwei Plätze vor voll ist, nicht erst im Notfall; Angriff auf einen Feind bündeln; Startkarten verbannen; nach Lage kaufen statt nach Preis. Genau diese vier Punkte vermittelt das Tutorial.

**Preis der Änderung:** Partien dauern 2–3 Züge länger (Normal 19,8 statt 17,1 Züge, gut 15 Minuten). Alle Marktkarten bleiben im Zielband (8,0–10,6 Punkte je Kostenpunkt; Sternenzirkel wie bisher darunter).

**Weitere Ideen, noch nicht simuliert** (nach erwartetem Nutzen)

1. **Vorbereiten:** Eine Handkarte darf in den nächsten Zug mitgenommen werden. Belohnt Planung über Züge hinweg.
2. **Feinde mit Konter:** zwei Feinde Vorschau, dazu Eigenschaften wie „nimmt nur Schaden ab 3 auf einmal“ oder „der erste Angriff jedes Zugs prallt ab“. Man baut das Deck gegen kommende Bedrohungen.
3. **Opferkarten:** „Verbanne diese Karte: +4 ⚡“. Einmaliger Spitzenwert gegen Dauerwert.
4. **Markt reservieren:** Für 1 ◆ eine Marktkarte vor der Rotation sichern.
5. **Ort-Ereignisse und Flüche** als Modifikatoren für Tagesrätsel und „Schwer+“: Abwechslung statt Tiefe.

Einschränkung: Die Bots sind Heuristiken. Ob Menschen den Altar so klug nutzen wie der gute Bot, zeigt erst der Test mit echten Spielern.

## Tutorial und Onboarding

Das Tutorial ist die erste echte Partie auf Leicht: sechs Züge, drei Mini-Lektionen, höchstens drei Hinweise pro Lektion, Ziel unter vier Minuten. Wer es überspringt, spielt dieselbe Partie ohne Hinweise weiter.

**Was die Recherche sagt – und was wir daraus machen**

| Befund | Quelle | Umsetzung |
| --- | --- | --- |
| Fragt man „Tutorial spielen?“, lehnen rund 70 % ab und stehen dann ratlos im Spiel | [PlaytestCloud](https://blog.playtestcloud.com/mistakes-mobile-game-tutorials/) | Keine Frage beim ersten Start; Einführung startet direkt, „Überspringen“ ist immer sichtbar |
| Jede Mechanik mindestens zweimal ausführen lassen | [PlaytestCloud](https://blog.playtestcloud.com/mistakes-mobile-game-tutorials/) | Kaufen und Angreifen kommen je in zwei Zügen dran |
| Früh zu viele Wahlmöglichkeiten verwirren | [PlaytestCloud](https://blog.playtestcloud.com/mistakes-mobile-game-tutorials/) | Während einer Lektion ist nur das Ziel-Element antippbar; Menü erst nach Lektion 1 |
| Spieler lesen keine Textwände; lernen durch Tun | [GDevelop](https://gdevelop.io/blog/mobile-ux-mistakes), [UX Planet](https://uxplanet.org/mobile-onboarding-interact-don-t-tell-f0c35da2b2b4) | Jeder Schritt verlangt eine Handlung, kein Schritt nur zum Lesen |
| Abbruch häuft sich ab Schritt 3 mehrstufiger Abläufe | [Onboarding-Referenz](https://cdn.jsdelivr.net/npm/@hegemonart/get-design-done@1.60.4/reference/onboarding-progressive-disclosure.md) | Drei Lektionen à höchstens drei Hinweise statt einer langen Tour |
| Hinweis nie über das erklärte Element legen; immer schließbar | [Adobe Spectrum](https://spectrum.adobe.com/page/coach-mark), [Onboarding-Referenz](https://cdn.jsdelivr.net/npm/@hegemonart/get-design-done@1.60.4/reference/onboarding-progressive-disclosure.md) | Platzierungsregel unten; Ziel bleibt frei und antippbar |
| Ein Satz pro Hinweis, einer gleichzeitig | [AppStorys](https://appstorys.com/blog-Coach-Marks-Spotlight-UI-Onboarding), [Flowmapp](https://www.flowmapp.com/blog/qa/coach-marks) | Maximal 80 Zeichen, nie zwei Hinweise zugleich |
| Wiederkehrende Hinweise nerven am meisten | [Dolfy](https://www.dolfy.ai/blog/feature-discovery-tooltips-coachmarks-mobile-apps) | Jeder Hinweis erscheint genau einmal; Erledigtes wird gespeichert |
| Hängenbleiben sieht nur, wer frisch ins Spiel kommt | [Bugnet](https://bugnet.io/blog/how-to-fix-a-tutorial-players-keep-getting-stuck-on) | Jeder Schritt wird lokal mit Zeit protokolliert; Testen mit Personen, die das Spiel nicht kennen |
| Bei Vergrößerung verlieren Sehschwache den Bezug | [WebAIM](https://webaim.org/discussion/mail_message?id=40946) | Hinweis nennt das Ziel mit Symbol und Namen („◆ Markt: Glimmerkristall“) |

**Skript der Einführung** (fester Zufallsstart: Startdeck, Markt, Feinde und Omen liegen in vorgegebener Reihenfolge)

| Zug | Hervorgehoben | Hinweistext | Erwartete Handlung | Rückmeldung |
| --- | --- | --- | --- | --- |
| 1 | Handkarte | Tippe eine Karte an, um sie groß zu sehen. | Karte antippen | Großansicht öffnet |
| 1 | Knopf „Ausspielen“ | Spiel alle Karten aus, um ◆ und ⚡ zu sammeln. | Alle ausspielen | Zähler zählen hoch |
| 1 | Glimmerkristall im Markt | Für 3 ◆ kaufst du den Glimmerkristall. | Karte kaufen | Karte fliegt auf die Ablage: „Kommt bald auf die Hand.“ |
| 2 | Markt (nur Rahmen) | Kauf wieder etwas – Lichtfunke ist ein Zauber. | Lichtfunke kaufen | wie oben |
| 3 | Irrlicht-Schemen | Das Irrlicht trifft dich jeden Zug. Tippe es an, um ⚡ zuzuweisen. | Feind antippen | Schadenszahl, Lebensbalken sinkt |
| 3 | Schwäche-Symbol am Irrlicht | Zauber treffen seine Schwäche: +1 Schaden ganz von selbst. | – (Weiter) | Lichtfunke leuchtet beim Ausspielen |
| 4 | Irrlicht | Besiege es – Feinde geben Belohnungen. | ⚡ zuweisen bis 0 | Belohnung fliegt zu ♥ |
| 5 | Omen-Karte, dann Ortsleiste | Ein Omen legt Schatten auf den Ort. Ist der Ort voll, fällt er. | – (Weiter) | Schatten-Symbol pulsiert einmal |
| 5 | Staubwedelzauber im Markt | Verbannen wirft schwache Karten für immer raus. | Karte kaufen | – |
| 6 | Funkenzauber in der Hand | Verbanne jetzt einen Funkenzauber. | Karte wählen | Karte zerfällt in Funken |

Danach: „Das war das Wichtigste. Spiel die Partie zu Ende.“ Sobald ein Ort zum ersten Mal zwei Plätze vor voll ist, kommt ein letzter Pflicht-Hinweis am Altar: „Der Altar tilgt Schatten für 4 ◆ – lieber früh als zu spät.“ Alles Weitere erklärt das Spiel beim ersten Auftreten, höchstens ein Hinweis pro Zug: erste Betäubung, erste Wut, erste Regeneration, Fluchkrähe-Aufschlag, Seelenzehrer, Live-Siegchance, Sparen von Einfluss.

**Regeln für Hinweisblasen (für den Code)**

1. **Abdunkeln mit Aussparung:** Schleier 60 % Deckkraft, das Ziel bleibt frei (8 px Rand, gleiche Eckenrundung) und antippbar. Alles andere ist gesperrt, außer „Überspringen“ oben rechts und der Blase selbst.
2. **Platzierung:** Zielrechteck messen, erst wenn Layout und Animationen fertig sind; neu messen bei Drehung, Größenänderung und `visualViewport`-Änderung. Kandidaten in dieser Reihenfolge: unterhalb, oberhalb, rechts, links (seitlich nur ab 600 px Breite). Gewählt wird der erste, der ganz in den sicheren Bereich (`env(safe-area-inset-*)` plus 12 px) passt und weder Ziel noch den erwarteten Knopf überdeckt.
3. **Kein Platz:** Blase als schmale Leiste an den gegenüberliegenden Bildschirmrand (Ziel unten → Leiste oben). Pfeil zeigt immer auf die Zielmitte, an den Blasenrand geklemmt.
4. **Größe:** Breite höchstens `min(320px, 100vw − 32px)`, Schrift 16 px, höchstens zwei Zeilen. Wächst mit der Systemschriftgröße; danach Platzierung neu prüfen.
5. **Weiterkommen:** Nie per Zeitablauf. Bei Handlungsschritten kein „Weiter“-Knopf, sondern der Schritt endet mit der Handlung. Falscher Tipp: Ziel wackelt kurz, kein Fehlertext. Nach drei Fehltipps erscheint „Zeig’s mir“ mit animierter Hand.
6. **Barrierefreiheit:** Blase als `role="dialog"` mit `aria-live="polite"`, nennt Symbol und Namen des Ziels; Fokus springt auf das Ziel; `prefers-reduced-motion` schaltet Wackeln und Fliegen ab.
7. **Fortschritt speichern:** Lektionsstand lokal (in `try/catch`), Fortsetzen nach Neustart. Wiederholen jederzeit über Menü → Grimoire → „Einführung wiederholen“.

**Hilfe nach dem Tutorial**

- **Grimoire:** Kartenlexikon aller 85 Karten (Filter nach Typ und Kosten), Regeln auf einer Bildschirmseite, Symbol-Legende.
- **„?“-Knopf** in der Kopfleiste öffnet die Regeln als Bottom Sheet über dem Spiel, das Spielfeld bleibt sichtbar.
- **Langes Drücken** auf Feind, Ort oder Zähler zeigt dessen Erklärung in einem Satz.

## Mobiles Layout

Das ganze Spielfeld passt ohne Scrollen auf 360 × 560 CSS-Pixel Nutzfläche – das ist ein kleines Android-Handy mit eingeblendeter Browserleiste. Der Trick: Auf dem Feld zeigen Karten nur Kosten, Name und Effekt-Symbole; der volle Text kommt per Antippen in der Großansicht.

&#91;embedded content: Spielfeld im Hochformat · 6 Zonen, Bezugsgröße 360 × 560 px\]

Die Zonen teilen sich die Höhe im Verhältnis 40 : 112 : 140 : 36 : 172 : 60 und wachsen auf größeren Geräten anteilig mit.

**Feste Maße für den Code**

| Element | Maß bei 360 × 560 | Regel |
| --- | --- | --- |
| Gesamtlayout | `height: 100dvh`, CSS-Grid mit sechs Zeilen | Seite scrollt nie; `env(safe-area-inset-*)` als Innenabstand |
| Seitenrand | 16 px | gleich auf allen Zonen |
| Marktkachel | 104 × 66 px (Querformat) | 8 px Abstand zwischen Kacheln |
| Feindkachel | 160 × 104 px | Lebensbalken, Schwäche-Symbol, Wut-Zähler sichtbar |
| Handkarte | 114 × 160 px (5 : 7) | überlappend; jede mindestens 44 px breit sichtbar |
| 6 oder mehr Handkarten | bei 6 Karten 100 × 140 px (46 px sichtbar) | ab 7 Karten wird nur die Hand seitlich wischbar, mit Randverlauf als Hinweis (bis 5 Karten: 54 px sichtbar) |
| Tippziele | mindestens 44 × 44 px | mindestens 8 px Abstand, Hauptknöpfe 48 px hoch |
| Kleinste Schrift auf dem Feld | 12 px | Zahlen und Symbole 16 px oder größer |

Die 44-px-Grenze folgt Apple (44 pt) und Google Material (48 dp) sowie WCAG 2.5.5 ([Frontend Checklist](https://frontendchecklist.io/rules/accessibility/touch-targets)); 8 px Mindestabstand empfehlen beide Plattformen ([OpenReplay](https://blog.openreplay.com/improving-tap-targets-mobile-ux/)).

**Bedienung**

- **Antippen = Großansicht**, bei jeder Karte überall (Hand, Markt, Feind, Ablage). Großansicht: 80 % der Breite, Text 16 px, darunter genau die passenden Knöpfe („Ausspielen“, „Kaufen für 3 ◆“, „Verbannen“). Schließen per Tipp daneben oder Wisch nach unten.
- **Kein Ziehen zum Ausspielen.** Bei *Slay the Spire* mobil klagen Spieler über versehentlich gespielte Karten und zu kleine Texte ([TouchArcade](https://toucharcade.com/?p=268940), [Android Central](https://www.androidcentral.com/slay-spire-android-game-week)). Darum: Antippen öffnet, ein Knopf löst aus.
- **„Alle ausspielen“** spielt zuerst Ziehkarten, dann den Rest. Einzelnes Ausspielen bleibt möglich.
- **Angriff zuweisen:** Feind antippen = +1 ⚡ auf ihn; langes Drücken = so viel wie zum Besiegen nötig. Rückgängig, solange der Zug läuft.
- **Kaufen** fragt nie nach, ist aber bis Zugende per „Rückgängig“ umkehrbar.
- **Zug beenden** warnt nur, wenn noch ◆ über 2 oder ⚡ ungenutzt sind.

**Altar:** eigener Knopf in der Ressourcenleiste („Altar · 4 ◆“, 44 px hoch). Aktiv nur mit mindestens 4 ◆, mindestens 1 ☾ und noch nicht benutzt in diesem Zug; leuchtet, sobald der Ort zwei Plätze vor voll ist.

**Querformat und Tablets (ab 700 px Breite):** Feinde und Orte links, Markt rechts, Hand und Aktionen über die volle Breite unten. Gleiche Komponenten, nur anderes Grid.

**Prüfgeräte vor jeder Freigabe:** 360 × 640, 390 × 844, 430 × 932, iPad hochkant, jeweils mit Systemschrift 100 % und 130 %, hell und dunkel.

## Design-System

Der Look ist „Nacht über der Akademie“: tiefes Blau als Bühne, Karten wie altes Pergament mit Goldrand, Magie als Licht statt als Schatten. Alles ist in CSS-Variablen definiert, damit Design und Code dieselben Namen benutzen.

**Farben**

| Variable | Wert | Verwendung |
| --- | --- | --- |
| `--nacht` | #0E1020 | Hintergrund |
| `--nacht-2` | #171A33 | Zonenflächen, Blasen |
| `--sternweiss` | #F4F1E8 | Text auf Nacht |
| `--pergament` | #EFE3C4 | Kartenfläche |
| `--tinte` | #2A2118 | Text auf Pergament |
| `--gold` | #C9A24B | Rahmen, Kostenmünze, Einfluss |
| `--zauber` | #6E7BFF | Typ Zauber (Arkanblau) |
| `--objekt` | #B8823A | Typ Objekt (Bronze) |
| `--wesen` | #3F9A6E | Typ Wesen (Waldgrün) |
| `--blitz` | #F2C14E | Angriff |
| `--leben` | #D9534F | Leben, Schaden |
| `--schild` | #8FB7D9 | Schild |
| `--schatten` | #7B4FA8 | Schatten, Omen |
| `--feind` | #9E2B3A | Feindkarten, Wut |

Kartentyp nie nur über Farbe: Zauber trägt eine Sternraute, Objekt ein eckiges Siegel, Wesen einen Kreis mit Pfote. So bleibt alles bei Farbfehlsichtigkeit lesbar. Textkontrast mindestens 4,5 : 1.

**Schrift** (beide frei, Google Fonts, OFL)

- **Cinzel** für Titel, Kartennamen, Kostenzahlen.
- **Alegreya Sans** für Regeltext, Hinweise, Zähler (mit `font-variant-numeric: tabular-nums`).
- Größen: 12 / 14 / 16 / 20 / 28 px. Kartentext in der Großansicht 16 px.

**Abstände und Formen:** Raster 4 px, Stufen 4 / 8 / 12 / 16 / 24 / 32. Eckenradien 6 (Kacheln), 10 (Karten), 16 (Blasen, Sheets). Tiefe entsteht durch sanftes Leuchten in der Typfarbe, nicht durch harte Schatten.

**Aufbau einer Karte (Großansicht, Seitenverhältnis 5 : 7)**

1. Doppelter Goldrahmen, 3 % der Breite.
2. Kostenmünze oben links, Durchmesser 22 % der Breite, Zahl in Cinzel fett.
3. Typ-Juwel oben rechts mit Form und Farbe des Typs.
4. Bildfenster, 46 % der Höhe: eigene Illustration; im Prototyp ein generiertes Emblem aus Typ-Form und einem Motiv-Glyph je Karte.
5. Namensband in Cinzel.
6. Effektzeile mit großen Symbolen („+2 ◆“), darunter der Regeltext.
7. Fußzeile: Typname und Anzahl im Spiel (z. B. „Wesen · 2×“).

Kompaktkachel im Markt: links 4 px Streifen in Typfarbe, Kostenmünze, Name (12 px), Effekt als Symbole (16 px). Feindkachel: Name, Lebensbalken mit Zahl, Schwäche-Symbol, Fähigkeit als Symbolzeile, Wut-Zähler als drei Punkte.

**Rückseiten** (je ein SVG, um 180° symmetrisch, damit die Ausrichtung egal ist)

| Stapel | Grund | Rahmen | Motiv in der Mitte |
| --- | --- | --- | --- |
| Akademie (Start und Markt) | Nachtblau mit feinem Sternenfeld | Doppelt, Gold | Mondsichel über offenem Buch, umringt von zwölf Sternpunkten |
| Omen | Schwarz mit violettem Nebel | Silber | Geschlossenes Auge im Dornenkranz, rote Glut in der Mitte |
| Feinde | Tiefes Blutrot | Dunkles Eisen | Zerbrochener Mond |

Beim Ziehen läuft einmal ein schräger Lichtschimmer über die Rückseite (300 ms).

**Symbole** (eigene SVG-Icons, 24-px-Raster, 2 px Linie): ◆ Einfluss (Goldmünze mit Raute), ⚡ Angriff, ♥ Leben, ☾ Schatten (verdunkelter Mond), Schild, Ziehen (Karte mit Pfeil), Verbannen (Karte, die in Funken zerfällt). Unicode-Zeichen nur als Notlösung, weil manche Schriften sie nicht enthalten.

**Zustände**

- Spielbar: Goldrand leuchtet. Nicht bezahlbar: 60 % Sättigung, Kostenzahl in `--leben`.
- Ausgewählt: 8 px angehoben. Schwäche-Treffer: Funke in Typfarbe springt zum Feind.
- Feind mit Wut: roter Puls am Rand, einmal pro Zug.

**Bewegung:** Tipp-Rückmeldung 100 ms, Karte fliegen 250 ms (ease-out), Umdrehen 300 ms, Schadenszahl 600 ms. Höchstens eine Animation je Zone gleichzeitig; Spiellogik wartet nie auf eine Animation. Bei `prefers-reduced-motion`: Überblenden statt Fliegen.

## Technik

Eine Spiellogik für alles: Dieselbe reine Engine ohne Oberfläche läuft im Spiel, im Web Worker für die Live-Siegchance und in den Balance-Tests. Karten sind Daten, nicht Code – die Erweiterung braucht nur neue Datensätze.

**Stack:** Vite + React + TypeScript als installierbare Web-App (PWA, offline spielbar). Spielstand lokal gespeichert, jeder Zugriff in `try/catch`.

**Ordner**

| Pfad | Inhalt |
| --- | --- |
| `src/engine/` | `state.ts`, `rules.ts` (reine Funktion `apply(state, action) → { state, events }`), `rng.ts` (seedbarer Zufall, z. B. mulberry32), `bots.ts` (gut, teuer, zufällig) |
| `src/engine/sim.worker.ts` | Live-Siegchance: 200 Partien vom aktuellen Stand |
| `src/data/` | `cards.json`, `enemies.json`, `omens.json`, `locations.json`, `difficulty.json`, `tutorial.json` |
| `src/ui/` | Komponenten: Spielfeld, Karte, Kachel, Großansicht, Hinweisblase, Grimoire |
| `tools/balance.ts` | Node-Skript: Siegquoten- und Kartenwert-Tabelle wie in diesem Dokument |
| `tools/balance_sim.py` | Python-Referenz, mit der alle Zahlen hier entstanden sind |

**Karten als Daten** – Effekte sind eine Liste von Bausteinen:

```json
{
  "id": "greif",
  "name": "Sturmfeder-Greif",
  "type": "wesen",
  "cost": 6,
  "copies": 2,
  "effects": [
    { "op": "attack", "amount": 3 },
    { "op": "onKillThisTurn", "then": [{ "op": "influence", "amount": 1 }] }
  ],
  "text": "+3 ⚡. Besiegst du in diesem Zug einen Feind: +1 ◆",
  "art": { "motif": "feder" }
}
```

Bausteine v1: `influence`, `attack`, `heal`, `shield`, `draw`, `banish`, `cleanse`, `selfDamage`, `peekOmen`, `onKillThisTurn`, `perOtherOfType` (für Sternenzirkel). Feinde nutzen zusätzlich `damage`, `discard`, `addShadow`, `everyNthTurn`, `buyTax`, `blockHealing`.

**Ereignisse:** Jede Aktion liefert Ereignisse (`CARD_ZOOMED`, `CARDS_PLAYED`, `CARD_BOUGHT`, `ATTACK_ASSIGNED`, `WEAKNESS_HIT`, `ENEMY_DEFEATED`, `OMEN_REVEALED`, `SHADOW_ADDED`, `LOCATION_FALLEN`, `STUNNED`, `CARD_BANISHED`). Die Oberfläche spielt danach Animationen ab; das Tutorial schaltet an genau diesen Ereignissen weiter.

**Neu in v2:** Spielaktion `useAltar` mit Ereignis `ALTAR_USED`, Feind-Baustein `regenerate` mit Ereignis `ENEMY_REGENERATED`. Treffer pro Zug werden je Feind vermerkt, damit Regeneration korrekt greift.

**Gleichheitstest:** `tools/balance.ts` muss die Siegquoten der Python-Referenz auf ±2 Punkte treffen (3.000 Partien je Stufe und Bot). Erst dann gilt die TypeScript-Engine als richtig.

## Umsetzung, Abnahme, offene Punkte

Gebaut wird von innen nach außen: erst die Regeln, dann das klickbare Grundgerüst, dann Tutorial und Look. So ist jeder Schritt einzeln prüfbar.

**Reihenfolge**

1. Engine und Kartendaten nach diesem Dokument; Gleichheitstest gegen die Python-Referenz besteht.
2. Klickbares Grundgerüst: alle sechs Zonen, Großansicht, Ausspielen, Angreifen, Kaufen, Zugende; schlichte Kacheln.
3. Live-Siegchance im Web Worker, Verlaufskurve am Partieende.
4. Einführung mit Hinweisblasen nach Skript, dann Grimoire und Kontexthinweise.
5. Design-System: Farben, Schriften, Karten, Rückseiten, Symbole, Bewegung.
6. Test mit zwei bis drei Personen, die das Spiel nicht kennen; Schrittprotokoll auswerten, nachschärfen.

**Abnahme des Prototyps**

- [ ] Auf 360 × 640, 390 × 844 und 430 × 932 scrollt die Seite nie; nichts ist abgeschnitten, auch bei 130 % Systemschrift.
- [ ] Jedes Tippziel misst mindestens 44 × 44 px; keine Karte lässt sich versehentlich ausspielen.
- [ ] Jede Karte ist per Antippen in voller Größe lesbar, überall im Spiel.
- [ ] Keine Hinweisblase überdeckt ihr Ziel oder den erwarteten Knopf, in Hoch- und Querformat.
- [ ] Die Einführung ist ohne Vorwissen in unter 4 Minuten durchspielbar und jederzeit abbrechbar.
- [ ] Siegquoten der TypeScript-Engine weichen höchstens 2 Punkte von dieser Spezifikation ab.
- [ ] Live-Siegchance erscheint in unter 300 ms auf einem Mittelklasse-Handy.
- [ ] Keine Namen, Bilder oder Schriftzüge aus Harry Potter im Spiel oder im Code.

**Offene Punkte**

- Tiefe weiter erhöhen: Vorbereiten, Feinde mit Konter und Opferkarten simulieren (Abschnitt *Spieltiefe v2*).
- Altar-Nutzung bei echten Spielern beobachten; wird er zu spät genutzt, den Tutorial-Hinweis früher zeigen.
- Partielänge im Test prüfen (Normal 19,8 Züge); bei Bedarf Feindleben um 1 senken und neu messen.
- Hausfähigkeiten entwerfen und je einzeln simulieren, bevor sie ins Spiel kommen.
- Koop zu zweit: eigene Simulation, Schaden und Omen je Spielerzahl skalieren.
- Erweiterung: Ort-Eigenschaften als Abwechslung, 15–20 neue Karten, alle durch den Prüfablauf.
- Wer zeichnet die Illustrationen? Bis dahin generierte Embleme.

**Quellen** (Websuche vom 11.10.2026)

- [Man O' Kent Games – Rezension Hogwarts Battle](https://www.manokentgames.com/single-post/2019/11/11/harry-potter-hogwarts-battle)
- [Miniature Market – Rezension Hogwarts Battle](https://www.miniaturemarket.com/reviewcorner/harry-potter-hogwarts-battle-review)
- [Board Game Quest – Rezension Hogwarts Battle](https://boardgamequest.com/harry-potter-hogwarts-battle-review)
- [Meeple Mountain – Rezension Hogwarts Battle](https://www.meeplemountain.com/reviews/harry-potter-hogwarts-battle-review-muggles-and-wizards-delight/)
- [PlaytestCloud – Fehler in mobilen Tutorials](https://blog.playtestcloud.com/mistakes-mobile-game-tutorials/)
- [GDevelop – Mobile UX-Fehler](https://gdevelop.io/blog/mobile-ux-mistakes)
- [UX Planet – Mobile Onboarding: Interact, Don't Tell](https://uxplanet.org/mobile-onboarding-interact-don-t-tell-f0c35da2b2b4)
- [Adobe Spectrum – Coach Mark](https://spectrum.adobe.com/page/coach-mark)
- [Onboarding & Progressive Disclosure (Referenz)](https://cdn.jsdelivr.net/npm/@hegemonart/get-design-done@1.60.4/reference/onboarding-progressive-disclosure.md)
- [AppStorys – Coach Marks](https://appstorys.com/blog-Coach-Marks-Spotlight-UI-Onboarding)
- [Flowmapp – Coach Marks](https://www.flowmapp.com/blog/qa/coach-marks)
- [Dolfy – Tooltips ohne zu nerven](https://www.dolfy.ai/blog/feature-discovery-tooltips-coachmarks-mobile-apps)
- [Bugnet – Tutorial-Hänger finden](https://bugnet.io/blog/how-to-fix-a-tutorial-players-keep-getting-stuck-on)
- [WebAIM – Zugängliche Onboarding-Hinweise](https://webaim.org/discussion/mail_message?id=40946)
- [Frontend Checklist – Touch Targets](https://frontendchecklist.io/rules/accessibility/touch-targets)
- [OpenReplay – Tap Targets](https://blog.openreplay.com/improving-tap-targets-mobile-ux/)
- [TouchArcade – Slay the Spire mobil](https://toucharcade.com/?p=268940)
- [Android Central – Slay the Spire auf Android](https://www.androidcentral.com/slay-spire-android-game-week)

Hinweis: Die Rezensionen und Ratgeber wurden über Suchergebnisse ausgewertet; alle Spielwerte stammen aus der eigenen Simulation.
