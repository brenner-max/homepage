# n8n Workflow: CTA Erstberatung (Google Calendar)

> Letzte Aktualisierung: 2026-04-14
> Siehe auch: [[homepage]], [[google-calendar-setup]]

## Übersicht

| Eigenschaft | Wert |
|---|---|
| **Trigger** | Google Calendar — neuer Termin |
| **Google Sheet** | "CTA Erstberatung" (brenner@bremos.org) |
| **Bestätigungs-Mail** | Automatisch via Google Calendar (Kalendereinladung) |
| **Info-Mail** | An info@bremos.org via Gmail |

## Workflow-Ablauf

```
Google Calendar Trigger → Google Sheets (Log) → Gmail (Info an Monika)
```

> **Hinweis:** Die Danke-Mail an den Interessenten entfällt — Google Calendar sendet automatisch eine Kalendereinladung mit allen Termin-Details.

---

## Schritt-für-Schritt: Workflow umbauen

### Vorbereitung

Der bestehende Workflow "Erstberatung-Workflow" wird umgebaut. Wenn du den alten Workflow behalten willst, dupliziere ihn vorher.

### Node 1: Google Calendar Trigger (NEU — ersetzt Webhook)

1. **Alten Webhook-Node löschen**
2. Neuen Trigger hinzufügen: **Google Calendar Trigger**
3. Credential: **Google-Verbindung** (brenner@bremos.org)
4. Einstellungen:
   - Event: `Event Created`
   - Calendar: Wähle den Kalender, auf dem der Terminplan liegt (Standard: brenner@bremos.org)
5. Der Trigger liefert automatisch: Teilnehmer-Name, E-Mail, Termin-Zeitpunkt, Beschreibung

### Node 2: Google Sheets — Append Row (anpassen)

1. Node bleibt bestehen, Mapping anpassen:
   - Operation: `Append Row`
   - Document: `CTA Erstberatung`
   - Sheet: `Sheet1`
2. Spalten-Mapping (angepasst auf Calendar-Daten):
   - `Name` → `{{ $json.summary }}` (Terminplan-Titel enthält Name)
   - `E-Mail` → `{{ $json.attendees[0].email }}`
   - `Termin` → `{{ $json.start.dateTime }}`
   - `Erstellt am` → `{{ $now.format('dd.MM.yyyy HH:mm') }}`

> **Hinweis:** Die genauen Feldnamen hängen davon ab, wie Google Calendar die Daten liefert. Nach dem ersten Test-Trigger kannst du die Felder im n8n-Editor sehen und korrekt mappen.

### Node 3: Gmail — Danke-Mail (ENTFERNT)

❌ **Diesen Node löschen.** Google Calendar sendet automatisch eine Kalendereinladung an den Interessenten.

### Node 4: Gmail — Info-Mail an Monika (anpassen)

1. Node bleibt bestehen, Felder anpassen:
   - To: `info@bremos.org`
   - Subject: `🔔 Neue Erstberatung gebucht: {{ $json.summary }}`
   - Email Type: `HTML`
   - Message (HTML):

```html
<div style="font-family:'Inter',Arial,sans-serif;padding:24px">
  <h2 style="color:#f5c842;font-size:18px">📅 Neue Erstberatung gebucht</h2>
  <table style="font-size:15px;line-height:2;border-collapse:collapse">
    <tr><td style="padding-right:16px;color:#666"><strong>Termin:</strong></td><td>{{ $json.summary }}</td></tr>
    <tr><td style="padding-right:16px;color:#666"><strong>Zeitpunkt:</strong></td><td>{{ $json.start.dateTime }}</td></tr>
    <tr><td style="padding-right:16px;color:#666"><strong>Teilnehmer:</strong></td><td>{{ $json.attendees[0].email }}</td></tr>
    <tr><td style="padding-right:16px;color:#666"><strong>Erstellt:</strong></td><td>{{ $now.format('dd.MM.yyyy HH:mm') }} Uhr</td></tr>
  </table>
  <p style="margin-top:20px;font-size:14px;color:#999">Dieser Termin wurde über die Buchungsseite auf bremos.org gebucht.</p>
</div>
```

---

## Abschluss

1. **Verbindungen prüfen:** Webhook-Node entfernt, Calendar Trigger → Sheets → Gmail Info
2. **Workflow aktivieren** (Toggle oben rechts auf "Active" / "Veröffentlicht")
3. **Test:** Über die Buchungsseite einen Test-Termin buchen
4. Prüfen:
   - [ ] Google Calendar: Termin erscheint
   - [ ] Interessent: Kalendereinladung per E-Mail erhalten
   - [ ] Google Sheet: Neuer Eintrag mit Termin-Details
   - [ ] info@bremos.org: Info-Mail eingegangen
