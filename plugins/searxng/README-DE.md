# SearXNG

Eine eigene Suchmaschine auf Ihrer Maschine. [SearXNG](https://github.com/searxng/searxng) ist
eine freie Metasuchmaschine: Sie befragt mehrere Suchmaschinen gleichzeitig, führt deren
Ergebnisse zusammen und speichert weder Profil noch Verlauf. Die Integration installiert und
startet sie selbst, **ohne Docker**, und macht zwei Dinge daraus:

- **eine Suchseite in Allkin** — Web, Bilder, Videos, Nachrichten, IT, Wissenschaft, mit Wahl
  des Zeitraums;
- **die Websuche Ihrer Agenten** über den Dienst „SearXNG“: ohne Schlüssel, ohne Kontingent,
  ohne die Suche des KI-Anbieters.

## Erste Schritte

1. Erteilen Sie die drei Rechte (unten steht, warum).
2. Kreuzen Sie **Start als Dienst erlauben** an und speichern Sie.
3. Öffnen Sie **SearXNG** im Systemfenster (das Logo von Allkin).

Beim **ersten Start** lädt die Integration SearXNG herunter und installiert seine Python-Pakete
in ihren Datenordner: Rechnen Sie mit **einer bis einigen Minuten**. Die Seite sagt, wo sie
steht (Download, Python-Umgebung, Pakete), dann öffnet sich die Suche von selbst. Spätere Starts
dauern einige Sekunden.

Die Maschine braucht **git** und **Python 3.10 oder neuer mit dem venv-Modul**. Unter Debian und
Ubuntu: `sudo apt install git python3 python3-venv`. Fehlt etwas, sagt die Seite es.

## Suchen

Geben Sie Ihre Wörter ein, <kbd>Eingabe</kbd>. <kbd>/</kbd> führt zurück ins Suchfeld. Die
Kategorien und der Zeitraum stehen in der Leiste; „Mehr Ergebnisse“ am Seitenende lädt die
Fortsetzung. Ein Ergebnis öffnet sich in einem neuen Browser-Tab; sein Menü „⋯“ kopiert den Link.
Der Fuß der Seite zählt die Ergebnisse und sagt, wie viele Suchmaschinen nicht geantwortet haben
(ihre Namen beim Überfahren).

## Die Suche Ihren Agenten geben

1. Seite **Dienste** → den Dienst **SearXNG** hinzufügen.
2. Adresse: `http://127.0.0.1:9350` (der Port aus den Einstellungen unten). Kein Schlüssel.
3. Auf der Seite des Agenten den Dienst **SearXNG** ankreuzen.

Der Agent sucht dann über Ihr SearXNG: Zu jedem Ergebnis erhält er Titel, Adresse, einen Auszug
und die Suchmaschinen, die es gefunden haben, in einer kurzen Form, die sein Arbeitsgedächtnis
schont.

## Einstellungen

| Einstellung             | Aufgabe                                                                                |
|-------------------------|----------------------------------------------------------------------------------------|
| Lokaler Port            | Port, auf dem die Integration auf `127.0.0.1` lauscht (Standard 9350); die Adresse des Dienstes |
| Inhaltsfilter           | Keiner, moderat oder streng: was SearXNG die Suchmaschinen weglassen lässt             |
| SearXNG aktuell halten  | Einmal pro Woche, beim Start der Integration (standardmäßig an)                        |

Befragt werden die Suchmaschinen, die SearXNG standardmäßig aktiviert. Seine Einstellungsdatei
wird bei jedem Start aus diesen neu geschrieben: Ändern Sie sie nicht von Hand.

## Angeforderte Rechte

- **Netzwerk** — Download von SearXNG und seinen Paketen, Lauschen auf dem lokalen Port,
  Anfragen an die Suchmaschinen bei jeder Suche.
- **Ausführung** — `git` und `python3` für die Installation, dann SearXNG selbst.
- **Oberfläche** — die Suchseite: ihr Tab und ihr Eintrag im Systemfenster.

SearXNG lauscht nur auf der Maschine (`127.0.0.1`): Ihre Seite läuft über Allkin, hinter Ihrer
Sitzung, und im Netzwerk wird nichts geöffnet. Die Suchen gehen von der Adresse **dieser
Maschine** an die Suchmaschinen: Diese sehen weder Ihren Browser noch Ihre Cookies, aber diese
Adresse.

## Wenn es nicht funktioniert

- **„SearXNG ist gestoppt“** — nicht alle Rechte sind erteilt, oder der Dienst darf nicht
  starten: Öffnen Sie die Seite der Integration.
- **„SearXNG konnte nicht starten“** — die Seite sagt, was fehlt (git, Python, venv,
  Verbindung). Beheben Sie es und **starten** Sie den Dienst auf der Seite der Integration
  **neu**; sein Protokoll zeigt die Einzelheiten.
- **Wenige oder keine Ergebnisse, „N Suchmaschinen haben nicht geantwortet“** — Suchmaschinen
  lehnen die Anfragen eines Servers manchmal eine Zeit lang ab (CAPTCHA, Zeitüberschreitung).
  Versuchen Sie es später erneut; die wöchentliche Aktualisierung von SearXNG behebt, was an
  einer geänderten Suchmaschine liegt.
- **Von vorn beginnen** — Dienst stoppen, den Ordner `runtime` im Datenordner der Integration
  löschen, neu starten: SearXNG wird neu installiert.

Das Deinstallieren der Integration stoppt SearXNG; ihre Einstellungen und ihre Kopie von SearXNG
bleiben in ihrem Datenordner: Eine neue Installation findet sie wieder.
