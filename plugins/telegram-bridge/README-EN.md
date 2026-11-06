# Telegram bridge

Talk to your agents from Telegram. You create as many bots as you want, each bound to **one agent
or several**, and you manage them from Allkin's **Telegram** page: who may write to them, which
agent answers, the conversations under way. Every bot listens continuously (long polling: nothing
to open on your router, no public address). When an agent wants to run a command, it comes in the
chat with two buttons: **Approve** or **Refuse**.

## Getting started

1. Grant the integration's four rights, tick **Allow starting as a service**, save, then reload
   Allkin's page (the Telegram page joins the interface).
2. Open **Telegram** from the System window, then **Add a bot**:
   - in Telegram, write `/newbot` to **@BotFather**: a name, then a username ending in `bot`. It
     answers with a **token**;
   - paste the token: Allkin checks it with Telegram and shows the bot it recognized;
   - choose the agent or agents that answer; the star picks the one that answers first;
   - **Start the bot**.
3. Write to the bot. You get a **code** and your request shows at the top of the page:
   **Approve**, and you can talk to it.

Several bots can serve the same agent, and one bot can serve several agents.

## The Telegram page

- **The table of bots**: its agents, the people who may write to it, today's and the last seven
  days' messages, the last message, its state (listening, paused, in error — a revoked token for
  instance, with what to do).
- **A row unfolds** on the bot's conversations: who talks to which agent, what was said last,
  where the conversation stands (at work, waiting for approval, answered), and a button to open it
  in Allkin.
- **Access requests** at the top: a stranger who writes to the bot gets a code; you approve or
  refuse with one click.
- A bot's **⋯** menu: settings, pause, invite link, open in Telegram, remove.
- The search and the agent filter in the page bar.

## A bot's settings

| Section  | What it sets                                                                                        |
|----------|-----------------------------------------------------------------------------------------------------|
| Agents   | the bot's agents, the default one; switching agents with `/agent`; after how long a silence a new conversation starts |
| Access   | the allowed people, each one's agent, who may approve commands; invites; groups                     |
| Approval | approving commands from Telegram, or refusing them outright                                         |
| Messages | taking files and photos (dropped into the agent's `Upload/`); "typing…"                             |
| Bot      | replacing the token, the command menu published in Telegram, the language of the bot's messages     |

An **invite link** (`t.me/<bot>?start=…`) adds a person in one message: valid 7 days, once. In a
**group**, the bot only stays if an allowed person added it and groups are accepted; there it
answers only allowed people, when it is mentioned or answered.

## In the chat

| Command  | Effect                                                         |
|----------|----------------------------------------------------------------|
| `/agent` | choose the agent you talk to, among the bot's (as buttons)     |
| `/new`   | start a fresh conversation with the same agent                 |
| `/who`   | the agent and the conversation of this chat                    |
| `/help`  | what the bot understands                                       |

Every chat keeps its conversation: it survives restarts and shows in the agent's history.
**Forms** an agent may ask for cannot be filled from Telegram: they are cancelled with a word of
explanation.

## The integration's settings

- **Local port**: where the service serves the page's API, on 127.0.0.1 only; the page goes
  through Allkin, behind your session.
- **Telegram API address**: only to change for a Bot API server of your own.
- The three **(previous version)** settings serve once: the bot of the previous version is taken
  over into the page, with its allowed users. Leave them empty afterwards.

## Rights

| Right      | Why                                                                                    |
|------------|----------------------------------------------------------------------------------------|
| Network    | poll Telegram for each bot, send the answers back, download files; serve the page's API locally |
| Agents     | open a conversation with an agent through Allkin's socket                              |
| Files      | drop received files into the agent's Upload folder                                     |
| Interface  | add the Telegram page to Allkin                                                        |

The bot grants no right: every agent keeps exactly the rights of its page. Tokens stay on the
server, in the integration's private folder; they are never shown nor given to an agent.

## When it does not work

- **The page says the service does not answer**: open the integration's page, check that the four
  rights are granted and the service runs; its log says why it stops.
- **Token refused**: the token was revoked in @BotFather. ⋯ menu › Settings › Bot › Replace, with
  the same bot's new token.
- **Read elsewhere**: another program (another server, a webhook) reads this bot's messages; a bot
  can be read by one program only.
- **The bot does not answer someone**: their request may be waiting at the top of the page.
