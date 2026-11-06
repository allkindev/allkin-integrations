# Forge

The Forge is the workshop where **Coder**, Allkin's system agent, makes and modifies with you
integrations, services and competences — without installing anything before you have seen it.

## Getting started

1. Install the integration from the **Add** window of the Integrations page, grant it its right
   on its page and reload Allkin.
2. Open the **Forge** from the System window, or with **Create an integration** on the
   Integrations page and **Create a service** on the Services page.
3. Say what you want — the type (integration, service, competence), your request, and if you
   wish a starting point: a third-party software, an API, the documentation of an API, a page,
   an agent, a file. **Start with Coder** creates the skeleton of the project in Coder's
   workspace and opens its conversation.

Coder has to be switched on (its page, group "Activation").

## The page of a project

- **The band**: the name of the project, its installed version and the one in progress, the
  result of the check; the tools of the preview (computer or phone, light or dark theme,
  **Designate**); Files, Check, Open, **Install** or **Update**, and the "⋯" menu (Coder's
  conversation, the folder, the page of the integration, back to the installed version,
  delete).
- **Coder's six steps**: understand, plan, mock up, build, check, install — done, current, set
  aside, to come —, with one line on the current step.
- **The preview**: the page of the integration, drawn from Coder's workspace without installing
  it, in an isolated frame. A service or a competence has nothing to show: the sheet of its
  manifest takes the place. A page served by the integration's own service is only seen once
  installed.
- **The conversation** with Coder floats at the right (a sheet at the bottom on a phone), folded
  with one click. **Designate**, then a click on an element of the preview names it at the head
  of your message: "About “Save button”: …".

After each of Coder's writes, the preview and the check are read again. **Install** goes through
the installation window of the Integrations page, from Coder's repository; nothing is installed
while the check reports an error.

## Modifying what the Forge made

The start screen, tab **Modify**: choose a project of the Forge, say what has to change. The
installed version keeps running while the work goes on; the Files window marks what differs from
it; **Update to 1.0.N** delivers the new version, and "Go back to the installed version" abandons
the modification. Only what the Forge made is modified here: nothing that comes from a
repository or from another source.

## What the Forge writes, and where

Nothing in the project's files. The Forge notes what it knows of a project in the shared folder,
in its own `forge/` folder: `<kind>-<id>.json` (your request, the starting point, the
conversation) and `<kind>-<id>.progress.json`, which **Coder writes itself** to say the step it
is at. Deleting a project moves it to the bin of Coder's workspace; what is installed stays
installed.
