# Browser

The live view of your agents' browser. Every agent with the right “Browser” has a Chrome of its
own on Allkin's machine, kept between conversations with the sessions you open in it. This
integration opens one tab per agent where you watch the page it handles, take the hand with a
click, then give it back.

The browser's tools — navigating, reading the page, acting on it, taking a screenshot, managing
the tabs — are Allkin's, mounted by the right “Browser” on the agent's page. Without this
integration the agent browses all the same: you see its screenshots and its actions in the
conversation, not the page live.

## Getting started

1. In **Settings › Browser**, install the browser if it is not there yet (a download of about
   100 MB, once).
2. On an agent's page, group **Rights**, tick **Has a browser of its own**; tick **Can act on
   the pages** if it must fill forms, click, choose.
3. Install this integration, grant its right and reload Allkin.
4. Ask the agent for something: as soon as it opens its browser, the **Browser** tab opens
   beside the conversation.

## The screen

The bar holds **Back**, **Forward**, **Reload**, the address, the list of the browser's tabs
and a **⋯** menu (open the address in your own browser, copy it, close the agent's browser).
Below, the page live; in the foot, the state of the stream, **Capture** (the picture as it is)
and **Fit | Real size**.

The **capsule** at the bottom of the page says who has the hand: “Plume is browsing · the
page” with an indigo ring around the page, or “You have the hand · Plume waits”.

## Taking the hand

A click on **Take the hand**: your mouse and keyboard go to the page, the address opens, the
tabs obey you. The agent is told at its next tool and waits. This is how you sign in to a site,
pass a captcha or correct a form: what you type goes to Chrome and nowhere else, neither in the
conversation nor in the journal. <kbd>Esc</kbd> or **Give the hand back** returns the page to the
agent, which reads it again before acting.

## What the agent does, and what it asks

- Navigating and reading ask for nothing: reading the web is already a right without a card.
- **One sequence of actions, one card** in the conversation, each step named by the element it
  touches. You approve it once, or **for this session, on this site**.
- The agent never types a password: Allkin refuses, and it hands you the page.
- Downloads land in the agent's `Downloads/` folder.

## The Chrome of your own computer

When Allkin Client is open on this server and its **Browser** setting is on for this server, an
agent that also has the right **Your computers** can open **the Chrome of your PC**, before your
eyes: the window appears on your screen, in a separate "Allkin" profile (your sessions stay
there from one time to the next, your passwords are not in it), and the agent browses in it as
in its own. A click or a key of yours in the window takes the hand: the agent waits, and goes on
fifteen seconds after your last gesture. Closing the window closes the agent's browser, which
does not open it again on its own. The cards and the lines of the conversation say "In the
Chrome of …". This integration opens no tab for that browser — it is on your screen —, but
**Settings › Browser › View** still shows it, from a phone for instance.

## What the browser does not reach

The machine's own network (localhost, private addresses, Tailscale) stays out of reach unless
you open it in **Settings › Browser**; the sites you forbid there are out of reach of every
agent. A browser closes by itself after a while without a request or a viewer; the number of
browsers open at once is capped. Every action leaves a line in the journal, category
**Browser**.
