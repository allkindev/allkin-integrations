# SearXNG

A search engine of your own, on your machine. [SearXNG](https://github.com/searxng/searxng) is a
free metasearch engine: it asks several search engines at once, gathers their results, and keeps
neither a profile nor a history. The integration installs and runs it by itself, **without
Docker**, then makes two things of it:

- **a search page inside Allkin** — web, images, videos, news, IT, science, with a choice of
  period;
- **web search for your agents**, through the service "SearXNG": no key, no quota, without going
  through the AI provider's search.

## Getting started

1. Grant the three rights (see below why).
2. Tick **Allow it to start as a service**, then save.
3. Open **SearXNG** from the System window (Allkin's logo).

On **first start**, the integration downloads SearXNG and installs its Python packages into its
data folder: allow **one to a few minutes**. The page says where it is at (download, Python
environment, packages), then the search opens by itself. Later starts take a few seconds.

The machine needs **git** and **Python 3.10 or newer with its venv module**. On Debian and
Ubuntu: `sudo apt install git python3 python3-venv`. If one is missing, the page says so.

## Searching

Type your words, <kbd>Enter</kbd>. <kbd>/</kbd> goes back to the search field. The categories and
the period are in the bar; "More results" at the bottom loads the next page. A result opens in a
new browser tab; its "⋯" menu copies the link. The foot of the page counts the results and says
how many engines did not answer (their names on hover).

## Giving the search to your agents

1. **Services** page → add the service **SearXNG**.
2. Address: `http://127.0.0.1:9350` (the port of the settings below). No key.
3. On the agent's page, tick the service **SearXNG**.

The agent then searches through your SearXNG: for each result it gets the title, the address, a
snippet and the engines that found it, in a short form that spares its working memory.

## Settings

| Setting                 | Role                                                                                  |
|-------------------------|---------------------------------------------------------------------------------------|
| Local port              | Port the integration listens on, on `127.0.0.1` (default 9350); the service's address |
| Content filter          | None, moderate or strict: what SearXNG asks the engines to leave out                  |
| Keep SearXNG up to date | Once a week, when the integration starts (on by default)                              |

The engines asked are the ones SearXNG enables by default. Its settings file is written again at
every start from these: do not edit it by hand.

## Rights asked

- **Network** — downloading SearXNG and its packages, listening on the local port, requests to
  the search engines at every search.
- **Execution** — `git` and `python3` for the installation, then SearXNG itself.
- **Interface** — the search page: its tab and its entry in the System window.

SearXNG listens on the machine only (`127.0.0.1`): your page goes through Allkin, behind your
session, and nothing is opened on the network. Searches leave from **this machine's** address to
the engines: they see neither your browser nor your cookies, but they do see that address.

## When it does not work

- **"SearXNG is stopped"** — not every right is granted, or the service is not allowed to start:
  open the integration's page.
- **"SearXNG could not start"** — the page says what is missing (git, Python, venv, connection).
  Fix it, then **restart** the service from the integration's page; its log shows the detail.
- **Few or no results, "N engines did not answer"** — engines sometimes refuse a server's
  requests for a while (CAPTCHA, timeout). Try again later; SearXNG's weekly update fixes what
  comes from an engine that changed.
- **Starting over** — stop the service, delete the `runtime` folder of the integration's data
  folder, start again: SearXNG is reinstalled.

Uninstalling the integration stops SearXNG; its settings and its copy of SearXNG stay in its data
folder: a new installation finds them again.
