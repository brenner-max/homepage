# n8n Workflow: Schulung Kapitel 2 (Lead-Magnet)

> Letzte Aktualisierung: 2026-08-01
> Siehe auch: Landingpage `/schulung`, Muster: bestehender Workflow "Lead-Magnet" (Checkliste)

## Übersicht

| Eigenschaft | Wert |
|---|---|
| **Trigger** | Webhook `POST /webhook/schulung-k2` |
| **Payload** | `{ "vorname": "...", "email": "...", "quelle": "Schulung K2", "werbung": "Ja\|Nein", "einwilligung_am": "<ISO oder leer>" }` |
| **Ziel 1** | Google Sheets: Lead-Log des Checklisten-Funnels, Spalte "Quelle" = Schulung K2 |
| **Ziel 2** | Gmail: Mail an den Lead mit dem Kapitel-2-Link |
| **Kapitel-2-Link** | `https://bremos.org/schulung/k2-9d3b2807b991.html` |

## Aufbau (Muster: Workflow "Lead-Magnet" duplizieren)

1. Bestehenden Checklisten-Workflow **duplizieren** und umbenennen: "Schulung K2"
2. **Webhook-Node:** Pfad auf `schulung-k2` ändern (POST, Respond immediately)
3. **Sheets-Node ("Append row in sheet"):** gleiches Dokument; im Google Sheet einmalig Spalte "Quelle" ergänzen, dann im Node mappen: Vorname → `{{ $json.body.vorname }}`, E-Mail → `{{ $json.body.email }}`, Quelle → fester Text `Schulung K2` (Nachname bleibt leer — das Schulungs-Formular fragt nur Vorname + E-Mail)
4. **Gmail-Node:** To auf `{{ $json["E-Mail"] }}` setzen (Daten kommen vom Sheets-Node, nicht mehr vom Webhook!), dann Betreff und Text ersetzen (Vorlage unten), UTF-8/Umlaute wie beim Checklisten-Fix beibehalten
5. **WICHTIG (Reaktivierungs-Gotcha):** Workflow nach jeder Änderung deaktivieren und wieder aktivieren, sonst läuft der Live-Webhook mit der alten Version
6. **Test:** Formular auf bremos.org/schulung mit eigener Adresse absenden → Sheet-Eintrag + Mail prüfen

## Mail-Vorlage (HTML, Anrede Sie — offizielle Zustellung)

Betreff: `Ihr Kapitel 2: Diese Routinen können Sie heute schon abgeben`

```html
<div style="font-family:'Inter',Arial,sans-serif;max-width:560px;padding:24px">
  <h2 style="color:#c99e20;font-size:20px">Hallo {{ $json.Vorname }},</h2>
  <p style="font-size:15px;line-height:1.7">
    schön, dass Sie weitermachen. Hier ist Ihr Zugang zu Kapitel 2 der Schulung —
    darin sehen Sie, welche Büroroutinen sich heute schon automatisieren lassen
    und wie Sie richtig anfangen:
  </p>
  <p style="margin:28px 0">
    <a href="https://bremos.org/schulung/k2-9d3b2807b991.html"
       style="background:#f5c842;color:#1a1508;padding:12px 26px;border-radius:8px;
              text-decoration:none;font-weight:700;font-size:15px">
      Kapitel 2 jetzt starten
    </a>
  </p>
  <p style="font-size:14px;line-height:1.7;color:#555">
    Die Schulung dauert etwa 15 Minuten, läuft direkt im Browser und endet mit einem
    druckbaren Merkblatt. Tipp: Ton einschalten.
  </p>
  <p style="font-size:14px;line-height:1.7;color:#555">
    Wenn Sie danach wissen wollen, wie das in Ihrem Betrieb konkret aussehen kann:
    <a href="https://bremos.org/termin" style="color:#c99e20">Buchen Sie sich ein kostenloses
    15-Minuten-Erstgespräch.</a>
  </p>
  <p style="font-size:13px;color:#999;margin-top:28px">
    Herzliche Grüße<br>Monika Brenner · BreMo KI-Beratung<br>
    <a href="https://bremos.org" style="color:#999">bremos.org</a>
  </p>
</div>
```

## Checkliste nach Aktivierung

- [ ] Testlead im Google Sheet mit Quelle "Schulung K2"
- [ ] Mail kommt an, Umlaute korrekt, Link funktioniert
- [ ] Workflow-Toggle aktiv (nach letzter Änderung einmal aus/an)

---

## Nachtrag 2026-08-09: Benachrichtigung an Monika ergänzen

**Warum:** Der Workflow meldet neue Leads bisher niemandem. Sie landen still im Sheet — wer nicht aktiv reinschaut, merkt nichts. Zum Vergleich: Demo 2 (Cal.com-Briefing) schickt eine interne Mail, dieser Workflow nicht.

> [!warning] Benachrichtigt werden ≠ nachfassen dürfen
> Dieser Node informiert **dich**. Er schafft keine Erlaubnis, den Lead werblich anzuschreiben. Der Formular-Hinweis ("Kein Spam. Jederzeit abmeldbar. DSGVO-konform.") deckt nur die Zusendung von Kapitel 2 ab; werbliche E-Mail-Ansprache braucht nach § 7 Abs. 2 Nr. 2 UWG eine Einwilligung, und § 7 Abs. 3 (Bestandskunden) greift nicht, weil kein Kauf stattfand. Wer aktiv nachfassen will, muss zuerst den Einwilligungstext am Formular erweitern — das gilt dann ab Änderung, nicht rückwirkend. Der bereits eingebaute Weg bleibt zulässig: die K2-Mail verlinkt das kostenlose Erstgespräch, der Lead meldet sich selbst.

### Aufbau: zweiter Zweig aus dem Sheets-Node

Den neuen Node **parallel** an den Sheets-Node hängen, nicht hinter den bestehenden Gmail-Node. Zwei Gründe: Die Benachrichtigung läuft auch dann, wenn der Mailversand an den Lead klemmt — und `$json` zeigt im Parallelzweig direkt auf die Sheet-Zeile, wodurch die Mapping-Trap (`$json` zeigt immer nur auf den DIREKTEN Vorgänger) gar nicht erst auftritt.

1. Auf dem Canvas am **Ausgangspunkt des Sheets-Nodes** ein zweites Mal ziehen — es entsteht ein zweiter Zweig neben dem bestehenden Gmail-Node
2. Node hinzufügen: **Gmail → Send Message**, Credential wie gehabt (Gmail OAuth2, info@bremos.org)
3. Felder setzen:
   - **To:** `brenner@bremos.org` (internes Postfach für Alerts — info@ ist die Außendarstellung und hier bewusst nicht gemeint)
   - **Subject:** `={{ "Neuer Schulungs-Lead: " + $json.Vorname }}`
   - **Email Type:** **HTML** (nicht Text — Gmail kollabiert Plain-Text-Zeilenumbrüche beim Anzeigen)
   - **Message:** Vorlage unten
4. Node umbenennen in `Alert Monika`, damit auf dem Canvas sofort klar ist, welcher Gmail-Node wohin schickt
5. **Reaktivierungs-Gotcha:** Workflow deaktivieren und wieder aktivieren — sonst läuft der Live-Webhook weiter mit der alten Version
6. Test: Formular auf bremos.org/schulung mit eigener Adresse absenden. Danach **die Testzeile im Sheet löschen** (sonst verfälscht sie den 2-Wochen-Check)

### Mail-Vorlage (HTML)

```html
<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7">
  <p><strong>Neuer Lead über die Schulung (Kapitel 2)</strong></p>
  <p>
    Vorname: {{ $json.Vorname }}<br>
    E-Mail: {{ $json["E-Mail"] }}<br>
    Quelle: {{ $json.Quelle }}
  </p>
  <p style="color:#555">
    Kapitel 2 wurde automatisch zugestellt. Ein aktives Nachfassen per E-Mail ist
    von der Einwilligung nicht gedeckt — abwarten, ob der Lead das Erstgespräch bucht.
  </p>
</div>
```

> Die Feldnamen (`Vorname`, `E-Mail`, `Quelle`) sind die **Spaltenüberschriften des Google Sheets**, nicht die Webhook-Felder. `E-Mail` braucht wegen des Bindestrichs die Klammerschreibweise `$json["E-Mail"]`. Wenn eine Spalte anders heißt, im Output-Panel des Sheets-Nodes nachsehen und per Drag-and-Drop übernehmen.

### Checkliste

- [ ] Zweiter Zweig am Sheets-Node, Node heißt `Alert Monika`
- [ ] Email Type = HTML
- [ ] Testlead ausgelöst: Lead-Mail UND Alert-Mail angekommen
- [ ] Workflow einmal aus/an geschaltet
- [ ] Testzeile im Sheet "Schulung K2" gelöscht

---

## Nachtrag 2026-08-09 (2): Werbe-Einwilligung aufnehmen

Das Formular auf `/schulung` hat seit 2026-08-09 eine **freiwillige, standardmäßig leere Checkbox** für die Einwilligung in werbliche E-Mails. Ohne Häkchen bekommt der Lead trotzdem Kapitel 2 — nur das Nachfassen entfällt.

Der Webhook schickt jetzt zwei zusätzliche Felder:

| Feld | Wert |
|---|---|
| `werbung` | `Ja` oder `Nein` |
| `einwilligung_am` | ISO-Zeitstempel des Absendens, bei `Nein` leerer String |

> [!important] Reihenfolge: erst n8n, dann die Seite live
> Solange die beiden Spalten im Google Sheet fehlen, verwirft der Sheets-Node die Felder stillschweigend. Dann kreuzt jemand an, und die Einwilligung ist nirgends dokumentiert — die Rechenschaftspflicht aus Art. 5 Abs. 2 DSGVO verlangt aber, dass sich Einwilligungen nachweisen lassen. Eine nicht dokumentierte Einwilligung ist wertlos: Sie dürfen dann faktisch nicht nachfassen und wissen es nicht einmal.

### Schritte

1. Im Google Sheet, Blatt **"Schulung K2"**, zwei Spalten ergänzen: **`Werbung`** und **`Einwilligung am`**
2. Im n8n-Sheets-Node **"Refresh columns"** klicken (sonst greift der Spalten-Cache — bekannter Stolperstein aus dem Erstaufbau), dann mappen:
   - `Werbung` → `={{ $json.body.werbung }}`
   - `Einwilligung am` → `={{ $json.body.einwilligung_am }}`
3. Workflow deaktivieren + reaktivieren
4. Test über das Formular, **einmal mit und einmal ohne Häkchen** — beide Zeilen im Sheet prüfen, danach beide Testzeilen löschen

### Was das erlaubt und was nicht

- Nachfassen ist nur bei Leads mit `Werbung = Ja` zulässig, und erst ab dem Tag, an dem die Checkbox live ist
- Die Leads von vor dem 09.08. haben diese Einwilligung **nicht** — sie gilt nicht rückwirkend, auch nicht durch nachträgliches Anschreiben mit der Bitte um Zustimmung (das wäre selbst schon Werbung)
- Jede Werbemail braucht einen funktionierenden Abmeldeweg; ein Widerruf muss im Sheet nachgeführt werden
- Rechtlich final abgesichert ist das erst mit anwaltlicher Prüfung — sinnvoll gemeinsam mit den Vertragsbausteinen, die ohnehin schon beim Anwalt liegen
