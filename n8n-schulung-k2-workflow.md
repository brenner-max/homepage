# n8n Workflow: Schulung Kapitel 2 (Lead-Magnet)

> Letzte Aktualisierung: 2026-08-01
> Siehe auch: Landingpage `/schulung`, Muster: bestehender Workflow "Lead-Magnet" (Checkliste)

## Übersicht

| Eigenschaft | Wert |
|---|---|
| **Trigger** | Webhook `POST /webhook/schulung-k2` |
| **Payload** | `{ "vorname": "...", "email": "...", "quelle": "Schulung K2" }` |
| **Ziel 1** | Google Sheets: Lead-Log des Checklisten-Funnels, Spalte "Quelle" = Schulung K2 |
| **Ziel 2** | Gmail: Mail an den Lead mit dem Kapitel-2-Link |
| **Kapitel-2-Link** | `https://bremos.org/schulung/k2-9d3b2807b991.html` |

## Aufbau (Muster: Workflow "Lead-Magnet" duplizieren)

1. Bestehenden Checklisten-Workflow **duplizieren** und umbenennen: "Schulung K2"
2. **Webhook-Node:** Pfad auf `schulung-k2` ändern (POST, Respond immediately)
3. **Sheets-Node ("Append row in sheet"):** gleiches Dokument; im Google Sheet einmalig Spalte "Quelle" ergänzen, dann im Node mappen: Vorname → `{{ $json.body.vorname }}`, E-Mail → `{{ $json.body.email }}`, Quelle → fester Text `Schulung K2` (Nachname bleibt leer — das Schulungs-Formular fragt nur Vorname + E-Mail)
4. **Gmail-Node:** Betreff und Text ersetzen (Vorlage unten), UTF-8/Umlaute wie beim Checklisten-Fix beibehalten
5. **WICHTIG (Reaktivierungs-Gotcha):** Workflow nach jeder Änderung deaktivieren und wieder aktivieren, sonst läuft der Live-Webhook mit der alten Version
6. **Test:** Formular auf bremos.org/schulung mit eigener Adresse absenden → Airtable-Eintrag + Mail prüfen

## Mail-Vorlage (HTML, Anrede Sie — offizielle Zustellung)

Betreff: `Ihr Kapitel 2: Diese Routinen können Sie heute schon abgeben`

```html
<div style="font-family:'Inter',Arial,sans-serif;max-width:560px;padding:24px">
  <h2 style="color:#c99e20;font-size:20px">Hallo {{ $json.body.vorname }},</h2>
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
