# Allkin Integrations

The **integrations** of [Allkin](https://github.com/allkindev/allkin) — what the code calls plugins:
a page, a bridge to a service, sometimes an agent that goes with it. Allkin lists them on its
Integrations page and installs one from there; a right an integration declares is granted on its
page, never by the installation.

```
plugins/<id>/
├── plugin.json         the manifest: name, version (1.0.N), description, permissions, service, web…
├── README.md           for the user, with README-EN.md, README-ES.md, README-DE.md
├── icon.svg            its object icon (a Phosphor fill glyph on a gradient, viewBox 0 0 64 64)
├── locales.js          its texts in the four languages (Allkin.i18n.register)
└── …                   its code: a service (server.mjs), a page (view.html, its script and style)
```

[CREER-UN-PLUGIN.md](CREER-UN-PLUGIN.md) (in French) is the complete guide: a worked example, the
manifest, the rights, the service, the interface, local testing. Allkin's standard for the Coder
agent is `prompts/standards/PLUGIN-STANDARD.md` in the Allkin repository.

## Layout

Every repository for Allkin has the same layout, whatever it holds — one of these folders, or several:

```
catalogue.json          written by scripts/catalogue.mjs, never by hand (signed: catalogue.json.sig)
scripts/catalogue.mjs   checks every entry and writes the catalogue
agents/<id>/            a model of agent: agent.json, CLAUDE.md, README.md…
plugins/<id>/           an integration: plugin.json, its code, README.md…
skills/<id>/            a competence: SKILL.md, skill.json, README.md…
services/<id>/          a declarative service: service.json, README.md…
```

The code keeps the folder names of before (`plugins/`, `skills/`); the user reads integrations and
competences. An `id` is the folder name: lowercase letters, digits and dashes.

## Versions: `1.0.N`

Every entry carries a version of the form `1.0.N`: three numbers, the first two fixed, `N` an
integer without a leading zero. **Every change** to an entry (code, manifest, README, picture) raises
`N` by one, in the same change — Allkin offers an update only when the catalogue is ahead of the
installed version, and compares number by number (`1.0008` would read as `1.8`).

## The catalogue

```
node scripts/catalogue.mjs            # checks every entry, writes catalogue.json and signs it
node scripts/catalogue.mjs --check    # checks without writing (exit 1 on a difference)
node scripts/catalogue.mjs --unsigned # writes without signing: for a repository that is not Allkin's
```

The catalogue lists every file of every entry with its size and SHA-256 digest: an Allkin refuses
to install an entry whose files do not match. The catalogues of Allkin's four repositories are
signed with the owner's Ed25519 key (`~/.allkin-signing/catalogue.key`, never in a repository);
Allkin carries the public half and reads nothing from one of its repositories whose signature is
missing or wrong. `catalogue.json` and `catalogue.json.sig` are always committed together. The
owner publishes with `~/allkin-scripts/git_commit_tools.sh`, which raises the versions, regenerates
and signs the catalogue, commits and pushes.

## Your own repository

Anyone can make a repository Allkin reads: the same layout, this very `scripts/catalogue.mjs` run
with `--unsigned`, and the page of the repository pasted in Allkin under **Settings › General ›
Repositories**. What comes from it is shown as "not checked by Allkin". Allkin's own sheet
"Create a repository for Allkin" (the button of that section) says it all, step by step.

Every text shown to the user exists in the four languages of Allkin (en, fr, es, de).
