// Launcher of the SearXNG integration.
//
// SearXNG is a Python application with no release to download: it is cloned
// from its repository and its packages go into a virtual environment, both in
// the integration's data folder — kept from one update to the next. No Docker,
// nothing installed on the system: `git` and `python3` (with venv) are all it
// asks of the machine.
//
// This process is the one Allkin talks to. It listens at once on the port of
// the settings (127.0.0.1) so that the page can say what is going on while
// SearXNG installs, then starts SearXNG on a port of its own and stands in
// front of it:
//
//   GET /api/status   what the launcher is at (installing, running, failed…)
//   GET /search       a search, answered as a short JSON — the page's and the
//                     agents' one endpoint (the service "SearXNG")
//   GET /healthz      "OK" once SearXNG answers
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, request } from "node:http";
import { createServer as createNetServer } from "node:net";
import { dirname, join } from "node:path";

const REPOSITORY = "https://github.com/searxng/searxng";
const BRANCH = "master";
/** SearXNG follows the search engines day by day: a copy left alone stops working. */
const UPDATE_EVERY_MS = 7 * 24 * 3600 * 1000;
const MIN_PYTHON = [3, 10];
const SEARCH_TIMEOUT_MS = 30_000;
const MAX_RESULTS = 50;
const MAX_CONTENT = 500;

const settings = JSON.parse(process.env.ALLKIN_PLUGIN_SETTINGS ?? "{}");
const dataDir = process.env.ALLKIN_PLUGIN_DATA ?? join(process.cwd(), "data");
const port = Number(process.env.PORT ?? settings.port ?? 9330);
const runtimeDir = join(dataDir, "runtime");
const sourceDir = join(runtimeDir, "searxng");
const venvDir = join(runtimeDir, "venv");
const venvPython = join(venvDir, "bin", "python");
const markerFile = join(runtimeDir, "installed.json");
const settingsFile = join(dataDir, "settings.yml");
const secretFile = join(dataDir, "secret.key");

// The PATH of the systemd service may hold very little.
const env = { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH ?? ""}:/usr/local/bin:/usr/bin:/bin` };

/** What the page reads: `state` is installing | updating | starting | running |
 *  failed; `step` says where an installation is, `error` why it failed — codes,
 *  never sentences: the page translates. */
const status = { state: "starting", step: null, error: null, version: null };
let searxPort = 0;
let searx = null;
let stopping = false;

class LauncherError extends Error {
  constructor(code, detail = "") {
    super(detail ? `${code}: ${detail}` : code);
    this.code = code;
  }
}

/* ---- Commands ------------------------------------------------------------ */

/** Runs a command to its end, its output going to the log. Resolves with its exit code. */
function run(command, args, cwd = dataDir) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", (error) => {
      console.error(`cannot start ${command}: ${error.message}`);
      resolve(127);
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

/** Runs a command and gives back what it printed, or null when it failed. */
function capture(command, args, cwd = dataDir) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (chunk) => (out += chunk));
    child.on("error", () => resolve(null));
    child.on("exit", (code) => resolve(code === 0 ? out.trim() : null));
  });
}

/* ---- Installation -------------------------------------------------------- */

function readMarker() {
  try {
    return JSON.parse(readFileSync(markerFile, "utf-8"));
  } catch {
    return null;
  }
}

async function writeMarker() {
  const commit = (await capture("git", ["rev-parse", "--short", "HEAD"], sourceDir)) ?? "";
  const date = (await capture("git", ["log", "-1", "--format=%cs"], sourceDir)) ?? "";
  const marker = { commit, date, checkedAt: Date.now() };
  writeFileSync(markerFile, `${JSON.stringify(marker)}\n`);
  return marker;
}

async function checkMachine() {
  if ((await capture("git", ["--version"])) === null) throw new LauncherError("no-git");
  const version = await capture("python3", ["-c", "import sys; print(sys.version_info[0], sys.version_info[1])"]);
  if (version === null) throw new LauncherError("no-python");
  const [major, minor] = version.split(" ").map(Number);
  if (major < MIN_PYTHON[0] || (major === MIN_PYTHON[0] && minor < MIN_PYTHON[1])) {
    throw new LauncherError("old-python", `${major}.${minor}`);
  }
  // Debian and Ubuntu ship venv apart (python3-venv): without ensurepip a
  // virtual environment comes without pip.
  if ((await capture("python3", ["-c", "import venv, ensurepip"])) === null) throw new LauncherError("no-venv");
}

async function installPackages() {
  status.step = "packages";
  const pip = [venvPython, ["-m", "pip", "install", "--quiet", "--disable-pip-version-check"]];
  if ((await run(pip[0], [...pip[1], "--upgrade", "pip", "setuptools", "wheel"])) !== 0) throw new LauncherError("packages-failed");
  if ((await run(pip[0], [...pip[1], "-r", join(sourceDir, "requirements.txt")])) !== 0) throw new LauncherError("packages-failed");
}

async function install() {
  status.state = "installing";
  await checkMachine();
  // A marker is written last: without it, whatever is there is half done.
  rmSync(runtimeDir, { recursive: true, force: true });
  mkdirSync(runtimeDir, { recursive: true });

  status.step = "clone";
  console.log(`Installing SearXNG into ${runtimeDir} (a few minutes)…`);
  if ((await run("git", ["clone", "--quiet", "--depth", "1", "--branch", BRANCH, REPOSITORY, sourceDir])) !== 0) {
    throw new LauncherError("clone-failed");
  }
  status.step = "venv";
  if ((await run("python3", ["-m", "venv", venvDir])) !== 0) throw new LauncherError("no-venv");
  await installPackages();
  const marker = await writeMarker();
  console.log(`SearXNG ${marker.commit} (${marker.date}) installed.`);
  return marker;
}

/** Brings the copy to the head of SearXNG's branch. A failure before the
 *  sources move leaves the copy as it was; one after it asks for a new
 *  installation at the next start. */
async function update(marker) {
  status.state = "updating";
  status.step = "clone";
  console.log("Looking for a newer SearXNG…");
  if ((await run("git", ["fetch", "--quiet", "--depth", "1", "origin", BRANCH], sourceDir)) !== 0) {
    console.error("Update skipped: the repository did not answer.");
    return marker;
  }
  const head = await capture("git", ["rev-parse", "HEAD"], sourceDir);
  const fetched = await capture("git", ["rev-parse", "FETCH_HEAD"], sourceDir);
  if (head && fetched && head !== fetched) {
    rmSync(markerFile, { force: true });
    if ((await run("git", ["reset", "--quiet", "--hard", "FETCH_HEAD"], sourceDir)) !== 0) throw new LauncherError("clone-failed");
    await installPackages();
  }
  const next = await writeMarker();
  console.log(head !== fetched ? `SearXNG updated to ${next.commit} (${next.date}).` : "SearXNG is up to date.");
  return next;
}

/* ---- SearXNG itself ------------------------------------------------------ */

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port: free } = probe.address();
      probe.close(() => resolve(free));
    });
  });
}

function secretKey() {
  try {
    const known = readFileSync(secretFile, "utf-8").trim();
    if (known.length >= 32) return known;
  } catch {
    // First start: written below.
  }
  const key = randomBytes(32).toString("hex");
  writeFileSync(secretFile, `${key}\n`, { mode: 0o600 });
  return key;
}

/** SearXNG's settings, written again at every start from the integration's:
 *  its defaults, the loopback, no limiter (one user, behind Allkin), JSON on. */
function writeSettings() {
  const safe = [0, 1, 2].includes(Number(settings.safeSearch)) ? Number(settings.safeSearch) : 0;
  writeFileSync(
    settingsFile,
    [
      "# Written by the SearXNG integration of Allkin at every start: changes are lost.",
      "use_default_settings: true",
      "general:",
      '  instance_name: "SearXNG"',
      "server:",
      '  bind_address: "127.0.0.1"',
      `  port: ${searxPort}`,
      `  secret_key: "${secretKey()}"`,
      "  limiter: false",
      "  public_instance: false",
      "  image_proxy: false",
      "search:",
      `  safe_search: ${safe}`,
      "  formats:",
      "    - html",
      "    - json",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
}

/** One request to SearXNG. Resolves with { status, body }. */
function askSearx(path, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port: searxPort,
        path,
        method: "GET",
        // SearXNG's bot detection wants to know who asks, even switched off.
        headers: { Accept: "application/json", "X-Forwarded-For": "127.0.0.1", "X-Real-IP": "127.0.0.1" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 502, body: Buffer.concat(chunks).toString("utf-8") }));
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

async function startSearx() {
  status.state = "starting";
  status.step = null;
  searxPort = await freePort();
  writeSettings();
  console.log(`Starting SearXNG on 127.0.0.1:${searxPort} (behind 127.0.0.1:${port}).`);
  searx = spawn(venvPython, ["-m", "searx.webapp"], {
    cwd: sourceDir,
    env: { ...env, SEARXNG_SETTINGS_PATH: settingsFile },
    stdio: ["ignore", "inherit", "inherit"],
  });
  let gone = false;
  searx.on("error", (error) => {
    console.error(`cannot start SearXNG: ${error.message}`);
    gone = true;
  });
  searx.on("exit", (code, signal) => {
    gone = true;
    if (stopping) return;
    // Running, SearXNG fell: Allkin restarts the service, with its growing delay.
    if (status.state === "running") {
      console.error(`SearXNG stopped (${signal ?? code}).`);
      process.exit(1);
    }
  });
  for (let waited = 0; waited < 60 && !gone; waited++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      if ((await askSearx("/healthz", 2000)).status === 200) {
        status.state = "running";
        console.log("SearXNG answers.");
        return;
      }
    } catch {
      // Not listening yet.
    }
  }
  if (!gone) searx.kill("SIGTERM");
  throw new LauncherError("start-failed");
}

/* ---- The search, made short ---------------------------------------------- */

/** The parameters of SearXNG a caller may set; anything else is dropped. */
const SEARCH_PARAMS = ["q", "categories", "engines", "language", "time_range", "pageno", "safesearch"];

// SearXNG marks the words found with two private-use characters.
const clean = (value) => (typeof value === "string" ? value.replace(/[]/g, "").trim() : "");
const clip = (value, max) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

function shortResult(result) {
  const out = { title: clean(result.title), url: clean(result.url) };
  const content = clean(result.content);
  if (content && content !== out.title) out.content = clip(content, MAX_CONTENT);
  for (const key of ["img_src", "thumbnail", "author", "category"]) {
    const value = clean(result[key]);
    if (value) out[key] = value;
  }
  if (typeof result.publishedDate === "string" && result.publishedDate) out.published = result.publishedDate;
  if (Array.isArray(result.engines) && result.engines.length) out.engines = result.engines.map(String);
  else if (result.engine) out.engines = [String(result.engine)];
  return out;
}

function shortAnswer(raw, count) {
  const texts = (list) =>
    (Array.isArray(list) ? list : [])
      .map((item) => clean(typeof item === "string" ? item : (item?.answer ?? item?.content ?? "")))
      .filter(Boolean);
  const out = {
    query: clean(raw.query),
    results: (Array.isArray(raw.results) ? raw.results : []).slice(0, count).map(shortResult),
  };
  const answers = texts(raw.answers);
  if (answers.length) out.answers = answers.map((answer) => clip(answer, 1000));
  const infoboxes = (Array.isArray(raw.infoboxes) ? raw.infoboxes : [])
    .map((box) => ({ title: clean(box.infobox), content: clip(clean(box.content), 1000), url: clean(box.id) || clean(box.urls?.[0]?.url) }))
    .filter((box) => box.title);
  if (infoboxes.length) out.infoboxes = infoboxes.slice(0, 2);
  const suggestions = texts(raw.suggestions);
  if (suggestions.length) out.suggestions = suggestions.slice(0, 8);
  const corrections = texts(raw.corrections);
  if (corrections.length) out.corrections = corrections.slice(0, 3);
  // The engines that did not answer, with why: a search with few results says so.
  const silent = (Array.isArray(raw.unresponsive_engines) ? raw.unresponsive_engines : [])
    .map((pair) => (Array.isArray(pair) ? { engine: String(pair[0]), reason: String(pair[1] ?? "") } : null))
    .filter(Boolean);
  if (silent.length) out.unresponsive = silent;
  return out;
}

function sendJson(res, code, body) {
  const text = JSON.stringify(body);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(text) });
  res.end(text);
}

async function search(url, res) {
  if (status.state !== "running") return sendJson(res, 503, { error: "not-ready", state: status.state });
  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query) return sendJson(res, 400, { error: "no-query" });
  const params = new URLSearchParams({ format: "json" });
  for (const name of SEARCH_PARAMS) {
    const value = url.searchParams.get(name);
    if (value) params.set(name, value);
  }
  const count = Math.min(MAX_RESULTS, Math.max(1, Number(url.searchParams.get("count")) || MAX_RESULTS));
  try {
    const answer = await askSearx(`/search?${params}`, SEARCH_TIMEOUT_MS);
    if (answer.status !== 200) return sendJson(res, 502, { error: "searxng-refused", status: answer.status });
    sendJson(res, 200, shortAnswer(JSON.parse(answer.body), count));
  } catch (error) {
    console.error(`search failed: ${error.message}`);
    sendJson(res, 502, { error: "searxng-silent" });
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method !== "GET") return sendJson(res, 405, { error: "method" });
  if (url.pathname === "/api/status") return sendJson(res, 200, status);
  if (url.pathname === "/search") return void search(url, res);
  if (url.pathname === "/healthz") {
    res.writeHead(status.state === "running" ? 200 : 503, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end(status.state === "running" ? "OK" : status.state);
  }
  sendJson(res, 404, { error: "not-found" });
});

/* ---- Life ---------------------------------------------------------------- */

function stop() {
  if (stopping) return;
  stopping = true;
  server.close();
  if (!searx || searx.exitCode !== null) process.exit(0);
  searx.once("exit", () => process.exit(0));
  searx.kill("SIGTERM");
  setTimeout(() => searx.kill("SIGKILL"), 4000).unref();
}
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, stop);

server.on("error", (error) => {
  console.error(`cannot listen on 127.0.0.1:${port}: ${error.message}`);
  process.exit(1);
});

server.listen(port, "127.0.0.1", async () => {
  try {
    mkdirSync(dataDir, { recursive: true });
    let marker = existsSync(venvPython) ? readMarker() : null;
    if (!marker) marker = await install();
    else if (settings.autoUpdate !== false && Date.now() - (marker.checkedAt ?? 0) > UPDATE_EVERY_MS) marker = await update(marker);
    status.version = marker.commit ? `${marker.date} (${marker.commit})` : null;
    await startSearx();
  } catch (error) {
    // The launcher stays up: the page says what failed, and a restart of the
    // service — from the integration's page — tries again. Leaving would only
    // make Allkin install five times in a row.
    status.state = "failed";
    status.step = null;
    status.error = error instanceof LauncherError ? error.code : "unexpected";
    console.error(`SearXNG is not running: ${error.message}`);
  }
});
