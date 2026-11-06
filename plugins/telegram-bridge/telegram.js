"use strict";
/* ============================================================================
   Telegram integration: its page (2026-11-06, style D of mockups/telegram).
   ----------------------------------------------------------------------------
   A table of the bots — each bound to one agent or several —, a row
   unfolding on the bot's conversations (who talks to which agent, where it
   stands), the access requests of people a bot does not know yet at the top,
   the totals in the page's foot with "Add a bot". A bot's settings open in
   the one window, a menu of sections at its left: agents, access, approval,
   messages, the bot itself.

   Everything goes through the integration's own service (bridge.mjs), whose
   web part Allkin relays under /plugins/telegram-bridge/web/ behind the
   user's session: the tokens never come back to the page. While the tab is
   shown the state is read again every few seconds.
   ========================================================================== */
(() => {
const Allkin = window.Allkin;
const core = Allkin.core;
const { el, escapeHtml: esc } = core;
const P = "plugin.telegram-bridge.";
const tt = (key, vars) => Allkin.t(P + key, vars);
const ttn = (key, count, vars) => Allkin.tn(P + key, count, vars);
const KIND = "telegram";
const API = "/plugins/telegram-bridge/web/api";
const POLL_MS = 4000;
const LANGUAGES = { fr: "Français", en: "English", es: "Español", de: "Deutsch" };
const IDLE_HOURS = [0, 1, 4, 12, 24, 72];
const API_CODES = new Set(["token-format", "token-used", "token-refused", "telegram-unreachable", "unknown-agent", "no-agent", "token-other-bot", "bot-not-started"]);
const toast = (message, kind = "ok") => core.toast?.(message, kind);
const isPhone = () => window.matchMedia("(max-width: 720px)").matches;

/* ---- Icons: Phosphor, light (and duotone for the tab) -------------------- */

// Generated from @phosphor-icons/core (MIT): light weight, and duotone for the tab.
const ICONS = {"light":{"paper-plane-tilt":[{"d":"M225.88,30.12a13.83,13.83,0,0,0-13.7-3.58l-.11,0L20.14,84.77A14,14,0,0,0,18,110.85l85.56,41.64L145.12,238a13.87,13.87,0,0,0,12.61,8c.4,0,.81,0,1.21-.05a13.9,13.9,0,0,0,12.29-10.09l58.2-191.93,0-.11A13.83,13.83,0,0,0,225.88,30.12Zm-8,10.4L159.73,232.43l0,.11a2,2,0,0,1-3.76.26l-40.68-83.58,49-49a6,6,0,1,0-8.49-8.49l-49,49L23.15,100a2,2,0,0,1,.31-3.74l.11,0L215.48,38.08a1.94,1.94,0,0,1,1.92.52A2,2,0,0,1,217.92,40.52Z"}],"users-three":[{"d":"M243.6,148.8a6,6,0,0,1-8.4-1.2A53.58,53.58,0,0,0,192,126a6,6,0,0,1,0-12,26,26,0,1,0-25.18-32.5,6,6,0,0,1-11.62-3,38,38,0,1,1,59.91,39.63A65.69,65.69,0,0,1,244.8,140.4,6,6,0,0,1,243.6,148.8ZM189.19,213a6,6,0,0,1-2.19,8.2,5.9,5.9,0,0,1-3,.81,6,6,0,0,1-5.2-3,59,59,0,0,0-101.62,0,6,6,0,1,1-10.38-6A70.1,70.1,0,0,1,103,182.55a46,46,0,1,1,50.1,0A70.1,70.1,0,0,1,189.19,213ZM128,178a34,34,0,1,0-34-34A34,34,0,0,0,128,178ZM70,120a6,6,0,0,0-6-6A26,26,0,1,1,89.18,81.49a6,6,0,1,0,11.62-3,38,38,0,1,0-59.91,39.63A65.69,65.69,0,0,0,11.2,140.4a6,6,0,1,0,9.6,7.2A53.58,53.58,0,0,1,64,126,6,6,0,0,0,70,120Z"}],"warning-circle":[{"d":"M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Zm-6-82V80a6,6,0,0,1,12,0v56a6,6,0,0,1-12,0Zm16,36a10,10,0,1,1-10-10A10,10,0,0,1,138,172Z"}],"x":[{"d":"M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z"}],"check":[{"d":"M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z"}],"warning":[{"d":"M235.07,189.09,147.61,37.22h0a22.75,22.75,0,0,0-39.22,0L20.93,189.09a21.53,21.53,0,0,0,0,21.72A22.35,22.35,0,0,0,40.55,222h174.9a22.35,22.35,0,0,0,19.6-11.19A21.53,21.53,0,0,0,235.07,189.09ZM224.66,204.8a10.46,10.46,0,0,1-9.21,5.2H40.55a10.46,10.46,0,0,1-9.21-5.2,9.51,9.51,0,0,1,0-9.72L118.79,43.21a10.75,10.75,0,0,1,18.42,0l87.46,151.87A9.51,9.51,0,0,1,224.66,204.8ZM122,144V104a6,6,0,0,1,12,0v40a6,6,0,0,1-12,0Zm16,36a10,10,0,1,1-10-10A10,10,0,0,1,138,180Z"}],"dots-three":[{"d":"M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128ZM60,118a10,10,0,1,0,10,10A10,10,0,0,0,60,118Zm136,0a10,10,0,1,0,10,10A10,10,0,0,0,196,118Z"}],"key":[{"d":"M215.15,40.85A78,78,0,0,0,86.2,121.31l-56.1,56.1a13.94,13.94,0,0,0-4.1,9.9V216a14,14,0,0,0,14,14H72a6,6,0,0,0,6-6V206H96a6,6,0,0,0,6-6V182h18a6,6,0,0,0,4.24-1.76l10.45-10.44A77.59,77.59,0,0,0,160,174h.1A78,78,0,0,0,215.15,40.85ZM226,98.16c-1.12,35.16-30.67,63.8-65.88,63.84a65.93,65.93,0,0,1-24.51-4.67,6,6,0,0,0-6.64,1.26L117.51,170H96a6,6,0,0,0-6,6v18H72a6,6,0,0,0-6,6v18H40a2,2,0,0,1-2-2V187.31a2,2,0,0,1,.58-1.41l58.83-58.83a6,6,0,0,0,1.26-6.64A65.61,65.61,0,0,1,94,95.92C94,60.71,122.68,31.16,157.83,30A66,66,0,0,1,226,98.16ZM190,76a10,10,0,1,1-10-10A10,10,0,0,1,190,76Z"}],"arrow-right":[{"d":"M220.24,132.24l-72,72a6,6,0,0,1-8.48-8.48L201.51,134H40a6,6,0,0,1,0-12H201.51L139.76,60.24a6,6,0,0,1,8.48-8.48l72,72A6,6,0,0,1,220.24,132.24Z"}],"paperclip":[{"d":"M208.25,123.76a6,6,0,0,1,0,8.49l-82.06,82a54,54,0,0,1-76.36-76.39L149.1,37.14a38,38,0,1,1,53.77,53.72L103.59,191.54a22,22,0,1,1-31.15-31.09l83.28-84.67a6,6,0,0,1,8.56,8.42L81,168.91a10,10,0,1,0,14.11,14.18L194.35,82.4a26,26,0,1,0-36.74-36.8L58.33,146.28a42,42,0,1,0,59.37,59.44l82.06-82A6,6,0,0,1,208.25,123.76Z"}],"arrow-square-out":[{"d":"M222,104a6,6,0,0,1-12,0V54.49l-69.75,69.75a6,6,0,0,1-8.48-8.48L201.51,46H152a6,6,0,0,1,0-12h64a6,6,0,0,1,6,6Zm-38,26a6,6,0,0,0-6,6v72a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V80a2,2,0,0,1,2-2h72a6,6,0,0,0,0-12H48A14,14,0,0,0,34,80V208a14,14,0,0,0,14,14H176a14,14,0,0,0,14-14V136A6,6,0,0,0,184,130Z"}],"gear":[{"d":"M128,82a46,46,0,1,0,46,46A46.06,46.06,0,0,0,128,82Zm0,80a34,34,0,1,1,34-34A34,34,0,0,1,128,162ZM214,130.84c.06-1.89.06-3.79,0-5.68L229.33,106a6,6,0,0,0,1.11-5.29A105.34,105.34,0,0,0,219.76,74.9a6,6,0,0,0-4.53-3l-24.45-2.71q-1.93-2.07-4-4l-2.72-24.46a6,6,0,0,0-3-4.53,105.65,105.65,0,0,0-25.77-10.66A6,6,0,0,0,150,26.68l-19.2,15.37c-1.89-.06-3.79-.06-5.68,0L106,26.67a6,6,0,0,0-5.29-1.11A105.34,105.34,0,0,0,74.9,36.24a6,6,0,0,0-3,4.53L69.23,65.22q-2.07,1.94-4,4L40.76,72a6,6,0,0,0-4.53,3,105.65,105.65,0,0,0-10.66,25.77A6,6,0,0,0,26.68,106l15.37,19.2c-.06,1.89-.06,3.79,0,5.68L26.67,150.05a6,6,0,0,0-1.11,5.29A105.34,105.34,0,0,0,36.24,181.1a6,6,0,0,0,4.53,3l24.45,2.71q1.94,2.07,4,4L72,215.24a6,6,0,0,0,3,4.53,105.65,105.65,0,0,0,25.77,10.66,6,6,0,0,0,5.29-1.11L125.16,214c1.89.06,3.79.06,5.68,0l19.21,15.38a6,6,0,0,0,3.75,1.31,6.2,6.2,0,0,0,1.54-.2,105.34,105.34,0,0,0,25.76-10.68,6,6,0,0,0,3-4.53l2.71-24.45q2.07-1.93,4-4l24.46-2.72a6,6,0,0,0,4.53-3,105.49,105.49,0,0,0,10.66-25.77,6,6,0,0,0-1.11-5.29Zm-3.1,41.63-23.64,2.63a6,6,0,0,0-3.82,2,75.14,75.14,0,0,1-6.31,6.31,6,6,0,0,0-2,3.82l-2.63,23.63A94.28,94.28,0,0,1,155.14,218l-18.57-14.86a6,6,0,0,0-3.75-1.31h-.36a78.07,78.07,0,0,1-8.92,0,6,6,0,0,0-4.11,1.3L100.87,218a94.13,94.13,0,0,1-17.34-7.17L80.9,187.21a6,6,0,0,0-2-3.82,75.14,75.14,0,0,1-6.31-6.31,6,6,0,0,0-3.82-2l-23.63-2.63A94.28,94.28,0,0,1,38,155.14l14.86-18.57a6,6,0,0,0,1.3-4.11,78.07,78.07,0,0,1,0-8.92,6,6,0,0,0-1.3-4.11L38,100.87a94.13,94.13,0,0,1,7.17-17.34L68.79,80.9a6,6,0,0,0,3.82-2,75.14,75.14,0,0,1,6.31-6.31,6,6,0,0,0,2-3.82l2.63-23.63A94.28,94.28,0,0,1,100.86,38l18.57,14.86a6,6,0,0,0,4.11,1.3,78.07,78.07,0,0,1,8.92,0,6,6,0,0,0,4.11-1.3L155.13,38a94.13,94.13,0,0,1,17.34,7.17l2.63,23.64a6,6,0,0,0,2,3.82,75.14,75.14,0,0,1,6.31,6.31,6,6,0,0,0,3.82,2l23.63,2.63A94.28,94.28,0,0,1,218,100.86l-14.86,18.57a6,6,0,0,0-1.3,4.11,78.07,78.07,0,0,1,0,8.92,6,6,0,0,0,1.3,4.11L218,155.13A94.13,94.13,0,0,1,210.85,172.47Z"}],"link":[{"d":"M238,88.18a52.42,52.42,0,0,1-15.4,35.66l-34.75,34.75A52.28,52.28,0,0,1,150.62,174h-.05A52.63,52.63,0,0,1,98,119.9a6,6,0,0,1,6-5.84h.17a6,6,0,0,1,5.83,6.16A40.62,40.62,0,0,0,150.58,162h0a40.4,40.4,0,0,0,28.73-11.9l34.75-34.74A40.63,40.63,0,0,0,156.63,57.9l-11,11a6,6,0,0,1-8.49-8.49l11-11a52.62,52.62,0,0,1,74.43,0A52.83,52.83,0,0,1,238,88.18Zm-127.62,98.9-11,11A40.36,40.36,0,0,1,70.6,210h0a40.63,40.63,0,0,1-28.7-69.36L76.62,105.9A40.63,40.63,0,0,1,146,135.77a6,6,0,0,0,5.83,6.16H152a6,6,0,0,0,6-5.84A52.63,52.63,0,0,0,68.14,97.42L33.38,132.16A52.63,52.63,0,0,0,70.56,222h0a52.26,52.26,0,0,0,37.22-15.42l11-11a6,6,0,1,0-8.49-8.48Z"}],"trash":[{"d":"M216,50H174V40a22,22,0,0,0-22-22H104A22,22,0,0,0,82,40V50H40a6,6,0,0,0,0,12H50V208a14,14,0,0,0,14,14H192a14,14,0,0,0,14-14V62h10a6,6,0,0,0,0-12ZM94,40a10,10,0,0,1,10-10h48a10,10,0,0,1,10,10V50H94ZM194,208a2,2,0,0,1-2,2H64a2,2,0,0,1-2-2V62H194ZM110,104v64a6,6,0,0,1-12,0V104a6,6,0,0,1,12,0Zm48,0v64a6,6,0,0,1-12,0V104a6,6,0,0,1,12,0Z"}],"caret-down":[{"d":"M212.24,100.24l-80,80a6,6,0,0,1-8.48,0l-80-80a6,6,0,0,1,8.48-8.48L128,167.51l75.76-75.75a6,6,0,0,1,8.48,8.48Z"}],"star":[{"d":"M237.28,97.87A14.18,14.18,0,0,0,224.76,88l-60.25-4.87-23.22-56.2a14.37,14.37,0,0,0-26.58,0L91.49,83.11,31.24,88a14.18,14.18,0,0,0-12.52,9.89A14.43,14.43,0,0,0,23,113.32L69,152.93l-14,59.25a14.4,14.4,0,0,0,5.59,15,14.1,14.1,0,0,0,15.91.6L128,196.12l51.58,31.71a14.1,14.1,0,0,0,15.91-.6,14.4,14.4,0,0,0,5.59-15l-14-59.25L233,113.32A14.43,14.43,0,0,0,237.28,97.87Zm-12.14,6.37-48.69,42a6,6,0,0,0-1.92,5.92l14.88,62.79a2.35,2.35,0,0,1-.95,2.57,2.24,2.24,0,0,1-2.6.1L131.14,184a6,6,0,0,0-6.28,0L70.14,217.61a2.24,2.24,0,0,1-2.6-.1,2.35,2.35,0,0,1-1-2.57l14.88-62.79a6,6,0,0,0-1.92-5.92l-48.69-42a2.37,2.37,0,0,1-.73-2.65,2.28,2.28,0,0,1,2.07-1.65l63.92-5.16a6,6,0,0,0,5.06-3.69l24.63-59.6a2.35,2.35,0,0,1,4.38,0l24.63,59.6a6,6,0,0,0,5.06,3.69l63.92,5.16a2.28,2.28,0,0,1,2.07,1.65A2.37,2.37,0,0,1,225.14,104.24Z"}],"shield-check":[{"d":"M208,42H48A14,14,0,0,0,34,56v56c0,51.94,25.12,83.4,46.2,100.64,22.73,18.6,45.27,24.89,46.22,25.15a6,6,0,0,0,3.16,0c.95-.26,23.49-6.55,46.22-25.15C196.88,195.4,222,163.94,222,112V56A14,14,0,0,0,208,42Zm2,70c0,37.76-13.94,68.39-41.44,91.06A131.17,131.17,0,0,1,128,225.72a130.94,130.94,0,0,1-40.56-22.66C59.94,180.39,46,149.76,46,112V56a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2ZM172.24,99.76a6,6,0,0,1,0,8.48l-56,56a6,6,0,0,1-8.48,0l-24-24a6,6,0,0,1,8.48-8.48L112,151.51l51.76-51.75A6,6,0,0,1,172.24,99.76Z"}],"lock-simple":[{"d":"M208,82H174V56a46,46,0,0,0-92,0V82H48A14,14,0,0,0,34,96V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V96A14,14,0,0,0,208,82ZM94,56a34,34,0,0,1,68,0V82H94ZM210,208a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V96a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2Z"}],"info":[{"d":"M142,176a6,6,0,0,1-6,6,14,14,0,0,1-14-14V128a2,2,0,0,0-2-2,6,6,0,0,1,0-12,14,14,0,0,1,14,14v40a2,2,0,0,0,2,2A6,6,0,0,1,142,176ZM124,94a10,10,0,1,0-10-10A10,10,0,0,0,124,94Zm106,34A102,102,0,1,1,128,26,102.12,102.12,0,0,1,230,128Zm-12,0a90,90,0,1,0-90,90A90.1,90.1,0,0,0,218,128Z"}],"check-circle":[{"d":"M172.24,99.76a6,6,0,0,1,0,8.48l-56,56a6,6,0,0,1-8.48,0l-24-24a6,6,0,0,1,8.48-8.48L112,151.51l51.76-51.75A6,6,0,0,1,172.24,99.76ZM230,128A102,102,0,1,1,128,26,102.12,102.12,0,0,1,230,128Zm-12,0a90,90,0,1,0-90,90A90.1,90.1,0,0,0,218,128Z"}],"magnifying-glass":[{"d":"M228.24,219.76l-51.38-51.38a86.15,86.15,0,1,0-8.48,8.48l51.38,51.38a6,6,0,0,0,8.48-8.48ZM38,112a74,74,0,1,1,74,74A74.09,74.09,0,0,1,38,112Z"}],"funnel":[{"d":"M228.77,50.34A13.8,13.8,0,0,0,216,42H40A14,14,0,0,0,29.67,65.42l.06.07L98,138.38V216a14,14,0,0,0,21.77,11.64l32-21.33A14,14,0,0,0,158,194.66V138.38l68.33-73A13.82,13.82,0,0,0,228.77,50.34Zm-11.26,6.94L147.62,131.9A6,6,0,0,0,146,136v58.66a2,2,0,0,1-.89,1.67l-32,21.33A2,2,0,0,1,110,216V136a6,6,0,0,0-1.62-4.1L38.53,57.32A2,2,0,0,1,40,54H216a1.9,1.9,0,0,1,1.83,1.19A1.86,1.86,0,0,1,217.51,57.28Z"}],"arrows-clockwise":[{"d":"M222,48V96a6,6,0,0,1-6,6H168a6,6,0,0,1,0-12h33.52L183.47,72a81.51,81.51,0,0,0-57.53-24h-.46A81.5,81.5,0,0,0,68.19,71.28a6,6,0,1,1-8.38-8.58,93.38,93.38,0,0,1,65.67-26.76H126a93.45,93.45,0,0,1,66,27.53l18,18V48a6,6,0,0,1,12,0ZM187.81,184.72a81.5,81.5,0,0,1-57.29,23.34h-.46a81.51,81.51,0,0,1-57.53-24L54.48,166H88a6,6,0,0,0,0-12H40a6,6,0,0,0-6,6v48a6,6,0,0,0,12,0V174.48l18,18.05a93.45,93.45,0,0,0,66,27.53h.52a93.38,93.38,0,0,0,65.67-26.76,6,6,0,1,0-8.38-8.58Z"}],"plus":[{"d":"M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"}],"robot":[{"d":"M200,50H134V16a6,6,0,0,0-12,0V50H56A30,30,0,0,0,26,80V192a30,30,0,0,0,30,30H200a30,30,0,0,0,30-30V80A30,30,0,0,0,200,50Zm18,142a18,18,0,0,1-18,18H56a18,18,0,0,1-18-18V80A18,18,0,0,1,56,62H200a18,18,0,0,1,18,18ZM74,108a10,10,0,1,1,10,10A10,10,0,0,1,74,108Zm88,0a10,10,0,1,1,10,10A10,10,0,0,1,162,108Zm2,30H92a26,26,0,0,0,0,52h72a26,26,0,0,0,0-52Zm-22,12v28H114V150ZM78,164a14,14,0,0,1,14-14h10v28H92A14,14,0,0,1,78,164Zm86,14H154V150h10a14,14,0,0,1,0,28Z"}],"chat-circle":[{"d":"M128,26A102,102,0,0,0,38.35,176.69L26.73,211.56a14,14,0,0,0,17.71,17.71l34.87-11.62A102,102,0,1,0,128,26Zm0,192a90,90,0,0,1-45.06-12.08,6.09,6.09,0,0,0-3-.81,6.2,6.2,0,0,0-1.9.31L40.65,217.88a2,2,0,0,1-2.53-2.53L50.58,178a6,6,0,0,0-.5-4.91A90,90,0,1,1,128,218Z"}],"caret-right":[{"d":"M180.24,132.24l-80,80a6,6,0,0,1-8.48-8.48L167.51,128,91.76,52.24a6,6,0,0,1,8.48-8.48l80,80A6,6,0,0,1,180.24,132.24Z"}],"pause":[{"d":"M200,34H160a14,14,0,0,0-14,14V208a14,14,0,0,0,14,14h40a14,14,0,0,0,14-14V48A14,14,0,0,0,200,34Zm2,174a2,2,0,0,1-2,2H160a2,2,0,0,1-2-2V48a2,2,0,0,1,2-2h40a2,2,0,0,1,2,2ZM96,34H56A14,14,0,0,0,42,48V208a14,14,0,0,0,14,14H96a14,14,0,0,0,14-14V48A14,14,0,0,0,96,34Zm2,174a2,2,0,0,1-2,2H56a2,2,0,0,1-2-2V48a2,2,0,0,1,2-2H96a2,2,0,0,1,2,2Z"}],"play":[{"d":"M231.36,116.19,87.28,28.06a14,14,0,0,0-14.18-.27A13.69,13.69,0,0,0,66,39.87V216.13a13.69,13.69,0,0,0,7.1,12.08,14,14,0,0,0,14.18-.27l144.08-88.13a13.82,13.82,0,0,0,0-23.62Zm-6.26,13.38L81,217.7a2,2,0,0,1-2.06,0,1.78,1.78,0,0,1-1-1.61V39.87a1.78,1.78,0,0,1,1-1.61A2.06,2.06,0,0,1,80,38a2,2,0,0,1,1,.31L225.1,126.43a1.82,1.82,0,0,1,0,3.14Z"}],"broadcast":[{"d":"M128,90a38,38,0,1,0,38,38A38,38,0,0,0,128,90Zm0,64a26,26,0,1,1,26-26A26,26,0,0,1,128,154Zm78-26a77.74,77.74,0,0,1-19.86,52,6,6,0,0,1-8.94-8,65.93,65.93,0,0,0,0-88,6,6,0,1,1,8.94-8A77.74,77.74,0,0,1,206,128ZM67.18,102.31A65.93,65.93,0,0,0,78.8,172a6,6,0,0,1-.47,8.47,6,6,0,0,1-8.47-.47,77.93,77.93,0,0,1,0-104,6,6,0,1,1,8.94,8A66.21,66.21,0,0,0,67.18,102.31ZM246,128a117.71,117.71,0,0,1-33.71,82.58,6,6,0,0,1-8.58-8.4,105.88,105.88,0,0,0,0-148.36,6,6,0,0,1,8.58-8.4A117.71,117.71,0,0,1,246,128ZM52.29,202.18a6,6,0,0,1-8.58,8.4,117.92,117.92,0,0,1,0-165.16,6,6,0,1,1,8.58,8.4,105.88,105.88,0,0,0,0,148.36Z"}],"circle-notch":[{"d":"M230,128a102,102,0,0,1-204,0c0-40.18,23.35-76.86,59.5-93.45a6,6,0,0,1,5,10.9C58.61,60.09,38,92.49,38,128a90,90,0,0,0,180,0c0-35.51-20.61-67.91-52.5-82.55a6,6,0,0,1,5-10.9C206.65,51.14,230,87.82,230,128Z"}]},"duotone":{"paper-plane-tilt":[{"d":"M223.69,42.18l-58.22,192a8,8,0,0,1-14.92,1.25L108,148,20.58,105.45a8,8,0,0,1,1.25-14.92l192-58.22A8,8,0,0,1,223.69,42.18Z","o":"0.2"},{"d":"M227.32,28.68a16,16,0,0,0-15.66-4.08l-.15,0L19.57,82.84a16,16,0,0,0-2.49,29.8L102,154l41.3,84.87A15.86,15.86,0,0,0,157.74,248q.69,0,1.38-.06a15.88,15.88,0,0,0,14-11.51l58.2-191.94c0-.05,0-.1,0-.15A16,16,0,0,0,227.32,28.68ZM157.83,231.85l-.05.14,0-.07-40.06-82.3,48-48a8,8,0,0,0-11.31-11.31l-48,48L24.08,98.25l-.07,0,.14,0L216,40Z"}]}};

function iconSvg(name, cls = "") {
  return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" aria-hidden="true"><g transform="scale(0.09375)" fill="currentColor" stroke="none">${(ICONS.light[name] ?? []).map((p) => `<path d="${p.d}"${p.o ? ` opacity="${p.o}"` : ""}/>`).join("")}</g></svg>`;
}
function dualIcon(name) {
  const group = (weight, cls) =>
    `<g class="${cls}" transform="scale(0.09375)" fill="currentColor" stroke="none">${(ICONS[weight][name] ?? []).map((p) => `<path d="${p.d}"${p.o ? ` opacity="${p.o}"` : ""}/>`).join("")}</g>`;
  return `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">${group("light", "ph-light")}${group("duotone", "ph-duo")}</svg>`;
}
const TAB_ICON = dualIcon("paper-plane-tilt");

function fillIcons(root) {
  for (const node of root.querySelectorAll("[data-tgb-icon]")) {
    // An empty span stands for the glyph itself; a button gets it before its label.
    if (node.tagName === "SPAN" && !node.childNodes.length) node.outerHTML = iconSvg(node.dataset.tgbIcon, node.className);
    else node.insertAdjacentHTML("afterbegin", iconSvg(node.dataset.tgbIcon));
  }
}

/* ---- The service --------------------------------------------------------- */

class ApiError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/** A call to the service. Anything but JSON is Allkin's relay saying the
 *  service is not there (stopped, rights missing): "down". */
async function call(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("down");
  }
  if (!(res.headers.get("content-type") ?? "").includes("application/json")) throw new ApiError("down", res.status);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "internal", res.status);
  return data;
}
const apiMessage = (error) => (API_CODES.has(error.code) ? tt(`api.${error.code}`) : tt("api.generic", { code: error.code }));

/* ---- State --------------------------------------------------------------- */

/** The last answer of GET /api/state: { bots, requests, chats }. */
let data = null;
let down = false;
const ui = { open: new Set(), opened: false, query: "", agent: null };
let pollTimer = null;
let shown = false;

const agents = () => (core.state.agents ?? []).filter((a) => !a.disabled);
const agentName = (id) => core.state.agents?.find((a) => a.id === id)?.name ?? id;
const botTitle = (bot) => bot.name || (bot.username ? `@${bot.username}` : tt("col.bot"));
const personName = (p) => p.name || (p.username ? `@${p.username}` : p.id);
const when = (ms) => (ms ? core.formatRelativeTime(ms) : "—");

async function refresh() {
  try {
    data = await call("/state");
    down = false;
  } catch (error) {
    if (error.code !== "down") return;
    down = true;
  }
  if (!ui.opened && data?.bots?.length) {
    ui.opened = true;
    ui.open.add(data.bots[0].id);
  }
  render();
}

function startPolling() {
  stopPolling();
  void refresh();
  pollTimer = setInterval(() => {
    if (!document.hidden) void refresh();
  }, POLL_MS);
}
function stopPolling() {
  clearInterval(pollTimer);
  pollTimer = null;
}

/* ---- Pictures ------------------------------------------------------------ */

const hueOf = (id) => [...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
/** A bot wears Telegram's round picture, in a hue of its own. */
const botPic = (bot, cls = "") => `<span class="tgb-bav${cls ? ` ${cls}` : ""}" style="--h:${hueOf(bot.id)}">${iconSvg("paper-plane-tilt")}</span>`;
const initials = (name) => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const personPic = (p, cls = "") => `<span class="tgb-pav${cls ? ` ${cls}` : ""}" style="--h:${hueOf(p.id)}">${esc(initials(personName(p).replace(/^@/, "")))}</span>`;
const groupPic = (cls = "") => `<span class="tgb-pav tgb-gav${cls ? ` ${cls}` : ""}">${iconSvg("users-three")}</span>`;
/** An agent's picture, the app's own: filled once the markup is in the page. */
const agentPic = (id, cls = "") => `<span class="tgb-av${cls ? ` ${cls}` : ""}" data-agent="${esc(id)}"></span>`;
function paintAgents(root) {
  for (const node of root.querySelectorAll(".tgb-av[data-agent]")) core.renderAgentAvatar?.(node, node.dataset.agent);
}

function statePill(bot) {
  if (bot.state === "error") {
    const code = bot.error?.code ?? "telegram";
    return `<span class="tgb-state tgb-state-error" title="${esc(tt(`error.long.${code}`, { detail: bot.error?.detail ?? "" }))}">${iconSvg("warning-circle")}<span>${esc(tt(`error.${code}`))}</span></span>`;
  }
  const s = bot.state === "on" ? "on" : bot.state === "starting" ? "starting" : "off";
  const icon = { on: "broadcast", starting: "circle-notch", off: "pause" }[s];
  return `<span class="tgb-state tgb-state-${s}">${iconSvg(icon)}<span>${esc(tt(`state.${s}`))}</span></span>`;
}

function weekBars(week, cls = "") {
  const max = Math.max(1, ...week.map((d) => d.count));
  const days = week.map((d) => new Date(`${d.day}T12:00:00`).toLocaleDateString(Allkin.i18n.locale, { weekday: "narrow" }));
  return `<div class="tgb-bars ${cls}">${week
    .map((d, i) => `<span class="tgb-bar${i === week.length - 1 ? " is-today" : ""}" title="${esc(String(d.count))}"><i style="height:${Math.max(4, Math.round((d.count / max) * 100))}%"></i><em>${esc(days[i])}</em></span>`)
    .join("")}</div>`;
}

/* ---- The page ------------------------------------------------------------ */

const view = () => el("tgb-view");

function matches(bot) {
  if (ui.agent && !bot.agents.includes(ui.agent)) return false;
  const q = ui.query.trim().toLowerCase();
  if (!q) return true;
  const words = [bot.name, bot.username, ...bot.agents.map(agentName), ...bot.people.map((p) => `${p.name} ${p.username}`), ...bot.groups.map((g) => g.title)];
  return words.some((w) => String(w ?? "").toLowerCase().includes(q));
}

function render() {
  if (!shown) return;
  renderFilterLabel();
  renderRequests();
  renderTable();
  renderTotals();
}

function renderFilterLabel() {
  el("tgb-filter-label").textContent = ui.agent ? agentName(ui.agent) : tt("filter.all");
}

function renderTotals() {
  const bots = data?.bots ?? [];
  const meta = el("tgb-totals");
  if (!bots.length) {
    meta.textContent = "";
    return;
  }
  const agentCount = new Set(bots.flatMap((b) => b.agents)).size;
  const people = new Set(bots.flatMap((b) => b.people.map((p) => p.id))).size;
  const today = bots.reduce((n, b) => n + b.today, 0);
  const part = (key, n) => `<b>${esc(String(n))}</b>${esc(ttn(key, n).replace(String(n), ""))}`;
  meta.innerHTML = [part("totals.bots", bots.length), part("totals.agents", agentCount), part("totals.people", people), part("totals.today", today)].join(" · ");
}

function renderRequests() {
  const box = el("tgb-requests");
  const requests = data && !down ? data.requests : [];
  box.replaceChildren();
  for (const r of requests) {
    const bot = data.bots.find((b) => b.id === r.botId);
    if (!bot) continue;
    const card = document.createElement("div");
    card.className = "tgb-request";
    card.innerHTML = `${personPic({ id: r.userId, name: r.name, username: r.username })}
      <div class="tgb-request-text"><b>${esc(r.name || tt("people.unnamed"))}</b> <span class="tgb-dim">${r.username ? `@${esc(r.username)} · ` : ""}${esc(r.userId)}</span><br>
      <span class="tgb-dim">${esc(tt("request.line", { bot: bot.username, when: when(r.at) }))}</span> <span class="tgb-tag tgb-tag-warn tgb-code">${esc(tt("request.code", { code: r.code }))}</span></div>
      <span class="tgb-gap"></span>
      <button type="button" class="secondary" data-act="refuse">${iconSvg("x")}<span>${esc(tt("request.refuse"))}</span></button>
      <button type="button" class="tgb-lit" data-act="approve">${iconSvg("check")}<span>${esc(tt("request.approve"))}</span></button>`;
    for (const button of card.querySelectorAll("button")) {
      button.addEventListener("click", async () => {
        const verdict = button.dataset.act;
        try {
          data = await call(`/requests/${encodeURIComponent(r.code)}/${verdict}`, { method: "POST" });
          toast(verdict === "approve" ? tt("request.approved", { name: r.name || r.userId }) : tt("request.refused"));
          render();
        } catch (error) {
          toast(apiMessage(error), "ko");
        }
      });
    }
    box.appendChild(card);
  }
}

function renderTable() {
  const body = el("tgb-body");
  body.replaceChildren();
  if (down) {
    body.appendChild(
      core.emptyState({
        icon: iconSvg("warning-circle"),
        title: tt("down.title"),
        text: tt("down.text"),
        action: { label: tt("down.open"), onClick: () => core.openPluginPage?.("telegram-bridge") },
      }),
    );
    return;
  }
  if (!data) return;
  if (!data.bots.length) {
    body.appendChild(core.emptyState({ icon: iconSvg("paper-plane-tilt"), title: tt("empty.title"), text: tt("empty.text"), action: { label: tt("add"), onClick: openAddWindow } }));
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "tgb-wrap";
  const table = document.createElement("table");
  table.className = "tgb-table";
  table.innerHTML = `<thead><tr><th>${esc(tt("col.bot"))}</th><th>${esc(tt("col.agents"))}</th><th class="tgb-hide">${esc(tt("col.people"))}</th><th class="tgb-num">${esc(tt("col.today"))}</th><th class="tgb-hide">${esc(tt("col.week"))}</th><th class="tgb-hide2">${esc(tt("col.last"))}</th><th>${esc(tt("col.state"))}</th><th class="tgb-more-col"></th></tr></thead>`;
  const tbody = document.createElement("tbody");
  for (const bot of data.bots.filter(matches)) {
    const open = ui.open.has(bot.id);
    const pending = data.requests.filter((r) => r.botId === bot.id).length;
    const tr = document.createElement("tr");
    tr.className = `tgb-row${open ? " is-open" : ""}${bot.state === "error" ? " is-error" : ""}`;
    tr.innerHTML = `
      <td><span class="tgb-name">${iconSvg(open ? "caret-down" : "caret-right", "tgb-caret")}${botPic(bot, "tgb-bav-sm")}<span class="tgb-text"><b>${esc(botTitle(bot))}</b><span class="tgb-dim">${bot.username ? `@${esc(bot.username)}` : ""}</span></span></span></td>
      <td>${bot.agents.length ? `<span class="tgb-agents"><span class="tgb-stack">${bot.agents.map((id) => agentPic(id, "tgb-av-xs")).join("")}</span><span>${esc(bot.agents.map(agentName).join(", "))}</span></span>` : `<span class="tgb-tag tgb-tag-warn">${iconSvg("warning")}${esc(tt("noAgent"))}</span>`}</td>
      <td class="tgb-hide"><span class="tgb-people">${bot.people.slice(0, 6).map((p) => personPic(p, "tgb-pav-xs")).join("")}${bot.groups.map(() => groupPic("tgb-pav-xs")).join("")}${pending ? `<span class="tgb-tag tgb-tag-warn">+${pending}</span>` : ""}</span></td>
      <td class="tgb-num"><b>${esc(String(bot.today))}</b></td>
      <td class="tgb-hide">${weekBars(bot.week, "tgb-bars-mini")}</td>
      <td class="tgb-hide2 tgb-dim">${esc(when(bot.lastAt))}</td>
      <td>${statePill(bot)}</td>
      <td class="tgb-more-col"><button type="button" class="secondary tgb-sq" data-act="more" title="${esc(tt("menu.more"))}" aria-label="${esc(tt("menu.more"))}">${iconSvg("dots-three")}</button></td>`;
    tr.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (ui.open.has(bot.id)) ui.open.delete(bot.id);
      else ui.open.add(bot.id);
      renderTable();
    });
    tr.querySelector('[data-act="more"]').addEventListener("click", (event) => openBotMenu(event.currentTarget, bot));
    tbody.appendChild(tr);
    if (open) tbody.appendChild(chatsRow(bot));
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  body.appendChild(wrap);
  paintAgents(body);
}

/** The unfolded row: the bot's error said whole, then its conversations. */
function chatsRow(bot) {
  const tr = document.createElement("tr");
  tr.className = "tgb-sub";
  const chats = data.chats.filter((c) => c.botId === bot.id);
  const error = bot.state === "error" && bot.error
    ? `<div class="tgb-alert">${iconSvg("warning-circle")}<div><b>${esc(tt(`error.${bot.error.code}`))}</b> <span class="tgb-dim">${esc(tt("error.since", { when: when(bot.since) }))}</span><br><span>${esc(tt(`error.long.${bot.error.code}`, { detail: bot.error.detail ?? "" }))}</span></div><span class="tgb-gap"></span>${bot.error.code === "token-refused" ? `<button type="button" class="tgb-lit" data-act="token">${iconSvg("key")}<span>${esc(tt("bot.replaceToken"))}</span></button>` : ""}</div>`
    : "";
  const rows = chats.length
    ? chats.map((c) => {
        const person = bot.people.find((p) => p.id === c.userId);
        const who = c.kind === "group"
          ? `${groupPic("tgb-pav-sm")}<span>${esc(c.title || tt("chat.group"))}</span>`
          : `${personPic(person ?? { id: c.userId ?? c.chatId, name: "" }, "tgb-pav-sm")}<span>${esc(person ? personName(person) : c.userId ?? "")}</span>`;
        const state = ["work", "wait", "done", "error"].includes(c.state) ? c.state : "done";
        const icon = { work: "circle-notch", wait: "shield-check", done: "check", error: "warning-circle" }[state];
        const text = `${c.fromName ? `${c.fromName} : ` : ""}${c.preview ?? ""}`;
        return `<div class="tgb-chat" data-key="${esc(c.key)}">
          <span class="tgb-who">${who}</span>${iconSvg("arrow-right", "tgb-arrow")}
          <span class="tgb-who">${agentPic(c.agentId, "tgb-av-xs")}<span>${esc(agentName(c.agentId))}</span></span>
          <span class="tgb-snippet">${c.hasFile ? iconSvg("paperclip", "tgb-clip") : ""}${esc(text)}</span>
          <span class="tgb-cstate tgb-cstate-${state}">${iconSvg(icon)}<span>${esc(tt(`chat.state.${state}`))}</span></span>
          <span class="tgb-when">${esc(when(c.lastAt))}</span>
          <button type="button" class="secondary tgb-sq tgb-sq-sm" data-act="open" ${c.sessionId ? "" : "disabled"} title="${esc(tt("chat.open"))}" aria-label="${esc(tt("chat.open"))}">${iconSvg("arrow-square-out")}</button>
        </div>`;
      }).join("")
    : `<div class="tgb-chats-empty">${esc(tt("chats.empty"))}</div>`;
  tr.innerHTML = `<td colspan="8">${error}<div class="tgb-chats">
    <div class="tgb-chats-head"><b>${esc(tt("chats.title"))}</b><b class="tgb-count">${chats.length}</b><span class="tgb-gap"></span>
    <button type="button" class="secondary" data-act="settings">${iconSvg("gear")}<span>${esc(tt("chats.settings"))}</span></button></div>
    ${rows}</div></td>`;
  tr.querySelector('[data-act="settings"]').addEventListener("click", () => openSettings(bot.id));
  tr.querySelector('[data-act="token"]')?.addEventListener("click", () => openTokenWindow(bot));
  for (const row of tr.querySelectorAll(".tgb-chat")) {
    const chat = chats.find((c) => c.key === row.dataset.key);
    row.querySelector('[data-act="open"]').addEventListener("click", () => {
      if (chat?.sessionId) core.openTab(chat.agentId, "chat", { path: chat.sessionId, name: `Telegram · ${botTitle(bot)}` });
    });
  }
  return tr;
}

function openBotMenu(anchor, bot) {
  core.menu(anchor, [
    { label: tt("menu.settings"), iconHtml: iconSvg("gear"), onClick: () => openSettings(bot.id) },
    { label: bot.enabled ? tt("menu.pause") : tt("menu.resume"), iconHtml: iconSvg(bot.enabled ? "pause" : "play"), onClick: () => setEnabled(bot, !bot.enabled) },
    { label: tt("menu.invite"), iconHtml: iconSvg("link"), disabled: !bot.username, onClick: () => copyInvite(bot) },
    { label: tt("menu.open"), iconHtml: iconSvg("arrow-square-out"), disabled: !bot.username, onClick: () => window.open(`https://t.me/${bot.username}`, "_blank", "noopener") },
    "sep",
    { label: tt("menu.remove"), iconHtml: iconSvg("trash"), danger: true, onClick: () => removeBot(bot) },
  ]);
}

/* ---- Actions on a bot ------------------------------------------------------ */

/** Applies a bot's new view to the state, then redraws what shows it. */
function applyBot(view) {
  if (!data || !view?.id) return;
  const i = data.bots.findIndex((b) => b.id === view.id);
  if (i >= 0) data.bots[i] = view;
  render();
  if (sheet?.botId === view.id) drawSheet();
}

async function patchBot(bot, patch) {
  try {
    applyBot(await call(`/bots/${bot.id}`, { method: "PATCH", body: patch }));
    return true;
  } catch (error) {
    toast(apiMessage(error), "ko");
    if (sheet?.botId === bot.id) drawSheet();
    return false;
  }
}

async function setEnabled(bot, enabled) {
  if (await patchBot(bot, { enabled })) toast(tt(enabled ? "resumed" : "paused", { name: botTitle(bot) }));
}

async function copyInvite(bot) {
  try {
    const { link } = await call(`/bots/${bot.id}/invite`, { method: "POST" });
    await core.copyToClipboard?.(link);
    toast(tt("invite.copied"));
  } catch (error) {
    toast(apiMessage(error), "ko");
  }
}

async function removeBot(bot) {
  const ok = await core.confirm({ title: tt("remove.title", { name: botTitle(bot) }), text: tt("remove.text"), okLabel: tt("remove.ok"), danger: true });
  if (!ok) return;
  try {
    await call(`/bots/${bot.id}`, { method: "DELETE" });
    if (sheet?.botId === bot.id) closeSheet();
    toast(tt("removed"));
    await refresh();
  } catch (error) {
    toast(apiMessage(error), "ko");
  }
}

/* ---- The one window ------------------------------------------------------- */

/** A window of the one grammar, appended to the page; `close()` removes it. */
function openWindow({ className = "", icon = "", title, meta = "", onClose = null }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop tgb-backdrop";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  const modal = document.createElement("div");
  modal.className = `modal ${className}`;
  const head = document.createElement("div");
  head.className = "modal-head";
  head.innerHTML = `${icon}<h2 class="modal-title"></h2>${meta ? `<span class="modal-head-meta"></span>` : ""}`;
  head.querySelector(".modal-title").textContent = title;
  if (meta) head.querySelector(".modal-head-meta").textContent = meta;
  head.appendChild(core.modalCloseButton());
  const body = document.createElement("div");
  body.className = "modal-body";
  const foot = document.createElement("div");
  foot.className = "modal-foot";
  modal.append(head, body, foot);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  const onKey = (event) => {
    if (event.key === "Escape") close();
  };
  function close() {
    document.removeEventListener("keydown", onKey);
    backdrop.remove();
    onClose?.();
  }
  document.addEventListener("keydown", onKey);
  backdrop.addEventListener("mousedown", (event) => {
    if (event.target === backdrop) close();
  });
  core.onModalDismiss(modal, close);
  return { backdrop, modal, head, body, foot, close };
}

/* Pieces of a form: the one grammar of rows. */
function optionRow(title, note, action) {
  const row = document.createElement("div");
  row.className = "option-row";
  const label = document.createElement("div");
  label.className = "option-label";
  label.innerHTML = `<span class="option-title"></span>${note ? `<span class="option-note"></span>` : ""}`;
  label.querySelector(".option-title").textContent = title;
  if (note) label.querySelector(".option-note").textContent = note;
  const act = document.createElement("div");
  act.className = "option-action";
  for (const node of [action].flat().filter(Boolean)) act.appendChild(node);
  row.append(label, act);
  return row;
}
function setGroup(title, rows, aside = "") {
  const group = document.createElement("div");
  group.className = "set-group";
  const h = document.createElement("h2");
  h.className = "set-group-title tgb-group-title";
  h.textContent = title;
  if (aside) h.insertAdjacentHTML("beforeend", `<span class="tgb-group-aside">${aside}</span>`);
  const card = document.createElement("div");
  card.className = "set-card set-card--list";
  for (const row of rows.filter(Boolean)) card.appendChild(row);
  group.append(h, card);
  return group;
}
function switchControl(on, onChange, label = "") {
  const wrap = document.createElement("span");
  wrap.className = "switch-control";
  wrap.innerHTML = `<input type="checkbox"${on ? " checked" : ""}${label ? ` aria-label="${esc(label)}"` : ""} /><span class="switch" aria-hidden="true"></span>`;
  wrap.querySelector("input").addEventListener("change", (event) => onChange(event.target.checked));
  return wrap;
}
function button(label, icon, onClick, cls = "secondary") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.innerHTML = `${icon ? iconSvg(icon) : ""}${label ? `<span>${esc(label)}</span>` : ""}`;
  if (!label) {
    b.classList.add("tgb-sq");
    b.title = "";
  }
  b.addEventListener("click", onClick);
  return b;
}
/** A raised button that says its value, opening the menu of the values. */
function choiceButton(label, items, current, onPick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "secondary tgb-choice";
  b.innerHTML = `<span>${esc(label)}</span>${iconSvg("caret-down")}`;
  b.addEventListener("click", () =>
    core.menu(b, items.map((item) => ({ label: item.label, active: item.value === current, onClick: () => onPick(item.value) })), { choice: true }),
  );
  return b;
}

/* ---- The settings of a bot ----------------------------------------------- */

const SECTIONS = [
  { id: "agents", icon: "robot", draw: sectionAgents },
  { id: "access", icon: "users-three", draw: sectionAccess },
  { id: "approvals", icon: "shield-check", draw: sectionApprovals },
  { id: "messages", icon: "chat-circle", draw: sectionMessages },
  { id: "bot", icon: "gear", draw: sectionBot },
];

/** The window open on a bot: { botId, section, win }. */
let sheet = null;
const sheetBot = () => data?.bots.find((b) => b.id === sheet?.botId);

function openSettings(botId, section = "agents") {
  const bot = data?.bots.find((b) => b.id === botId);
  if (!bot) return;
  closeSheet();
  const win = openWindow({
    className: "modal-wide modal-tall tgb-modal",
    icon: botPic(bot, "tgb-bav-xs modal-icon"),
    title: botTitle(bot),
    meta: bot.username ? `@${bot.username}` : "",
    onClose: () => {
      sheet = null;
    },
  });
  sheet = { botId, section, win };
  win.body.classList.add("tgb-m-body");
  drawSheet();
}
function closeSheet() {
  sheet?.win.close();
  sheet = null;
}

function drawSheet() {
  const bot = sheetBot();
  if (!sheet || !bot) return;
  const { win } = sheet;
  const keepScroll = win.body.querySelector(".tgb-m-page")?.scrollTop ?? 0;
  win.body.replaceChildren();
  const pending = data.requests.filter((r) => r.botId === bot.id).length;
  const nav = document.createElement("nav");
  nav.className = isPhone() ? "tgb-m-chips" : "tgb-m-menu";
  for (const s of SECTIONS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `${isPhone() ? "tgb-chip" : "tgb-m-nav"}${s.id === sheet.section ? " is-on" : ""}`;
    b.innerHTML = `${isPhone() ? "" : iconSvg(s.icon)}<span>${esc(tt(`section.${s.id}`))}</span>${s.id === "access" && pending ? `<b class="tgb-count tgb-count-warn">${pending}</b>` : ""}`;
    b.addEventListener("click", () => {
      sheet.section = s.id;
      drawSheet();
      win.body.querySelector(".tgb-m-page").scrollTop = 0;
    });
    nav.appendChild(b);
  }
  const page = document.createElement("div");
  page.className = "tgb-m-page";
  if (isPhone()) page.appendChild(nav);
  page.insertAdjacentHTML("beforeend", facts(bot));
  const set = document.createElement("div");
  set.className = "set-page tgb-set";
  for (const node of SECTIONS.find((s) => s.id === sheet.section).draw(bot)) set.appendChild(node);
  page.appendChild(set);
  if (isPhone()) win.body.append(page);
  else win.body.append(nav, page);
  paintAgents(win.body);
  page.scrollTop = keepScroll;

  win.foot.replaceChildren();
  const aside = document.createElement("span");
  aside.className = "modal-foot-aside";
  aside.innerHTML = statePill(bot);
  win.foot.append(
    aside,
    button(bot.enabled ? tt("menu.pause") : tt("menu.resume"), bot.enabled ? "pause" : "play", () => setEnabled(bot, !bot.enabled)),
    button(tt("close"), "", () => win.close(), "secondary modal-cancel"),
  );
}

function facts(bot) {
  return `<div class="tgb-facts">
    <div><span>${esc(tt("facts.today"))}</span><b>${esc(String(bot.today))}</b><em>${esc(tt("facts.messages"))}</em></div>
    <div><span>${esc(tt("facts.last"))}</span><b>${esc(when(bot.lastAt))}</b></div>
    <div class="tgb-facts-lat"><span>${esc(tt("facts.latency"))}</span><b>${bot.latencyMs ? esc(`${(bot.latencyMs / 1000).toLocaleString(Allkin.i18n.locale, { maximumFractionDigits: 1 })} s`) : "—"}</b></div>
    <div class="tgb-facts-week"><span>${esc(tt("facts.week"))}</span>${weekBars(bot.week)}</div>
  </div>${bot.state === "error" && bot.error ? `<div class="tgb-alert">${iconSvg("warning-circle")}<div><b>${esc(tt(`error.${bot.error.code}`))}</b><br><span>${esc(tt(`error.long.${bot.error.code}`, { detail: bot.error.detail ?? "" }))}</span></div></div>` : ""}`;
}

function sectionAgents(bot) {
  const rows = bot.agents.map((id) => {
    const isDefault = id === bot.defaultAgent;
    const row = optionRow(agentName(id), core.state.agents?.find((a) => a.id === id)?.description ?? "", []);
    row.classList.add("tgb-pic-row");
    row.querySelector(".option-label").insertAdjacentHTML("afterbegin", agentPic(id));
    const act = row.querySelector(".option-action");
    if (isDefault) act.insertAdjacentHTML("beforeend", `<span class="tgb-tag tgb-tag-on">${iconSvg("star")}${esc(tt("agents.default"))}</span>`);
    else if (bot.agents.length > 1 && bot.options.switchAgents) act.insertAdjacentHTML("beforeend", `<span class="tgb-cmd">/agent ${esc(id)}</span>`);
    const more = button("", "dots-three", () =>
      core.menu(more, [
        { label: tt("agents.makeDefault"), iconHtml: iconSvg("star"), disabled: isDefault, onClick: () => patchBot(bot, { defaultAgent: id }) },
        { label: tt("agents.unlink"), iconHtml: iconSvg("x"), danger: true, disabled: bot.agents.length < 2, onClick: () => patchBot(bot, { agents: bot.agents.filter((a) => a !== id) }) },
      ]),
    );
    more.classList.add("tgb-sq-sm");
    more.title = tt("menu.more");
    more.setAttribute("aria-label", tt("menu.more"));
    act.appendChild(more);
    return row;
  });
  if (!bot.agents.length) rows.push(optionRow(tt("agents.none"), "", []));
  const others = agents().filter((a) => !bot.agents.includes(a.id));
  const link = document.createElement("div");
  link.className = "option-row tgb-add-row";
  const linkBtn = button(tt("agents.link"), "plus", () =>
    core.menu(linkBtn, others.map((a) => ({ label: a.name, onClick: () => patchBot(bot, { agents: [...bot.agents, a.id] }) })), { choice: true }),
    "tgb-link",
  );
  linkBtn.disabled = !others.length;
  link.appendChild(linkBtn);
  rows.push(link);
  const idle = Number(bot.options.newAfterHours);
  return [
    setGroup(tt("agents.title"), rows, esc(ttn("agents.count", bot.agents.length))),
    setGroup(tt("routing.title"), [
      optionRow(tt("opt.switchAgents"), tt("opt.switchAgents.note"), switchControl(bot.options.switchAgents, (v) => patchBot(bot, { options: { switchAgents: v } }), tt("opt.switchAgents"))),
      optionRow(tt("opt.newAfterHours"), tt("opt.newAfterHours.note"), choiceButton(tt(`idle.${idle}`), IDLE_HOURS.map((h) => ({ value: h, label: tt(`idle.${h}`) })), idle, (v) => patchBot(bot, { options: { newAfterHours: v } }))),
    ]),
  ];
}

function sectionAccess(bot) {
  const requests = data.requests.filter((r) => r.botId === bot.id);
  const rows = [];
  for (const r of requests) {
    const row = optionRow(r.name || tt("people.unnamed"), `${r.username ? `@${r.username} · ` : ""}${r.userId} · ${tt("request.code", { code: r.code })} · ${when(r.at)}`, [
      button(tt("request.refuse"), "x", () => answerRequest(r, "refuse")),
      button(tt("request.approve"), "check", () => answerRequest(r, "approve"), "tgb-lit"),
    ]);
    row.classList.add("tgb-pic-row", "tgb-req-row");
    row.querySelector(".option-label").insertAdjacentHTML("afterbegin", personPic({ id: r.userId, name: r.name, username: r.username }));
    rows.push(row);
  }
  for (const p of bot.people) {
    const count = data.chats.filter((c) => c.botId === bot.id && c.userId === p.id).length;
    const note = [p.username ? `@${p.username}` : "", p.id, ttn("people.chats", count)].filter(Boolean).join(" · ");
    const actions = [];
    if (bot.agents.length > 1) {
      const items = [{ value: null, label: tt("people.defaultAgent") }, ...bot.agents.map((id) => ({ value: id, label: agentName(id) }))];
      const pick = choiceButton(p.agentId ? agentName(p.agentId) : tt("people.defaultAgent"), items, p.agentId ?? null, (v) => patchPerson(bot, p, { agentId: v }));
      pick.title = tt("people.agentFor", { name: personName(p) });
      actions.push(pick);
    }
    const approve = document.createElement("label");
    approve.className = "tgb-mini";
    approve.title = tt("people.approve");
    approve.innerHTML = iconSvg("shield-check");
    approve.appendChild(switchControl(p.approve, (v) => patchPerson(bot, p, { approve: v }), tt("people.approve")));
    actions.push(approve);
    const remove = button("", "x", async () => {
      const ok = await core.confirm({ title: tt("people.removeTitle", { name: personName(p) }), text: tt("people.removeText"), okLabel: tt("people.remove"), danger: true });
      if (!ok) return;
      try {
        applyBot(await call(`/bots/${bot.id}/people/${p.id}`, { method: "DELETE" }));
      } catch (error) {
        toast(apiMessage(error), "ko");
      }
    });
    remove.classList.add("tgb-sq-sm");
    remove.title = tt("people.remove");
    remove.setAttribute("aria-label", tt("people.remove"));
    actions.push(remove);
    const row = optionRow(personName(p), note, actions);
    row.classList.add("tgb-pic-row");
    row.querySelector(".option-label").insertAdjacentHTML("afterbegin", personPic(p));
    rows.push(row);
  }
  if (!bot.people.length && !requests.length) rows.push(optionRow(tt("people.none"), "", []));
  const invite = document.createElement("div");
  invite.className = "option-row tgb-add-row";
  const inviteBtn = button(tt("people.invite"), "user-plus", () => copyInvite(bot), "tgb-link");
  inviteBtn.disabled = !bot.username;
  invite.appendChild(inviteBtn);
  invite.insertAdjacentHTML("beforeend", `<span class="tgb-dim tgb-small">${esc(tt("people.inviteNote"))}</span>`);
  rows.push(invite);

  const groupRows = [optionRow(tt("opt.groups"), tt("opt.groups.note", { bot: bot.username || "…" }), switchControl(bot.options.groups, (v) => patchBot(bot, { options: { groups: v } }), tt("opt.groups")))];
  for (const g of bot.groups) {
    const leave = button("", "x", async () => {
      try {
        applyBot(await call(`/bots/${bot.id}/groups/${g.id}`, { method: "DELETE" }));
      } catch (error) {
        toast(apiMessage(error), "ko");
      }
    });
    leave.classList.add("tgb-sq-sm");
    leave.title = tt("groups.leave");
    leave.setAttribute("aria-label", tt("groups.leave"));
    const row = optionRow(g.title || g.id, tt("groups.note", { when: when(g.addedAt) }), leave);
    row.classList.add("tgb-pic-row");
    row.querySelector(".option-label").insertAdjacentHTML("afterbegin", groupPic());
    groupRows.push(row);
  }
  return [
    setGroup(tt("people.title"), rows, `${iconSvg("lock-simple")}${esc(tt("people.aside"))}`),
    setGroup(tt("groups.title"), groupRows),
  ];
}

async function answerRequest(r, verdict) {
  try {
    data = await call(`/requests/${encodeURIComponent(r.code)}/${verdict}`, { method: "POST" });
    toast(verdict === "approve" ? tt("request.approved", { name: r.name || r.userId }) : tt("request.refused"));
    render();
    drawSheet();
  } catch (error) {
    toast(apiMessage(error), "ko");
  }
}

async function patchPerson(bot, person, patch) {
  try {
    applyBot(await call(`/bots/${bot.id}/people/${person.id}`, { method: "PATCH", body: patch }));
  } catch (error) {
    toast(apiMessage(error), "ko");
    drawSheet();
  }
}

function sectionApprovals(bot) {
  const note = document.createElement("p");
  note.className = "tgb-note";
  note.innerHTML = `${iconSvg("info")}<span>${esc(tt("approvals.note"))}</span>`;
  return [
    setGroup(tt("approvals.title"), [
      optionRow(tt("opt.approvals"), tt("opt.approvals.note"), switchControl(bot.options.approvals, (v) => patchBot(bot, { options: { approvals: v } }), tt("opt.approvals"))),
    ]),
    note,
  ];
}

function sectionMessages(bot) {
  return [
    setGroup(tt("messages.title"), [
      optionRow(tt("opt.files"), tt("opt.files.note"), switchControl(bot.options.files, (v) => patchBot(bot, { options: { files: v } }), tt("opt.files"))),
      optionRow(tt("opt.typing"), tt("opt.typing.note"), switchControl(bot.options.typing, (v) => patchBot(bot, { options: { typing: v } }), tt("opt.typing"))),
    ]),
  ];
}

function sectionBot(bot) {
  const token = document.createElement("code");
  token.className = "tgb-token";
  token.textContent = `••••••••${bot.tokenHint}`;
  const botfather = button(tt("bot.botfather"), "arrow-square-out", () => window.open("https://t.me/BotFather", "_blank", "noopener"));
  const language = bot.options.language;
  return [
    setGroup(tt("bot.title"), [
      optionRow(tt("bot.token"), tt("bot.token.note"), [token, button(tt("bot.replaceToken"), "key", () => openTokenWindow(bot))]),
      optionRow(tt("bot.identity"), tt("bot.identity.note"), botfather),
      optionRow(tt("opt.commandsMenu"), tt("opt.commandsMenu.note"), switchControl(bot.options.commandsMenu, (v) => patchBot(bot, { options: { commandsMenu: v } }), tt("opt.commandsMenu"))),
      optionRow(tt("opt.language"), tt("opt.language.note"), choiceButton(LANGUAGES[language] ?? language, Object.entries(LANGUAGES).map(([value, label]) => ({ value, label })), language, (v) => patchBot(bot, { options: { language: v } }))),
    ]),
  ];
}

/* ---- Replacing a token ----------------------------------------------------- */

function openTokenWindow(bot) {
  const win = openWindow({ className: "tgb-small-win", title: tt("token.title", { name: botTitle(bot) }) });
  win.body.innerHTML = `<p class="tgb-dim tgb-p"></p><input type="text" class="tgb-token-input" autocomplete="off" spellcheck="false" />`;
  win.body.querySelector("p").textContent = tt("token.text");
  const input = win.body.querySelector("input");
  input.placeholder = tt("add.token.placeholder");
  const ok = button(tt("token.ok"), "key", async () => {
    ok.disabled = true;
    try {
      applyBot(await call(`/bots/${bot.id}/token`, { method: "POST", body: { token: input.value.trim() } }));
      win.close();
      toast(tt("token.done"));
    } catch (error) {
      core.setFieldError(input, apiMessage(error));
    } finally {
      ok.disabled = false;
    }
  }, "tgb-lit");
  input.addEventListener("input", () => core.setFieldError(input, ""));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") ok.click();
  });
  win.foot.append(button(tt("cancel"), "", () => win.close(), "secondary modal-cancel"), ok);
  input.focus();
}

/* ---- Adding a bot ---------------------------------------------------------- */

function openAddWindow() {
  const win = openWindow({ className: "modal-wide tgb-add", title: tt("add.title") });
  const pick = { found: null, token: "", agents: [], defaultAgent: null };
  const list = agents();
  // The agent shown in the conversation, else the first: picked to start with.
  const first = list.find((a) => a.id === core.state.currentAgentId) ?? list[0];
  if (first) {
    pick.agents = [first.id];
    pick.defaultAgent = first.id;
  }
  win.body.innerHTML = `<ol class="tgb-steps">
    <li class="tgb-step" data-step="1"><span class="tgb-step-n">1</span><div class="tgb-step-body"><b></b><p class="tgb-dim"></p></div></li>
    <li class="tgb-step" data-step="2"><span class="tgb-step-n">2</span><div class="tgb-step-body"><b></b>
      <div class="tgb-field"><input type="text" class="tgb-token-input" autocomplete="off" spellcheck="false" /><span class="tgb-ok hidden"></span></div>
      <div class="tgb-found hidden"></div></div></li>
    <li class="tgb-step" data-step="3"><span class="tgb-step-n">3</span><div class="tgb-step-body"><b></b><div class="tgb-pick"></div><p class="tgb-dim tgb-small"></p></div></li>
    <li class="tgb-step is-todo" data-step="4"><span class="tgb-step-n">4</span><div class="tgb-step-body"><b></b><p class="tgb-dim"></p></div></li>
  </ol>`;
  const step = (n) => win.body.querySelector(`[data-step="${n}"]`);
  step(1).querySelector("b").textContent = tt("add.step1");
  step(1).querySelector("p").textContent = tt("add.step1.text");
  step(1).querySelector(".tgb-step-body").appendChild(button(tt("bot.botfather"), "arrow-square-out", () => window.open("https://t.me/BotFather", "_blank", "noopener")));
  step(2).querySelector("b").textContent = tt("add.step2");
  step(3).querySelector("b").textContent = tt("add.step3");
  step(3).querySelector("p").textContent = tt("add.step3.note");
  step(4).querySelector("b").textContent = tt("add.step4");
  step(4).querySelector("p").textContent = tt("add.step4.text");
  const input = step(2).querySelector("input");
  input.placeholder = tt("add.token.placeholder");
  const okMark = step(2).querySelector(".tgb-ok");
  const found = step(2).querySelector(".tgb-found");
  const check = button(tt("add.check"), "check-circle", () => void checkToken());
  step(2).querySelector(".tgb-field").appendChild(check);

  async function checkToken() {
    const token = input.value.trim();
    if (!token) return;
    check.disabled = true;
    check.querySelector("span").textContent = tt("add.checking");
    try {
      const me = await call("/check", { method: "POST", body: { token } });
      pick.found = me;
      pick.token = token;
      okMark.innerHTML = `${iconSvg("check-circle")}<span>${esc(tt("add.recognized"))}</span>`;
      okMark.classList.remove("hidden");
      check.classList.add("hidden");
      found.innerHTML = `${botPic({ id: String(me.tgId) }, "tgb-bav-md")}<span class="tgb-text"><b>${esc(me.name)}</b><span class="tgb-dim">${esc(tt("add.found", { username: me.username }))}</span></span>`;
      found.classList.remove("hidden");
      step(1).classList.add("is-done");
      step(2).classList.add("is-done");
    } catch (error) {
      core.setFieldError(input, apiMessage(error));
    } finally {
      check.disabled = false;
      check.querySelector("span").textContent = tt("add.check");
      drawSteps();
    }
  }
  input.addEventListener("input", () => {
    core.setFieldError(input, "");
    if (pick.found && input.value.trim() !== pick.token) {
      pick.found = null;
      okMark.classList.add("hidden");
      check.classList.remove("hidden");
      found.classList.add("hidden");
      step(2).classList.remove("is-done");
      drawSteps();
    }
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") void checkToken();
  });
  input.addEventListener("paste", () => setTimeout(() => void checkToken(), 0));

  function drawPick() {
    const box = step(3).querySelector(".tgb-pick");
    box.replaceChildren();
    if (!list.length) {
      box.textContent = tt("add.noAgents");
      return;
    }
    for (const a of list) {
      const on = pick.agents.includes(a.id);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `tgb-pick-a${on ? " is-on" : ""}`;
      chip.setAttribute("aria-pressed", String(on));
      chip.innerHTML = `${agentPic(a.id, "tgb-av-sm")}<span>${esc(a.name)}</span>${on ? `<span class="tgb-star${a.id === pick.defaultAgent ? " is-default" : ""}" role="button" title="${esc(tt("agents.makeDefault"))}">${iconSvg("star")}</span>` : ""}`;
      chip.addEventListener("click", (event) => {
        if (event.target.closest(".tgb-star")) {
          pick.defaultAgent = a.id;
        } else if (on) {
          pick.agents = pick.agents.filter((id) => id !== a.id);
          if (pick.defaultAgent === a.id) pick.defaultAgent = pick.agents[0] ?? null;
        } else {
          pick.agents.push(a.id);
          if (!pick.defaultAgent) pick.defaultAgent = a.id;
        }
        drawPick();
        drawSteps();
      });
      box.appendChild(chip);
    }
    paintAgents(box);
  }

  function drawSteps() {
    step(3).classList.toggle("is-now", Boolean(pick.found));
    step(2).classList.toggle("is-now", !pick.found);
    for (const n of [1, 2]) {
      const mark = step(n).querySelector(".tgb-step-n");
      mark.innerHTML = step(n).classList.contains("is-done") ? iconSvg("check") : String(n);
    }
    start.disabled = !pick.found || !pick.agents.length;
  }

  const aside = document.createElement("span");
  aside.className = "modal-foot-aside tgb-dim tgb-small";
  aside.innerHTML = `${iconSvg("lock-simple")}<span>${esc(tt("add.secret"))}</span>`;
  const start = button(tt("add.start"), "paper-plane-tilt", async () => {
    if (!pick.found) return core.setFieldError(input, tt("add.needToken"));
    start.disabled = true;
    try {
      const bot = await call("/bots", { method: "POST", body: { token: pick.token, agents: pick.agents, defaultAgent: pick.defaultAgent } });
      win.close();
      toast(tt("add.done", { name: botTitle(bot) }));
      ui.open.add(bot.id);
      await refresh();
    } catch (error) {
      if (["token-format", "token-used", "token-refused"].includes(error.code)) core.setFieldError(input, apiMessage(error));
      else toast(apiMessage(error), "ko");
      start.disabled = false;
    }
  }, "tgb-lit");
  win.foot.append(aside, button(tt("cancel"), "", () => win.close(), "secondary modal-cancel"), start);
  drawPick();
  drawSteps();
  input.focus();
}

/* ---- The page's controls ----------------------------------------------------- */

function bindPage() {
  const v = view();
  fillIcons(v);
  el("tgb-search").addEventListener("input", (event) => {
    ui.query = event.target.value;
    renderTable();
  });
  el("tgb-filter").addEventListener("click", (event) => {
    const used = [...new Set((data?.bots ?? []).flatMap((b) => b.agents))];
    core.menu(
      event.currentTarget,
      [{ label: tt("filter.all"), active: !ui.agent, onClick: () => setFilter(null) }, ...used.map((id) => ({ label: agentName(id), active: ui.agent === id, onClick: () => setFilter(id) }))],
      { choice: true },
    );
  });
  el("tgb-refresh").addEventListener("click", () => void refresh());
  el("tgb-add").addEventListener("click", openAddWindow);
}
function setFilter(id) {
  ui.agent = id;
  render();
}

/* ---- Tab and app ------------------------------------------------------------ */

function openPage() {
  core.openTab(null, KIND, { path: "telegram", name: tt("tab") });
}

Allkin.registerTabKind(KIND, {
  panels: ["tgb-view"],
  icon: TAB_ICON,
  label: () => tt("tab"),
  meta: tt("tab"),
  tooltip: () => tt("app.meta"),
  activate: () => {
    shown = true;
    render();
    startPolling();
  },
  leave: () => {
    shown = false;
    stopPolling();
  },
  beforeClose: () => {
    shown = false;
    stopPolling();
    closeSheet();
  },
});

Allkin.registerApp({
  key: "telegram",
  get name() {
    return tt("app.name");
  },
  get meta() {
    return tt("app.meta");
  },
  icon: TAB_ICON,
  open: openPage,
});

Allkin.provide("telegram", { open: openPage });

bindPage();
})();
