# Animal World

## Im Browser spielen

Doppelklick auf **Animal World starten.cmd** oder `npm start`. Das Spiel startet im Standardbrowser unter **http://127.0.0.1:4173**. Das Startfenster offen lassen; mit Strg+C wird der lokale Server beendet. Node.js muss installiert sein. Internet und Electron sind zum Spielen nicht erforderlich.

Spielstand und Ton-Einstellungen werden in diesem Browser gespeichert. Der bisherige Electron-Spielstand wird nicht automatisch in den Browser importiert. Verwende immer dieselbe Adresse und dasselbe Browserprofil.



Ein vollständig lokales Sandbox-Spiel mit Mauz, niedrig geführter Folgekamera, kleiner Spieloberfläche, Jobs, Autos, Musik und kaufbaren Häusern.

## Neue Welt: mindestens fünfmal so gross

Die begehbare Insel hat jetzt 1'120 Welteinheiten Durchmesser (vorher 480). Bei gleicher Kreisform sind das rund **5,44-mal so viel Fläche**. Zusätzliche Strassen verbinden Nordstadt, Obstgarten und neue Wohngebiete im Osten, Westen und Süden. Stadt, Dorf, Berg mit Gipfelweg, Farm, Werkstatt, Hafen, Wald und See bleiben erhalten. Insgesamt gibt es 56 mehrstöckige Stadtgebäude und zehn Telefonzellen.

Die Karte (M) lässt sich mit dem Mausrad oder +/− zoomen und durch Ziehen verschieben. „Bei Mauz“ zeigt deine Umgebung, „Ganze Insel“ die Übersicht. Violett markiert Jobs, Türkis Telefonzellen, Gold kaufbare Häuser, Grün deinen Hausbesitz.

Bäume und Gras sind räumlich aufgeteilt: Es werden nur nahe Bereiche geprüft bzw. dargestellt. Dadurch muss die grössere Welt nicht in jedem Bild vollständig durchsucht werden.

## Neun Jobs

Mit E an einer Station beginnen. Immer nur ein Auftrag gleichzeitig. In der Nähe erscheint der passende Hinweis. Bei Haltearbeiten E gedrückt halten; Loslassen oder Weggehen setzt nur den aktuellen Schritt zurück. Zum Schluss zur Station zurückkehren, ausser bei Paket- und Taxilieferungen.

| Job | Aufgabe | Münzen |
| --- | --- | --- |
| Paketpost | Paket abholen und liefern; drei wiederkehrende Routen | 35 / 60 / 50 |
| Strassenreinigung | Fünf Abfälle einsammeln | 70 |
| Gartenpflege | Drei Beete je 1,5 Sekunden giessen | 85 |
| Mechaniker | Drei Motoren: vorbereiten und je zwei Timing-Treffer | 100 |
| Taxi | Nordstadt bis zum Südstrand: 767 Meter | 260 |
| Angeln | Drei Fische: Angel halten und im richtigen Moment einholen | 190 |
| Obsternte | Vier Äpfel beim Obstgarten im Westen ernten | 140 |
| Elektriker | Drei Schaltkästen: vorbereiten und je zwei Timing-Treffer | 180 |
| Bergkontrolle | Vier Markierungen bis zum Gipfel kontrollieren | 220 |

Gartenpflege, Reparaturen, Sammelarbeiten und die neuen Jobs werden zu Fuss erledigt. Für Taxi braucht man ein Auto. Die Musik passt sich dem Auftrag an.

## Häuser kaufen

Fünf Häuser stehen zum Verkauf. Vor der markierten Tür E drücken. Die Kaufansicht zeigt Preis und Guthaben. Erst der Knopf „Kaufen“ zieht die Spielmünzen ab.

| Haus | Preis |
| --- | --- |
| Dorfhäuschen | 180 Münzen |
| Gartenhaus im Osten | 350 Münzen |
| Haus am Obstgarten | 420 Münzen |
| Sonnenvilla | 650 Münzen |
| Südhaus | 800 Münzen |

Das erste gekaufte Haus wird automatisch dein Zuhause. An weiteren eigenen Häusern kannst du „Als Zuhause festlegen“ wählen. Beim nächsten Öffnen der App startet Mauz vor dessen Tür und blickt entlang der Strasse. Eigene Häuser haben begehbare Innenräume: Wohnzimmer, Schlafzimmer, Küche und Badezimmer. An der Haustür E drücken und „Haus betreten“ wählen. Im Flur beim Ausgang mit E zurück nach draussen. Bewegung und Folgekamera funktionieren wie draussen; Die Kamera rückt vor Wänden näher heran. Wände bleiben vollständig sichtbar; ein Tiefenpuffer verdeckt dahinterliegende Möbel.

Guthaben, Hausbesitz und Zuhause werden gemeinsam lokal gespeichert. Bei zu wenig Geld oder bereits vorhandenem Besitz erfolgt kein Kauf. Schlägt das Speichern fehl, wird nichts abgezogen. Bestehende Münzen aus früheren Versionen bleiben erhalten. Spätere Joblöhne überschreiben den Hausbesitz nicht.

## Autos und Telefonzellen

Mit E an einer türkisfarbenen Telefonzelle Kleinwagen, Roadster oder Pickup auswählen. Der Ruf ist kostenlos und ersetzt das bisherige Auto. Das Fahrzeug erscheint auf einem freien Platz. Der Kleinwagen ist wendig, der Roadster am schnellsten, der Pickup bewältigt sanfte Hänge.

F zum Einsteigen. W/S für Gas, Bremsen und Rückwärtsfahren, A/D zum Lenken, Leertaste zum Bremsen. Zum Aussteigen anhalten und F drücken. Gebäude, Baumstämme, Wasser, Küste, Telefonzellen und zu steile Hänge blockieren die Fahrt.

## Musik und Sound

Eigene offline erzeugte Musik für Hauptmenü, freies Erkunden und jeden der neun Jobs. Dazu Motoren, Schritte, Sprünge, Telefon, Arbeitsgeräusche und Belohnungstöne. Im Hauptmenü „Musik einschalten“ anklicken; Audio beginnt nach einer Nutzeraktion. Stummschaltung und getrennte Regler für Musik/Geräusche stehen im Pausenmenü und werden gespeichert.

## Steuerung und Speicherung

- W/S: laufen oder fahren. A/D: drehen oder lenken.
- Shift: zu Fuss rennen. Leertaste: hüpfen oder bremsen.
- E: Job, Arbeit, Haus oder Telefonzelle.
- F: einsteigen / angehalten aussteigen.
- M: Karte. Esc: Pause oder zurück ins Spiel.
- Klick auf den Boden: zu Fuss loslaufen. Noch keine automatische Wegfindung um Hindernisse.

Münzen, Häuser, Zuhause und Audioeinstellungen werden gespeichert. Angefangene Jobs, Autos und die aktuelle freie Position werden beim Schliessen nicht gespeichert. Es gibt noch keine vollständige Ragdoll-Physik.

## Entwicklung und Tests

- `npm install`: Testwerkzeuge installieren.
- `npm start`: Spiel lokal im Browser starten.
- `npm run build`: statische Spieldateien nach `dist/` kopieren.
- `npm run preview`: fertigen Build lokal testen (vorher laufenden lokalen Server beenden).
- `npm test`: Spiellogik, Audio und lokalen Webserver testen.
- `npx playwright install chromium`: Browser fuer UI-Tests einmalig installieren.
- `npm run test:ui`: fertigen Build in Chromium testen, inklusive Jobs, Autos, Kamera, Innenraeumen und Speicherung. Getrenntes Browserprofil; echte Spielstaende bleiben unberuehrt.

## Auf Vercel veroeffentlichen

Das Projekt ist eine statische Website ohne Backend. `vercel.json` setzt Framework auf **Other**, Build Command auf **npm run build** und Output Directory auf **dist**. Konfiguration gemaess [Vercel-Dokumentation](https://vercel.com/docs/project-configuration/vercel-json).

Das Repository in Vercel importieren und **AnimalWorld** als Root Directory waehlen, falls das Repository noch andere Projekte enthaelt. Alternativ im Projektordner `npx vercel` fuer eine Vorschau oder `npx vercel --prod` fuer die Produktion ausfuehren und das gewuenschte Vercel-Projekt verknuepfen. Eine Anmeldung ist erforderlich. Fuer manuelle statische Hosts ausschliesslich den Inhalt von `dist/` veroeffentlichen.

Der lokale Node-Server wird auf Vercel nicht benoetigt. Es werden keine Windows-Programme ausgeliefert. Alle Spielressourcen liegen im Web-Paket; Musik wird im Browser erzeugt. Zum ersten Laden einer Vercel-Adresse ist Internet noetig. Ein Offline-Cache ist noch nicht eingerichtet. Spielstaende bleiben im Browser und sind an die jeweilige Adresse gebunden: localhost, Vorschau und Produktionsdomain haben getrennte Speicher.

## Touch und neue Job-Aufgaben

Auf Touch-Geraeten erscheint automatisch ein analoger Joystick. Ziehen: laufen / lenken; loslassen: stoppen. Rechts liegen Rennen, Huepfen (im Auto Bremse), Arbeit und Ein-/Aussteigen. Mehrere Finger funktionieren gleichzeitig. Menues und Karten bleiben per Tippen bedienbar. Beim Pausieren oder Wechseln der App wird die Eingabe zurueckgesetzt.

Taxi: Fahrgast an der Nordstadt abholen, 767 Meter zum suedlichen Strand fahren und dort anhalten. Lohn: 260 Muenzen. Der Fahrgast winkt.

Angeln, Mechaniker und Elektriker: zuerst die Aktion halten, danach loslassen und im gruenen Bereich der Anzeige erneut tippen (Tastatur: E). Angeln braucht einen Treffer, Reparatur und Elektriker zwei. Fehlversuche koennen wiederholt werden; Weggehen setzt die aktuelle Vorbereitung zurueck. Gartenpflege bleibt eine Halteaufgabe. Wasser, Funken, wachsende Blumen, eine bewegte Angel und Mauz' Jubel zeigen den Fortschritt.

`npm run test:touch` prueft Joystick, mehrere Finger, Loslassen, Pause und Geschicklichkeitseingaben in einem Touch-Browser in Hoch- und Querformat.

## Minikarte, Uhrzeit und Schlafen

Die kleine Karte rechts zeigt die Umgebung, Mauz' Blickrichtung und das aktuelle Ziel. Ziele ausserhalb des Ausschnitts erscheinen am Kartenrand. Antippen oeffnet die grosse Inselkarte. Im Haus zeigt sie stattdessen den Grundriss mit Bett und Ausgang.

Unter der Minikarte stehen Uhrzeit und Tag. Ein kompletter Spieltag dauert 20 echte Minuten. In Menues und Pausen bleibt die Zeit stehen; Uhrzeit und Tagesnummer werden lokal gespeichert. Zwischen 18:00 und 21:00 wird es allmaehlich dunkel, zwischen 05:00 und 08:00 wieder hell. Die Strassenlaternen leuchten in der Daemmerung und nachts.

In jedem gekauften Haus steht ein Bett im Schlafzimmer. Daneben treten und E druecken oder die Schlaf-Aktion antippen. Schlafen ist von 20:00 bis vor 06:00 moeglich; Mauz wacht um 07:00 auf. Eine kurze Schlafblende zeigt den Zeitsprung. Guthaben, Hausbesitz und Jobs bleiben erhalten.

## Stadtgebaeude und Kleidung

Sieben oeffentliche Gebaeude sind begehbar: **Mauz Mode**, **Restaurant Pfotenstube**, **Polizeistation**, **Krankenhaus**, **Feuerwehr**, **Pfotenbank** und **Stadtmarkt**. Rosa Markierungen zeigen ihre Tueren auf den Karten; beim Vergroessern der Inselkarte erscheinen die Namen. Vor der Tuer E druecken oder die Aktion antippen. Ein Hauskauf ist dafuer nicht noetig. Im Eingangsbereich fuehrt E wieder nach draussen.

Alle Gebaeude haben eine eigene Einrichtung und einen Empfang. Restaurant, Polizei, Krankenhaus, Feuerwehr, Bank und Markt lassen sich erkunden; am Empfang gibt es passende Hinweise (bei der Bank auch das Guthaben). Eigene Bankkonten, medizinische Behandlungen und neue Einsatz-Jobs sind damit nicht verbunden.

Im **Kleidershop** (erstes Stadthaus links, Tuer bei -18 / -18) zur Kasse gehen. Dort gibt es sieben Outfits fuer 70 bis 220 Muenzen, darunter Shirts, Wald-Outfit, Polizei-Outfit, Feuerwehr-Outfit und Arztkittel. Preise stehen vor dem Kauf auf den Knopfen. Kaufen zieht den Betrag einmalig ab und zieht das Outfit sofort an. Bereits gekaufte Kleidung kann hier kostenlos gewechselt oder ausgezogen werden.

Outfit, Kleidersammlung, Guthaben und Haeuser werden gemeinsam gespeichert. Ein fehlgeschlagener Kauf zieht keine Muenzen ab. Vorhandene Spielstaende bleiben kompatibel.
