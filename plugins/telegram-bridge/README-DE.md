# Telegram-Brücke

Sprechen Sie von Telegram aus mit Ihren Agenten. Sie legen so viele Bots an, wie Sie wollen, jeder
mit **einem oder mehreren Agenten** verbunden, und verwalten sie auf der Seite **Telegram** von
Allkin: wer ihnen schreiben darf, welcher Agent antwortet, die laufenden Unterhaltungen. Jeder Bot
hört ständig zu (Long Polling: nichts am Router zu öffnen, keine öffentliche Adresse). Will ein
Agent einen Befehl ausführen, kommt er im Chat mit zwei Schaltflächen: **Erlauben** oder
**Ablehnen**.

## Erste Schritte

1. Erteilen Sie die vier Rechte der Integration, setzen Sie **Start als Dienst erlauben**,
   speichern Sie und laden Sie die Seite von Allkin neu (die Seite Telegram kommt zur Oberfläche).
2. Öffnen Sie **Telegram** im Systemfenster, dann **Einen Bot hinzufügen**:
   - schreiben Sie in Telegram `/newbot` an **@BotFather**: einen Namen, dann einen Benutzernamen,
     der auf `bot` endet. Er antwortet mit einem **Token**;
   - fügen Sie das Token ein: Allkin prüft es bei Telegram und zeigt den erkannten Bot;
   - wählen Sie den oder die Agenten, die antworten; der Stern wählt den, der zuerst antwortet;
   - **Den Bot starten**.
3. Schreiben Sie dem Bot. Sie bekommen einen **Code** und Ihre Anfrage erscheint oben auf der
   Seite: **Erlauben**, und Sie können mit ihm sprechen.

Mehrere Bots können demselben Agenten dienen, und ein Bot kann mehreren Agenten dienen.

## Die Seite Telegram

- **Die Tabelle der Bots**: seine Agenten, die Personen, die ihm schreiben dürfen, die Nachrichten
  von heute und der letzten sieben Tage, die letzte Nachricht, sein Status (hört zu, pausiert,
  Fehler — etwa ein widerrufenes Token, mit dem, was zu tun ist).
- **Eine Zeile klappt auf** und zeigt die Unterhaltungen des Bots: wer mit welchem Agenten spricht,
  was zuletzt gesagt wurde, wo die Unterhaltung steht (bei der Arbeit, wartet auf Freigabe,
  beantwortet), und eine Schaltfläche, um sie in Allkin zu öffnen.
- **Zugangsanfragen** oben: Ein Unbekannter, der dem Bot schreibt, bekommt einen Code; Sie
  erlauben oder lehnen mit einem Klick ab.
- Das Menü **⋯** eines Bots: Einstellungen, Pause, Einladungslink, in Telegram öffnen, entfernen.
- Die Suche und der Agentenfilter in der Leiste der Seite.

## Die Einstellungen eines Bots

| Bereich      | Was eingestellt wird                                                                            |
|--------------|-------------------------------------------------------------------------------------------------|
| Agenten      | die Agenten des Bots, der Standard-Agent; Wechsel mit `/agent`; nach wie langer Pause eine neue Unterhaltung beginnt |
| Zugang       | die erlaubten Personen, der Agent jeder Person, wer Befehle freigeben darf; Einladungen; Gruppen |
| Freigabe     | Befehle aus Telegram freigeben oder sofort ablehnen                                             |
| Nachrichten  | Dateien und Fotos annehmen (in `Upload/` des Agenten abgelegt); „schreibt…“                     |
| Bot          | das Token ersetzen, das in Telegram veröffentlichte Befehlsmenü, die Sprache der Bot-Nachrichten |

Ein **Einladungslink** (`t.me/<bot>?start=…`) fügt eine Person mit einer Nachricht hinzu: 7 Tage
gültig, einmal. In einer **Gruppe** bleibt der Bot nur, wenn eine erlaubte Person ihn hinzugefügt
hat und Gruppen angenommen werden; dort antwortet er nur erlaubten Personen, wenn er erwähnt oder
ihm geantwortet wird.

## Im Chat

| Befehl   | Wirkung                                                              |
|----------|----------------------------------------------------------------------|
| `/agent` | den Agenten wählen, mit dem man spricht, unter denen des Bots        |
| `/new`   | eine neue Unterhaltung mit demselben Agenten beginnen                |
| `/who`   | Agent und Unterhaltung dieses Chats                                  |
| `/help`  | was der Bot versteht                                                 |

Jeder Chat behält seine Unterhaltung: Sie übersteht Neustarts und erscheint im Verlauf des
Agenten. **Formulare**, die ein Agent anfordern kann, lassen sich aus Telegram nicht ausfüllen:
Sie werden mit einer Erklärung abgebrochen.

## Einstellungen der Integration

- **Lokaler Port**: wo der Dienst die API der Seite bereitstellt, nur auf 127.0.0.1; die Seite
  läuft über Allkin, hinter Ihrer Sitzung.
- **Adresse der Telegram-API**: nur für einen eigenen Bot-API-Server zu ändern.
- Die drei Einstellungen **(vorherige Version)** dienen einmal: Der Bot der vorherigen Version wird
  mit seinen erlaubten Nutzern in die Seite übernommen. Danach leer lassen.

## Rechte

| Recht        | Warum                                                                                 |
|--------------|---------------------------------------------------------------------------------------|
| Netzwerk     | Telegram für jeden Bot abfragen, Antworten zurückschicken, Dateien laden; die API der Seite lokal bereitstellen |
| Agenten      | über die Socket von Allkin eine Unterhaltung mit einem Agenten öffnen                 |
| Dateien      | empfangene Dateien im Upload-Ordner des Agenten ablegen                               |
| Oberfläche   | die Seite Telegram zu Allkin hinzufügen                                               |

Der Bot erteilt kein Recht: Jeder Agent behält genau die Rechte seiner Seite. Die Tokens bleiben
auf dem Server, im privaten Ordner der Integration; sie werden nie gezeigt noch einem Agenten
gegeben.

## Wenn es nicht klappt

- **Die Seite sagt, der Dienst antworte nicht**: Öffnen Sie die Seite der Integration, prüfen Sie,
  dass die vier Rechte erteilt sind und der Dienst läuft; sein Protokoll sagt, warum er anhält.
- **Token abgelehnt**: Das Token wurde in @BotFather widerrufen. Menü ⋯ › Einstellungen › Bot ›
  Ersetzen, mit dem neuen Token desselben Bots.
- **Anderswo gelesen**: Ein anderes Programm (ein anderer Server, ein Webhook) liest die
  Nachrichten dieses Bots; ein Bot kann nur von einem gelesen werden.
- **Der Bot antwortet jemandem nicht**: Seine Anfrage wartet vielleicht oben auf der Seite.
