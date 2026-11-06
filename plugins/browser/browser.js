"use strict";
/* ============================================================================
   Browser integration (2026-11-04).
   ----------------------------------------------------------------------------
   The live view of an agent's browser — the Chrome of its own Allkin runs
   for it on the machine (src/browser/engine.ts): a tab of Allkin (kind
   "browser", one per agent) that shows the screencast of the active page,
   says who has the hand, and lets the user take it: their mouse and
   keyboard then go to the page, the address bar and the tabs open to them,
   and the agent waits until the hand is given back.

   The tools, the right, the cards and the journal are Allkin's: this script
   only talks to /api/browser (the state, the hand, the user's navigation,
   a dialog answered) and /ws/browser (the frames down, the gestures up),
   and listens to `browsers_changed` on the activity socket to open the tab
   when a browser opens for the agent whose conversation is shown.

   The Chrome of one of the user's PCs (2026-11-06, lot 2): the same view,
   its tab's path `<agent>@<computer>`, `?computer=` on every call. It is
   not opened by itself — the window is on the user's own screen — but it
   serves to watch, from a phone say, what the agent does there; the size
   of the picture is the window's, read from the frames.
   ========================================================================== */
(() => {
const Allkin = window.Allkin;
const core = Allkin.core;
const { el } = core;
const t = Allkin.t;

const KIND = "browser";
/** The viewport of the agent's browser on the server (BROWSER_LIMITS.viewport);
 *  a PC's Chrome has its window's, read from the frames (`current.size`). */
const VIEW = { width: 1280, height: 800 };
const toast = (message, kind = "ok") => core.toast?.(message, kind);
const isPhone = () => window.matchMedia("(max-width: 720px)").matches;

/* ---- Icons: Phosphor, light (and duotone for the tab) -------------------- */

// Generated from @phosphor-icons/core (MIT): light weight, and duotone for the tab.
const ICONS = {"light":{"globe":["M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm81.57,64H169.19a132.58,132.58,0,0,0-25.73-50.67A90.29,90.29,0,0,1,209.57,90ZM218,128a89.7,89.7,0,0,1-3.83,26H171.81a155.43,155.43,0,0,0,0-52h42.36A89.7,89.7,0,0,1,218,128Zm-90,87.83a110,110,0,0,1-15.19-19.45A124.24,124.24,0,0,1,99.35,166h57.3a124.24,124.24,0,0,1-13.46,30.38A110,110,0,0,1,128,215.83ZM96.45,154a139.18,139.18,0,0,1,0-52h63.1a139.18,139.18,0,0,1,0,52ZM38,128a89.7,89.7,0,0,1,3.83-26H84.19a155.43,155.43,0,0,0,0,52H41.83A89.7,89.7,0,0,1,38,128Zm90-87.83a110,110,0,0,1,15.19,19.45A124.24,124.24,0,0,1,156.65,90H99.35a124.24,124.24,0,0,1,13.46-30.38A110,110,0,0,1,128,40.17Zm-15.46-.84A132.58,132.58,0,0,0,86.81,90H46.43A90.29,90.29,0,0,1,112.54,39.33ZM46.43,166H86.81a132.58,132.58,0,0,0,25.73,50.67A90.29,90.29,0,0,1,46.43,166Zm97,50.67A132.58,132.58,0,0,0,169.19,166h40.38A90.29,90.29,0,0,1,143.46,216.67Z"],"arrow-left":["M222,128a6,6,0,0,1-6,6H54.49l61.75,61.76a6,6,0,1,1-8.48,8.48l-72-72a6,6,0,0,1,0-8.48l72-72a6,6,0,0,1,8.48,8.48L54.49,122H216A6,6,0,0,1,222,128Z"],"arrow-right":["M220.24,132.24l-72,72a6,6,0,0,1-8.48-8.48L201.51,134H40a6,6,0,0,1,0-12H201.51L139.76,60.24a6,6,0,0,1,8.48-8.48l72,72A6,6,0,0,1,220.24,132.24Z"],"arrow-clockwise":["M238,56v48a6,6,0,0,1-6,6H184a6,6,0,0,1,0-12h32.55l-30.38-27.8c-.06-.06-.12-.13-.19-.19a82,82,0,1,0-1.7,117.65,6,6,0,0,1,8.24,8.73A93.46,93.46,0,0,1,128,222h-1.28A94,94,0,1,1,194.37,61.4L226,90.35V56a6,6,0,1,1,12,0Z"],"browsers":["M216,42H72A14,14,0,0,0,58,56V74H40A14,14,0,0,0,26,88V200a14,14,0,0,0,14,14H184a14,14,0,0,0,14-14V182h18a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM40,86H184a2,2,0,0,1,2,2v18H38V88A2,2,0,0,1,40,86ZM186,200a2,2,0,0,1-2,2H40a2,2,0,0,1-2-2V118H186Zm32-32a2,2,0,0,1-2,2H198V88a14,14,0,0,0-14-14H70V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2Z"],"caret-down":["M212.24,100.24l-80,80a6,6,0,0,1-8.48,0l-80-80a6,6,0,0,1,8.48-8.48L128,167.51l75.76-75.75a6,6,0,0,1,8.48,8.48Z"],"hand":["M188,50a25.8,25.8,0,0,0-14,4.11V44a26,26,0,0,0-51.41-5.51A26,26,0,0,0,82,60v71l-7.53-12.1a26,26,0,0,0-45.11,25.87C60.76,211,78.51,238,128,238a86.1,86.1,0,0,0,86-86V76A26,26,0,0,0,188,50Zm14,102a74.09,74.09,0,0,1-74,74c-21,0-34.51-5.05-46.75-17.45C67.81,195,55.54,172,40.1,139.43l-.23-.43a14,14,0,0,1,24.25-14l.1.17,18.68,30A6,6,0,0,0,94,152V60a14,14,0,0,1,28,0v60a6,6,0,0,0,12,0V44a14,14,0,0,1,28,0v76a6,6,0,0,0,12,0V76a14,14,0,0,1,28,0Z"],"arrow-u-up-left":["M230,144a62.07,62.07,0,0,1-62,62H80a6,6,0,0,1,0-12h88a50,50,0,0,0,0-100H46.49l37.75,37.76a6,6,0,1,1-8.48,8.48l-48-48a6,6,0,0,1,0-8.48l48-48a6,6,0,0,1,8.48,8.48L46.49,82H168A62.07,62.07,0,0,1,230,144Z"],"camera":["M208,58H179.21L165,36.67A6,6,0,0,0,160,34H96a6,6,0,0,0-5,2.67L76.78,58H48A22,22,0,0,0,26,80V192a22,22,0,0,0,22,22H208a22,22,0,0,0,22-22V80A22,22,0,0,0,208,58Zm10,134a10,10,0,0,1-10,10H48a10,10,0,0,1-10-10V80A10,10,0,0,1,48,70H80a6,6,0,0,0,5-2.67L99.21,46h57.57L171,67.33A6,6,0,0,0,176,70h32a10,10,0,0,1,10,10ZM128,90a42,42,0,1,0,42,42A42,42,0,0,0,128,90Zm0,72a30,30,0,1,1,30-30A30,30,0,0,1,128,162Z"],"arrows-out-simple":["M214,48V96a6,6,0,0,1-12,0V62.48l-53.76,53.76a6,6,0,0,1-8.48-8.48L193.52,54H160a6,6,0,0,1,0-12h48A6,6,0,0,1,214,48ZM107.76,139.76,54,193.52V160a6,6,0,0,0-12,0v48a6,6,0,0,0,6,6H96a6,6,0,0,0,0-12H62.48l53.76-53.76a6,6,0,0,0-8.48-8.48Z"],"arrows-in-simple":["M212.24,52.24,158.48,106H192a6,6,0,0,1,0,12H144a6,6,0,0,1-6-6V64a6,6,0,0,1,12,0V97.52l53.76-53.76a6,6,0,0,1,8.48,8.48ZM112,138H64a6,6,0,0,0,0,12H97.52L43.76,203.76a6,6,0,1,0,8.48,8.48L106,158.48V192a6,6,0,0,0,12,0V144A6,6,0,0,0,112,138Z"],"dots-three":["M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128ZM60,118a10,10,0,1,0,10,10A10,10,0,0,0,60,118Zm136,0a10,10,0,1,0,10,10A10,10,0,0,0,196,118Z"],"x":["M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z"],"lock-simple":["M208,82H174V56a46,46,0,0,0-92,0V82H48A14,14,0,0,0,34,96V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V96A14,14,0,0,0,208,82ZM94,56a34,34,0,0,1,68,0V82H94ZM210,208a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V96a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2Z"],"keyboard":["M224,50H32A14,14,0,0,0,18,64V192a14,14,0,0,0,14,14H224a14,14,0,0,0,14-14V64A14,14,0,0,0,224,50Zm2,142a2,2,0,0,1-2,2H32a2,2,0,0,1-2-2V64a2,2,0,0,1,2-2H224a2,2,0,0,1,2,2Zm-20-64a6,6,0,0,1-6,6H56a6,6,0,0,1,0-12H200A6,6,0,0,1,206,128Zm0-32a6,6,0,0,1-6,6H56a6,6,0,0,1,0-12H200A6,6,0,0,1,206,96ZM70,160a6,6,0,0,1-6,6H56a6,6,0,0,1,0-12h8A6,6,0,0,1,70,160Zm96,0a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,160Zm40,0a6,6,0,0,1-6,6h-8a6,6,0,0,1,0-12h8A6,6,0,0,1,206,160Z"],"prohibit":["M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm90,102a89.6,89.6,0,0,1-22.29,59.22L68.78,60.29A89.95,89.95,0,0,1,218,128ZM38,128A89.6,89.6,0,0,1,60.29,68.78L187.22,195.71A89.95,89.95,0,0,1,38,128Z"],"play":["M231.36,116.19,87.28,28.06a14,14,0,0,0-14.18-.27A13.69,13.69,0,0,0,66,39.87V216.13a13.69,13.69,0,0,0,7.1,12.08,14,14,0,0,0,14.18-.27l144.08-88.13a13.82,13.82,0,0,0,0-23.62Zm-6.26,13.38L81,217.7a2,2,0,0,1-2.06,0,1.78,1.78,0,0,1-1-1.61V39.87a1.78,1.78,0,0,1,1-1.61A2.06,2.06,0,0,1,80,38a2,2,0,0,1,1,.31L225.1,126.43a1.82,1.82,0,0,1,0,3.14Z"],"copy":["M216,34H88a6,6,0,0,0-6,6V82H40a6,6,0,0,0-6,6V216a6,6,0,0,0,6,6H168a6,6,0,0,0,6-6V174h42a6,6,0,0,0,6-6V40A6,6,0,0,0,216,34ZM162,210H46V94H162Zm48-48H174V88a6,6,0,0,0-6-6H94V46H210Z"],"arrow-square-out":["M222,104a6,6,0,0,1-12,0V54.49l-69.75,69.75a6,6,0,0,1-8.48-8.48L201.51,46H152a6,6,0,0,1,0-12h64a6,6,0,0,1,6,6Zm-38,26a6,6,0,0,0-6,6v72a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V80a2,2,0,0,1,2-2h72a6,6,0,0,0,0-12H48A14,14,0,0,0,34,80V208a14,14,0,0,0,14,14H176a14,14,0,0,0,14-14V136A6,6,0,0,0,184,130Z"],"plus":["M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"],"check":["M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z"],"warning":["M235.07,189.09,147.61,37.22h0a22.75,22.75,0,0,0-39.22,0L20.93,189.09a21.53,21.53,0,0,0,0,21.72A22.35,22.35,0,0,0,40.55,222h174.9a22.35,22.35,0,0,0,19.6-11.19A21.53,21.53,0,0,0,235.07,189.09ZM224.66,204.8a10.46,10.46,0,0,1-9.21,5.2H40.55a10.46,10.46,0,0,1-9.21-5.2,9.51,9.51,0,0,1,0-9.72L118.79,43.21a10.75,10.75,0,0,1,18.42,0l87.46,151.87A9.51,9.51,0,0,1,224.66,204.8ZM122,144V104a6,6,0,0,1,12,0v40a6,6,0,0,1-12,0Zm16,36a10,10,0,1,1-10-10A10,10,0,0,1,138,180Z"]},"duotone":{"globe":[{"d":"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z","o":"0.2"},"M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm88,104a87.61,87.61,0,0,1-3.33,24H174.16a157.44,157.44,0,0,0,0-48h38.51A87.61,87.61,0,0,1,216,128ZM102,168H154a115.11,115.11,0,0,1-26,45A115.27,115.27,0,0,1,102,168Zm-3.9-16a140.84,140.84,0,0,1,0-48h59.88a140.84,140.84,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.84a157.44,157.44,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154,88H102a115.11,115.11,0,0,1,26-45A115.27,115.27,0,0,1,154,88Zm52.33,0H170.71a135.28,135.28,0,0,0-22.3-45.6A88.29,88.29,0,0,1,206.37,88ZM107.59,42.4A135.28,135.28,0,0,0,85.29,88H49.63A88.29,88.29,0,0,1,107.59,42.4ZM49.63,168H85.29a135.28,135.28,0,0,0,22.3,45.6A88.29,88.29,0,0,1,49.63,168Zm98.78,45.6a135.28,135.28,0,0,0,22.3-45.6h35.66A88.29,88.29,0,0,1,148.41,213.6Z"],"arrow-left":[{"d":"M112,56V200L40,128Z","o":"0.2"},"M216,120H120V56a8,8,0,0,0-13.66-5.66l-72,72a8,8,0,0,0,0,11.32l72,72A8,8,0,0,0,120,200V136h96a8,8,0,0,0,0-16ZM104,180.69,51.31,128,104,75.31Z"],"arrow-right":[{"d":"M216,128l-72,72V56Z","o":"0.2"},"M221.66,122.34l-72-72A8,8,0,0,0,136,56v64H40a8,8,0,0,0,0,16h96v64a8,8,0,0,0,13.66,5.66l72-72A8,8,0,0,0,221.66,122.34ZM152,180.69V75.31L204.69,128Z"],"arrow-clockwise":[{"d":"M216,128a88,88,0,1,1-88-88A88,88,0,0,1,216,128Z","o":"0.2"},"M240,56v48a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16H211.4L184.81,71.64l-.25-.24a80,80,0,1,0-1.67,114.78,8,8,0,0,1,11,11.63A95.44,95.44,0,0,1,128,224h-1.32A96,96,0,1,1,195.75,60L224,85.8V56a8,8,0,1,1,16,0Z"],"browsers":[{"d":"M224,56V168a8,8,0,0,1-8,8H192V88a8,8,0,0,0-8-8H64V56a8,8,0,0,1,8-8H216A8,8,0,0,1,224,56Z","o":"0.2"},"M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,88H184v16H40ZM184,200H40V120H184v80Zm32-32H200V88a16,16,0,0,0-16-16H72V56H216Z"],"caret-down":[{"d":"M208,96l-80,80L48,96Z","o":"0.2"},"M215.39,92.94A8,8,0,0,0,208,88H48a8,8,0,0,0-5.66,13.66l80,80a8,8,0,0,0,11.32,0l80-80A8,8,0,0,0,215.39,92.94ZM128,164.69,67.31,104H188.69Z"],"hand":[{"d":"M208,76v76a80,80,0,0,1-80,80c-44.18,0-60.75-21.28-93.32-90a20,20,0,0,1,34.64-20L88,152V60a20,20,0,0,1,40,0V44a20,20,0,0,1,40,0V76a20,20,0,0,1,40,0Z","o":"0.2"},"M188,48a27.75,27.75,0,0,0-12,2.71V44a28,28,0,0,0-54.65-8.6A28,28,0,0,0,80,60v64l-3.82-6.13a28,28,0,0,0-48.6,27.82c16,33.77,28.93,57.72,43.72,72.69C86.24,233.54,103.2,240,128,240a88.1,88.1,0,0,0,88-88V76A28,28,0,0,0,188,48Zm12,104a72.08,72.08,0,0,1-72,72c-20.38,0-33.51-4.88-45.33-16.85C69.44,193.74,57.26,171,41.9,138.58a6.36,6.36,0,0,0-.3-.58,12,12,0,0,1,20.79-12,1.76,1.76,0,0,0,.14.23l18.67,30A8,8,0,0,0,96,152V60a12,12,0,0,1,24,0v60a8,8,0,0,0,16,0V44a12,12,0,0,1,24,0v76a8,8,0,0,0,16,0V76a12,12,0,0,1,24,0Z"],"arrow-u-up-left":[{"d":"M80,40v96L32,88Z","o":"0.2"},"M168,80H88V40a8,8,0,0,0-13.66-5.66l-48,48a8,8,0,0,0,0,11.32l48,48A8,8,0,0,0,88,136V96h80a48,48,0,0,1,0,96H80a8,8,0,0,0,0,16h88a64,64,0,0,0,0-128ZM72,116.69,43.31,88,72,59.31Z"],"camera":[{"d":"M208,64H176L160,40H96L80,64H48A16,16,0,0,0,32,80V192a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V80A16,16,0,0,0,208,64ZM128,168a36,36,0,1,1,36-36A36,36,0,0,1,128,168Z","o":"0.2"},"M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z"],"arrows-out-simple":[{"d":"M224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48Z","o":"0.2"},"M216,48V96a8,8,0,0,1-16,0V67.31l-50.34,50.35a8,8,0,0,1-11.32-11.32L188.69,56H160a8,8,0,0,1,0-16h48A8,8,0,0,1,216,48ZM106.34,138.34,56,188.69V160a8,8,0,0,0-16,0v48a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16H67.31l50.35-50.34a8,8,0,0,0-11.32-11.32Z"],"arrows-in-simple":[{"d":"M224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48Z","o":"0.2"},"M213.66,53.66,163.31,104H192a8,8,0,0,1,0,16H144a8,8,0,0,1-8-8V64a8,8,0,0,1,16,0V92.69l50.34-50.35a8,8,0,0,1,11.32,11.32ZM112,136H64a8,8,0,0,0,0,16H92.69L42.34,202.34a8,8,0,0,0,11.32,11.32L104,163.31V192a8,8,0,0,0,16,0V144A8,8,0,0,0,112,136Z"],"dots-three":[{"d":"M240,96v64a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V96A16,16,0,0,1,32,80H224A16,16,0,0,1,240,96Z","o":"0.2"},"M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z"],"x":[{"d":"M216,56V200a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V56A16,16,0,0,1,56,40H200A16,16,0,0,1,216,56Z","o":"0.2"},"M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"],"lock-simple":[{"d":"M216,96V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V96a8,8,0,0,1,8-8H208A8,8,0,0,1,216,96Z","o":"0.2"},"M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Z"],"keyboard":[{"d":"M232,64V192a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H224A8,8,0,0,1,232,64Z","o":"0.2"},"M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,144H32V64H224V192Zm-16-64a8,8,0,0,1-8,8H56a8,8,0,0,1,0-16H200A8,8,0,0,1,208,128Zm0-32a8,8,0,0,1-8,8H56a8,8,0,0,1,0-16H200A8,8,0,0,1,208,96ZM72,160a8,8,0,0,1-8,8H56a8,8,0,0,1,0-16h8A8,8,0,0,1,72,160Zm96,0a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,160Zm40,0a8,8,0,0,1-8,8h-8a8,8,0,0,1,0-16h8A8,8,0,0,1,208,160Z"],"prohibit":[{"d":"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z","o":"0.2"},"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm88,104a87.56,87.56,0,0,1-20.41,56.28L71.72,60.4A88,88,0,0,1,216,128ZM40,128A87.56,87.56,0,0,1,60.41,71.72L184.28,195.6A88,88,0,0,1,40,128Z"],"play":[{"d":"M228.23,134.69,84.15,222.81A8,8,0,0,1,72,216.12V39.88a8,8,0,0,1,12.15-6.69l144.08,88.12A7.82,7.82,0,0,1,228.23,134.69Z","o":"0.2"},"M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z"],"copy":[{"d":"M216,40V168H168V88H88V40Z","o":"0.2"},"M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"],"arrow-square-out":[{"d":"M184,80V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H176A8,8,0,0,1,184,80Z","o":"0.2"},"M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"],"plus":[{"d":"M216,56V200a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V56A16,16,0,0,1,56,40H200A16,16,0,0,1,216,56Z","o":"0.2"},"M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"],"check":[{"d":"M232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Z","o":"0.2"},"M205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"],"warning":[{"d":"M215.46,216H40.54C27.92,216,20,202.79,26.13,192.09L113.59,40.22c6.3-11,22.52-11,28.82,0l87.46,151.87C236,202.79,228.08,216,215.46,216Z","o":"0.2"},"M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"]}};

function iconSvg(name) {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g transform="scale(0.09375)" fill="currentColor" stroke="none">${(ICONS.light[name] ?? []).map((d) => `<path d="${d}"/>`).join("")}</g></svg>`;
}

function dualIcon(name) {
  const group = (weight, cls) =>
    `<g class="${cls}" transform="scale(0.09375)" fill="currentColor" stroke="none">${(ICONS[weight][name] ?? [])
      .map((p) => (typeof p === "string" ? `<path d="${p}"/>` : `<path d="${p.d}" opacity="${p.o}"/>`))
      .join("")}</g>`;
  return `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">${group("light", "ph-light")}${group("duotone", "ph-duo")}</svg>`;
}

const TAB_ICON = dualIcon("globe");

function fillIcons(root) {
  for (const node of root.querySelectorAll("[data-brw-icon], [data-brw-label]")) {
    const label = node.dataset.brwLabel;
    node.innerHTML = (node.dataset.brwIcon ? iconSvg(node.dataset.brwIcon) : "") + (label ? `<span>${core.escapeHtml(t(label))}</span>` : "");
  }
}

/* ---- The view ------------------------------------------------------------ */

/** What the tab shows: the agent, its socket, the last state, the stream's pace. */
let current = null;
/** The last `browsers_changed` (GET /api/browser): the browsers open. */
let status = null;
/** The browsers whose tab was opened by itself (one per opening). */
const autoOpened = new Set();

const api = (path, options) => core.api(path, options);
const agentName = (agentId) => core.state.agents?.find((a) => a.id === agentId)?.name ?? agentId;
const view = () => el("brw-view");

/** The path of a tab: the agent, and the computer when the browser is a PC's. */
const pathOf = (agentId, computerId) => (computerId ? `${agentId}@${computerId}` : agentId);
const parsePath = (path) => {
  const at = String(path ?? "").indexOf("@");
  return at > 0 ? { agentId: path.slice(0, at), computerId: path.slice(at + 1) } : { agentId: String(path ?? ""), computerId: null };
};
const keyOf = (b) => pathOf(b.agentId, b.computer?.id);
/** `?computer=` for the calls of the view shown. */
const query = () => (current?.computerId ? `?computer=${encodeURIComponent(current.computerId)}` : "");
const computerName = () => current?.state?.computer?.name ?? current?.computerName ?? current?.computerId ?? "";
const size = () => current?.size ?? VIEW;

function openView(agentId, computerId) {
  const open = status?.open?.find((b) => b.agentId === agentId && (b.computer?.id ?? null) === (computerId ?? null));
  const name = computerId ? t("plugin.browser.tab.computer", { agent: agentName(agentId), computer: open?.computer?.name ?? computerId }) : agentName(agentId);
  core.openTab(null, KIND, { path: pathOf(agentId, computerId), name });
}

/* ---- The state drawn ----------------------------------------------------- */

function render(state) {
  if (!current) return;
  current.state = state;
  const v = view();
  const hand = state?.hand ?? "agent";
  v.dataset.hand = hand;
  v.classList.toggle("is-off", !state);
  const name = agentName(current.agentId);
  const pc = state?.computer?.name ?? computerName();
  const url = el("brw-url-input");
  if (document.activeElement !== url) url.value = state?.url ?? "";
  url.readOnly = hand !== "user";
  for (const id of ["brw-back", "brw-forward", "brw-reload"]) el(id).disabled = hand !== "user";
  const tabs = state?.tabs ?? [];
  el("brw-tabs-label").textContent = tabs.length === 1 ? t("plugin.browser.tabs.one") : t("plugin.browser.tabs", { n: tabs.length });
  const page = state?.title || state?.url || "";
  // A PC's Chrome: the capsule names the computer; the hand there is the user's as soon as they act in the window.
  el("brw-cap-title").textContent =
    hand === "user"
      ? current.computerId
        ? t("plugin.browser.state.user.computer", { computer: pc })
        : t("plugin.browser.state.user")
      : current.computerId
        ? page
          ? t("plugin.browser.state.agent.computer.page", { agent: name, computer: pc, page })
          : t("plugin.browser.state.agent.computer", { agent: name, computer: pc })
        : page
          ? t("plugin.browser.state.agent.page", { agent: name, page })
          : t("plugin.browser.state.agent", { agent: name });
  el("brw-cap-note").textContent = hand === "user" ? t("plugin.browser.state.user.waits", { agent: name }) : state?.url ?? "";
  const handBtn = el("brw-hand");
  handBtn.innerHTML = iconSvg(hand === "user" ? "arrow-u-up-left" : "hand") + `<span>${core.escapeHtml(t(hand === "user" ? "plugin.browser.hand.give" : "plugin.browser.hand.take"))}</span>`;
  // A dialog of the page waits: shown to the user, who answers it or leaves it to the agent.
  const dialog = state?.dialog;
  el("brw-dialog").classList.toggle("hidden", !dialog);
  if (dialog) {
    el("brw-dialog-message").textContent = dialog.message;
    const input = el("brw-dialog-input");
    input.classList.toggle("hidden", dialog.type !== "prompt");
    if (dialog.type === "prompt") input.value = dialog.defaultValue ?? "";
    el("brw-dialog-dismiss").classList.toggle("hidden", dialog.type === "alert");
  }
  el("brw-closed").classList.add("hidden");
  el("brw-foot-text").textContent = hand === "user" ? t("plugin.browser.keys.hint") : `${t("plugin.browser.live")} · ${size().width} × ${size().height}${current.fps ? ` · ${t("plugin.browser.fps", { n: current.fps })}` : ""}`;
}

function showClosed() {
  if (!current) return;
  const v = view();
  v.dataset.hand = "agent";
  v.classList.add("is-off");
  el("brw-closed").classList.remove("hidden");
  el("brw-closed-text").textContent = current.computerId
    ? t("plugin.browser.closed.text.computer", { agent: agentName(current.agentId), computer: computerName() })
    : t("plugin.browser.closed.text", { agent: agentName(current.agentId) });
  el("brw-dialog").classList.add("hidden");
  el("brw-foot-text").textContent = t("plugin.browser.closed.title");
  el("brw-cap-title").textContent = agentName(current.agentId);
  el("brw-cap-note").textContent = t("plugin.browser.closed.title");
}

/* ---- The socket: frames down, gestures up ------------------------------- */

function openSocket() {
  if (!current || current.ws) return;
  const agentId = current.agentId;
  const computer = current.computerId ? `&computer=${encodeURIComponent(current.computerId)}` : "";
  const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/browser?agentId=${encodeURIComponent(agentId)}${computer}`);
  current.ws = ws;
  current.frames = 0;
  ws.addEventListener("message", (event) => {
    if (!current || current.ws !== ws) return;
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg.type === "frame") {
      el("brw-img").src = `data:image/jpeg;base64,${msg.data}`;
      current.frames += 1;
      // The size of the picture: the window's on a PC (the first frame says it, and a resize).
      if (msg.width && msg.height && (current.size?.width !== msg.width || current.size?.height !== msg.height)) {
        current.size = { width: msg.width, height: msg.height };
        if (current.state && current.state.hand !== "user") render(current.state);
      }
    } else if (msg.type === "state") {
      render(msg.state);
    } else if (msg.type === "closed") {
      showClosed();
    }
  });
  ws.addEventListener("close", (event) => {
    if (!current || current.ws !== ws) return;
    current.ws = null;
    // The browser closed (4004): said. Anything else: the page lost its socket, it comes back.
    if (event.code === 4004) showClosed();
    else if (current.state) current.retry = setTimeout(() => current && !current.ws && void connect(current.path, true), 2000);
  });
}

function closeSocket() {
  if (!current) return;
  clearTimeout(current.retry);
  clearInterval(current.fpsTimer);
  const ws = current.ws;
  current.ws = null;
  try {
    ws?.close();
  } catch {}
}

async function connect(path, again = false) {
  const { agentId, computerId } = parsePath(path);
  if (!again) {
    disconnect();
    const open = status?.open?.find((b) => b.agentId === agentId && (b.computer?.id ?? null) === computerId);
    current = { path, agentId, computerId, computerName: open?.computer?.name ?? null, ws: null, state: null, frames: 0, fps: 0, size: null };
    el("brw-img").removeAttribute("src");
    core.renderAgentAvatar?.(el("brw-avatar"), agentId);
    current.fpsTimer = setInterval(() => {
      if (!current) return;
      current.fps = current.frames;
      current.frames = 0;
      if (current.state && current.state.hand !== "user") el("brw-foot-text").textContent = `${t("plugin.browser.live")} · ${size().width} × ${size().height}${current.fps ? ` · ${t("plugin.browser.fps", { n: current.fps })}` : ""}`;
    }, 1000);
  }
  try {
    const data = await api(`/api/browser/${encodeURIComponent(agentId)}${query()}`);
    if (!current || current.path !== path) return;
    render(data.state);
    openSocket();
  } catch {
    if (current && current.path === path) showClosed();
  }
}

function disconnect() {
  closeSocket();
  current = null;
}

/* ---- The hand, and what the user does with it --------------------------- */

const send = (message) => {
  const ws = current?.ws;
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
};

async function setHand(hand) {
  if (!current) return;
  try {
    await api(`/api/browser/${encodeURIComponent(current.agentId)}/hand${query()}`, { method: "POST", body: JSON.stringify({ hand }) });
    if (hand === "user") {
      toast(t("plugin.browser.hand.taken"));
      el("brw-keys").focus({ preventScroll: true });
    } else toast(t("plugin.browser.hand.given", { agent: agentName(current.agentId) }));
  } catch (err) {
    toast(t("plugin.browser.error", { error: err.message }), "ko");
  }
}

/** The user's gesture on the frame, in the pixels of the page. */
function pagePoint(event) {
  const img = el("brw-img");
  const rect = img.getBoundingClientRect();
  const scale = rect.width ? size().width / rect.width : 1;
  return { x: Math.round((event.clientX - rect.left) * scale), y: Math.round((event.clientY - rect.top) * scale) };
}

function modifiers(event) {
  return (event.altKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.metaKey ? 4 : 0) | (event.shiftKey ? 8 : 0);
}

/** Windows virtual key codes, for the keys the page listens to by code. */
const VK = { Enter: 13, Backspace: 8, Tab: 9, Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Delete: 46, Home: 36, End: 35, PageUp: 33, PageDown: 34, " ": 32, Shift: 16, Control: 17, Alt: 18, Meta: 91, Insert: 45 };
function virtualKey(event) {
  if (VK[event.key] !== undefined) return VK[event.key];
  if (/^F\d{1,2}$/.test(event.key)) return 111 + Number(event.key.slice(1));
  if (event.key.length === 1) {
    const c = event.key.toUpperCase().charCodeAt(0);
    if ((c >= 65 && c <= 90) || (c >= 48 && c <= 57)) return c;
  }
  return 0;
}

function bindInput() {
  const frame = el("brw-frame");
  const keys = el("brw-keys");
  const hasHand = () => current?.state?.hand === "user";
  let lastMove = 0;
  frame.addEventListener("pointerdown", (event) => {
    if (!hasHand() || event.target !== el("brw-img")) return;
    event.preventDefault();
    keys.focus({ preventScroll: true });
    const p = pagePoint(event);
    send({ type: "mouse", kind: "move", ...p, modifiers: modifiers(event) });
    send({ type: "mouse", kind: "down", ...p, button: event.button, clickCount: event.detail || 1, modifiers: modifiers(event) });
  });
  frame.addEventListener("pointerup", (event) => {
    if (!hasHand() || event.target !== el("brw-img")) return;
    event.preventDefault();
    send({ type: "mouse", kind: "up", ...pagePoint(event), button: event.button, clickCount: event.detail || 1, modifiers: modifiers(event) });
  });
  frame.addEventListener("pointermove", (event) => {
    if (!hasHand() || event.target !== el("brw-img")) return;
    const now = Date.now();
    if (now - lastMove < 30) return;
    lastMove = now;
    send({ type: "mouse", kind: "move", ...pagePoint(event), modifiers: modifiers(event) });
  });
  frame.addEventListener("contextmenu", (event) => {
    if (hasHand() && event.target === el("brw-img")) event.preventDefault();
  });
  frame.addEventListener(
    "wheel",
    (event) => {
      if (!hasHand() || event.target !== el("brw-img") || view().classList.contains("is-real")) return;
      event.preventDefault();
      send({ type: "wheel", ...pagePoint(event), dx: Math.round(event.deltaX), dy: Math.round(event.deltaY), modifiers: modifiers(event) });
    },
    { passive: false }
  );
  // The keyboard: special keys as key events, the characters as text (the
  // textarea takes them, so a phone's keyboard and the dead keys work too).
  keys.addEventListener("keydown", (event) => {
    if (!hasHand()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      void setHand("agent");
      return;
    }
    const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (printable) return;
    event.preventDefault();
    send({ type: "key", kind: "down", key: event.key, code: event.code, vk: virtualKey(event), modifiers: modifiers(event), text: event.key.length === 1 ? event.key : "" });
  });
  keys.addEventListener("keyup", (event) => {
    if (!hasHand()) return;
    const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (printable) return;
    send({ type: "key", kind: "up", key: event.key, code: event.code, vk: virtualKey(event), modifiers: modifiers(event) });
  });
  keys.addEventListener("input", () => {
    if (!hasHand()) {
      keys.value = "";
      return;
    }
    const text = keys.value;
    keys.value = "";
    if (text) send({ type: "text", text });
  });
  keys.addEventListener("paste", (event) => {
    if (!hasHand()) return;
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") ?? "";
    if (text) send({ type: "text", text });
  });
}

/* ---- The bar: address, navigation, tabs, menu --------------------------- */

async function userRequest(path, body) {
  if (!current) return;
  try {
    const data = await api(`/api/browser/${encodeURIComponent(current.agentId)}/${path}${query()}`, { method: "POST", body: JSON.stringify(body) });
    if (data?.state) render(data.state);
  } catch (err) {
    toast(t("plugin.browser.error", { error: err.message }), "ko");
  }
}

function bindBar() {
  el("brw-back").addEventListener("click", () => void userRequest("navigate", { action: "back" }));
  el("brw-forward").addEventListener("click", () => void userRequest("navigate", { action: "forward" }));
  el("brw-reload").addEventListener("click", () => void userRequest("navigate", { action: "reload" }));
  const url = el("brw-url-input");
  url.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || url.readOnly) return;
    event.preventDefault();
    const value = url.value.trim();
    if (value) void userRequest("navigate", { url: value });
    el("brw-keys").focus({ preventScroll: true });
  });
  url.addEventListener("focus", () => {
    if (!url.readOnly) url.select();
  });
  el("brw-tabs").addEventListener("click", (event) => {
    const state = current?.state;
    if (!state) return;
    const mine = state.hand === "user";
    const items = state.tabs.map((tab) => ({
      label: tab.title || tab.url || "—",
      active: tab.active,
      disabled: !mine,
      onClick: () => void userRequest("tabs", { action: "switch", index: tab.index }),
    }));
    if (mine) {
      items.push("sep", { label: t("plugin.browser.tabs.new"), iconHtml: iconSvg("plus"), onClick: () => void userRequest("tabs", { action: "new" }) });
      const active = state.tabs.find((tab) => tab.active);
      if (active && state.tabs.length > 1) items.push({ label: t("plugin.browser.tabs.close"), iconHtml: iconSvg("x"), danger: true, onClick: () => void userRequest("tabs", { action: "close", index: active.index }) });
    }
    core.menu(event.currentTarget, items, { choice: true });
  });
  el("brw-more").addEventListener("click", (event) => {
    const state = current?.state;
    const items = [
      { label: t("plugin.browser.menu.open"), iconHtml: iconSvg("arrow-square-out"), disabled: !state?.url, onClick: () => window.open(state.url, "_blank", "noopener") },
      { label: t("plugin.browser.menu.copy"), iconHtml: iconSvg("copy"), disabled: !state?.url, onClick: () => { void core.copyToClipboard?.(state.url); toast(t("plugin.browser.copied")); } },
      "sep",
      { label: t("plugin.browser.menu.close"), iconHtml: iconSvg("x"), danger: true, disabled: !state, onClick: () => current && void api(`/api/browser/${encodeURIComponent(current.agentId)}/close${query()}`, { method: "POST" }).catch((err) => toast(t("plugin.browser.error", { error: err.message }), "ko")) },
    ];
    core.menu(event.currentTarget, items);
  });
  el("brw-hand").addEventListener("click", () => void setHand(current?.state?.hand === "user" ? "agent" : "user"));
  el("brw-open").addEventListener("click", async () => {
    if (!current) return;
    el("brw-open").disabled = true;
    try {
      await api(`/api/browser/${encodeURIComponent(current.agentId)}/open${query()}`, { method: "POST" });
      await connect(current.path, true);
    } catch (err) {
      toast(t("plugin.browser.error", { error: err.message }), "ko");
    } finally {
      el("brw-open").disabled = false;
    }
  });
  el("brw-dialog-accept").addEventListener("click", () => void userRequest("dialog", { accept: true, text: el("brw-dialog-input").value }));
  el("brw-dialog-dismiss").addEventListener("click", () => void userRequest("dialog", { accept: false }));
  el("brw-capture").addEventListener("click", () => {
    const src = el("brw-img").getAttribute("src");
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `${(current?.state?.title || "page").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 60)}.jpg`;
    a.click();
  });
  el("brw-fit").addEventListener("click", () => setReal(false));
  el("brw-real").addEventListener("click", () => setReal(true));
}

function setReal(real) {
  view().classList.toggle("is-real", real);
  el("brw-fit").classList.toggle("is-on", !real);
  el("brw-real").classList.toggle("is-on", real);
}

/* ---- Tab, app, activity ------------------------------------------------- */

Allkin.registerTabKind(KIND, {
  panels: ["brw-view"],
  icon: TAB_ICON,
  byPath: true,
  label: (tab) => tab.name || agentName(parsePath(tab.path).agentId),
  meta: t("plugin.browser.tab"),
  tooltip: (tab) => t("plugin.browser.state.agent", { agent: tab.name || agentName(parsePath(tab.path).agentId) }),
  activate: (tab) => void connect(tab.path),
  leave: () => disconnect(),
  beforeClose: () => disconnect(),
});

/** The System window's entry: the browser of the agent shown, else the first open, else nothing. */
function openApp() {
  const open = status?.open ?? [];
  const mine = open.find((b) => b.agentId === core.state.currentAgentId && !b.computer) ?? open.find((b) => b.agentId === core.state.currentAgentId) ?? open[0];
  if (mine) openView(mine.agentId, mine.computer?.id);
  else if (core.state.currentAgentId) openView(core.state.currentAgentId);
  else toast(t("plugin.browser.none"));
}

Allkin.registerApp({
  key: "browser",
  get name() {
    return t("plugin.browser.app.name");
  },
  get meta() {
    return t("plugin.browser.app.meta");
  },
  icon: TAB_ICON,
  open: openApp,
});

Allkin.provide("browser", { open: openView });

/** A card that waits for the user keeps the conversation in front: the tab
 *  of the browser opens once it is answered (a minute at most). */
function autoOpen(agentId, tries = 0) {
  const cardWaits = Boolean(document.querySelector(".proposal-card:not(.resolved)"));
  if (!cardWaits) {
    openView(agentId);
    return;
  }
  if (tries < 60) setTimeout(() => autoOpen(agentId, tries + 1), 1000);
}

/* A browser opens for the agent whose conversation is shown: its tab opens
   by itself, once per opening — the point is to see what the agent does. An
   opening is an agent that was not in the list a moment ago (`known`): a
   change of state of a browser already open never moves the user. */
let known = new Set();
core.onActivity?.((msg) => {
  if (msg?.type !== "browsers_changed") return;
  status = msg.status ?? null;
  const now = new Set((status?.open ?? []).map(keyOf));
  for (const b of status?.open ?? []) {
    const key = `${keyOf(b)}@${b.openedAt}`;
    if (known.has(keyOf(b)) || autoOpened.has(key)) continue;
    autoOpened.add(key);
    // A PC's Chrome is on the user's own screen: its tab is not opened by itself.
    if (!b.computer && b.agentId === core.state.currentAgentId && !isPhone()) autoOpen(b.agentId);
  }
  known = now;
  if (current && !current.ws && !status?.open?.some((b) => keyOf(b) === current.path)) showClosed();
});

/* ---- Wiring ------------------------------------------------------------- */

fillIcons(el("brw-view"));
bindInput();
bindBar();
void api("/api/browser").then((data) => {
  status = data;
  known = new Set((data?.open ?? []).map(keyOf));
  for (const b of data?.open ?? []) autoOpened.add(`${keyOf(b)}@${b.openedAt}`);
}).catch(() => {});
})();
