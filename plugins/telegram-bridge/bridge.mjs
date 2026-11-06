// Telegram bridge — the background service of the integration.
//
// Several bots, each serving one agent or several (2026-11-06, style D of
// mockups/telegram in Allkin's repository). Every bot has its own polling loop
// (getUpdates, long polling: no public address, no webhook to set up). Every
// chat a bot holds is bound to one of the bot's agents through the Unix socket
// of Allkin, with the same protocol as the CLI: one socket connection per chat,
// attached to a session that lasts across restarts. What the agent answers goes
// back to the chat; a command it wants to run comes with two buttons.
//
// Who may talk to a bot is the bot's own list of people. Someone unknown gets a
// code and waits as a request, which the user approves on the page; an invite
// link (t.me/<bot>?start=<token>) adds a person in one message.
//
// The page of the integration (its `ui` part) talks to this service through
// Allkin's relay of its web part (/plugins/telegram-bridge/web/api/…): only a
// signed-in user reaches it. Tokens stay in bots.json, never sent back.
//
// Settings arrive from Allkin in the environment (see plugin-services.ts);
// ALLKIN_SOCKET and ALLKIN_DIR only exist with the "agents" right.
import { createServer } from "node:http";
import { connect } from "node:net";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const settings = JSON.parse(process.env.ALLKIN_PLUGIN_SETTINGS ?? "{}");
const dataDir = process.env.ALLKIN_PLUGIN_DATA ?? join(process.cwd(), "data");
const socketPath = process.env.ALLKIN_SOCKET;
const allkinDir = process.env.ALLKIN_DIR;
const port = Number(process.env.PORT || settings.port || 9340);
const apiBase = String(settings.apiBase ?? "https://api.telegram.org").replace(/\/+$/, "");
const LANGUAGES = ["en", "fr", "es", "de"];

if (!socketPath) fail("ALLKIN_SOCKET is missing: the integration needs the \"agents\" right to reach the agents.");
mkdirSync(dataDir, { recursive: true });

function fail(message) {
  console.error(message);
  process.exit(1);
}

const log = (...args) => console.log(new Date().toISOString(), ...args);

/* ---- Files of the data folder ------------------------------------------- */
function readJson(name, fallback) {
  try {
    return JSON.parse(readFileSync(join(dataDir, name), "utf-8"));
  } catch {
    return fallback;
  }
}
/** Written whole then renamed: a crash never leaves half a file. */
function writeJson(name, value) {
  const path = join(dataDir, name);
  writeFileSync(`${path}.tmp`, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  renameSync(`${path}.tmp`, path);
}

const DEFAULT_OPTIONS = {
  switchAgents: true,
  newAfterHours: 12,
  approvals: true,
  files: true,
  typing: true,
  commandsMenu: true,
  groups: false,
  language: "fr",
};

/** bots.json: the bots, their tokens, agents, people, groups and options. */
let store = readJson("bots.json", null);
if (!store || !Array.isArray(store.bots)) store = { version: 1, bots: [] };
/** requests.json: people the bots do not know yet, waiting for the user. */
let requests = readJson("requests.json", []);
/** chats.json: every chat a bot holds — its agent, session and where it stands. */
const chats = readJson("chats.json", {});
/** stats.json: messages received per bot and per day. */
const stats = readJson("stats.json", {});
/** offsets.json: the next update to ask for, per bot. */
const offsets = readJson("offsets.json", {});

const saveStore = () => writeJson("bots.json", store);
const saveRequests = () => writeJson("requests.json", requests);
const saveChats = () => writeJson("chats.json", chats);
let statsTimer = null;
const saveStatsSoon = () => {
  if (statsTimer) return;
  statsTimer = setTimeout(() => {
    statsTimer = null;
    writeJson("stats.json", stats);
  }, 2000);
};

function newId() {
  return `b${randomBytes(4).toString("hex")}`;
}

function normalizeBot(b) {
  return {
    id: b.id,
    token: String(b.token ?? ""),
    tgId: b.tgId ?? null,
    username: String(b.username ?? ""),
    name: String(b.name ?? ""),
    enabled: b.enabled !== false,
    agents: Array.isArray(b.agents) ? [...new Set(b.agents.map(String))] : [],
    defaultAgent: b.defaultAgent ?? null,
    people: Array.isArray(b.people) ? b.people : [],
    groups: Array.isArray(b.groups) ? b.groups : [],
    invites: Array.isArray(b.invites) ? b.invites : [],
    options: { ...DEFAULT_OPTIONS, ...(b.options ?? {}) },
    createdAt: b.createdAt ?? Date.now(),
  };
}
store.bots = store.bots.map(normalizeBot);

/* The bot of the version before (one bot in the integration's settings) is
   taken over once, with its allowed ids and its default agent. */
if (!store.legacyImported) {
  const token = String(settings.botToken ?? "").trim();
  if (token && store.bots.length === 0) {
    const ids = String(settings.allowedUsers ?? "").split(/[\s,;]+/).map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
    const agent = String(settings.defaultAgent ?? "").trim();
    store.bots.push(
      normalizeBot({
        id: newId(),
        token,
        agents: agent ? [agent] : [],
        defaultAgent: agent || null,
        people: ids.map((id) => ({ id, name: "", username: "", agentId: null, approve: true, addedAt: Date.now() })),
        options: { ...DEFAULT_OPTIONS, approvals: settings.approvals !== false, language: LANGUAGES.includes(settings.language) ? settings.language : "fr" },
      }),
    );
    // The offset of the old loop carries on: no message is read twice.
    const old = readJson("offset.json", null);
    if (old?.offset) offsets[store.bots[0].id] = Number(old.offset) || 0;
    log(`imported the bot of the previous version (${ids.length} allowed user(s))`);
  }
  store.legacyImported = true;
  saveStore();
}

const botById = (id) => store.bots.find((b) => b.id === id);

/* ---- Texts shown in the chat, in the bot's own language ------------------- */
const TEXTS = {
  en: {
    help: "I relay this chat to an Allkin agent.\n\n/agent — choose the agent you talk to\n/new — start a fresh conversation\n/who — which agent and conversation this chat uses\n\nAnything else is sent to the agent. A photo or a file is dropped into its Upload folder.",
    requestSent: "This bot is private. Your request has been sent to its owner, with the code {code}. You will get a message once it is accepted.",
    requestPending: "Your request is waiting for the owner of the bot (code {code}).",
    welcome: "Welcome! You can talk to {name} now. /help lists what I understand.",
    accepted: "Your request has been accepted: you can talk to {name} now.",
    pickAgent: "Which agent do you want to talk to?",
    switched: "This chat now talks to {name}. A new conversation starts.",
    noSwitch: "This bot talks to {name} only.",
    unknownAgent: "This bot has no agent named {id}.",
    newSession: "New conversation with {name}.",
    who: "Agent: {name}\nConversation: {session}",
    noAgent: "This bot has no agent yet: its owner chooses one in Allkin.",
    unreachable: "Allkin does not answer right now: try again in a moment.",
    error: "⚠️ {message}",
    proposal: "{agent} wants to run a command ({risk}):\n\n{command}\n\n{explanation}",
    approve: "✅ Approve",
    refuse: "❌ Refuse",
    approved: "✅ Approved: {command}",
    refused: "❌ Refused: {command}",
    notApprover: "You cannot approve commands on this bot.",
    autoRefused: "{agent} proposed a command, refused automatically (approvals from Telegram are off):\n{command}",
    formUnsupported: "The agent asked for a form, which cannot be filled from Telegram: cancelled. Answer in Allkin's interface, or rephrase.",
    filesOff: "This bot does not take files.",
    fileSaved: "File received: {name}",
    fileFailed: "Could not fetch the file from Telegram: {message}",
    fileNote: "[File dropped in Upload/{name}]",
    cmdAgent: "Choose the agent you talk to",
    cmdNew: "Start a fresh conversation",
    cmdWho: "Which agent this chat uses",
    cmdHelp: "What this bot understands",
  },
  fr: {
    help: "Je relaie cette conversation à un agent Allkin.\n\n/agent — choisir l'agent à qui vous parlez\n/new — repartir sur une conversation vierge\n/who — l'agent et la conversation de ce chat\n\nTout le reste part à l'agent. Une photo ou un fichier est déposé dans son dossier Upload.",
    requestSent: "Ce bot est privé. Votre demande a été transmise à son propriétaire, avec le code {code}. Vous recevrez un message dès qu'elle sera acceptée.",
    requestPending: "Votre demande attend le propriétaire du bot (code {code}).",
    welcome: "Bienvenue ! Vous pouvez maintenant parler à {name}. /help liste ce que je comprends.",
    accepted: "Votre demande a été acceptée : vous pouvez maintenant parler à {name}.",
    pickAgent: "À quel agent voulez-vous parler ?",
    switched: "Ce chat parle maintenant à {name}. Une nouvelle conversation commence.",
    noSwitch: "Ce bot ne parle qu'à {name}.",
    unknownAgent: "Ce bot n'a pas d'agent nommé {id}.",
    newSession: "Nouvelle conversation avec {name}.",
    who: "Agent : {name}\nConversation : {session}",
    noAgent: "Ce bot n'a pas encore d'agent : son propriétaire en choisit un dans Allkin.",
    unreachable: "Allkin ne répond pas pour le moment : réessayez dans un instant.",
    error: "⚠️ {message}",
    proposal: "{agent} veut lancer une commande ({risk}) :\n\n{command}\n\n{explanation}",
    approve: "✅ Autoriser",
    refuse: "❌ Refuser",
    approved: "✅ Autorisée : {command}",
    refused: "❌ Refusée : {command}",
    notApprover: "Vous ne pouvez pas valider les commandes de ce bot.",
    autoRefused: "{agent} a proposé une commande, refusée automatiquement (les validations depuis Telegram sont désactivées) :\n{command}",
    formUnsupported: "L'agent a demandé un formulaire, impossible à remplir depuis Telegram : annulé. Répondez dans l'interface d'Allkin, ou reformulez.",
    filesOff: "Ce bot ne prend pas de fichiers.",
    fileSaved: "Fichier reçu : {name}",
    fileFailed: "Impossible de récupérer le fichier depuis Telegram : {message}",
    fileNote: "[Fichier déposé dans Upload/{name}]",
    cmdAgent: "Choisir l'agent à qui vous parlez",
    cmdNew: "Repartir sur une conversation vierge",
    cmdWho: "L'agent de ce chat",
    cmdHelp: "Ce que ce bot comprend",
  },
  es: {
    help: "Reenvío este chat a un agente de Allkin.\n\n/agent — elegir el agente con el que habla\n/new — empezar una conversación nueva\n/who — el agente y la conversación de este chat\n\nTodo lo demás va al agente. Una foto o un archivo se deposita en su carpeta Upload.",
    requestSent: "Este bot es privado. Su solicitud se ha enviado a su propietario, con el código {code}. Recibirá un mensaje cuando sea aceptada.",
    requestPending: "Su solicitud espera al propietario del bot (código {code}).",
    welcome: "¡Bienvenido! Ya puede hablar con {name}. /help lista lo que entiendo.",
    accepted: "Su solicitud ha sido aceptada: ya puede hablar con {name}.",
    pickAgent: "¿Con qué agente quiere hablar?",
    switched: "Este chat habla ahora con {name}. Empieza una conversación nueva.",
    noSwitch: "Este bot solo habla con {name}.",
    unknownAgent: "Este bot no tiene ningún agente llamado {id}.",
    newSession: "Nueva conversación con {name}.",
    who: "Agente: {name}\nConversación: {session}",
    noAgent: "Este bot aún no tiene agente: su propietario elige uno en Allkin.",
    unreachable: "Allkin no responde ahora mismo: inténtelo de nuevo en un momento.",
    error: "⚠️ {message}",
    proposal: "{agent} quiere ejecutar un comando ({risk}):\n\n{command}\n\n{explanation}",
    approve: "✅ Autorizar",
    refuse: "❌ Rechazar",
    approved: "✅ Autorizado: {command}",
    refused: "❌ Rechazado: {command}",
    notApprover: "No puede validar los comandos de este bot.",
    autoRefused: "{agent} propuso un comando, rechazado automáticamente (las validaciones desde Telegram están desactivadas):\n{command}",
    formUnsupported: "El agente pidió un formulario, que no se puede rellenar desde Telegram: cancelado. Responda en la interfaz de Allkin, o reformule.",
    filesOff: "Este bot no acepta archivos.",
    fileSaved: "Archivo recibido: {name}",
    fileFailed: "No se pudo obtener el archivo de Telegram: {message}",
    fileNote: "[Archivo depositado en Upload/{name}]",
    cmdAgent: "Elegir el agente con el que habla",
    cmdNew: "Empezar una conversación nueva",
    cmdWho: "El agente de este chat",
    cmdHelp: "Lo que entiende este bot",
  },
  de: {
    help: "Ich leite diesen Chat an einen Allkin-Agenten weiter.\n\n/agent — den Agenten wählen, mit dem Sie sprechen\n/new — eine neue Unterhaltung beginnen\n/who — Agent und Unterhaltung dieses Chats\n\nAlles andere geht an den Agenten. Ein Foto oder eine Datei landet in seinem Upload-Ordner.",
    requestSent: "Dieser Bot ist privat. Ihre Anfrage wurde mit dem Code {code} an seinen Besitzer geschickt. Sie bekommen eine Nachricht, sobald sie angenommen ist.",
    requestPending: "Ihre Anfrage wartet auf den Besitzer des Bots (Code {code}).",
    welcome: "Willkommen! Sie können jetzt mit {name} sprechen. /help zeigt, was ich verstehe.",
    accepted: "Ihre Anfrage wurde angenommen: Sie können jetzt mit {name} sprechen.",
    pickAgent: "Mit welchem Agenten möchten Sie sprechen?",
    switched: "Dieser Chat spricht jetzt mit {name}. Eine neue Unterhaltung beginnt.",
    noSwitch: "Dieser Bot spricht nur mit {name}.",
    unknownAgent: "Dieser Bot hat keinen Agenten namens {id}.",
    newSession: "Neue Unterhaltung mit {name}.",
    who: "Agent: {name}\nUnterhaltung: {session}",
    noAgent: "Dieser Bot hat noch keinen Agenten: sein Besitzer wählt einen in Allkin.",
    unreachable: "Allkin antwortet gerade nicht: versuchen Sie es gleich noch einmal.",
    error: "⚠️ {message}",
    proposal: "{agent} will einen Befehl ausführen ({risk}):\n\n{command}\n\n{explanation}",
    approve: "✅ Erlauben",
    refuse: "❌ Ablehnen",
    approved: "✅ Erlaubt: {command}",
    refused: "❌ Abgelehnt: {command}",
    notApprover: "Sie können die Befehle dieses Bots nicht freigeben.",
    autoRefused: "{agent} hat einen Befehl vorgeschlagen, automatisch abgelehnt (Freigaben aus Telegram sind aus):\n{command}",
    formUnsupported: "Der Agent hat ein Formular angefordert, das sich aus Telegram nicht ausfüllen lässt: abgebrochen. Antworten Sie in der Allkin-Oberfläche oder formulieren Sie um.",
    filesOff: "Dieser Bot nimmt keine Dateien an.",
    fileSaved: "Datei erhalten: {name}",
    fileFailed: "Die Datei konnte nicht von Telegram geholt werden: {message}",
    fileNote: "[Datei in Upload/{name} abgelegt]",
    cmdAgent: "Den Agenten wählen, mit dem Sie sprechen",
    cmdNew: "Eine neue Unterhaltung beginnen",
    cmdWho: "Der Agent dieses Chats",
    cmdHelp: "Was dieser Bot versteht",
  },
};
const textOf = (bot, key, vars = {}) => {
  const lang = LANGUAGES.includes(bot.options.language) ? bot.options.language : "en";
  return (TEXTS[lang][key] ?? TEXTS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
};

/* ---- Telegram ----------------------------------------------------------- */
class TelegramError extends Error {
  constructor(method, status, description) {
    super(`${method}: ${description ?? `HTTP ${status}`}`);
    this.status = status;
    this.description = description ?? "";
  }
}

async function tgCall(token, method, params = {}, { timeoutMs = 30_000 } = {}) {
  const res = await fetch(`${apiBase}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new TelegramError(method, data.error_code ?? res.status, data.description);
  return data.result;
}

/** Telegram caps a message at 4096 characters: longer answers go in slices. */
async function send(bot, chatId, text, extra = {}) {
  const chunks = [];
  let rest = String(text ?? "");
  if (!rest.trim()) return null;
  while (rest.length > 4000) {
    let cut = rest.lastIndexOf("\n", 4000);
    if (cut < 1000) cut = 4000;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  chunks.push(rest);
  let last = null;
  for (const [i, chunk] of chunks.entries()) {
    try {
      last = await tgCall(bot.token, "sendMessage", { chat_id: chatId, text: chunk, ...(i === chunks.length - 1 ? extra : {}) });
    } catch (error) {
      log(`[${bot.username || bot.id}] sendMessage failed: ${error.message}`);
    }
  }
  return last;
}

/* ---- Agents ------------------------------------------------------------- */
let agentsCache = { at: 0, list: [] };
function listAgents() {
  if (Date.now() - agentsCache.at < 10_000) return Promise.resolve(agentsCache.list);
  return new Promise((resolve, reject) => {
    const socket = connect(socketPath);
    let buffer = "";
    socket.on("connect", () => socket.write(JSON.stringify({ type: "list_agents" }) + "\n"));
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf-8");
      const i = buffer.indexOf("\n");
      if (i === -1) return;
      try {
        const msg = JSON.parse(buffer.slice(0, i));
        const list = msg.type === "agents" ? msg.agents ?? [] : [];
        agentsCache = { at: Date.now(), list };
        resolve(list);
      } catch {
        resolve([]);
      }
      socket.destroy();
    });
    socket.on("error", reject);
  });
}
const agentNameOf = (id) => agentsCache.list.find((a) => a.id === id)?.name ?? id;

/* ---- Chats and their sessions ------------------------------------------- */
const chatKey = (bot, chatId) => `${bot.id}:${chatId}`;
/** One live link per chat: a socket attached to the chat's agent and session. */
const links = new Map();
/** Command proposals waiting for a button, by requestId. */
const pending = new Map();
/** The typing indicator, renewed while the agent works. */
const typing = new Map();

function startTyping(bot, chatId) {
  stopTyping(bot, chatId);
  if (!bot.options.typing) return;
  const tick = () => tgCall(bot.token, "sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});
  tick();
  typing.set(chatKey(bot, chatId), setInterval(tick, 4500));
}
function stopTyping(bot, chatId) {
  const key = chatKey(bot, chatId);
  const timer = typing.get(key);
  if (timer) clearInterval(timer);
  typing.delete(key);
}

function setChatState(bot, chatId, state) {
  const chat = chats[chatKey(bot, chatId)];
  if (!chat) return;
  chat.state = state;
  chat.lastAt = Date.now();
  saveChats();
}

function dropLink(bot, chatId) {
  const key = chatKey(bot, chatId);
  links.get(key)?.socket.destroy();
  links.delete(key);
}

function connectLink(bot, chatId, agentId, sessionId) {
  return new Promise((resolve, reject) => {
    const key = chatKey(bot, chatId);
    const socket = connect(socketPath);
    const link = { socket, agentId, sessionId: null, ready: false, name: agentId };
    let buffer = "";
    let settled = false;
    socket.on("connect", () => {
      socket.write(JSON.stringify({ type: "attach", agentId, ...(sessionId ? { sessionId } : {}) }) + "\n");
    });
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf-8");
      let i;
      while ((i = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, i);
        buffer = buffer.slice(i + 1);
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (!settled) {
          settled = true;
          if (msg.type === "attached") {
            link.sessionId = msg.sessionId;
            link.name = msg.name ?? agentId;
            link.ready = true;
            resolve(link);
          } else {
            socket.destroy();
            reject(new Error(msg.message ?? msg.type));
          }
          continue;
        }
        void onAgentEvent(bot, chatId, link, msg);
      }
    });
    socket.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      } else log(`socket of chat ${key}: ${error.message}`);
    });
    socket.on("close", () => {
      if (links.get(key) === link) links.delete(key);
      stopTyping(bot, chatId);
    });
  });
}

/** The agent a chat talks to: its own choice, else the person's, else the
 *  bot's default — always one of the bot's agents. */
function agentOfChat(bot, chat, person) {
  for (const id of [chat?.agentId, person?.agentId, bot.defaultAgent, bot.agents[0]]) {
    if (id && bot.agents.includes(id)) return id;
  }
  return null;
}

/** The link of a chat, opened on demand; the session is remembered so a
 *  restart of the integration (or of Allkin) picks the conversation up again,
 *  unless the chat was silent longer than the bot's "new conversation after". */
async function linkFor(bot, chatId, info) {
  const key = chatKey(bot, chatId);
  const chat = chats[key] ?? {};
  const agentId = agentOfChat(bot, chat, info.person);
  if (!agentId) return null;
  const idleMs = Number(bot.options.newAfterHours) * 3_600_000;
  const stale = idleMs > 0 && chat.lastAt && Date.now() - chat.lastAt > idleMs;
  const live = links.get(key);
  if (live?.ready && !live.socket.destroyed && live.agentId === agentId && !stale) return live;
  if (live) dropLink(bot, chatId);
  const keepSession = chat.agentId === agentId && !stale ? chat.sessionId : undefined;
  let link;
  try {
    link = await connectLink(bot, chatId, agentId, keepSession);
  } catch (error) {
    // A session gone (archived, removed): start a fresh one once.
    if (!keepSession) throw error;
    log(`session ${keepSession} of chat ${key} unusable (${error.message}); opening a new one`);
    link = await connectLink(bot, chatId, agentId, undefined);
  }
  chats[key] = {
    ...chat,
    botId: bot.id,
    chatId: String(chatId),
    kind: info.kind,
    userId: info.userId ?? chat.userId ?? null,
    title: info.title || chat.title || "",
    agentId,
    sessionId: link.sessionId,
    lastAt: chat.lastAt ?? Date.now(),
  };
  saveChats();
  links.set(key, link);
  return link;
}

function sendToLink(link, payload) {
  link.socket.write(JSON.stringify({ ...payload, agentId: link.agentId, sessionId: link.sessionId }) + "\n");
}

async function onAgentEvent(bot, chatId, link, msg) {
  switch (msg.type) {
    case "assistant_text":
      await send(bot, chatId, msg.text);
      break;
    case "turn_done":
      stopTyping(bot, chatId);
      setChatState(bot, chatId, "done");
      break;
    case "error":
      stopTyping(bot, chatId);
      setChatState(bot, chatId, "error");
      await send(bot, chatId, textOf(bot, "error", { message: msg.message }));
      break;
    case "command_proposal": {
      if (!bot.options.approvals) {
        sendToLink(link, { type: "approval_response", requestId: msg.requestId, approved: false });
        await send(bot, chatId, textOf(bot, "autoRefused", { agent: link.name, command: msg.command }));
        break;
      }
      pending.set(msg.requestId, { botId: bot.id, chatId, link, command: msg.command });
      setChatState(bot, chatId, "wait");
      stopTyping(bot, chatId);
      await send(bot, chatId, textOf(bot, "proposal", { agent: link.name, risk: msg.riskLevel, command: msg.command, explanation: msg.explanation ?? "" }), {
        reply_markup: {
          inline_keyboard: [[
            { text: textOf(bot, "approve"), callback_data: `ap:${msg.requestId}:1` },
            { text: textOf(bot, "refuse"), callback_data: `ap:${msg.requestId}:0` },
          ]],
        },
      });
      break;
    }
    case "form_request":
      sendToLink(link, { type: "form_response", requestId: msg.requestId, values: null });
      await send(bot, chatId, textOf(bot, "formUnsupported"));
      break;
    case "closed":
      stopTyping(bot, chatId);
      link.socket.destroy();
      break;
    default:
      break;
  }
}

/* ---- Files from the chat --------------------------------------------------
   Dropped in the agent's Upload folder, like the upload webhook does: the
   agent reads them from there, the message names the file. */
async function fetchTelegramFile(bot, fileId, proposedName, agentId) {
  const info = await tgCall(bot.token, "getFile", { file_id: fileId });
  const res = await fetch(`${apiBase}/file/bot${bot.token}/${info.file_path}`, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const dir = join(allkinDir, "agents", agentId, "data", "Upload");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  let name = (proposedName || info.file_path?.split("/").pop() || "file").replace(/[/\\]/g, "_").replace(/^\.+/, "").slice(0, 120) || "file";
  if (existsSync(join(dir, name))) {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    name = `${base}-${Date.now().toString(36)}${ext}`;
  }
  writeFileSync(join(dir, name), bytes, { mode: 0o600 });
  return name;
}

/* ---- Access: requests and invites ----------------------------------------- */
/** A short code the person reads in Telegram and the user finds on the page. */
function requestCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  for (;;) {
    const bytes = randomBytes(3);
    const code = `${letters[bytes[0] % letters.length]}${bytes[1] % 10}-${String(bytes[2] % 100).padStart(2, "0")}`;
    if (!requests.some((r) => r.code === code)) return code;
  }
}

function personFrom(from) {
  return {
    name: [from.first_name, from.last_name].filter(Boolean).join(" "),
    username: from.username ?? "",
  };
}

async function onUnknown(bot, message) {
  const from = message.from;
  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();
  // An invite: /start <token>, one use, before its expiry.
  const start = /^\/start\s+(\S+)/.exec(text);
  if (start) {
    const invite = bot.invites.find((i) => i.token === start[1] && i.expiresAt > Date.now());
    if (invite) {
      bot.invites = bot.invites.filter((i) => i !== invite);
      bot.people.push({ id: String(from.id), ...personFrom(from), agentId: null, approve: false, addedAt: Date.now(), via: "invite" });
      requests = requests.filter((r) => !(r.botId === bot.id && r.userId === String(from.id)));
      saveStore();
      saveRequests();
      log(`[${bot.username}] ${from.id} joined through an invite`);
      await listAgents().catch(() => []);
      await send(bot, chatId, textOf(bot, "welcome", { name: agentNameOf(agentOfChat(bot, null, null) ?? "") }));
      return;
    }
  }
  const existing = requests.find((r) => r.botId === bot.id && r.userId === String(from.id));
  if (existing) {
    // Said once more at most every ten minutes: a flood gets no answer.
    if (Date.now() - (existing.toldAt ?? 0) > 600_000) {
      existing.toldAt = Date.now();
      saveRequests();
      await send(bot, chatId, textOf(bot, "requestPending", { code: existing.code }));
    }
    return;
  }
  const request = { code: requestCode(), botId: bot.id, userId: String(from.id), chatId: String(chatId), ...personFrom(from), at: Date.now(), toldAt: Date.now() };
  requests.push(request);
  saveRequests();
  log(`[${bot.username}] access request ${request.code} from ${from.id}`);
  await send(bot, chatId, textOf(bot, "requestSent", { code: request.code }));
}

/* ---- What arrives from Telegram ---------------------------------------- */
function countMessage(bot) {
  const day = new Date().toISOString().slice(0, 10);
  const s = (stats[bot.id] ??= { days: {}, lastAt: 0 });
  s.days[day] = (s.days[day] ?? 0) + 1;
  s.lastAt = Date.now();
  for (const d of Object.keys(s.days).sort().slice(0, -14)) delete s.days[d];
  saveStatsSoon();
}

async function agentButtons(bot, current) {
  await listAgents().catch(() => []);
  return {
    inline_keyboard: bot.agents.map((id) => [{ text: `${id === current ? "• " : ""}${agentNameOf(id)}`, callback_data: `ag:${id}` }]),
  };
}

async function onMessage(bot, message) {
  const chat = message.chat;
  const from = message.from ?? {};
  const isGroup = chat.type === "group" || chat.type === "supergroup";
  if (chat.type === "channel") return;
  const person = bot.people.find((p) => p.id === String(from.id));
  let text = (message.text || message.caption || "").trim();

  if (isGroup) {
    if (!bot.options.groups || !bot.groups.some((g) => g.id === String(chat.id))) return;
    if (!person) return;
    // In a group, the bot answers when it is named or answered, never otherwise.
    const mention = bot.username ? new RegExp(`@${bot.username}\\b`, "i") : null;
    const named = Boolean(mention && mention.test(text));
    const repliedTo = message.reply_to_message?.from?.id === bot.tgId;
    const command = /^\/\w+/.test(text) && (!text.split(/\s/)[0].includes("@") || named);
    if (!named && !repliedTo && !command) return;
    if (mention) text = text.replace(new RegExp(`@${bot.username}\\b`, "gi"), "").trim();
  } else if (!person) {
    countMessage(bot);
    return onUnknown(bot, message);
  }
  countMessage(bot);
  // Refresh what Telegram says of the person: names change.
  if (!isGroup) {
    const fresh = personFrom(from);
    if (fresh.name !== person.name || fresh.username !== person.username) {
      Object.assign(person, fresh);
      saveStore();
    }
  }

  const chatId = chat.id;
  const key = chatKey(bot, chatId);
  const info = { kind: isGroup ? "group" : "private", userId: isGroup ? null : String(from.id), title: isGroup ? chat.title : "", person: isGroup ? null : person };
  const cmd = /^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/.exec(text);
  const name = cmd?.[1];

  if (name === "start" || name === "help") return send(bot, chatId, textOf(bot, "help"));
  if (name === "agent" || name === "agents") {
    await listAgents().catch(() => []);
    const current = agentOfChat(bot, chats[key], info.person);
    if (!bot.options.switchAgents || bot.agents.length < 2) {
      return send(bot, chatId, current ? textOf(bot, "noSwitch", { name: agentNameOf(current) }) : textOf(bot, "noAgent"));
    }
    const wanted = cmd[2].trim();
    if (!wanted) return send(bot, chatId, textOf(bot, "pickAgent"), { reply_markup: await agentButtons(bot, current) });
    const agentId = bot.agents.find((id) => id === wanted || agentNameOf(id).toLowerCase() === wanted.toLowerCase());
    if (!agentId) return send(bot, chatId, textOf(bot, "unknownAgent", { id: wanted }));
    return switchAgent(bot, chatId, info, agentId);
  }
  if (name === "new") {
    dropLink(bot, chatId);
    if (chats[key]) delete chats[key].sessionId;
    const link = await linkFor(bot, chatId, info).catch(() => null);
    return send(bot, chatId, link ? textOf(bot, "newSession", { name: link.name }) : textOf(bot, "noAgent"));
  }
  if (name === "who") {
    const link = await linkFor(bot, chatId, info).catch(() => null);
    return send(bot, chatId, link ? textOf(bot, "who", { name: link.name, session: link.sessionId }) : textOf(bot, "noAgent"));
  }

  let link;
  try {
    link = await linkFor(bot, chatId, info);
  } catch (error) {
    log(`cannot link chat ${key}: ${error.message}`);
    return send(bot, chatId, textOf(bot, "unreachable"));
  }
  if (!link) return send(bot, chatId, textOf(bot, "noAgent"));

  // Attachments first: the agent is told where they landed.
  const notes = [];
  const files = [];
  if (message.document) files.push({ id: message.document.file_id, name: message.document.file_name });
  if (message.photo?.length) files.push({ id: message.photo[message.photo.length - 1].file_id, name: `photo-${message.message_id}.jpg` });
  if (message.voice) files.push({ id: message.voice.file_id, name: `voice-${message.message_id}.ogg` });
  if (message.audio) files.push({ id: message.audio.file_id, name: message.audio.file_name ?? `audio-${message.message_id}.mp3` });
  if (message.video) files.push({ id: message.video.file_id, name: message.video.file_name ?? `video-${message.message_id}.mp4` });
  if (files.length && !bot.options.files) {
    await send(bot, chatId, textOf(bot, "filesOff"));
    files.length = 0;
  }
  for (const file of files) {
    try {
      const saved = await fetchTelegramFile(bot, file.id, file.name, link.agentId);
      notes.push(textOf(bot, "fileNote", { name: saved }));
      await send(bot, chatId, textOf(bot, "fileSaved", { name: saved }));
    } catch (error) {
      await send(bot, chatId, textOf(bot, "fileFailed", { message: error.message }));
    }
  }
  const outgoing = [text, ...notes].filter(Boolean).join("\n");
  if (!outgoing) return;
  const record = chats[key];
  record.lastAt = Date.now();
  record.state = "work";
  record.preview = outgoing.slice(0, 140);
  record.fromName = isGroup ? personFrom(from).name : "";
  record.hasFile = files.length > 0;
  saveChats();
  startTyping(bot, chatId);
  sendToLink(link, { type: "message", text: outgoing });
}

async function switchAgent(bot, chatId, info, agentId) {
  const key = chatKey(bot, chatId);
  dropLink(bot, chatId);
  chats[key] = { ...(chats[key] ?? {}), botId: bot.id, chatId: String(chatId), kind: info.kind, userId: info.userId, title: info.title, agentId, sessionId: undefined };
  saveChats();
  await listAgents().catch(() => []);
  return send(bot, chatId, textOf(bot, "switched", { name: agentNameOf(agentId) }));
}

async function onCallback(bot, query) {
  const data = String(query.data ?? "");
  const answer = (text) => tgCall(bot.token, "answerCallbackQuery", { callback_query_id: query.id, ...(text ? { text } : {}) }).catch(() => {});
  const person = bot.people.find((p) => p.id === String(query.from?.id));
  if (data.startsWith("ag:")) {
    const agentId = data.slice(3);
    const message = query.message;
    if (!person || !message || !bot.agents.includes(agentId) || !bot.options.switchAgents) return answer();
    const isGroup = message.chat.type !== "private";
    await answer();
    await tgCall(bot.token, "editMessageReplyMarkup", { chat_id: message.chat.id, message_id: message.message_id, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    return switchAgent(bot, message.chat.id, { kind: isGroup ? "group" : "private", userId: isGroup ? null : person.id, title: isGroup ? message.chat.title : "" }, agentId);
  }
  const [kind, requestId, value] = data.split(":");
  if (kind !== "ap" || !pending.has(requestId)) return answer();
  // Only a person allowed to approve on this bot answers a card.
  if (!person?.approve) return answer(textOf(bot, "notApprover"));
  const { chatId, link, command } = pending.get(requestId);
  pending.delete(requestId);
  const approved = value === "1";
  sendToLink(link, { type: "approval_response", requestId, approved });
  log(`[${bot.username}] command ${approved ? "approved" : "refused"} by ${person.id}`);
  await answer();
  if (query.message) {
    // The card gives way to its verdict.
    await tgCall(bot.token, "editMessageText", {
      chat_id: chatId,
      message_id: query.message.message_id,
      text: textOf(bot, approved ? "approved" : "refused", { command }),
    }).catch(() => {});
  }
  setChatState(bot, chatId, approved ? "work" : "done");
  if (approved) startTyping(bot, chatId);
}

/** Added to a group, or removed: a group is kept only when the bot takes
 *  groups and the one who added it may talk to the bot. */
async function onMembership(bot, update) {
  const chat = update.chat;
  if (chat.type !== "group" && chat.type !== "supergroup") return;
  const status = update.new_chat_member?.status;
  const id = String(chat.id);
  if (status === "left" || status === "kicked") {
    bot.groups = bot.groups.filter((g) => g.id !== id);
    saveStore();
    return;
  }
  if (status !== "member" && status !== "administrator") return;
  const by = bot.people.find((p) => p.id === String(update.from?.id));
  if (!bot.options.groups || !by) {
    log(`[${bot.username}] added to group ${id} by ${update.from?.id}: leaving`);
    await tgCall(bot.token, "leaveChat", { chat_id: chat.id }).catch(() => {});
    return;
  }
  if (!bot.groups.some((g) => g.id === id)) {
    bot.groups.push({ id, title: chat.title ?? "", addedBy: by.id, addedAt: Date.now() });
    saveStore();
  }
}

/* ---- One loop per bot --------------------------------------------------- */
/** What each bot is doing now: state, the error that stopped it, latency. */
const runtime = new Map();
const rt = (bot) => {
  if (!runtime.has(bot.id)) runtime.set(bot.id, { state: "off", error: null, since: Date.now(), latencyMs: null, generation: 0 });
  return runtime.get(bot.id);
};

function setState(bot, state, error = null) {
  const r = rt(bot);
  if (r.state !== state || r.error?.code !== error?.code) r.since = Date.now();
  r.state = state;
  r.error = error;
}

/** Telegram's answer turned into a code the page translates. */
function errorOf(error) {
  if (error instanceof TelegramError) {
    if (error.status === 401 || error.status === 404) return { code: "token-refused", detail: error.description };
    if (error.status === 409) return { code: "conflict", detail: error.description };
    return { code: "telegram", detail: error.description };
  }
  return { code: "network", detail: error.message };
}

async function publishCommands(bot) {
  if (!bot.options.commandsMenu) {
    await tgCall(bot.token, "deleteMyCommands", {}).catch(() => {});
    return;
  }
  const commands = [
    ...(bot.options.switchAgents && bot.agents.length > 1 ? [{ command: "agent", description: textOf(bot, "cmdAgent") }] : []),
    { command: "new", description: textOf(bot, "cmdNew") },
    { command: "who", description: textOf(bot, "cmdWho") },
    { command: "help", description: textOf(bot, "cmdHelp") },
  ];
  await tgCall(bot.token, "setMyCommands", { commands }).catch((error) => log(`[${bot.username}] setMyCommands: ${error.message}`));
}

/** A wait that a restart of the bot cuts short. */
function wait(bot, ms) {
  return new Promise((resolve) => {
    const r = rt(bot);
    const timer = setTimeout(done, ms);
    r.wake = done;
    function done() {
      clearTimeout(timer);
      if (r.wake === done) r.wake = null;
      resolve();
    }
  });
}

async function runBot(bot) {
  const r = rt(bot);
  const generation = ++r.generation;
  const alive = () => r.generation === generation && botById(bot.id) === bot && bot.enabled;
  if (!bot.enabled) return setState(bot, "off");
  setState(bot, "starting");
  for (;;) {
    if (!alive()) return;
    try {
      const me = await tgCall(bot.token, "getMe");
      if (bot.tgId !== me.id || bot.username !== me.username || bot.name !== me.first_name) {
        Object.assign(bot, { tgId: me.id, username: me.username, name: me.first_name });
        saveStore();
      }
      // Webhooks and polling exclude each other: make sure none is set.
      await tgCall(bot.token, "deleteWebhook", { drop_pending_updates: false }).catch(() => {});
      await publishCommands(bot);
      break;
    } catch (error) {
      if (!alive()) return;
      const e = errorOf(error);
      setState(bot, "error", e);
      log(`[${bot.username || bot.id}] cannot start: ${error.message}`);
      // A token refused will not heal by itself: tried again rarely.
      await wait(bot, e.code === "token-refused" ? 300_000 : 15_000);
    }
  }
  if (!alive()) return;
  log(`[${bot.username}] listening; ${bot.agents.length} agent(s), ${bot.people.length} person(s)`);
  setState(bot, "on");
  while (alive()) {
    let updates;
    const started = Date.now();
    try {
      updates = await tgCall(bot.token, "getUpdates", { offset: offsets[bot.id] ?? 0, timeout: 50, allowed_updates: ["message", "callback_query", "my_chat_member"] }, { timeoutMs: 65_000 });
      if (r.state !== "on" && alive()) setState(bot, "on");
    } catch (error) {
      if (!alive()) return;
      const e = errorOf(error);
      setState(bot, "error", e);
      log(`[${bot.username}] getUpdates failed: ${error.message}`);
      await wait(bot, e.code === "token-refused" ? 300_000 : 5_000);
      continue;
    }
    // An empty answer is the long poll's own wait; one with updates tells
    // how long Telegram took to hand them over.
    if (updates.length) r.latencyMs = Date.now() - started;
    if (!alive()) return;
    for (const update of updates) {
      offsets[bot.id] = update.update_id + 1;
      try {
        if (update.message) await onMessage(bot, update.message);
        else if (update.callback_query) await onCallback(bot, update.callback_query);
        else if (update.my_chat_member) await onMembership(bot, update.my_chat_member);
      } catch (error) {
        log(`[${bot.username}] update ${update.update_id} failed: ${error.message}`);
      }
    }
    if (updates.length) writeJson("offsets.json", offsets);
  }
}

/** Stops what a bot is doing: its loop (at its next turn), its waits, its chats. */
function stopBot(bot) {
  const r = rt(bot);
  r.generation++;
  r.wake?.();
  for (const key of [...links.keys()]) if (key.startsWith(`${bot.id}:`)) links.get(key)?.socket.destroy();
}

/** A bot whose token or options changed is started again from the top. */
function restartBot(bot) {
  stopBot(bot);
  void runBot(bot);
}

/* ---- The page's API (relayed by Allkin under /plugins/<id>/web/) --------- */
class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

/** Never the token: its last four characters, to recognise it. */
function botView(bot) {
  const r = rt(bot);
  const s = stats[bot.id] ?? { days: {}, lastAt: 0 };
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    week.push({ day, count: s.days[day] ?? 0 });
  }
  return {
    id: bot.id,
    username: bot.username,
    name: bot.name,
    tokenHint: bot.token.slice(-4),
    enabled: bot.enabled,
    state: bot.enabled ? r.state : "off",
    error: bot.enabled ? r.error : null,
    since: r.since,
    latencyMs: r.latencyMs,
    agents: bot.agents,
    defaultAgent: bot.defaultAgent,
    people: bot.people,
    groups: bot.groups,
    invites: bot.invites.filter((i) => i.expiresAt > Date.now()).length,
    options: bot.options,
    today: week[6].count,
    week,
    lastAt: s.lastAt || null,
    createdAt: bot.createdAt,
  };
}

function stateView() {
  return {
    bots: store.bots.map(botView),
    requests: requests.filter((r) => botById(r.botId)).map(({ toldAt, ...r }) => r),
    chats: Object.entries(chats)
      .filter(([, c]) => botById(c.botId))
      .map(([key, c]) => ({ key, ...c }))
      .sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0)),
  };
}

const TOKEN_PATTERN = /^\d{5,}:[A-Za-z0-9_-]{30,}$/;

/** Asks Telegram who a token is; refuses a token already used here. */
async function checkToken(token, exceptId) {
  if (!TOKEN_PATTERN.test(token)) throw new HttpError(400, "token-format");
  if (store.bots.some((b) => b.token === token && b.id !== exceptId)) throw new HttpError(409, "token-used");
  try {
    const me = await tgCall(token, "getMe", {}, { timeoutMs: 15_000 });
    return { tgId: me.id, username: me.username, name: me.first_name };
  } catch (error) {
    const e = errorOf(error);
    throw new HttpError(e.code === "token-refused" ? 400 : 502, e.code === "token-refused" ? "token-refused" : "telegram-unreachable");
  }
}

async function checkAgents(ids) {
  const known = new Set((await listAgents().catch(() => [])).map((a) => a.id));
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !known.has(id))) throw new HttpError(400, "unknown-agent");
  return [...new Set(ids)];
}

const NUMBER_OPTIONS = { newAfterHours: [0, 1, 4, 12, 24, 72] };
function readOptions(input, current) {
  const out = { ...current };
  for (const [key, value] of Object.entries(input ?? {})) {
    if (!(key in DEFAULT_OPTIONS)) continue;
    if (typeof DEFAULT_OPTIONS[key] === "boolean" && typeof value === "boolean") out[key] = value;
    else if (key === "language" && LANGUAGES.includes(value)) out[key] = value;
    else if (NUMBER_OPTIONS[key]?.includes(value)) out[key] = value;
    else throw new HttpError(400, "bad-option");
  }
  return out;
}

async function readBody(req) {
  let size = 0;
  const parts = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65_536) throw new HttpError(413, "too-large");
    parts.push(chunk);
  }
  if (!parts.length) return {};
  try {
    return JSON.parse(Buffer.concat(parts).toString("utf-8"));
  } catch {
    throw new HttpError(400, "bad-json");
  }
}

function needBot(id) {
  const bot = botById(id);
  if (!bot) throw new HttpError(404, "no-bot");
  return bot;
}

const ROUTES = [
  ["GET", /^\/api\/state$/, async () => {
    await listAgents().catch(() => []);
    return stateView();
  }],
  ["POST", /^\/api\/check$/, async (_m, body) => checkToken(String(body.token ?? "").trim())],
  ["POST", /^\/api\/bots$/, async (_m, body) => {
    const token = String(body.token ?? "").trim();
    const me = await checkToken(token);
    const agents = await checkAgents(body.agents ?? []);
    if (!agents.length) throw new HttpError(400, "no-agent");
    const defaultAgent = agents.includes(body.defaultAgent) ? body.defaultAgent : agents[0];
    const bot = normalizeBot({ id: newId(), token, ...me, agents, defaultAgent, options: readOptions(body.options, DEFAULT_OPTIONS) });
    store.bots.push(bot);
    saveStore();
    log(`[${bot.username}] added`);
    void runBot(bot);
    return botView(bot);
  }],
  ["PATCH", /^\/api\/bots\/(\w+)$/, async ([, id], body) => {
    const bot = needBot(id);
    let restart = false;
    if ("agents" in body) {
      const agents = await checkAgents(body.agents);
      if (!agents.length) throw new HttpError(400, "no-agent");
      bot.agents = agents;
      if (!agents.includes(bot.defaultAgent)) bot.defaultAgent = agents[0];
      for (const p of bot.people) if (p.agentId && !agents.includes(p.agentId)) p.agentId = null;
      restart = true;
    }
    if ("defaultAgent" in body) {
      if (!bot.agents.includes(body.defaultAgent)) throw new HttpError(400, "unknown-agent");
      bot.defaultAgent = body.defaultAgent;
    }
    if ("options" in body) {
      bot.options = readOptions(body.options, bot.options);
      restart = true;
    }
    if ("enabled" in body) {
      bot.enabled = body.enabled === true;
      restart = true;
    }
    saveStore();
    if (restart) restartBot(bot);
    return botView(bot);
  }],
  ["POST", /^\/api\/bots\/(\w+)\/token$/, async ([, id], body) => {
    const bot = needBot(id);
    const token = String(body.token ?? "").trim();
    const me = await checkToken(token, bot.id);
    if (bot.tgId && me.tgId !== bot.tgId) throw new HttpError(400, "token-other-bot");
    Object.assign(bot, { token, ...me });
    saveStore();
    log(`[${bot.username}] token replaced`);
    restartBot(bot);
    return botView(bot);
  }],
  ["DELETE", /^\/api\/bots\/(\w+)$/, async ([, id]) => {
    const bot = needBot(id);
    stopBot(bot);
    store.bots = store.bots.filter((b) => b !== bot);
    requests = requests.filter((r) => r.botId !== bot.id);
    for (const key of Object.keys(chats)) if (chats[key].botId === bot.id) delete chats[key];
    delete stats[bot.id];
    delete offsets[bot.id];
    runtime.delete(bot.id);
    saveStore();
    saveRequests();
    saveChats();
    writeJson("offsets.json", offsets);
    saveStatsSoon();
    log(`[${bot.username || bot.id}] removed`);
    return { ok: true };
  }],
  ["POST", /^\/api\/bots\/(\w+)\/invite$/, async ([, id]) => {
    const bot = needBot(id);
    if (!bot.username) throw new HttpError(409, "bot-not-started");
    const token = randomBytes(12).toString("base64url");
    const expiresAt = Date.now() + 7 * 86_400_000;
    bot.invites = [...bot.invites.filter((i) => i.expiresAt > Date.now()), { token, expiresAt }];
    saveStore();
    return { link: `https://t.me/${bot.username}?start=${token}`, expiresAt };
  }],
  ["PATCH", /^\/api\/bots\/(\w+)\/people\/(\d+)$/, async ([, id, userId], body) => {
    const bot = needBot(id);
    const person = bot.people.find((p) => p.id === userId);
    if (!person) throw new HttpError(404, "no-person");
    if ("agentId" in body) {
      if (body.agentId !== null && !bot.agents.includes(body.agentId)) throw new HttpError(400, "unknown-agent");
      person.agentId = body.agentId;
    }
    if ("approve" in body) person.approve = body.approve === true;
    saveStore();
    return botView(bot);
  }],
  ["DELETE", /^\/api\/bots\/(\w+)\/people\/(\d+)$/, async ([, id, userId]) => {
    const bot = needBot(id);
    bot.people = bot.people.filter((p) => p.id !== userId);
    for (const key of Object.keys(chats)) {
      if (chats[key].botId === bot.id && chats[key].userId === userId) {
        links.get(key)?.socket.destroy();
        delete chats[key];
      }
    }
    saveStore();
    saveChats();
    return botView(bot);
  }],
  ["DELETE", /^\/api\/bots\/(\w+)\/groups\/(-?\d+)$/, async ([, id, groupId]) => {
    const bot = needBot(id);
    bot.groups = bot.groups.filter((g) => g.id !== groupId);
    saveStore();
    await tgCall(bot.token, "leaveChat", { chat_id: groupId }).catch(() => {});
    return botView(bot);
  }],
  ["POST", /^\/api\/requests\/([A-Z0-9-]+)\/(approve|refuse)$/, async ([, code, verdict]) => {
    const request = requests.find((r) => r.code === code);
    if (!request) throw new HttpError(404, "no-request");
    const bot = needBot(request.botId);
    requests = requests.filter((r) => r !== request);
    saveRequests();
    if (verdict === "approve" && !bot.people.some((p) => p.id === request.userId)) {
      bot.people.push({ id: request.userId, name: request.name, username: request.username, agentId: null, approve: false, addedAt: Date.now(), via: "request" });
      saveStore();
      await listAgents().catch(() => []);
      await send(bot, request.chatId, textOf(bot, "accepted", { name: agentNameOf(agentOfChat(bot, null, null) ?? "") }));
    }
    log(`[${bot.username}] request ${code} ${verdict === "approve" ? "approved" : "refused"}`);
    return stateView();
  }],
];

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const reply = (status, payload) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(payload));
  };
  const route = ROUTES.find(([method, pattern]) => method === req.method && pattern.test(url.pathname));
  if (!route) return reply(404, { error: "not-found" });
  try {
    const body = req.method === "GET" ? {} : await readBody(req);
    reply(200, await route[2](route[1].exec(url.pathname), body));
  } catch (error) {
    if (error instanceof HttpError) return reply(error.status, { error: error.code });
    log(`${req.method} ${url.pathname} failed: ${error.message}`);
    reply(500, { error: "internal" });
  }
});

server.listen(port, "127.0.0.1", () => log(`page API on 127.0.0.1:${port}; ${store.bots.length} bot(s)`));
for (const bot of store.bots) void runBot(bot);

process.on("SIGTERM", () => {
  for (const link of links.values()) link.socket.destroy();
  if (statsTimer) writeJson("stats.json", stats);
  writeJson("offsets.json", offsets);
  process.exit(0);
});
