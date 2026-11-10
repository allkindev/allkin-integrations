"use strict";
/* ============================================================================
   SearXNG integration (2026-11-10).
   ----------------------------------------------------------------------------
   A search page inside Allkin, answered by the SearXNG the integration runs
   on the machine (start.mjs). The page talks to the launcher alone, through
   Allkin's relay (/plugins/searxng/web/):

     api/status   what the launcher is at — installing, updating, starting,
                  running, failed (a code) —, read when the tab is shown and
                  every two seconds while it works;
     search       the results of a query, as a short JSON.

   The relay answering anything but JSON means the service is not there (its
   rights not granted, stopped): the page says so and leads to the
   integration's page, where the log and the Restart button are.

   The agents use the same launcher through the service "SearXNG"
   (allkin-services): nothing of theirs lives here.
   ========================================================================== */
(() => {
const Allkin = window.Allkin;
const core = Allkin.core;
const { el } = core;
const t = Allkin.t;
const tn = Allkin.tn;

const ID = "searxng";
const KIND = "searxng";
const BASE = `/plugins/${ID}/web/`;
/** The categories of SearXNG offered in the bar: a choice among a few. */
const CATEGORIES = ["general", "images", "videos", "news", "it", "science"];
/** SearXNG's time ranges; "" is any time. */
const PERIODS = ["", "day", "month", "year"];
const THUMB_CATEGORIES = new Set(["videos", "news"]);
const POLL_MS = 2000;
const WORKING = new Set(["installing", "updating", "starting"]);
const toast = (message, kind = "ok") => core.toast?.(message, kind);

/* ---- Icons: Phosphor, light (and duotone for the tab) -------------------- */

// Generated from @phosphor-icons/core (MIT): light weight, and duotone for the tab.
const ICONS = {"light":{"clock":["M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Zm62-90a6,6,0,0,1-6,6H128a6,6,0,0,1-6-6V72a6,6,0,0,1,12,0v50h50A6,6,0,0,1,190,128Z"],"arrow-square-out":["M222,104a6,6,0,0,1-12,0V54.49l-69.75,69.75a6,6,0,0,1-8.48-8.48L201.51,46H152a6,6,0,0,1,0-12h64a6,6,0,0,1,6,6Zm-38,26a6,6,0,0,0-6,6v72a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V80a2,2,0,0,1,2-2h72a6,6,0,0,0,0-12H48A14,14,0,0,0,34,80V208a14,14,0,0,0,14,14H176a14,14,0,0,0,14-14V136A6,6,0,0,0,184,130Z"],"copy":["M216,34H88a6,6,0,0,0-6,6V82H40a6,6,0,0,0-6,6V216a6,6,0,0,0,6,6H168a6,6,0,0,0,6-6V174h42a6,6,0,0,0,6-6V40A6,6,0,0,0,216,34ZM162,210H46V94H162Zm48-48H174V88a6,6,0,0,0-6-6H94V46H210Z"],"dots-three":["M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128ZM60,118a10,10,0,1,0,10,10A10,10,0,0,0,60,118Zm136,0a10,10,0,1,0,10,10A10,10,0,0,0,196,118Z"],"warning":["M235.07,189.09,147.61,37.22h0a22.75,22.75,0,0,0-39.22,0L20.93,189.09a21.53,21.53,0,0,0,0,21.72A22.35,22.35,0,0,0,40.55,222h174.9a22.35,22.35,0,0,0,19.6-11.19A21.53,21.53,0,0,0,235.07,189.09ZM224.66,204.8a10.46,10.46,0,0,1-9.21,5.2H40.55a10.46,10.46,0,0,1-9.21-5.2,9.51,9.51,0,0,1,0-9.72L118.79,43.21a10.75,10.75,0,0,1,18.42,0l87.46,151.87A9.51,9.51,0,0,1,224.66,204.8ZM122,144V104a6,6,0,0,1,12,0v40a6,6,0,0,1-12,0Zm16,36a10,10,0,1,1-10-10A10,10,0,0,1,138,180Z"],"arrow-clockwise":["M238,56v48a6,6,0,0,1-6,6H184a6,6,0,0,1,0-12h32.55l-30.38-27.8c-.06-.06-.12-.13-.19-.19a82,82,0,1,0-1.7,117.65,6,6,0,0,1,8.24,8.73A93.46,93.46,0,0,1,128,222h-1.28A94,94,0,1,1,194.37,61.4L226,90.35V56a6,6,0,1,1,12,0Z"],"caret-down":["M212.24,100.24l-80,80a6,6,0,0,1-8.48,0l-80-80a6,6,0,0,1,8.48-8.48L128,167.51l75.76-75.75a6,6,0,0,1,8.48,8.48Z"],"magnifying-glass":["M228.24,219.76l-51.38-51.38a86.15,86.15,0,1,0-8.48,8.48l51.38,51.38a6,6,0,0,0,8.48-8.48ZM38,112a74,74,0,1,1,74,74A74.09,74.09,0,0,1,38,112Z"]},"duotone":{"magnifying-glass":[{"d":"M192,112a80,80,0,1,1-80-80A80,80,0,0,1,192,112Z","o":"0.2"},"M229.66,218.34,179.6,168.28a88.21,88.21,0,1,0-11.32,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"]}};

function iconSvg(name) {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g transform="scale(0.09375)" fill="currentColor" stroke="none">${(ICONS.light[name] ?? []).map((d) => `<path d="${d}"/>`).join("")}</g></svg>`;
}

function dualIcon(name) {
  const group = (weight, cls) =>
    `<g class="${cls}" transform="scale(0.09375)" fill="currentColor" stroke="none">${(ICONS[weight][name] ?? ICONS.light[name] ?? [])
      .map((p) => (typeof p === "string" ? `<path d="${p}"/>` : `<path d="${p.d}" opacity="${p.o}"/>`))
      .join("")}</g>`;
  return `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">${group("light", "ph-light")}${group("duotone", "ph-duo")}</svg>`;
}

const TAB_ICON = dualIcon("magnifying-glass");

/* ---- State --------------------------------------------------------------- */

const view = {
  shown: false,
  filled: false,
  /** The launcher's last answer ({ state, step, error, version }), or { state: "stopped" }. */
  launcher: null,
  pollTimer: null,
  query: "",
  category: "general",
  period: "",
  page: 1,
  results: [],
  /** Answers, infoboxes, suggestions and corrections of the first page. */
  extra: null,
  /** The engines that did not answer the last request. */
  silent: [],
  more: false,
  loading: false,
  /** The code of the search that failed, or null. */
  error: null,
  /** A search asked while SearXNG was not running: sent once it is. */
  pending: false,
  /** Counts the requests: an answer that is not the last one's is dropped. */
  token: 0,
  /** What the body shows, to leave it alone when nothing changed. */
  drawn: "",
};

/* ---- Talking to the launcher --------------------------------------------- */

/** One GET to the launcher. { ok, body } or { ok: false, error } — `stopped`
 *  when the relay itself answered (the service is not running). */
async function ask(path) {
  let response;
  try {
    response = await fetch(BASE + path, { credentials: "same-origin", headers: { Accept: "application/json" } });
  } catch {
    return { ok: false, error: "stopped" };
  }
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) return { ok: false, error: "stopped" };
  const body = await response.json().catch(() => null);
  if (!body) return { ok: false, error: "stopped" };
  return response.ok ? { ok: true, body } : { ok: false, error: typeof body.error === "string" ? body.error : "unexpected" };
}

async function refreshLauncher() {
  clearTimeout(view.pollTimer);
  const answer = await ask("api/status");
  view.launcher = answer.ok ? answer.body : { state: "stopped" };
  const state = view.launcher.state;
  if (view.shown && WORKING.has(state)) view.pollTimer = setTimeout(refreshLauncher, POLL_MS);
  if (state === "running" && view.pending) {
    view.pending = false;
    void search();
    return;
  }
  render();
}

async function search(append = false) {
  const query = view.query.trim();
  if (!query) {
    view.results = [];
    view.extra = null;
    view.error = null;
    render();
    return;
  }
  if (view.launcher?.state !== "running") {
    view.pending = true;
    void refreshLauncher();
    return;
  }
  const token = ++view.token;
  if (append) view.page += 1;
  else {
    view.page = 1;
    view.results = [];
    view.extra = null;
    view.silent = [];
  }
  view.loading = true;
  view.error = null;
  render();

  const params = new URLSearchParams({ q: query, categories: view.category, pageno: String(view.page), language: Allkin.i18n.language });
  if (view.period) params.set("time_range", view.period);
  const answer = await ask(`search?${params}`);
  if (token !== view.token) return;
  view.loading = false;

  if (!answer.ok) {
    if (append) view.page -= 1;
    if (answer.error === "stopped" || answer.error === "not-ready") {
      // SearXNG went away meanwhile: the page shows why, and asks again once it is back.
      view.pending = !append;
      void refreshLauncher();
      return;
    }
    if (append) toast(searchError(answer.error), "ko");
    else view.error = answer.error;
    render();
    return;
  }
  const known = new Set(view.results.map((result) => result.url));
  const fresh = (answer.body.results ?? []).filter((result) => result.url && !known.has(result.url));
  view.results.push(...fresh);
  view.more = fresh.length > 0;
  view.silent = answer.body.unresponsive ?? [];
  if (!append) {
    view.extra = {
      answers: answer.body.answers ?? [],
      infoboxes: answer.body.infoboxes ?? [],
      suggestions: answer.body.suggestions ?? [],
      corrections: answer.body.corrections ?? [],
    };
  }
  render();
}

const searchError = (code) => t(code === "searxng-refused" ? "plugin.searxng.error.refused" : "plugin.searxng.error.silent");

function searchFor(query) {
  view.query = query;
  el("sx-q").value = query;
  void search();
}

/* ---- Drawing ------------------------------------------------------------- */

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

/** An address a result may link to or show a picture from: http(s) only. */
function webUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function link(url, className) {
  const a = node("a", className);
  a.href = url.href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

function picture(src, className) {
  const url = webUrl(src);
  if (!url) return null;
  const img = node("img", className);
  img.src = url.href;
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  // A picture that does not come leaves no broken frame.
  img.addEventListener("error", () => img.closest(".sx-image, .sx-thumb")?.remove(), { once: true });
  return img;
}

/** « example.org › docs › page »: where a result leads, readable. */
function breadcrumb(url) {
  const parts = decodeURIComponent(url.pathname).split("/").filter(Boolean).slice(0, 3);
  return [url.hostname.replace(/^www\./, ""), ...parts].join(" › ");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(Allkin.i18n.locale, { year: "numeric", month: "short", day: "numeric" });
}

async function copyLink(href) {
  try {
    await navigator.clipboard.writeText(href);
    toast(t("plugin.searxng.result.copied"));
  } catch {
    toast(t("plugin.searxng.result.copyFailed"), "ko");
  }
}

function resultMenu(button, url) {
  core.menu(button, [
    { label: t("plugin.searxng.result.open"), iconHtml: iconSvg("arrow-square-out"), onClick: () => window.open(url.href, "_blank", "noopener,noreferrer") },
    { label: t("plugin.searxng.result.copy"), iconHtml: iconSvg("copy"), onClick: () => void copyLink(url.href) },
  ]);
}

function resultRow(result) {
  const url = webUrl(result.url);
  if (!url) return null;
  const row = node("article", "sx-result");
  // A picture only where it is the result's own — a video, a piece of news;
  // on the web it is mostly a site's logo, cut.
  const thumb = THUMB_CATEGORIES.has(view.category) ? picture(result.thumbnail || result.img_src, "sx-thumb-img") : null;
  if (thumb) {
    const frame = link(url, "sx-thumb");
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.appendChild(thumb);
    row.appendChild(frame);
  }
  const text = node("div", "sx-result-text");
  text.appendChild(node("span", "sx-result-url", breadcrumb(url)));
  const title = link(url, "sx-result-title");
  title.textContent = result.title || url.hostname;
  text.appendChild(title);
  if (result.content) text.appendChild(node("p", "sx-result-snippet", result.content));
  const meta = [result.published ? formatDate(result.published) : "", result.author ?? "", (result.engines ?? []).join(", ")].filter(Boolean);
  if (meta.length) text.appendChild(node("span", "sx-result-meta", meta.join(" · ")));
  row.appendChild(text);

  const more = node("button", "secondary sx-result-more");
  more.type = "button";
  more.innerHTML = iconSvg("dots-three");
  more.title = t("plugin.searxng.result.actions");
  more.setAttribute("aria-label", more.title);
  more.setAttribute("aria-haspopup", "menu");
  more.addEventListener("click", (event) => {
    // The click that opens a menu must not reach the page, which closes it.
    event.stopPropagation();
    resultMenu(more, url);
  });
  row.appendChild(more);
  return row;
}

function imageTile(result) {
  const url = webUrl(result.url);
  const img = picture(result.thumbnail || result.img_src, "sx-image-img");
  if (!url || !img) return null;
  const tile = link(url, "sx-image");
  tile.title = result.title ?? "";
  tile.append(img, node("span", "sx-image-name", result.title || url.hostname));
  return tile;
}

function extraBlocks(extra) {
  const blocks = [];
  if (extra.corrections.length) {
    const line = node("p", "sx-correction", `${t("plugin.searxng.correction")} `);
    for (const correction of extra.corrections) {
      const b = node("button", "sx-link", correction);
      b.type = "button";
      b.addEventListener("click", () => searchFor(correction));
      line.appendChild(b);
    }
    blocks.push(line);
  }
  for (const answer of extra.answers) blocks.push(node("div", "sx-answer", answer));
  for (const box of extra.infoboxes) {
    const card = node("div", "sx-infobox");
    card.appendChild(node("b", "sx-infobox-title", box.title));
    if (box.content) card.appendChild(node("p", "sx-infobox-text", box.content));
    const url = webUrl(box.url);
    if (url) {
      const a = link(url, "sx-result-url");
      a.textContent = breadcrumb(url);
      card.appendChild(a);
    }
    blocks.push(card);
  }
  return blocks;
}

function suggestions(list) {
  const block = node("div", "sx-suggestions");
  block.appendChild(node("span", "sx-suggestions-label", t("plugin.searxng.suggestions")));
  for (const suggestion of list) {
    const b = node("button", "secondary", suggestion);
    b.type = "button";
    b.addEventListener("click", () => searchFor(suggestion));
    block.appendChild(b);
  }
  return block;
}

function empty(options) {
  const block = core.emptyState(options);
  const wrap = node("div", "sx-empty");
  wrap.appendChild(block);
  return wrap;
}

const openPage = { get label() { return t("plugin.searxng.openPage"); }, onClick: () => core.openPluginPage?.(ID) };

/** What the launcher is at, while SearXNG does not answer. */
function launcherBlock(launcher) {
  if (launcher.state === "failed") {
    const code = ["no-git", "no-python", "old-python", "no-venv", "clone-failed", "packages-failed", "start-failed"].includes(launcher.error) ? launcher.error : "unexpected";
    return empty({ icon: iconSvg("warning"), title: t("plugin.searxng.failed.title"), text: t(`plugin.searxng.failed.${code}`), action: openPage });
  }
  if (launcher.state === "stopped") {
    return empty({ icon: iconSvg("warning"), title: t("plugin.searxng.stopped.title"), text: t("plugin.searxng.stopped.text"), action: openPage });
  }
  const step = ["clone", "venv", "packages"].includes(launcher.step) ? launcher.step : "clone";
  const text = launcher.state === "starting" ? t("plugin.searxng.starting.text") : t(`plugin.searxng.step.${step}`);
  const block = empty({ icon: iconSvg("arrow-clockwise"), title: t(`plugin.searxng.${launcher.state}.title`), text });
  block.classList.add("is-working");
  return block;
}

function renderFoot() {
  const foot = el("sx-foot");
  const count = el("sx-count");
  const show = view.launcher?.state === "running" && view.results.length > 0;
  foot.classList.toggle("hidden", !show);
  if (!show) return;
  const parts = [tn("plugin.searxng.count", view.results.length)];
  if (view.silent.length) parts.push(tn("plugin.searxng.silent", view.silent.length));
  count.textContent = parts.join(" · ");
  count.title = view.silent.map((entry) => (entry.reason ? `${entry.engine} (${entry.reason})` : entry.engine)).join(", ");
}

function render() {
  if (!view.filled) return;
  renderFoot();
  const body = el("sx-body");
  const launcher = view.launcher ?? { state: "starting" };

  if (launcher.state !== "running") {
    const key = `launcher:${launcher.state}:${launcher.step}:${launcher.error}`;
    if (view.drawn !== key) body.replaceChildren(launcherBlock(launcher));
    view.drawn = key;
    return;
  }
  view.drawn = "";
  if (view.loading && view.page === 1) {
    const block = empty({ icon: iconSvg("arrow-clockwise"), title: t("plugin.searxng.loading") });
    block.classList.add("is-working");
    body.replaceChildren(block);
    return;
  }
  if (view.error) {
    body.replaceChildren(empty({ icon: iconSvg("warning"), title: t("plugin.searxng.error.title"), text: searchError(view.error), action: { label: t("plugin.searxng.retry"), onClick: () => void search() } }));
    return;
  }
  if (!view.query.trim() || !view.extra) {
    body.replaceChildren(empty({ icon: iconSvg("magnifying-glass"), title: t("plugin.searxng.idle.title"), text: t("plugin.searxng.idle.text") }));
    return;
  }

  const page = node("div", "sx-page");
  page.append(...extraBlocks(view.extra));
  if (!view.results.length) {
    const silent = view.silent.length ? ` ${tn("plugin.searxng.silent", view.silent.length)}.` : "";
    page.appendChild(empty({ icon: iconSvg("magnifying-glass"), title: t("plugin.searxng.none.title"), text: t("plugin.searxng.none.text") + silent }));
  } else if (view.category === "images") {
    const grid = node("div", "sx-images");
    grid.append(...view.results.map(imageTile).filter(Boolean));
    page.appendChild(grid);
  } else {
    const list = node("div", "sx-results");
    list.append(...view.results.map(resultRow).filter(Boolean));
    page.appendChild(list);
  }
  if (view.extra.suggestions.length) page.appendChild(suggestions(view.extra.suggestions));
  if (view.results.length && view.more) {
    const more = node("button", "secondary sx-more", t(view.loading ? "plugin.searxng.loading" : "plugin.searxng.more"));
    more.type = "button";
    more.disabled = view.loading;
    more.addEventListener("click", () => void search(true));
    page.appendChild(more);
  }
  // More results are added under the ones read: the page stays where it is.
  const top = view.page > 1 ? body.scrollTop : 0;
  body.replaceChildren(page);
  body.scrollTop = top;
}

/* ---- The bar ------------------------------------------------------------- */

function renderCategories() {
  el("sx-view").dataset.category = view.category;
  el("sx-cats").replaceChildren(
    ...CATEGORIES.map((category) => {
      const b = node("button", "hub-chip", t(`plugin.searxng.cat.${category}`));
      b.type = "button";
      b.classList.toggle("active", category === view.category);
      b.setAttribute("aria-pressed", String(category === view.category));
      b.addEventListener("click", () => {
        if (view.category === category) return;
        view.category = category;
        renderCategories();
        void search();
      });
      return b;
    }),
  );
}

const periodLabel = (period) => t(`plugin.searxng.time.${period || "any"}`);

function fillView() {
  if (view.filled) return;
  view.filled = true;
  for (const holder of el("sx-view").querySelectorAll("[data-sx-icon]")) holder.innerHTML = iconSvg(holder.dataset.sxIcon);
  renderCategories();
  // The period's button: its glyph a child of the button itself, so that the
  // bar keeps it alone on a phone, where a button with an icon loses its label.
  el("sx-time").insertAdjacentHTML("afterbegin", iconSvg("clock"));
  el("sx-time-label").textContent = periodLabel(view.period);

  const input = el("sx-q");
  el("sx-form").addEventListener("submit", (event) => {
    event.preventDefault();
    view.query = input.value;
    input.blur();
    void search();
  });
  // The cross of the field empties the page too.
  input.addEventListener("search", () => {
    if (input.value) return;
    view.query = "";
    void search();
  });
  const time = el("sx-time");
  time.addEventListener("click", (event) => {
    event.stopPropagation();
    core.menu(
      time,
      PERIODS.map((period) => ({
        label: periodLabel(period),
        active: period === view.period,
        onClick: () => {
          if (view.period === period) return;
          view.period = period;
          el("sx-time-label").textContent = periodLabel(period);
          void search();
        },
      })),
      { choice: true },
    );
  });
}

/* ---- Tab, app, capability ------------------------------------------------ */

function openView(query) {
  core.openTab(null, KIND);
  if (typeof query === "string" && query.trim()) {
    fillView();
    searchFor(query.trim());
  }
}

Allkin.registerTabKind(KIND, {
  panels: ["sx-view"],
  icon: TAB_ICON,
  label: () => t("plugin.searxng.name"),
  tooltip: () => view.query.trim() || t("plugin.searxng.app.meta"),
  activate: () => {
    view.shown = true;
    fillView();
    void refreshLauncher();
    if (!view.query && window.matchMedia("(min-width: 721px)").matches) el("sx-q").focus();
  },
  leave: () => {
    view.shown = false;
    clearTimeout(view.pollTimer);
  },
  scroller: () => el("sx-body"),
});

Allkin.registerApp({
  key: "searxng",
  get name() {
    return t("plugin.searxng.name");
  },
  get meta() {
    return t("plugin.searxng.app.meta");
  },
  icon: TAB_ICON,
  open: () => openView(),
});

Allkin.provide("searxng", { open: openView });
})();
