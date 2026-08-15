# n8n: Sofortmaßnahmen aus dem Security-Check

> Erstellt: 2026-08-15
> Grundlage: `security-check-n8n-2026-08-15.md` im Business-Vault
> Betrifft die Workflows **Lead-Magnet** (Checkliste), **Schulung K2** und **Erstberatung**

Drei Änderungen, alle in n8n, zusammen etwa 15 Minuten. Reihenfolge einhalten: Punkt 1 ist der einzige mit Meldepflicht-Potenzial.

> [!important] Punkt 1 vor dem nächsten Öffnen des Sheets
> Die Lücke aus Punkt 1 wird genau dann ausgelöst, wenn das Google Sheet geöffnet wird. Also erst umstellen, dann reinschauen.

> [!warning] Reaktivierungs-Gotcha (gilt für jede Änderung hier)
> Nach jeder Änderung den Workflow **deaktivieren und wieder aktivieren**. Sonst läuft der Live-Webhook weiter mit der alten Fassung. Der Toggle sitzt oben rechts im Editor.

---

## Punkt 1: Zellformatierung auf "Raw" (dringend)

**Warum:** Der Sheets-Node schreibt Formularwerte unverändert in die Zelle. Beginnt ein Wert mit `=`, wertet Google Sheets ihn als Formel aus statt als Text. Eine eingeschleuste `IMPORTXML`-Formel würde beim Öffnen des Sheets Lead-Daten an einen fremden Server senden.

**Betrifft drei Workflows, nicht zwei.** Der Erstberatungs-Workflow schreibt ebenfalls in ein Sheet, und sein Name-Feld kommt aus einer Terminbuchung. Buchen kann jeder, also ist auch dieser Weg angreifbar.

### Klickweg (für jeden der drei Workflows einzeln)

1. Workflow öffnen: **Lead-Magnet**, danach **Schulung K2**, danach **Erstberatung**
2. Den **Google-Sheets-Node** anklicken (Operation "Append Row in Sheet")
3. Ganz nach unten scrollen bis zum Abschnitt **Options**
4. Auf **Add option** klicken
5. In der Liste **Cell Format** wählen
6. Den Wert von **"Let Google Sheets format"** auf **"Let n8n format"** umstellen
   > Die Voreinstellung "Let Google Sheets format" ist der gefährliche Wert: Sie behandelt den Inhalt, als hätte ihn jemand eingetippt, und führt Formeln aus. "Let n8n format" übernimmt die Datentypen so, wie n8n sie liefert.
   >
   > In älteren n8n-Fassungen hießen dieselben zwei Werte `USER_ENTERED` und `RAW`, in noch älteren stand die Option unter **Value Input Mode**. Gemeint ist immer dasselbe.
7. Node schließen, **Save**
8. Workflow **aus- und wieder einschalten**

### Prüfen, ob es gewirkt hat

Ein harmloser Test, der ohne echten Angriff eine klare Antwort gibt:

1. Formular auf `bremos.org/schulung` absenden, als Vorname genau das eintragen: `=1+1`
2. Ins Blatt "Schulung K2" schauen:
   - Steht dort **`=1+1`** als Text: die Einstellung greift, erledigt
   - Steht dort **`2`**: Sheets rechnet weiter, Schritt 3 bis 7 nochmal prüfen

> [!important] Dieser Test ist der eigentliche Beweis
> Die n8n-Doku beschreibt "Let n8n format" nur als "gleiche Datentypen wie die Eingabe", sie sagt nicht ausdrücklich, dass Formeln nicht mehr ausgeführt werden. Die Einstellung zu setzen und anzunehmen, es wirke, wäre genau der Fehler vom 13.08.: ein plausibel aussehender Zustand ohne Nachweis. Erst der Test oben belegt es.
3. Testzeile danach löschen

> Diesen Test erst **nach** dem 2-Wochen-Check machen, sonst steht eine zusätzliche Zeile im Blatt, während gezählt wird.

---

## Punkt 2: Alert-Mail auf Text umstellen

**Warum:** Der Node `Alert Monika` verschickt als HTML und setzt den Vornamen roh ein. Ein präparierter Vorname bringt fremdes Markup, etwa einen Link, in eine Mail, die im eigenen Postfach liegt und wie eine Meldung des eigenen Systems aussieht. Die interne Meldung enthält nur drei Werte, dafür braucht es kein HTML.

### Klickweg (nur Workflow "Schulung K2")

1. Workflow **Schulung K2** öffnen
2. Node **`Alert Monika`** anklicken
3. Feld **Email Type** von `HTML` auf **`Text`** umstellen
4. Das Feld **Message** enthält jetzt noch die HTML-Vorlage. Inhalt komplett löschen und durch die Fassung unten ersetzen
   > Feld muss auf **Expression** stehen (Umschalter erscheint oben rechts am Feld, wenn du mit der Maus darüberfährst). **Kein `=` davor tippen**, das setzt n8n selbst.
5. **Save**, Workflow aus- und wieder einschalten

### Neue Message (Text, keine Tags)

```
Neuer Lead über die Schulung (Kapitel 2)

Vorname: {{ $json.Vorname }}
E-Mail: {{ $json["E-Mail"] }}
Quelle: {{ $json.Quelle }}

Kapitel 2 wurde automatisch zugestellt.
Aktives Nachfassen per E-Mail ist nur erlaubt, wenn in der Spalte "Werbung" ein Ja steht.
```

> Bei Email Type `Text` bleiben Zeilenumbrüche erhalten. Der Grund, warum früher HTML nötig schien, war ein anderer: Gmail kollabiert Umbrüche nur, wenn HTML-Inhalt als Text verschickt wird. Reiner Text mit echten Umbrüchen wird sauber dargestellt.

---

## Punkt 3: Honeypot gegen Fluten

**Was ein Honeypot ist:** ein Eingabefeld, das im Formular unsichtbar ist. Ein Mensch sieht es nie und füllt es nie aus. Einfache Bots füllen stur jedes Feld, das sie im Quelltext finden. Kommt also etwas in diesem Feld an, war es kein Mensch, und der Durchlauf wird verworfen.

> [!warning] Ehrliche Einordnung der Wirkung
> Ein Honeypot stoppt **einfache Bots**, die Formulare abgrasen. Gegen jemanden, der den Endpunkt kennt und gezielt direkt dorthin sendet, hilft er **nicht** — der lässt das Feld einfach leer. Er ist billig und nimmt den Großteil des Massenmülls, ersetzt aber kein Rate Limit. Der echte Schutz gegen gezielten Missbrauch ist das Double-Opt-In aus Punkt 4 der Empfehlungsliste.

Der Honeypot besteht aus zwei Hälften. Die erste ist Code und liegt bei mir, die zweite sind Klicks in n8n.

### Hälfte A: Feld ins Formular (mache ich auf Ansage)

In beide Formulare kommt ein verstecktes Feld, das per CSS aus dem Sichtfeld genommen wird, nicht per `display:none` — manche Bots erkennen das und überspringen solche Felder. Der Wert wird als `hp` mitgeschickt und ist bei echten Absendern immer leer. Betroffen sind `index.html` und `schulung/index.html`.

### Hälfte B: Prüfung in n8n (Klickweg, für beide Webhook-Workflows)

1. Workflow **Schulung K2** öffnen, danach dasselbe in **Lead-Magnet**
2. Auf der Verbindungslinie **zwischen Webhook-Node und Sheets-Node** auf das kleine **Plus** klicken. Der neue Node wird dadurch dazwischengehängt
3. **If** auswählen
4. In der Bedingung:
   - **Left Value:** Feld auf **Expression** umschalten, dann `{{ $json.body.hp }}`
   - **Operation:** `String` → **is empty**
5. Node umbenennen in `Kein Bot`, damit auf dem Canvas klar ist, was er tut
6. Verbindungen prüfen: Der Ausgang **true** muss zum Sheets-Node führen. Der Ausgang **false** bleibt **unverbunden** — damit endet der Durchlauf dort still, genau das ist gewollt
7. **Save**, Workflow aus- und wieder einschalten

> [!warning] Der Fehler, der am 15.08. eine halbe Stunde gekostet hat
> Wird der Node **neben** die Kette gesetzt statt **auf** die Verbindungslinie, bleibt die alte Direktverbindung vom Webhook zum Sheets-Node bestehen, und die Ausgänge des If-Nodes hängen im Leeren. Der Node prüft dann völlig korrekt und schickt das Ergebnis ins Nichts, während der Eintrag am ihm vorbei ins Sheet läuft. Von außen sieht das aus wie eine falsche Bedingung, und man sucht an der falschen Stelle.
>
> **Die eine Kontrollfrage:** Hat der Sheets-Node hinterher genau **einen** eingehenden Pfeil, und kommt der vom **true**-Ausgang? Zwei Pfeile heißen: Umweg noch offen.
>
> Dass der Ausdruck im Editor **rot** erscheint, ist kein Hinweis auf einen Fehler. Ohne Eingabedaten kann n8n ihn dort nicht auflösen. Entschieden wird es im echten Lauf.

### Prüfen — immer beide Richtungen

Ein Filter, der **alles** wegwirft, sieht im Negativtest genauso erfolgreich aus wie einer, der richtig arbeitet. Deshalb zwei Absendungen, nicht eine:

1. **Negativtest:** Honeypot füllen (im Browser über die Entwicklertools, das Feld hat die ID `k2-firma` bzw. `lm-firma`). Erwartung: **keine** Zeile, **keine** Mail
2. **Positivtest:** ganz normal absenden, Honeypot bleibt leer. Erwartung: Zeile und Mails wie gewohnt
3. Fehlen **beide**, hängt der Sheets-Node am **false**- statt am **true**-Ausgang. Das ist der einzige Fall, der schlimmer ist als gar kein Filter, weil dann echte Interessenten weggeworfen werden
4. Testzeilen löschen

> Der Erfolgsbildschirm auf der Seite taugt hier nicht als Nachweis: Der Webhook steht auf "Respond Immediately" und antwortet mit 200, lange bevor der If-Node läuft. Entschieden wird es im Blatt.

---

## Danach

Alle drei Punkte sind Konfiguration, keiner ändert etwas an dem, was ein echter Lead erlebt. Wenn nach der Umstellung ein normaler Testlead sauber durchläuft, also Sheet-Zeile plus beide Mails, ist die Strecke unverändert funktionsfähig und die drei Lücken sind zu.

Offen bleibt danach nur noch der große Block: **Double-Opt-In**. Der schließt den Missbrauch als Versandweg und den fehlenden Einwilligungsnachweis nach Art. 7 Abs. 1 DSGVO in einem Zug.
