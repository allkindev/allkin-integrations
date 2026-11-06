# Schmiede

Die Schmiede ist die Werkstatt, in der **Coder**, der Systemagent von Allkin, mit Ihnen
Integrationen, Dienste und Fähigkeiten baut und ändert – ohne etwas zu installieren, bevor Sie es
gesehen haben.

## Erste Schritte

1. Installieren Sie die Integration aus dem Fenster **Hinzufügen** der Seite Integrationen,
   erteilen Sie ihr auf ihrer Seite ihr Recht und laden Sie Allkin neu.
2. Öffnen Sie die **Schmiede** aus dem Systemfenster oder mit **Integration erstellen** auf der
   Seite Integrationen und **Dienst erstellen** auf der Seite Dienste.
3. Sagen Sie, was Sie möchten: die Art (Integration, Dienst, Fähigkeit), Ihre Anfrage und, wenn
   Sie wollen, einen Ausgangspunkt: eine Drittsoftware, eine API, die Dokumentation einer API,
   eine Seite, einen Agenten, eine Datei. **Mit Coder beginnen** legt das Gerüst des Projekts im
   Arbeitsbereich von Coder an und öffnet seine Unterhaltung.

Coder muss eingeschaltet sein (seine Seite, Gruppe „Aktivierung“).

## Die Seite eines Projekts

- **Das Band**: der Name des Projekts, seine installierte Version und die laufende, das Ergebnis
  der Prüfung; die Werkzeuge der Vorschau (Computer oder Telefon, helles oder dunkles Thema,
  **Zeigen**); Dateien, Prüfung, Öffnen, **Installieren** oder **Aktualisieren** und das Menü „⋯“
  (die Unterhaltung von Coder, der Ordner, die Seite der Integration, zurück zur installierten
  Version, löschen).
- **Die sechs Schritte** von Coder: verstehen, planen, entwerfen, bauen, prüfen, installieren –
  erledigt, laufend, beiseitegelegt, ausstehend –, mit einer Zeile zum laufenden Schritt.
- **Die Vorschau**: die Seite der Integration, aus dem Arbeitsbereich von Coder gezeichnet, ohne
  sie zu installieren, in einem isolierten Rahmen. Ein Dienst oder eine Fähigkeit hat nichts zu
  zeigen: das Blatt ihres Manifests nimmt den Platz ein. Eine Seite, die der eigene Dienst der
  Integration ausliefert, ist erst nach der Installation zu sehen.
- **Die Unterhaltung** mit Coder schwebt rechts (auf einem Telefon ein Blatt am unteren Rand),
  mit einem Klick eingeklappt. **Zeigen** und dann ein Klick auf ein Element der Vorschau nennt es
  am Anfang Ihrer Nachricht: „Zu „Knopf Speichern“: …“.

Nach jedem Schreiben von Coder werden Vorschau und Prüfung neu gelesen. **Installieren** läuft
über das Installationsfenster der Seite Integrationen, aus dem Repository von Coder; solange die
Prüfung einen Fehler meldet, wird nichts installiert.

## Ändern, was die Schmiede gebaut hat

Der Startbildschirm, Reiter **Ändern**: Wählen Sie ein Projekt der Schmiede und sagen Sie, was
sich ändern muss. Die installierte Version läuft während der Arbeit weiter; das Fenster Dateien
markiert, was von ihr abweicht; **Auf 1.0.N aktualisieren** liefert die neue Version, und „Zur
installierten Version zurückkehren“ bricht die Änderung ab. Nur was die Schmiede gebaut hat, wird
hier geändert: nichts, was aus einem Repository oder einer anderen Quelle stammt.

## Was die Schmiede schreibt, und wo

Nichts in den Dateien des Projekts. Die Schmiede vermerkt, was sie über ein Projekt weiß, im
gemeinsamen Ordner, in ihrem eigenen Ordner `forge/`: `<art>-<id>.json` (Ihre Anfrage, der
Ausgangspunkt, die Unterhaltung) und `<art>-<id>.progress.json`, die **Coder selbst schreibt**,
um zu sagen, bei welchem Schritt er ist. Ein Projekt zu löschen verschiebt es in den Papierkorb
des Arbeitsbereichs von Coder; was installiert ist, bleibt installiert.
