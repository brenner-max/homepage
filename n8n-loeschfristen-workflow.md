# n8n Workflow: Löschfristen für Lead-Daten

> Erstellt: 2026-08-13
> Zweck: Umsetzung der Speicherbegrenzung nach Art. 5 Abs. 1 lit. e DSGVO — Leads 24 Monate
> Siehe auch: `n8n-schulung-k2-workflow.md`, mein-business/04-projects/homepage/datenschutzerklaerung-entwurf-2026-08-13.md

---

## Vorbefund: Das Datum fehlt

> [!warning] Ohne Eintragsdatum kann keine Frist berechnet werden
> Im Google Sheet **Lead Magnet** existiert in beiden Blättern eine Spalte `timestamp` — sie ist aber **in allen bestehenden Zeilen leer**. Der Webhook schickt das Feld (`timestamp` beim Checklisten-Formular), der Sheets-Node schreibt es nicht ins Blatt. Dasselbe gilt für die Spalte `Quelle`.
>
> **Folge:** Ein Löschworkflow hätte nichts, woran er rechnen kann. Er würde entweder gar nichts löschen oder alles.
>
> Das ist dieselbe Fehlerklasse wie am 09.08.: Damals fehlten die Spalten `Werbung` und `Einwilligung am`, und der Sheets-Node verwarf die Felder stillschweigend. Hier ist die Spalte da, aber nicht gemappt. Das Ergebnis ist gleich.

**Reihenfolge deshalb: erst Schritt 1, dann Schritt 3.** Schritt 2 räumt den Altbestand.

Nebenbei aufgefallen: Im Checklisten-Blatt steht eine kaputte Zeile mit dem Inhalt `}}` / `{{ $json.email }}` — ein Überbleibsel aus einem früheren Mapping-Fehler. Die gehört mit in Schritt 2.

---

## Schritt 1: Eintragsdatum serverseitig schreiben

Das erledigt zwei Dinge auf einmal — die Grundlage für die Löschfrist, und den Punkt E2 aus dem Rechts-Check (bisher kam der Zeitstempel aus dem Browser des Nutzers und war damit manipulierbar).

In **beiden** bestehenden Workflows (`Lead-Magnet` und `Schulung K2`) am **Google-Sheets-Node**:

1. Prüfen, ob die Spalte `timestamp` im Mapping auftaucht. Falls nicht: **"Refresh columns"** klicken (bekannter Spalten-Cache-Stolperstein)
2. Feld `timestamp` auf **Expression** umschalten und eintragen:

```
{{ $now.toISO() }}
```

> [!warning] Fixed vs. Expression
> `{{ ... }}` wird nur ausgewertet, wenn das Feld auf **Expression** steht. Mit der Maus über das Feld fahren, dann erscheint oben rechts der Umschalter `Fixed | Expression`.
> **Kein `=` davor tippen.** Das setzt n8n selbst. Sonst steht das Zeichen sichtbar im Ergebnis, oder Google Sheets liest die Zelle als Formel und zeigt `#NAME?`.

3. Beim Schulungs-Workflow zusätzlich die Spalte `Quelle` mit festem Text `Schulung K2` belegen, falls dort noch nichts steht — sonst lässt sich später nicht unterscheiden, woher ein Lead kam
4. **Reaktivierungs-Gotcha:** Workflow deaktivieren und wieder aktivieren, sonst läuft der Live-Webhook mit der alten Fassung
5. Testlead über das jeweilige Formular schicken, im Sheet prüfen, dass `timestamp` gefüllt ist. Testzeile danach löschen

Format der Zeitstempel: `2026-08-13T14:32:10.000+02:00`. Das ist sortierbar und maschinenlesbar.

---

## Schritt 2: Altbestand bereinigen

Die bestehenden Zeilen haben kein Datum. Sie lassen sich vom Workflow nicht bewerten, also müssen sie einmalig von Hand geklärt werden.

**Im Checklisten-Blatt** sind fast alle Einträge Tests (`test@example.com`, eigene Adressen, `Testvorname`). Diese Zeilen löschen — samt der kaputten `}}`-Zeile. Was an echten Fremdadressen übrig bleibt: In der Spalte `timestamp` das ungefähre Eintragsdatum von Hand nachtragen. Wenn es sich nicht mehr rekonstruieren lässt, das Datum des Formular-Livegangs eintragen und im Zweifel früher löschen als später.

**Im Blatt "Schulung K2"** stehen laut Abruf nur die Kopfzeilen — die Testzeilen wurden am 09.08. gelöscht, echte Leads sind offenbar noch keine dazugekommen. Falls doch welche da sind: gleiches Vorgehen.

> Das ist zugleich der Datenstand für den 2-Wochen-Check am 15.08.

---

## Schritt 3: Der Lösch-Workflow

### Aufbau

```
Schedule Trigger (monatlich)
        │
        ├──► Sheets: Get rows (Blatt 1: Checkliste) ──► Code: "Fristen prüfen" ──┐
        │                                                                         │
        └──► Sheets: Get rows (Blatt 2: Schulung K2) ─► Code: "Fristen prüfen" ──┤
                                                                                  │
                                                        Gmail: Bericht an Monika ◄┘
                                                                  │
                                                    (erst nach Freigabe scharf:)
                                                        Sheets: Delete Rows
```

### 1. Schedule Trigger

- **Trigger Interval:** Months
- **Months Between Triggers:** 1
- **Trigger at Day of Month:** 1
- **Trigger at Hour:** 6

Monatlich reicht. Eine Frist von 24 Monaten wird nicht dadurch verletzt, dass ein Datensatz ein paar Tage länger liegt — aber sie wird verletzt, wenn nie jemand hinschaut.

### 2. Google Sheets: Get row(s)

Zwei Nodes, je einer pro Blatt, beide aus dem Schedule Trigger heraus.

- **Resource:** Sheet Within Document
- **Operation:** Get Row(s)
- **Document:** `Lead Magnet`
- **Sheet:** das jeweilige Blatt
- Keine Filter — der Code-Node entscheidet

Der Node liefert je Zeile ein Feld `row_number`. **Das ist der Schlüssel zum Löschen.**

### 3. Code-Node "Fristen prüfen"

Sprache: JavaScript. Mode: **Run Once for All Items**.

```javascript
// Speicherbegrenzung Art. 5 Abs. 1 lit. e DSGVO: Leads nach 24 Monaten loeschen.
// Wichtig: absteigend nach Zeilennummer sortieren. Wer von oben loescht,
// verschiebt alle darunter liegenden Zeilen und trifft danach die falschen.

const MONATE = 24;
const grenze = DateTime.now().minus({ months: MONATE });

const zuLoeschen = [];
const ohneDatum  = [];

for (const item of $input.all()) {
  const zeile = item.json;
  const roh = zeile.timestamp;

  // Zeilen ohne Datum niemals automatisch loeschen — nur melden.
  if (!roh || String(roh).trim() === '') {
    ohneDatum.push({
      zeile: zeile.row_number,
      email: zeile['E-Mail'] || '(keine)',
    });
    continue;
  }

  const datum = DateTime.fromISO(String(roh));
  if (!datum.isValid) {
    ohneDatum.push({
      zeile: zeile.row_number,
      email: zeile['E-Mail'] || '(keine)',
      hinweis: 'Datum unlesbar: ' + roh,
    });
    continue;
  }

  if (datum < grenze) {
    zuLoeschen.push({
      zeile: zeile.row_number,
      email: zeile['E-Mail'] || '(keine)',
      eingetragen: datum.toFormat('dd.MM.yyyy'),
      alterInMonaten: Math.floor(DateTime.now().diff(datum, 'months').months),
    });
  }
}

// Absteigend sortieren — von unten nach oben loeschen.
zuLoeschen.sort((a, b) => b.zeile - a.zeile);

return [{
  json: {
    blatt: $('Schedule Trigger').first().json.blattName || 'unbekannt',
    geprueft: $input.all().length,
    zuLoeschenAnzahl: zuLoeschen.length,
    zuLoeschen,
    ohneDatumAnzahl: ohneDatum.length,
    ohneDatum,
    stichtag: grenze.toFormat('dd.MM.yyyy'),
  },
}];
```

Zwei Entscheidungen darin, die bewusst so sind:

- **Zeilen ohne Datum werden nie automatisch gelöscht**, nur gemeldet. Ein fehlendes Datum ist ein Fehler in der Erfassung, kein Grund, Daten zu vernichten.
- **Absteigend sortiert.** Google Sheets nummeriert Zeilen fortlaufend. Löscht man Zeile 5 und danach Zeile 9, ist die ursprüngliche 9 inzwischen die 8 — und man löscht die falsche. Von unten nach oben tritt das nicht auf.

### 4. Gmail: Bericht

- **To:** `brenner@bremos.org` — bleibt auf **Fixed**
- **Subject:** auf **Expression**: `{{ "Löschfristen-Bericht: " + $json.zuLoeschenAnzahl + " faellig" }}`
- **Email Type:** **HTML**
- **Message:** auf **Expression**, Vorlage unten

```html
<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7">
  <p><strong>Löschfristen-Prüfung {{ $now.toFormat('dd.MM.yyyy') }}</strong></p>
  <p>
    Geprüfte Zeilen: {{ $json.geprueft }}<br>
    Älter als 24 Monate: <strong>{{ $json.zuLoeschenAnzahl }}</strong><br>
    Ohne verwertbares Datum: {{ $json.ohneDatumAnzahl }}<br>
    Stichtag: alles vor dem {{ $json.stichtag }}
  </p>
  <p style="color:#555">
    {{ $json.zuLoeschen.map(z => "Zeile " + z.zeile + " — " + z.email + " (vom " + z.eingetragen + ")").join("<br>") }}
  </p>
  <p style="color:#a33">
    {{ $json.ohneDatumAnzahl > 0 ? "Achtung: " + $json.ohneDatumAnzahl + " Zeilen haben kein Datum und werden NICHT automatisch gelöscht. Bitte von Hand ansehen." : "" }}
  </p>
</div>
```

### 5. Google Sheets: Delete Rows — erst später anschließen

> [!important] Die ersten zwei Läufe nur berichten lassen
> Schalte den Lösch-Node erst an, wenn der Bericht zweimal plausibel aussah. Eine Automatik, die Kundendaten löscht, prüft man vorher — nicht danach. Löschen ist der eine Schritt, den kein Backup im Sheet rückgängig macht.

Wenn du soweit bist: Nach dem Code-Node einen **Split Out** auf das Feld `zuLoeschen`, dahinter:

- **Resource:** Sheet Within Document
- **Operation:** Delete Rows or Columns
- **Document / Sheet:** wie oben
- **To Delete:** Rows
- **Start Row Number:** auf **Expression**: `{{ $json.zeile }}`
- **Number of Rows to Delete:** `1`
- Im Node unter *Settings*: **Execute Once** ausschalten, damit jede Zeile drankommt

Weil die Liste absteigend sortiert ist, arbeitet der Node von unten nach oben — genau richtig.

### 6. Nach dem Bauen

- Workflow **deaktivieren und wieder aktivieren** (Reaktivierungs-Gotcha)
- Einmal von Hand ausführen und den Bericht lesen
- Erst danach den Zeitplan scharf schalten

---

## Was dieser Workflow nicht abdeckt

Die Datenschutzerklärung nennt vier Stellen mit Fristen. Dieser Workflow deckt eine davon ab:

| Stelle | Frist | Abgedeckt |
|---|---|---|
| Lead-Sheet | 24 Monate | ✅ dieser Workflow |
| Postfach info@bremos.org | 6 Monate | ❌ von Hand, quartalsweise |
| Cal.com-Buchungen | 6 Monate | ❌ prüfen, ob Cal.com selbst löscht |
| Widerruf einer Werbe-Einwilligung | sofort | ❌ von Hand: Spalte `Werbung` auf Nein, Datum vermerken |

Für das Postfach lohnt eine wiederkehrende Aufgabe im Kalender, quartalsweise. Automatisieren lässt sich das auch, aber bei E-Mails ist die Trennung zwischen "Anfrage ohne Abschluss" und "Korrespondenz mit Vertrag" nichts, was ein Filter zuverlässig entscheidet — und die zweite Gruppe darf nicht gelöscht werden.

---

## Checkliste

- [ ] Schritt 1: `timestamp` in beiden Workflows auf Expression `{{ $now.toISO() }}`, `Quelle` beim Schulungs-Workflow gesetzt
- [ ] Beide Workflows aus- und wieder eingeschaltet, je ein Testlead geprüft, Testzeilen gelöscht
- [ ] Schritt 2: Testzeilen und die kaputte `}}`-Zeile aus dem Checklisten-Blatt entfernt, echte Leads mit Datum versehen
- [ ] Schritt 3: Workflow gebaut, **ohne** Lösch-Node
- [ ] Zwei Berichte abgewartet und geprüft
- [ ] Lösch-Node angeschlossen, Start Row Number auf Expression, Execute Once aus
- [ ] Workflow einmal aus/an geschaltet
