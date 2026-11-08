# n8n Workflow: Kapitel 3 Warteliste

> Erstellt: 2026-11-08
> Siehe auch: `n8n-schulung-k2-workflow.md`, `n8n-loeschfristen-workflow.md`, Kapitel 2 unter `schulung/k2-9d3b2807b991.html`
> JSON: `mein-business/04-projects/homepage/kapitel-3-warteliste-workflow.json`

## Worum es geht

Am Ende von Kapitel 2 stand ein Teaser auf Kapitel 3, das es nicht gibt: ein Versprechen ohne Datum, ohne Anmeldung, ohne Klick. Wer zwei Kapitel durchgearbeitet hatte, landete in einer Sackgasse, und zwar genau im aufmerksamsten Moment.

An seiner Stelle steht jetzt ein Feld: **"Wenn du Bescheid bekommen willst, sobald es fertig ist, trag dich hier ein."** Damit wird die Sackgasse zu einem Messwert. Meldet sich niemand, ist die Frage nach Kapitel 3 beantwortet, ohne dass es gebaut wird. Melden sich Leute, gibt es warme Kontakte und einen Grund.

| Eigenschaft | Wert |
|---|---|
| **Trigger** | Webhook `POST /webhook/kapitel-3-warteliste` |
| **Payload** | `{ "vorname": "...", "email": "...", "hp": "", "quelle": "Kapitel 2 Abschluss" }` |
| **Ziel 1** | Google Sheet "Lead Magnet", **neuer Reiter "Kapitel 3 Warteliste"** |
| **Ziel 2** | Gmail: interne Meldung an brenner@bremos.org |
| **Keine Mail an den Eintragenden** | Es gibt nichts zu liefern. Die Mail kommt erst, wenn Kapitel 3 steht |

> [!warning] Reihenfolge ist Pflicht: Speicherziel zuerst, Formular zuletzt
> Der Google-Sheets-Node verwirft Felder stillschweigend, zu denen keine Spalte existiert. Wer das Formular live schaltet, bevor der Reiter steht, sammelt Eintragungen ein, die nirgends ankommen, und zeigt den Leuten trotzdem "Eingetragen". Das ist der Fund vom 09.08. Deshalb: **Schritt 1 bis 4 fertig, erst dann Schritt 5.**

---

## Schritt 1: Den Reiter im Google Sheet anlegen

Im Google Sheet **"Lead Magnet"** (dasselbe Dokument, in dem schon die Reiter "Lead Magnet" und "Schulung K2" liegen).

1. Unten auf das **+** neben den Reiternamen
2. Den neuen Reiter umbenennen in genau: `Kapitel 3 Warteliste`
3. In **Zeile 1** die vier Spaltenüberschriften eintragen, genau so geschrieben:

| Zelle | Inhalt |
|---|---|
| A1 | `Vorname` |
| B1 | `E-Mail` |
| C1 | `timestamp` |
| D1 | `Quelle` |

**Woran du erkennst, dass es sitzt:** Der Reiter unten heißt `Kapitel 3 Warteliste`, nicht `Tabellenblatt4`. In A1 bis D1 steht Text, Zeile 2 ist leer.

**Warum `timestamp` klein und englisch:** Die anderen beiden Reiter heißen die Spalte so, und die Löschroutine liest genau diesen Namen. Ein großes T oder ein deutsches "Zeitstempel" macht die Spalte für die Löschroutine unsichtbar. Der Name ist fix, nur sichtbarer Text auf der Seite trägt Umlaute.

---

## Schritt 2: Workflow importieren

1. In n8n oben rechts auf **+** → **Import from File**
2. Die Datei `kapitel-3-warteliste-workflow.json` auswählen
3. Der Workflow heißt danach **"Kapitel 3 Warteliste"** und hat **fünf Nodes**

**Woran du erkennst, dass es sitzt:** Fünf Kästen auf der Fläche, von links nach rechts: `Webhook` → `Kein Bot` → oben `In Warteliste schreiben` → `Alert Monika`, und nach unten abgezweigt `Bot verworfen`. Am `Kein Bot` gehen **zwei** Linien weg, eine nach oben rechts und eine nach unten. Keine Linie endet im Leeren.

Wenn an einem Node ein **rotes Dreieck** hängt, fehlt dort ein Credential. Das ist Schritt 3, die Dreiecke sind deine Aufgabenliste.

---

## Schritt 3: Credentials setzen

Zwei Nodes brauchen eine Anmeldung. Beide Credentials existieren schon, sie müssen nur ausgewählt werden.

1. **`In Warteliste schreiben`** anklicken → Feld **Credential to connect with** → das vorhandene Google-Sheets-Credential auswählen (dasselbe wie in den anderen Workflows)
   - Darunter prüfen: **Document** muss das Sheet **"Lead Magnet"** sein, **Sheet** muss **"Kapitel 3 Warteliste"** heißen
   - Im Mapping-Bereich sollten die vier Spalten `Vorname`, `E-Mail`, `timestamp`, `Quelle` auftauchen. **Tauchen sie nicht auf: "Refresh columns" klicken.** Das ist der bekannte Spalten-Cache-Stolperstein, nicht ein Fehler am Reiter
2. **`Alert Monika`** anklicken → das vorhandene Gmail-Credential auswählen

**Woran du erkennst, dass es sitzt:** Keine roten Dreiecke mehr. Im Node `In Warteliste schreiben` steht bei **Sheet** nicht "Kapitel 3 Warteliste" als getippter Text, sondern als ausgewählter Eintrag aus der Liste.

---

## Schritt 4: Aktivieren und in beide Richtungen testen

1. Den Workflow oben rechts auf **Active** stellen
2. **Nach jeder weiteren Änderung einmal aus und wieder an.** Sonst läuft der Live-Webhook mit der alten Version, das ist der Reaktivierungs-Stolperstein dieser Instanz

Getestet wird nicht im Editor. Der Knopf "Listen for test event" lauscht auf `/webhook-test/...`, das Formular sendet an `/webhook/...`. Wer im Testmodus wartet, wartet ewig. **Die Läufe erscheinen im Tab Executions.**

### Test A: normaler Eintrag (muss durchgehen)

Weil das Formular noch nicht live ist, von Hand auslösen. In der PowerShell:

```bash
curl -X POST https://n8n.srv1417885.hstgr.cloud/webhook/kapitel-3-warteliste -H "Content-Type: application/json" -d "{\"vorname\":\"Testname\",\"email\":\"test@example.com\",\"hp\":\"\",\"quelle\":\"Handtest\"}"
```

**Woran du erkennst, dass es sitzt:** Im Reiter "Kapitel 3 Warteliste" steht eine neue Zeile. **Wichtig ist nicht, dass eine Zeile da ist, sondern was in C steht:** In `timestamp` muss ein vollständiges Datum mit Uhrzeit stehen, nicht leer und nicht `#NAME?`. Ein leeres Feld heißt, das Mapping ist nicht angekommen; ein `#NAME?` heißt, das Feld stand auf Fixed statt Expression. Dazu kommt eine Mail an brenner@bremos.org mit Betreff "Neue Vormerkung Kapitel 3: Testname".

### Test B: Honeypot gefüllt (muss blockiert werden)

```bash
curl -X POST https://n8n.srv1417885.hstgr.cloud/webhook/kapitel-3-warteliste -H "Content-Type: application/json" -d "{\"vorname\":\"Bot\",\"email\":\"bot@example.com\",\"hp\":\"ausgefuellt\",\"quelle\":\"Handtest\"}"
```

**Woran du erkennst, dass es sitzt:** **Keine** neue Zeile im Sheet, **keine** Mail. Im Tab Executions steht ein roter Lauf mit der Meldung "Honeypot gefuellt, Eintrag verworfen". Der rote Lauf ist hier das gewünschte Ergebnis, nicht ein Problem.

> [!important] Beide Tests sind nötig, nicht nur Test A
> Ein Filter, der alles wegwirft, sieht im Positivtest kaputt aus. Einer, der alles durchlässt, sieht im Positivtest richtig aus und ist schlimmer als kein Filter. Das war der Fund vom 15.08.: Der Honeypot-Node lag damals *neben* der Kette statt darin und hat korrekt geprüft, das Ergebnis aber ins Nichts geschickt.

3. **Beide Testzeilen danach aus dem Sheet löschen**, damit der Zählstand stimmt. Ein Nullergebnis mit zwei Testzeilen drin ist kein Nullergebnis.

---

## Schritt 5: Erst jetzt das Formular live schalten

Die Änderung an Kapitel 2 liegt committet im Repo `brenner-max/homepage` und ist **noch nicht deployed**. Erst wenn Schritt 1 bis 4 grün sind, deployen.

**Woran du erkennst, dass es sitzt:** Auf `bremos.org/schulung/k2-9d3b2807b991.html` ganz durchklicken bis zur Zusammenfassung. Unter der Erstgesprächs-Karte steht "Kapitel 3 entsteht" mit zwei Feldern und dem Knopf "Bescheid geben". **Dein Vorname aus dem Lektionsanfang steht schon im ersten Feld.** Absenden, dann muss "Eingetragen." erscheinen, eine Sheet-Zeile entstehen und die Meldung kommen. Diese Zeile danach ebenfalls löschen.

Erscheint stattdessen "Das hat gerade nicht geklappt", ist das kein Anzeigefehler, sondern der eingebaute Schutz: Das Formular zeigt keinen Erfolg ohne bestätigten Eingang (Fund vom 15.08.). Dann klemmt der Webhook, meist am **Allowed Origins** im Webhook-Node: Dort muss `https://bremos.org` stehen, sonst liest der Browser die Antwort nicht.

---

## Offen, gehört aber dazu

- **Die Löschroutine kennt den neuen Reiter nicht.** `loeschfristen-workflow.json` liest nur "Lead Magnet" und "Schulung K2". Damit hat die Warteliste als einzige der drei Listen keine Löschmechanik. Zu ergänzen: ein dritter Zweig aus dem Schedule Trigger mit einem weiteren Sheets-Lese-Node auf "Kapitel 3 Warteliste", dahinter derselbe Code-Node. **Frist hier kürzer als bei Leads:** Die Adresse ist für genau eine Benachrichtigung erhoben, danach ist der Zweck erledigt. Sinnvoll sind 12 Monate, oder Löschen direkt nach dem Versand der Kapitel-3-Mail
- **Verarbeitungsverzeichnis ergänzen** — `verarbeitungsverzeichnis-entwurf-2026-08-24.md` listet neun Verarbeitungen, diese ist die zehnte. Zweck, Rechtsgrundlage (Art. 6 Abs. 1 lit. a), Empfänger (Google, keine neuen) und Frist eintragen
- **Kein Double-Opt-In, und das ist hier vertretbar** — meine Einschätzung, keine Rechtsauskunft: Die Adresse wird für genau den Zweck erhoben, den der Eintragende selbst anstößt, und für nichts anderes. Es ist keine Werbeliste. Der offene DOI-Punkt aus dem Security-Check betrifft Werbemails und blockiert diese Benachrichtigung nicht. Wenn die Liste später für Werbung benutzt werden soll, gilt er wieder in voller Härte, und dann braucht es die Einwilligung neu
- **Eine der vier Kapitel-2-Kopien ist veraltet** — `schulungen/kapitel-2-routinen-automatisieren/kapitel-2-routinen-automatisieren.html` fehlt die Anbieterkennzeichnung mit Impressum und Datenschutz, also der Rechts-Fix vom 13.08., und das `noindex`. Die Datei hat deshalb bewusst **keine** Formular-Änderung bekommen. Entweder löschen oder auf den Stand bringen, aber als Entscheidung, nicht im Vorbeigehen
