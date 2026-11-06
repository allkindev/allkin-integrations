# Browser

Die Live-Ansicht des Browsers Ihrer Agenten. Jeder Agent mit dem Recht „Browser“ hat ein eigenes
Chrome auf dem Rechner von Allkin, zwischen den Unterhaltungen behalten, mit den Sitzungen, die
Sie darin öffnen. Diese Integration öffnet einen Tab pro Agent, in dem Sie die Seite sehen, die
er bedient, mit einem Klick die Kontrolle übernehmen und sie wieder zurückgeben.

Die Werkzeuge des Browsers — navigieren, die Seite lesen, auf ihr handeln, ein Bildschirmfoto
machen, die Tabs verwalten — sind die von Allkin, eingehängt durch das Recht „Browser“ auf der
Seite des Agenten. Ohne diese Integration surft der Agent trotzdem: Sie sehen seine
Bildschirmfotos und seine Aktionen in der Unterhaltung, aber nicht die Seite live.

## Erste Schritte

1. Installieren Sie in **Einstellungen › Browser** den Browser, falls er noch fehlt (ein
   Download von etwa 100 MB, einmalig).
2. Setzen Sie auf der Seite eines Agenten, Gruppe **Rechte**, den Haken bei **Hat einen eigenen
   Browser**; setzen Sie **Darf auf den Seiten handeln**, wenn er Formulare ausfüllen, klicken,
   auswählen soll.
3. Installieren Sie diese Integration, gewähren Sie ihr Recht und laden Sie Allkin neu.
4. Bitten Sie den Agenten um etwas: sobald er seinen Browser öffnet, öffnet sich der Tab
   **Browser** neben der Unterhaltung.

## Der Bildschirm

Die Leiste trägt **Zurück**, **Vor**, **Neu laden**, die Adresse, die Liste der Tabs des Browsers
und ein Menü **⋯** (die Adresse im eigenen Browser öffnen, sie kopieren, den Browser des Agenten
schließen). Darunter die Seite live; in der Fußzeile der Zustand der Übertragung, **Aufnahme**
(das Bild, wie es ist) und **Einpassen | Originalgröße**.

Die **Kapsel** am Fuß der Seite sagt, wer die Kontrolle hat: „Plume surft · die Seite“ mit einem
indigofarbenen Rand um die Seite, oder „Sie haben die Kontrolle · Plume wartet“.

## Die Kontrolle übernehmen

Ein Klick auf **Kontrolle übernehmen**: Maus und Tastatur gehen an die Seite, die Adresse öffnet
sich, die Tabs gehorchen Ihnen. Der Agent erfährt es bei seinem nächsten Werkzeug und wartet. So
melden Sie sich bei einer Website an, lösen ein Captcha oder korrigieren ein Formular: was Sie
tippen, geht an Chrome und nirgendwo sonst hin, weder in die Unterhaltung noch ins Protokoll.
<kbd>Esc</kbd> oder **Kontrolle zurückgeben** gibt die Seite dem Agenten zurück, der sie vor dem
Handeln erneut liest.

## Was der Agent tut, und was er fragt

- Navigieren und Lesen fragen nichts: das Web zu lesen ist bereits ein Recht ohne Karte.
- **Eine Sequenz von Aktionen, eine Karte** in der Unterhaltung, jeder Schritt benannt nach dem
  Element, das er berührt. Sie genehmigen sie einmal, oder **für diese Sitzung, auf dieser
  Website**.
- Der Agent tippt nie ein Passwort: Allkin lehnt ab, und er übergibt Ihnen die Seite.
- Downloads landen im Ordner `Downloads/` des Agenten.

## Der Chrome Ihres eigenen Computers

Wenn Allkin Client auf diesem Server geöffnet ist und seine Einstellung **Browser** für diesen
Server eingeschaltet ist, kann ein Agent, der auch das Recht **Ihre Computer** hat, **den Chrome
Ihres PCs** öffnen, vor Ihren Augen: das Fenster erscheint auf Ihrem Bildschirm, in einem
eigenen Profil „Allkin“ (Ihre Sitzungen bleiben dort von Mal zu Mal, Ihre Passwörter sind nicht
darin), und der Agent surft darin wie in seinem eigenen. Ein Klick oder eine Taste von Ihnen im
Fenster übernimmt die Kontrolle: der Agent wartet und macht fünfzehn Sekunden nach Ihrer letzten
Geste weiter. Das Fenster zu schließen schließt den Browser des Agenten, der ihn nicht von sich
aus wieder öffnet. Die Karten und die Zeilen der Unterhaltung sagen „Im Chrome von …“. Diese
Integration öffnet keinen Tab für diesen Browser — er ist auf Ihrem Bildschirm —, aber
**Einstellungen › Browser › Ansehen** zeigt ihn trotzdem, zum Beispiel von einem Telefon aus.

## Was der Browser nicht erreicht

Das Netz des Rechners (localhost, private Adressen, Tailscale) bleibt außer Reichweite, solange
Sie es nicht in **Einstellungen › Browser** öffnen; die dort verbotenen Websites sind für jeden
Agenten außer Reichweite. Ein Browser schließt sich nach einer Weile ohne Anfrage und ohne
Zuschauer von selbst; die Zahl der gleichzeitig offenen Browser ist begrenzt. Jede Aktion
hinterlässt eine Zeile im Protokoll, Kategorie **Browser**.
