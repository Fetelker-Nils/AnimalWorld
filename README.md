# Animal World

## Im Browser spielen

Doppelklick auf **Animal World starten.cmd** oder `npm start`. Das Spiel startet im Standardbrowser unter **http://127.0.0.1:4173**. Das Startfenster offen lassen; mit Strg+C wird der lokale Server beendet. Node.js muss installiert sein. Offline spielen braucht kein Internet. Online spielen verbindet sich mit dem gemeinsamen Server. Electron ist nicht erforderlich.

Spielstand und Ton-Einstellungen werden in diesem Browser gespeichert. Der bisherige Electron-Spielstand wird nicht automatisch in den Browser importiert. Verwende immer dieselbe Adresse und dasselbe Browserprofil.



Ein Browser-Sandbox-Spiel mit Offline- und Online-Modus mit Mauz, niedrig geführter Folgekamera, kleiner Spieloberfläche, Jobs, Autos, Musik und kaufbaren Häusern.

## Neue Welt: mindestens fünfmal so gross

Die begehbare Insel hat jetzt 1'120 Welteinheiten Durchmesser (vorher 480). Bei gleicher Kreisform sind das rund **5,44-mal so viel Fläche**. Zusätzliche Strassen verbinden Nordstadt, Obstgarten und neue Wohngebiete im Osten, Westen und Süden. Stadt, Dorf, Berg mit Gipfelweg, Farm, Werkstatt, Hafen, Wald und See bleiben erhalten. Insgesamt gibt es 56 mehrstöckige Stadtgebäude und zehn Telefonzellen.

Die Karte (M) lässt sich mit dem Mausrad oder +/− zoomen und durch Ziehen verschieben. „Bei Mauz“ zeigt deine Umgebung, „Ganze Insel“ die Übersicht. Violett markiert Jobs, Türkis Telefonzellen, Gold kaufbare Häuser, Grün deinen Hausbesitz.

Bäume und Gras sind räumlich aufgeteilt: Es werden nur nahe Bereiche geprüft bzw. dargestellt. Dadurch muss die grössere Welt nicht in jedem Bild vollständig durchsucht werden.

## Zwoelf Jobs

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

Alle Wohngebaeude stehen zum Verkauf, darunter die fuenf besonderen Haeuser unten und die Stadtwohnungen. Vor der markierten Tür E drücken. Die Kaufansicht zeigt Preis und Guthaben. Erst der Knopf „Kaufen“ zieht die Spielmünzen ab.

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

Die Spieloberflaeche bleibt eine statische Website. Online spielen nutzt zusaetzlich den bereits bereitgestellten Cloudflare-Server. `vercel.json` setzt Framework auf **Other**, Build Command auf **npm run build** und Output Directory auf **dist**. Konfiguration gemaess [Vercel-Dokumentation](https://vercel.com/docs/project-configuration/vercel-json).

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


## Online spielen

Im Hauptmenue **Online spielen** druecken. Alle Teilnehmer landen ohne Raumcode auf derselben oeffentlichen Insel. Andere Tiere mit ihren Namen, getragenen Kleidern, Autos und Winkbewegungen werden live angezeigt; violette Punkte auf der Minikarte zeigen Mitspieler. Oeffentliche Innenraeume werden gemeinsam betreten. Wohnungen haben getrennte Innenraeume; Etagen-Treppenhaeuser sind gemeinsam begehbar.

Der gemeinsame Server ist bereits unter `wss://animal-world-online.animal-world-mauz.workers.dev/play` bereitgestellt. Er verwendet eine globale Durable-Object-Instanz mit WebSocket-Hibernation. Maximal 128 gleichzeitige Verbindungen; dies ist eine Schutzgrenze, kein Lasttest-Ergebnis. Ungueltige oder zu grosse Nachrichten werden verworfen bzw. geschlossen; verwaiste Verbindungen nach spaetestens etwa 90 Sekunden entfernt. Ein Verbindungsabbruch pausiert das Spiel. Zum Wiederverbinden im Hauptmenue erneut Online spielen waehlen.

Die Online-Uhr ist fuer alle gleich und laeuft auch bei geoeffneten Menues weiter. Nachts koennen alle Spieler in ihren eigenen Betten schlafen: Erst wenn alle verbundenen Spieler schlafen, springt die gemeinsame Uhr auf 07:00 Uhr. Die Schlafanzeige zeigt die Anzahl; Aufstehen oder Escape bricht das Warten ab. Die Offline-Uhr bleibt separat erhalten. Muenzen, Sparkonto und Kleider bleiben im jeweiligen Browser; Online-Immobilienbesitz wird gemeinsam auf dem Server gespeichert; Jobs und ihre Ziele werden individuell erledigt. Es gibt noch keine gemeinsamen Missionen, gemeinsamen Fahrzeugbesitz, Handel oder servergepruefte Wirtschaft. Es werden keine Konten oder Chat-Nachrichten angelegt. Die zufaellige Mauz-Kennung gilt fuer die aktuelle Verbindung.

Serverquellcode: `multiplayer-worker.mjs`; reproduzierbare Deployment-Konfiguration: `server/wrangler.jsonc`. Fuer spaetere Serverupdates mit angemeldetem Cloudflare-Konto: `npx wrangler deploy --config server/wrangler.jsonc`. Bei einer anderen Serveradresse auch `multiplayer.js` und die `connect-src`-Freigabe in `index.html` aktualisieren. Das Vercel-Frontend weiter normal aus `dist/` deployen; der Worker wird nicht als statische Spieldatei ausgeliefert.

## Jedes Gebaeude hat eine Funktion

- Mauz Mode: sieben Outfits kaufen und umziehen.
- Restaurant: Mahlzeit fuer 20 Muenzen, drei Minuten 30 Prozent schneller laufen.
- Krankenhaus: kostenlose Physiotherapie, drei Minuten hoeher springen.
- Bank: jeweils 100 Muenzen einzahlen oder abheben. Sparkonto und Portemonnaie werden atomar zusammen gespeichert; keine Zinsen.
- Polizei: drei Hinweise untersuchen, pro Hinweis zwei Timing-Treffer; 230 Muenzen.
- Feuerwehr: drei animierte Feuer jeweils vier Sekunden loeschen; 280 Muenzen.
- Stadtmarkt: drei Lebensmitteleinkaeufe bis ins Suedviertel liefern; 210 Muenzen.
- Postgebaeude: Paketdienst an der Station vor der Tuer.
- Alle uebrigen Gebaeude: kaufbare Wohnungen oder Haeuser mit eingerichteten Zimmern und waehlbarem Startpunkt.

Neue Stadtauftraege beginnen **am Empfang im Gebaeude**. Erst alle Aufgaben erledigen, dann zum Empfang zurueckkehren und den Lohn abholen. Restaurant- und Krankenhausboni laufen nur waehrend des Spielens und enden beim Neuladen.

Zusaetzliche Tests: `node scripts/test-city.cjs` prueft Wirtschaft und alle drei Auftraege; `node scripts/test-city-ui.cjs` prueft die Angebote per Touch gegen den fertigen Build. `npm run test:online` verbindet zwei getrennte Browserprofile mit dem echten Server und prueft Positionen, Uhr, Winken, oeffentliche Innenraeume und Trennung. Der Online-Test benoetigt Internet.


## Tiere, Stadtverkehr und Unfaelle

Mauz ist ein echtes, drehbares 3D-Modell mit Augen, Nase, Schnauze, Ohren, Pfoten und animiertem Schwanz. Mit **V** oder dem Kameraknopf im Pausenmenue zwischen Vorder- und Rueckansicht wechseln. Kleider bleiben sichtbar. Auch Empfangspersonal, Taxigast, Autofahrer und Schaufensterpuppen sind Tiere.

24 Katzen, Hasen, Baeren und Fuechse laufen auf Gehweg-Rundwegen durch die Stadt, halten Abstand zu Mauz und anderen Passanten und machen Pausen. Acht NPC-Autos fahren auf versetzten Fahrspuren, bremsen vor Hindernissen und warten auf Fahrzeuge mit Vorrang an Engstellen. Das ist regelbasierte Wegfuehrung und Hindernisvermeidung; noch keine freie Stadt-KI oder Verkehrsampel-Simulation. Im Online-Modus berechnet der gemeinsame Server die NPC-Positionen fuer alle Spieler.

Prallt dein Auto mit **mehr als 70 km/h** gegen ein festes Hindernis wie ein Haus, explodiert es mit Partikeln und Sound. Mauz bleibt unverletzt am letzten sicheren Ort; ein neues Auto gibt es kostenlos an Telefonzellen. Langsamere Kollisionen stoppen das Auto. Bei schnellen Treffern gegen Baeume und Strassenlaternen bleibt das Auto erhalten und stoppt, ohne Explosion. Die Objekte kippen in Fahrtrichtung, blockieren nicht mehr und erscheinen nach **fuenf Spielsekunden** wieder. Gefallene Laternen leuchten nicht. Online werden diese Unfaelle an Mitspieler uebertragen; dort laeuft die Wiederherstellung auch bei offenem Menue weiter.

`npm run test:animals` prueft 3D-Ansichten, tierische Innenraeume und echte Fahrzeugkollisionen samt Wiederherstellung im Browser. Die Verkehrstests in `npm test` pruefen begehbare Routen, Fortschritt, Anhalten, die strikte 70-km/h-Grenze und sichere Fahrerpositionen.


## Firefox: Online-Autos testen

Die Zeichenflaeche ist auf rund 2,1 Millionen Pixel begrenzt, unabhaengig von Bildschirmaufloesung und Pixeldichte. Entfernte Tiere verwenden weniger Polygone; gemeinsame Eckpunkte werden nur einmal transformiert. Beim Verlassen eines Innenraums werden dessen WebGL-Ressourcen freigegeben.

`npx playwright install firefox` installiert den Testbrowser. `npm run test:online-cars` prueft mit zwei Firefox-Profilen alle zehn Telefonzellen, alle drei Automodelle, Einsteigen, Fahren, Aussteigen und die Anzeige beim Mitspieler. Der Test benoetigt Internet und prueft auch eine hohe Pixeldichte. Optional `node scripts/test-online-cars.cjs --chromium` fuer Chromium.

## Charakter, Mitfahren und Meer

Vor Offline oder Online spielen einen Namen (bis 18 Zeichen) und Katze, Hase, Baer oder Fuchs waehlen. Die Auswahl wird im Browser gespeichert und online mit anderen geteilt.

Online neben ein angehaltenes Auto eines anderen Spielers treten und F oder den Fahrzeugknopf druecken: Ein freier Beifahrerplatz steht bereit. Der Besitzer faehrt; der Gast faehrt mit und kann nach dem Anhalten wieder aussteigen. Verschwindet das Auto oder trennt sich der Besitzer, wird der Gast abgesetzt.

Das Meer am Inselrand ist zu Fuss betretbar. Im Wasser wird die verbleibende Luft angezeigt. Nach zehn Sekunden wird die Figur an ihren sicheren Startpunkt zurueckgesetzt. Rechtzeitig an Land gehen fuellt die Luft wieder auf. Autos bleiben an Land.

`npm run test:adventure` prueft Auswahl, Speicherung, Meer und Mitfahren mit zwei echten Online-Verbindungen. `npm test` prueft ausserdem die serverseitige Schlafabstimmung und Sitzplatzvergabe.

## Raeumliche Weltobjekte

Baeume mit Stamm und Baumkrone, vollstaendige Strassenlaternen, Steine, Baelle, Blumen, Grasbueschel, Obst und Angelruten bestehen aus Weltkoordinaten und perspektivisch gezeichneten Polygonen. Auch kleine Feuer- und Unfallpartikel sind raeumlich. Haeuser, Fahrzeuge und Inneneinrichtung behalten ihre bestehende 3D-Geometrie. Karten, Namensschilder und Bedienanzeigen bleiben lesbare Overlays.

Beim Umfallen wird das komplette Baum- oder Laternenmodell um seine Basis gedreht. Laternen besitzen ein Gehaeuse und einen nachts hellen Leuchtkoerper. Geometrievorlagen werden wiederverwendet; entfernte Baeume erhalten weniger Flaechen. Die bestehenden Kollisions- und Wiederherstellungsregeln bleiben erhalten.

## Flugzeuge, Helikopter, Boote und Perleninsel

An den Flugplatz-Terminals auf der Hauptinsel (225 / 220) und der Perleninsel (918 / 145) stehen Propellerflugzeug und Helikopter bereit. Mit E das Fahrzeug waehlen, hingehen und F einsteigen. W/S: beschleunigen und verlangsamen; A/D: lenken; Q: steigen; R: sinken; Leertaste: bremsen. Auf Touch-Geraeten erscheinen Steigen/Sinken neben den bestehenden Fahrkontrollen. Das Flugzeug braucht zum Abheben mehr als 12 m/s; der Helikopter startet senkrecht und kann schweben. Maximalhoehe: 100 Meter. Zum Aussteigen anhalten und auf freiem Land landen.

Motorboote erscheinen an den Bootsstegen im Osten der Hauptinsel (550 / 0) und auf der Perleninsel (655 / 0). Auf den Steg gehen, mit F einsteigen und Richtung andere Insel fahren. Boote bleiben auf dem Meer und schuetzen ihre Insassen vor dem Ertrinken. Langsam anlegen: Bei einem schnellen Aufprall explodiert das Boot. Zum Aussteigen langsam an einen Steg heranfahren und anhalten.

Die Perleninsel liegt oestlich bei 900 / 0. Ihre Flaeche betraegt ein Fuenftel der Hauptinsel. Dort stehen 20 kaufbare, begehbare Perlenvillen ab 2400 Muenzen; ausserdem gibt es Strassen, einen Flugplatz, Bootssteg und eine Fahrzeug-Telefonzelle. Hausbesitz wird wie bisher gespeichert.

Die Weltgrenze liegt bei 1300 Metern Abstand vom Mittelpunkt der Hauptinsel. Ein violettes Gitter markiert sie in der Welt, eine gestrichelte Linie auf den Karten. Zu Fuss und mit Fahrzeugen kann sie nicht ueberschritten werden. Beide Inseln sind auf der Gesamtkarte sichtbar; zum Lesen kleiner Ortsnamen hineinzoomen.

Die neuen Fahrzeuge und ihre Flughoehe werden online uebertragen. `npm run test:navigation` prueft Starten, Landen, Bootsfahrt, Anlegen, Villenkauf und die Synchronisierung aller drei Fahrzeuge mit einem zweiten Browser. `npm run test:touch` prueft auch die Flugtasten in beiden Bildschirmausrichtungen.

## Individuelle Innenraeume und Online-Immobilien

Wohnungen sind kleiner als Einfamilienhaeuser; Perlenvillen haben die groessten Innenraeume. Breite, Tiefe, gespiegelte Raumaufteilung, offener Wohnbereich, Wandfarben, Boden und Einrichtung richten sich nach der Immobilie. Wandsichtbarkeit, Kollisionen, Kamera, Bett und Ausgang verwenden denselben Grundriss.

Stadtwohnhaeuser haben je nach Gebaeudehoehe zwei bis sechs Etagen mit jeweils zwei unabhaengigen Wohnungen. An der Haustuer lassen sich Etage und Wohnung ansehen oder das Treppenhaus betreten. Dort bei den Treppen E druecken, um die Etage zu wechseln; Wohnung A und B haben eigene Tueren. Mehrere Spieler koennen verschiedene Wohnungen im selben Haus besitzen.

Online entscheidet eine gespeicherte Datenbank-Transaktion ueber den Kauf. Jede Immobilie hat genau einen Besitzer; ein gleichzeitig abgelehnter Kauf wird nicht berechnet. Eine bestaetigte Bestellung wird bei Wiederholung nicht nochmals verkauft oder berechnet. Vor dem Senden wird das Geld lokal reserviert; ausstehende Bestaetigungen werden nach dem Wiederverbinden abgeglichen. Besitzrechte bleiben auch nach einem Server-Neustart erhalten.

Die Online-Besitzerkennung wird als zufaelliger geheimer Schluessel in diesem Browserprofil gespeichert. Name und Tier koennen weiter geaendert werden. Wer die Browserdaten loescht, verliert den Zugriff auf diese Kennung; es gibt noch keine Anmeldung oder Wiederherstellung ueber ein Konto. Alte lokale Hauskaeufe bleiben im Offline-Modus erhalten und werden nicht automatisch zu exklusiven Online-Kaeufen. Die Wirtschaft bleibt lokal; die serverseitige Exklusivitaet ist kein Schutz gegen manipulierte lokale Muenzen.

## Kaboom und Kartenrouten

Boote, Flugzeuge und Helikopter explodieren bei einem Zusammenstoss mit mehr als 4 m/s (etwa 14 km/h). Bei Fluggeraeten zaehlt auch die Sinkgeschwindigkeit beim Treffer auf ein Hindernis. Mauz erscheint sicher an Land wieder. Vorsichtiges Anlegen, normales Landen auf freier Flaeche und die Weltgrenze bleiben ohne Explosion. Autos behalten ihre bisherige 70-km/h-Regel; Baeume und Laternen fallen bei Autotreffern weiter ohne Autoexplosion um.

Auf der grossen Karte per Rechtsklick ein Ziel setzen. Eine orange Linie zeigt einen berechneten Weg, bevorzugt ueber Strassen und um Hindernisse herum. Bei Inselwechseln fuehrt sie ueber die Bootsstege; dort muss selbst ein Boot genommen werden. Gebaeudeziele werden an ihre Tuer gelegt. Die Linie ist auch auf der Minikarte sichtbar. Der naechste Rechtsklick entfernt die Route. Es ist eine Weganzeige, kein Autopilot; fuer ein neues Ziel die alte Linie entfernen und erneut rechtsklicken.

`npm run test:housing` prueft konkurrierende Kaeufe mit zwei Browsern gegen eine isolierte Instanz des Servercodes, Besitz nach Wiederverbinden, Etagen und Innenraeume. Es werden dabei keine echten Online-Immobilien belegt. `npm run test:routes` prueft Rechtsklick, Umweg und Entfernen im Browser. `npm test` umfasst zusaetzlich Transaktions-, Rueckerstattungs-, Grundriss- und Wegsuchetests.
