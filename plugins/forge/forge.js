"use strict";
/* The Forge — the integration where Coder, Allkin's system agent, makes and
   modifies integrations, services and competences with the user. Style D
   « Aperçu d'abord » of Allkin's mockups, the owner's choice: the page of the
   integration fills the screen, drawn from Coder's workspace WITHOUT
   installing it (Allkin's workshop routes, /api/repos/<coder>/projects/…);
   the conversation with Coder floats over it — the one conversation of the
   page, lent by Allkin (core.borrowChat) and given back when the tab is
   left —; "Designate" names an element of the preview in the message. A
   service or a competence has nothing to show: the sheet of its manifest
   takes the place of the preview.

   A page of Allkin from 2026-10-29 to 2026-11-03, an integration since (the
   owner's decision): Allkin keeps only its workshop — the projects of a local
   repository, their check, the preview, the installed copy back, the bin —
   and this script does the rest with window.Allkin alone.

   What the Forge knows of a project lives in the shared folder, in the
   integration's own place (share/forge/): `<kind>-<id>.json`, written by this
   page — the wish, the starting point, the mode (new, or the modification of
   an installed copy), Coder's conversation —, and `<kind>-<id>.progress.json`,
   written by Coder itself as its first message asks: the step it is at
   (understand, plan, mockup, build, check, install), one line about it, the
   steps set aside. Nothing of the Forge goes in the project's files: the
   check ignores nothing, the installation copies everything. */
(() => {
  const Allkin = window.Allkin;
  const core = Allkin.core;
  const { t, tn } = Allkin;
  const el = core.el;

  /* Phosphor glyphs (MIT), light weight — the hammer also duotone (the tab
     shown). */
  const PH = {
    hammer: "M249.92,113.4,182.47,45.49a94.12,94.12,0,0,0-133,.06L35.68,59.78a6,6,0,0,0,8.63,8.35L58,54A82,82,0,0,1,78.55,39l49,49L30.09,185.4a14,14,0,0,0,0,19.81L50.78,225.9a14,14,0,0,0,19.8,0L168,128.46l33.42,33.42a14,14,0,0,0,19.8,0l28.68-28.69A14,14,0,0,0,249.92,113.4ZM62.1,217.41a2,2,0,0,1-2.83,0L38.58,196.72a2,2,0,0,1,0-2.83L108,124.46,131.51,148ZM163.76,115.73,140,139.49,116.48,116l23.76-23.76a6,6,0,0,0,0-8.49L90.54,34A82.07,82.07,0,0,1,174,54l45.62,45.93L188,131.49l-15.76-15.76A6,6,0,0,0,163.76,115.73Zm77.66,9-28.69,28.7a2,2,0,0,1-2.83,0L196.49,140l31.56-31.57,13.37,13.46A2,2,0,0,1,241.42,124.7Z",
    desktop: "M208,42H48A22,22,0,0,0,26,64V176a22,22,0,0,0,22,22h74v20H96a6,6,0,0,0,0,12h64a6,6,0,0,0,0-12H134V198h74a22,22,0,0,0,22-22V64A22,22,0,0,0,208,42ZM48,54H208a10,10,0,0,1,10,10v82H38V64A10,10,0,0,1,48,54ZM208,186H48a10,10,0,0,1-10-10V158H218v18A10,10,0,0,1,208,186Z",
    "device-mobile": "M176,18H80A22,22,0,0,0,58,40V216a22,22,0,0,0,22,22h96a22,22,0,0,0,22-22V40A22,22,0,0,0,176,18ZM70,62H186V194H70ZM80,30h96a10,10,0,0,1,10,10V50H70V40A10,10,0,0,1,80,30Zm96,196H80a10,10,0,0,1-10-10V206H186v10A10,10,0,0,1,176,226Z",
    sun: "M122,40V16a6,6,0,0,1,12,0V40a6,6,0,0,1-12,0Zm68,88a62,62,0,1,1-62-62A62.07,62.07,0,0,1,190,128Zm-12,0a50,50,0,1,0-50,50A50.06,50.06,0,0,0,178,128ZM59.76,68.24a6,6,0,1,0,8.48-8.48l-16-16a6,6,0,0,0-8.48,8.48Zm0,119.52-16,16a6,6,0,1,0,8.48,8.48l16-16a6,6,0,1,0-8.48-8.48ZM192,70a6,6,0,0,0,4.24-1.76l16-16a6,6,0,0,0-8.48-8.48l-16,16A6,6,0,0,0,192,70Zm4.24,117.76a6,6,0,0,0-8.48,8.48l16,16a6,6,0,0,0,8.48-8.48ZM46,128a6,6,0,0,0-6-6H16a6,6,0,0,0,0,12H40A6,6,0,0,0,46,128Zm82,82a6,6,0,0,0-6,6v24a6,6,0,0,0,12,0V216A6,6,0,0,0,128,210Zm112-88H216a6,6,0,0,0,0,12h24a6,6,0,0,0,0-12Z",
    moon: "M232.13,143.64a6,6,0,0,0-6-1.49A90.07,90.07,0,0,1,113.86,29.85a6,6,0,0,0-7.49-7.48A102.88,102.88,0,0,0,54.48,58.68,102,102,0,0,0,197.32,201.52a102.88,102.88,0,0,0,36.31-51.89A6,6,0,0,0,232.13,143.64Zm-42,48.29a90,90,0,0,1-126-126A90.9,90.9,0,0,1,99.65,37.66,102.06,102.06,0,0,0,218.34,156.35,90.9,90.9,0,0,1,190.1,191.93Z",
    "cursor-click": "M90,24V16a6,6,0,0,1,12,0v8a6,6,0,0,1-12,0ZM16,102h8a6,6,0,0,0,0-12H16a6,6,0,0,0,0,12ZM125.32,37.37a6,6,0,0,0,8.05-2.69l8-16a6,6,0,0,0-10.74-5.37l-8,16A6,6,0,0,0,125.32,37.37Zm-96,85.26-16,8a6,6,0,0,0,5.36,10.74l16-8a6,6,0,1,0-5.36-10.74ZM217.9,185.41a14,14,0,0,1,0,19.8L205.21,217.9a14,14,0,0,1-19.8,0L134.1,166.59a2,2,0,0,0-3.21.54l-17.75,46.24a2.44,2.44,0,0,0-.1.24A13.85,13.85,0,0,1,100.26,222c-.23,0-.45,0-.68,0A13.85,13.85,0,0,1,87,212.38L34.7,52.3A14,14,0,0,1,52.3,34.7L212.38,87A14,14,0,0,1,213.61,113l-.24.09-46.25,17.76a2,2,0,0,0-.53,3.21Zm-8.49,8.49L158.1,142.59h0a14,14,0,0,1,4.32-22.74l.24-.1L208.91,102a2,2,0,0,0-.26-3.61L48.58,46.11a2.33,2.33,0,0,0-.65-.11,2,2,0,0,0-1.82,2.58L98.38,208.65a1.84,1.84,0,0,0,1.77,1.35,1.81,1.81,0,0,0,1.84-1.09l17.76-46.25.1-.24a14,14,0,0,1,22.74-4.32l51.31,51.31a2,2,0,0,0,2.83,0l12.68-12.68A2,2,0,0,0,209.41,193.9Z",
    files: "M212.24,67.76l-40-40A6,6,0,0,0,168,26H88A14,14,0,0,0,74,40V58H56A14,14,0,0,0,42,72V216a14,14,0,0,0,14,14H168a14,14,0,0,0,14-14V198h18a14,14,0,0,0,14-14V72A6,6,0,0,0,212.24,67.76ZM170,216a2,2,0,0,1-2,2H56a2,2,0,0,1-2-2V72a2,2,0,0,1,2-2h77.51L170,106.49Zm32-32a2,2,0,0,1-2,2H182V104a6,6,0,0,0-1.76-4.24l-40-40A6,6,0,0,0,136,58H86V40a2,2,0,0,1,2-2h77.51L202,74.49Zm-60-32a6,6,0,0,1-6,6H88a6,6,0,0,1,0-12h48A6,6,0,0,1,142,152Zm0,32a6,6,0,0,1-6,6H88a6,6,0,0,1,0-12h48A6,6,0,0,1,142,184Z",
    "shield-check": "M208,42H48A14,14,0,0,0,34,56v56c0,51.94,25.12,83.4,46.2,100.64,22.73,18.6,45.27,24.89,46.22,25.15a6,6,0,0,0,3.16,0c.95-.26,23.49-6.55,46.22-25.15C196.88,195.4,222,163.94,222,112V56A14,14,0,0,0,208,42Zm2,70c0,37.76-13.94,68.39-41.44,91.06A131.17,131.17,0,0,1,128,225.72a130.94,130.94,0,0,1-40.56-22.66C59.94,180.39,46,149.76,46,112V56a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2ZM172.24,99.76a6,6,0,0,1,0,8.48l-56,56a6,6,0,0,1-8.48,0l-24-24a6,6,0,0,1,8.48-8.48L112,151.51l51.76-51.75A6,6,0,0,1,172.24,99.76Z",
    "arrow-square-out": "M222,104a6,6,0,0,1-12,0V54.49l-69.75,69.75a6,6,0,0,1-8.48-8.48L201.51,46H152a6,6,0,0,1,0-12h64a6,6,0,0,1,6,6Zm-38,26a6,6,0,0,0-6,6v72a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V80a2,2,0,0,1,2-2h72a6,6,0,0,0,0-12H48A14,14,0,0,0,34,80V208a14,14,0,0,0,14,14H176a14,14,0,0,0,14-14V136A6,6,0,0,0,184,130Z",
    "download-simple": "M222,144v64a6,6,0,0,1-6,6H40a6,6,0,0,1-6-6V144a6,6,0,0,1,12,0v58H210V144a6,6,0,0,1,12,0Zm-98.24,4.24a6,6,0,0,0,8.48,0l40-40a6,6,0,0,0-8.48-8.48L134,129.51V32a6,6,0,0,0-12,0v97.51L92.24,99.76a6,6,0,0,0-8.48,8.48Z",
    "dots-three": "M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128ZM60,118a10,10,0,1,0,10,10A10,10,0,0,0,60,118Zm136,0a10,10,0,1,0,10,10A10,10,0,0,0,196,118Z",
    "arrow-clockwise": "M238,56v48a6,6,0,0,1-6,6H184a6,6,0,0,1,0-12h32.55l-30.38-27.8c-.06-.06-.12-.13-.19-.19a82,82,0,1,0-1.7,117.65,6,6,0,0,1,8.24,8.73A93.46,93.46,0,0,1,128,222h-1.28A94,94,0,1,1,194.37,61.4L226,90.35V56a6,6,0,1,1,12,0Z",
    "caret-down": "M212.24,100.24l-80,80a6,6,0,0,1-8.48,0l-80-80a6,6,0,0,1,8.48-8.48L128,167.51l75.76-75.75a6,6,0,0,1,8.48,8.48Z",
    "caret-up": "M212.24,164.24a6,6,0,0,1-8.48,0L128,88.49,52.24,164.24a6,6,0,0,1-8.48-8.48l80-80a6,6,0,0,1,8.48,0l80,80A6,6,0,0,1,212.24,164.24Z",
    x: "M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z",
    "puzzle-piece": "M219.21,160.24a6,6,0,0,0-5.78-.35,22,22,0,1,1-11.05-41.83,22.15,22.15,0,0,1,11.05,2.06A6,6,0,0,0,222,114.7V72a14,14,0,0,0-14-14H169.48a35,35,0,0,0,.52-6,34.1,34.1,0,0,0-10.73-24.78,33.64,33.64,0,0,0-25.45-9.15A34,34,0,0,0,102.54,58H64A14,14,0,0,0,50,72v34.53a34,34,0,0,0-30.79,10.2,34,34,0,0,0,22.31,57.18,34.34,34.34,0,0,0,8.48-.44V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V165.31A6,6,0,0,0,219.21,160.24ZM210,208a2,2,0,0,1-2,2H64a2,2,0,0,1-2-2V165.31a6,6,0,0,0-6-6,5.92,5.92,0,0,0-2.57.58,22,22,0,0,1-31.38-18.46,22,22,0,0,1,31.38-21.31A6,6,0,0,0,62,114.7V72a2,2,0,0,1,2-2h46.69a6,6,0,0,0,5.42-8.57,22.25,22.25,0,0,1-2-11,22,22,0,1,1,41.83,11A6,6,0,0,0,161.3,70H208a2,2,0,0,1,2,2v34.54a34,34,0,0,0-39.93,31.28,33.71,33.71,0,0,0,9.14,25.45A34.15,34.15,0,0,0,210,173.48Z",
    plug: "M236.24,67.76a6,6,0,0,0-8.48,0L192,103.51,152.49,64l35.75-35.76a6,6,0,0,0-8.48-8.48L144,55.51,116.24,27.76a6,6,0,1,0-8.48,8.48L115.51,44,61.13,98.38a38,38,0,0,0,0,53.75l17.13,17.12-50.5,50.51a6,6,0,1,0,8.48,8.48l50.51-50.5,17.13,17.13a38,38,0,0,0,53.74,0L212,140.49l7.76,7.75a6,6,0,0,0,8.48-8.48L200.49,112l35.75-35.76A6,6,0,0,0,236.24,67.76ZM149.13,186.38a26,26,0,0,1-36.77,0L69.62,143.64a26,26,0,0,1,0-36.77L124,52.49,203.51,132Z",
    "graduation-cap": "M250.82,90.71l-120-64a5.94,5.94,0,0,0-5.64,0l-120,64a6,6,0,0,0,0,10.58L34,116.67v49.62a14,14,0,0,0,3.55,9.32C50.42,189.94,79.29,214,128,214a127.21,127.21,0,0,0,50-9.73V240a6,6,0,0,0,12,0V198.35a113.18,113.18,0,0,0,28.45-22.75,13.91,13.91,0,0,0,3.55-9.31V116.67l28.82-15.38a6,6,0,0,0,0-10.58ZM128,202c-44,0-70-21.56-81.52-34.41a2,2,0,0,1-.48-1.3V123.07l79.18,42.22a6,6,0,0,0,5.64,0L178,140.13v51C165,197.35,148.45,202,128,202Zm82-35.71a2,2,0,0,1-.48,1.3A100.25,100.25,0,0,1,190,184.3V133.73l20-10.66Zm-22.15-45a6.27,6.27,0,0,0-1-.71l-56-29.86a6,6,0,0,0-5.64,10.58L175.25,128,128,153.2,20.75,96,128,38.8,235.25,96Z",
    "book-open": "M232,50H160a38,38,0,0,0-32,17.55A38,38,0,0,0,96,50H24a6,6,0,0,0-6,6V200a6,6,0,0,0,6,6H96a26,26,0,0,1,26,26,6,6,0,0,0,12,0,26,26,0,0,1,26-26h72a6,6,0,0,0,6-6V56A6,6,0,0,0,232,50ZM96,194H30V62H96a26,26,0,0,1,26,26V204.31A37.86,37.86,0,0,0,96,194Zm130,0H160a37.87,37.87,0,0,0-26,10.32V88a26,26,0,0,1,26-26h66Z",
    "app-window": "M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42Zm2,158a2,2,0,0,1-2,2H40a2,2,0,0,1-2-2V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2ZM78,84A10,10,0,1,1,68,74,10,10,0,0,1,78,84Zm40,0a10,10,0,1,1-10-10A10,10,0,0,1,118,84Z",
    robot: "M200,50H134V16a6,6,0,0,0-12,0V50H56A30,30,0,0,0,26,80V192a30,30,0,0,0,30,30H200a30,30,0,0,0,30-30V80A30,30,0,0,0,200,50Zm18,142a18,18,0,0,1-18,18H56a18,18,0,0,1-18-18V80A18,18,0,0,1,56,62H200a18,18,0,0,1,18,18ZM74,108a10,10,0,1,1,10,10A10,10,0,0,1,74,108Zm88,0a10,10,0,1,1,10,10A10,10,0,0,1,162,108Zm2,30H92a26,26,0,0,0,0,52h72a26,26,0,0,0,0-52Zm-22,12v28H114V150ZM78,164a14,14,0,0,1,14-14h10v28H92A14,14,0,0,1,78,164Zm86,14H154V150h10a14,14,0,0,1,0,28Z",
    "file-code": "M180.24,147.76a6,6,0,0,1,0,8.48l-24,24a6,6,0,0,1-8.48-8.48L167.51,152l-19.75-19.76a6,6,0,1,1,8.48-8.48Zm-72-24a6,6,0,0,0-8.48,0l-24,24a6,6,0,0,0,0,8.48l24,24a6,6,0,1,0,8.48-8.48L88.49,152l19.75-19.76A6,6,0,0,0,108.24,123.76ZM214,88V216a14,14,0,0,1-14,14H56a14,14,0,0,1-14-14V40A14,14,0,0,1,56,26h96a6,6,0,0,1,4.25,1.76l56,56A6,6,0,0,1,214,88Zm-56-6h35.52L158,46.48Zm44,134V94H152a6,6,0,0,1-6-6V38H56a2,2,0,0,0-2,2V216a2,2,0,0,0,2,2H200A2,2,0,0,0,202,216Z",
    "file-text": "M212.24,83.76l-56-56A6,6,0,0,0,152,26H56A14,14,0,0,0,42,40V216a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V88A6,6,0,0,0,212.24,83.76ZM158,46.48,193.52,82H158ZM200,218H56a2,2,0,0,1-2-2V40a2,2,0,0,1,2-2h90V88a6,6,0,0,0,6,6h50V216A2,2,0,0,1,200,218Zm-34-82a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,136Zm0,32a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,168Z",
    check: "M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z",
    minus: "M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128Z",
    "folder-simple": "M216,74H130L101.73,52.8a14,14,0,0,0-8.4-2.8H40A14,14,0,0,0,26,64V200a14,14,0,0,0,14,14H216.89A13.12,13.12,0,0,0,230,200.89V88A14,14,0,0,0,216,74Zm2,126.89a1.11,1.11,0,0,1-1.11,1.11H40a2,2,0,0,1-2-2V64a2,2,0,0,1,2-2H93.33a2,2,0,0,1,1.2.4L124.4,84.8A6,6,0,0,0,128,86h88a2,2,0,0,1,2,2Z",
    "chat-circle": "M128,26A102,102,0,0,0,38.35,176.69L26.73,211.56a14,14,0,0,0,17.71,17.71l34.87-11.62A102,102,0,1,0,128,26Zm0,192a90,90,0,0,1-45.06-12.08,6.09,6.09,0,0,0-3-.81,6.2,6.2,0,0,0-1.9.31L40.65,217.88a2,2,0,0,1-2.53-2.53L50.58,178a6,6,0,0,0-.5-4.91A90,90,0,1,1,128,218Z",
    "warning-circle": "M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Zm-6-82V80a6,6,0,0,1,12,0v56a6,6,0,0,1-12,0Zm16,36a10,10,0,1,1-10-10A10,10,0,0,1,138,172Z",
    "magnifying-glass": "M228.24,219.76l-51.38-51.38a86.15,86.15,0,1,0-8.48,8.48l51.38,51.38a6,6,0,0,0,8.48-8.48ZM38,112a74,74,0,1,1,74,74A74.09,74.09,0,0,1,38,112Z",
    "list-checks": "M222,128a6,6,0,0,1-6,6H128a6,6,0,0,1,0-12h88A6,6,0,0,1,222,128ZM128,70h88a6,6,0,0,0,0-12H128a6,6,0,0,0,0,12Zm88,116H128a6,6,0,0,0,0,12h88a6,6,0,0,0,0-12ZM83.76,43.76,56,71.51,44.24,59.76a6,6,0,0,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Zm0,64L56,135.51,44.24,123.76a6,6,0,1,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Zm0,64L56,199.51,44.24,187.76a6,6,0,0,0-8.48,8.48l16,16a6,6,0,0,0,8.48,0l32-32a6,6,0,0,0-8.48-8.48Z",
    file: "M212.24,83.76l-56-56A6,6,0,0,0,152,26H56A14,14,0,0,0,42,40V216a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V88A6,6,0,0,0,212.24,83.76ZM158,46.48,193.52,82H158ZM200,218H56a2,2,0,0,1-2-2V40a2,2,0,0,1,2-2h90V88a6,6,0,0,0,6,6h50V216A2,2,0,0,1,200,218Z",
  };
  const PH_HAMMER_DUO = [
    "M245.66,129,217,157.66a8,8,0,0,1-11.3,0L168.1,120l-28,28-32-32,28-28L80,31.78a87.81,87.81,0,0,1,98.31,18l67.35,67.89A8,8,0,0,1,245.66,129Z",
    "M251.34,112,183.88,44.08a96.1,96.1,0,0,0-135.77,0l-.09.09L34.25,58.4A8,8,0,0,0,45.74,69.53L59.47,55.35a79.92,79.92,0,0,1,18.71-13.9L124.68,88l-96,96a16,16,0,0,0,0,22.63l20.69,20.69a16,16,0,0,0,22.63,0l96-96,14.34,14.34h0L200,163.3a16,16,0,0,0,22.63,0l28.69-28.69A16,16,0,0,0,251.34,112ZM60.68,216,40,195.31l68-68L128.68,148ZM162.34,114.32,140,136.67,119.31,116l22.35-22.35a8,8,0,0,0,0-11.32L94.32,35a80,80,0,0,1,78.23,20.41l44.22,44.51L188,128.66l-14.34-14.34A8,8,0,0,0,162.34,114.32Zm49,37.66-12-12L228,111.25l12,12Z",
  ];

  const FORGE_KIND = "forge";
  /** Coder, Allkin's system agent: its workspace is the repository the Forge works in. */
  const FORGE_AGENT = "coder";
  const FORGE_START_PATH = "start";
  const FORGE_WISH_MAX = 2000;
  const FORGE_DEVICE_KEY = "allkin.forge.device";
  /** The Forge's place in the shared folder (the standard: share/<plugin id>/). */
  const FORGE_SHARE = "forge";
  /** The six steps of Coder's method, in order. */
  const FORGE_STEPS = ["understand", "plan", "mockup", "build", "check", "install"];
  const FORGE_STARTS = ["software", "api", "api-docs", "page", "agent", "file"];
  const START_GLYPHS = { software: "desktop", api: "plug", "api-docs": "book-open", page: "app-window", agent: "robot", file: "files" };
  const KIND_GLYPHS = { plugin: "puzzle-piece", service: "plug", skill: "graduation-cap" };
  const KIND_FOLDERS = { plugin: "plugins", service: "services", skill: "skills" };
  /** The tools whose end means Coder wrote something: the preview and the check are read again. */
  const WRITE_TOOLS = /(^|__)(Write|Edit|MultiEdit|NotebookEdit|write_file|edit_file|delete_data_file)$/;

  /* The kinds of project and the files wear Allkin's object icons (style B,
     2026-11-04) when the core draws them; the other glyphs are actions. */
  const KIND_OBJECTS = { plugin: ["puzzle", "blue"], service: ["plug", "orange"], skill: ["cap", "pink"] };
  function kindIcon(kind) {
    return core.objectIcon && KIND_OBJECTS[kind] ? core.objectIcon(...KIND_OBJECTS[kind]) : glyph(KIND_GLYPHS[kind]);
  }
  function fileIcon(path) {
    if (core.objectIcon) return /\.md$/i.test(path) ? core.objectIcon("page", "slate") : /\.(json|js|mjs|css|html|ts)$/i.test(path) ? core.objectIcon("code", "indigo") : core.objectIcon("page", "blue");
    return glyph(/\.md$/i.test(path) ? "file-text" : /\.(json|js|mjs|css|html|ts)$/i.test(path) ? "file-code" : "file");
  }

  function glyph(name, cls = "icon") {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g transform="scale(0.09375)" fill="currentColor" stroke="none"><path d="${PH[name]}"/></g></svg>`;
  }

  /** The tab's icon: the hammer, light at rest, duotone when the tab is shown. */
  const FORGE_ICON =
    `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">` +
    `<g class="ph-light" transform="scale(0.09375)" fill="currentColor" stroke="none"><path d="${PH.hammer}"/></g>` +
    `<g class="ph-duo" transform="scale(0.09375)" fill="currentColor" stroke="none"><path d="${PH_HAMMER_DUO[0]}" opacity="0.2"/><path d="${PH_HAMMER_DUO[1]}"/></g></svg>`;

  const forge = {
    /** The project shown: { kind, id, detail }, or null on the start screen. */
    project: null,
    loading: null,
    device: "pc",
    /** The preview's theme: null follows the page. */
    theme: null,
    designating: false,
    about: null,
    aboutPrefix: "",
    previewUrl: null,
    previewKind: null,
    chatSessionId: null,
    floatCollapsed: false,
    refreshTimer: null,
    /** The start screen: what is being filled in. */
    start: { mode: "new", kind: "plugin", start: null, software: "", url: "", target: null, wish: { new: "", modify: "" } },
    projects: [],
    /** Coder's repository, once known (GET /api/repos: the one Coder brings). */
    repoId: null,
  };

  try {
    if (localStorage.getItem(FORGE_DEVICE_KEY) === "tel") forge.device = "tel";
  } catch {
    // Storage unavailable: the computer's preview.
  }

  const appName = () => t("plugin.forge.app.name");

  /* ---- Where it is reached from ------------------------------------------------ */

  /** The Forge: its start screen, on a new project of `kind` or on the
   *  modification of a project (`{ mode: "modify", kind, id }`). */
  function openForgeView(opts = {}) {
    const tab = core.openTab(null, FORGE_KIND, { path: FORGE_START_PATH, name: appName() });
    if (opts.mode) forge.start.mode = opts.mode === "modify" ? "modify" : "new";
    if (opts.kind) forge.start.kind = opts.kind;
    if (opts.mode === "modify" && opts.kind && opts.id) forge.start.target = { kind: opts.kind, id: opts.id };
    renderForge(tab);
  }

  /** A project of the Forge, in its own tab. */
  function openForgeProject(kind, id, name = "") {
    core.openTab(null, FORGE_KIND, { path: `${kind}/${id}`, name: name || id });
  }

  /** "Modify in the Forge" for a row of the Integrations or Services pages:
   *  only for what Coder's workspace holds. */
  function modifyMenuItem(kind, id, source) {
    if (!source || !forge.repoId || source !== forge.repoId) return null;
    return { label: t("plugin.forge.modifyInForge"), iconHtml: glyph("hammer"), onClick: () => openForgeView({ mode: "modify", kind, id }) };
  }

  /* ---- Coder, its repository, the Forge's files --------------------------------- */

  function coderAgent() {
    return (core.state.agents ?? []).find((a) => a.id === FORGE_AGENT) ?? null;
  }

  /** Coder's repository: the one it brings to the list (its workspace). */
  async function forgeRepoId() {
    if (forge.repoId) return forge.repoId;
    const data = await core.api("/api/repos");
    const repo = (data.repos ?? []).find((r) => r.plugin === FORGE_AGENT && r.local && !r.missing);
    if (!repo) {
      const err = new Error(t("plugin.forge.repoMissing"));
      err.code = "forge-repo-missing";
      throw err;
    }
    forge.repoId = repo.id;
    return repo.id;
  }

  const projectsUrl = (repoId) => `/api/repos/${encodeURIComponent(repoId)}/projects`;
  const projectUrl = (repoId, kind, id) => `${projectsUrl(repoId)}/${kind}/${encodeURIComponent(id)}`;
  const stateFile = (kind, id) => `${FORGE_SHARE}/${kind}-${id}.json`;
  const progressFile = (kind, id) => `${FORGE_SHARE}/${kind}-${id}.progress.json`;

  async function readJsonFile(path) {
    try {
      const text = await core.share.read(path);
      const value = JSON.parse(text);
      return value && typeof value === "object" ? value : null;
    } catch {
      return null;
    }
  }

  /** The page's own file on a project: the wish, the start, the mode, the conversation. */
  async function readForgeState(kind, id) {
    const raw = await readJsonFile(stateFile(kind, id));
    if (!raw || typeof raw.wish !== "string") return null;
    return {
      version: 2,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
      mode: raw.mode === "modify" ? "modify" : "new",
      wish: raw.wish,
      ...(raw.start && typeof raw.start === "object" ? { start: raw.start } : {}),
      ...(typeof raw.sessionId === "string" ? { sessionId: raw.sessionId } : {}),
      ...(typeof raw.modifyingFrom === "string" ? { modifyingFrom: raw.modifyingFrom } : {}),
    };
  }

  async function writeForgeState(kind, id, state) {
    const now = new Date().toISOString();
    const value = { version: 2, kind, id, ...state, createdAt: state.createdAt || now, updatedAt: now };
    try {
      await core.share.write(stateFile(kind, id), JSON.stringify(value, null, 2) + "\n");
    } catch (err) {
      core.toast(t("plugin.forge.state.saveFailed", { message: err.message }), "ko");
    }
    return value;
  }

  /** What Coder wrote of its progress: the step, one line, the steps set aside. */
  async function readProgress(kind, id) {
    const raw = await readJsonFile(progressFile(kind, id));
    if (!raw) return null;
    return {
      step: FORGE_STEPS.includes(raw.step) ? raw.step : "understand",
      summary: typeof raw.summary === "string" ? raw.summary.trim().slice(0, 200) : "",
      skipped: Array.isArray(raw.skipped) ? raw.skipped.filter((s) => FORGE_STEPS.includes(s)) : [],
    };
  }

  async function writeProgress(kind, id, progress) {
    try {
      await core.share.write(progressFile(kind, id), JSON.stringify(progress, null, 2) + "\n");
    } catch {
      // Coder will write it at its next step.
    }
  }

  async function removeForgeFiles(kind, id) {
    for (const path of [stateFile(kind, id), progressFile(kind, id)]) {
      try {
        await core.share.remove(path);
      } catch {
        // Not there: nothing to remove.
      }
    }
  }

  /** The steps as the page draws them: every one before the current is done
   *  unless set aside, the current one is "now", the rest to come. */
  function stepsOf(progress) {
    if (!progress) return null;
    const skipped = new Set(progress.skipped);
    const index = FORGE_STEPS.indexOf(progress.step);
    const steps = {};
    FORGE_STEPS.forEach((step, i) => {
      steps[step] = { state: skipped.has(step) ? "skipped" : i < index ? "done" : i === index ? "now" : "todo" };
    });
    if (progress.summary) steps[progress.step].summary = progress.summary;
    return steps;
  }

  /** "Install" reached and the project installed at its version: every step is done. */
  function stepsAllDone(detail) {
    const p = detail.project;
    return detail.progress?.step === "install" && Boolean(p.installedVersion) && (!p.version || p.version === p.installedVersion);
  }

  /** The status of Coder's session that carries the project: active, closed, or null. */
  async function sessionStatus(sessionId) {
    if (!sessionId) return null;
    try {
      const data = await core.api(`/api/agents/${FORGE_AGENT}/sessions`);
      return (data.sessions ?? []).find((s) => s.id === sessionId)?.status ?? null;
    } catch {
      return null;
    }
  }

  /**
   * The first message of a project's conversation, for Coder: the user's wish
   * as typed, then — for the model, in English — what the Forge knows and how
   * Coder reports its steps. Text written for a model: not translated.
   */
  function firstMessage(project, state) {
    const kindText = project.kind === "plugin" ? "plugin (an integration, for the user)" : project.kind === "service" ? "service" : "skill (a competence, for the user)";
    const folder = `${KIND_FOLDERS[project.kind]}/${project.id}`;
    const lines = [state.wish, "", "---", ""];
    if (state.mode === "modify") {
      lines.push(
        `Forge: modification of the ${kindText} \`${project.id}\` ("${project.name}"), in \`${folder}\` of your workspace` +
          (state.modifyingFrom ? `, installed in version ${state.modifyingFrom}, which keeps running until the user updates it.` : "."),
        "Keep its id, the keys of its settings and the shape of its data; say any migration in your plan. Bump N once the change is done.",
      );
    } else {
      lines.push(`Forge: new ${kindText} \`${project.id}\` ("${project.name}"), created as a skeleton in \`${folder}\` of your workspace. Fill it in; do not create another project for this request.`);
    }
    const start = state.start;
    if (start) {
      const what = { software: "a third-party software", api: "an API to connect", "api-docs": "the documentation of an API", page: "a page that shows something", agent: "an agent that does something", file: "a file given as an example" }[start.kind];
      lines.push(`Starting point: ${what}${start.name ? ` — ${start.name}` : ""}${start.url ? ` — ${start.url}` : ""}.`);
      if (start.kind === "software") {
        lines.push(
          "A third-party software: first find out whether it is already on this machine (ask the user for its address and version; you have no shell). If it is not, its installation is a part of your plan — the method, the port, the data folder —, done by the user, or by Master command by command; never by the plugin. The integration then brings: a page (its interface in a tab when the software allows a frame, otherwise a page made from its API), a service for its API with the credentials kept in the service, never in a file of the project, and a skill that says how to use it.",
        );
      }
    }
    lines.push(
      `Report the step you are at by writing the file \`${progressFile(project.kind, project.id)}\` in the shared folder (the folder your rules call shared; create its \`${FORGE_SHARE}/\` folder if it is missing), as JSON on one object: {"step": "understand" | "plan" | "mockup" | "build" | "check" | "install", "summary": "one line on what this step holds, for the user", "skipped": ["mockup"]} — \`skipped\` lists the steps set aside because they have no object (the mockup of a service, say). Write it each time you move on, starting now with "understand"; "install" means the project is ready for the user to install or update. The user looks at the mockup of a page in the Forge's preview, without installing it, and installs or updates from the Forge.`,
    );
    return lines.join("\n");
  }

  /** A fresh conversation of Coder, carrying the project: its first message is the wish. */
  async function openConversation(project, state) {
    const coder = coderAgent();
    if (!coder || coder.disabled) {
      const err = new Error(t("plugin.forge.coderMissing"));
      err.code = "forge-coder-missing";
      throw err;
    }
    const result = await core.api(`/api/agents/${FORGE_AGENT}/message`, {
      method: "POST",
      body: JSON.stringify({ text: firstMessage(project, state), newSession: true }),
    });
    await writeForgeState(project.kind, project.id, { ...state, sessionId: result.sessionId });
    return result.sessionId;
  }

  /* ---- Drawing --------------------------------------------------------------- */

  function button({ label = "", icon = "", cls = "secondary", title = "", id = "" } = {}) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    if (id) b.id = id;
    if (icon) b.insertAdjacentHTML("beforeend", glyph(icon));
    if (label) {
      const span = document.createElement("span");
      span.className = "page-bar-label";
      span.textContent = label;
      b.appendChild(span);
    }
    if (title || (!label && icon)) {
      b.title = title || label;
      b.setAttribute("aria-label", title || label);
    }
    return b;
  }

  function seg(options, current, onPick) {
    const group = document.createElement("div");
    group.className = "seg-switch";
    group.setAttribute("role", "group");
    for (const opt of options) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `seg-switch-btn${opt.value === current ? " active" : ""}`;
      b.setAttribute("aria-pressed", String(opt.value === current));
      if (opt.icon) b.insertAdjacentHTML("beforeend", glyph(opt.icon));
      if (opt.label) {
        const span = document.createElement("span");
        span.textContent = opt.label;
        b.appendChild(span);
      }
      if (opt.title) {
        b.title = opt.title;
        b.setAttribute("aria-label", opt.title);
      }
      b.addEventListener("click", () => {
        for (const other of group.querySelectorAll(".seg-switch-btn")) {
          other.classList.toggle("active", other === b);
          other.setAttribute("aria-pressed", String(other === b));
        }
        onPick(opt.value);
      });
      group.appendChild(b);
    }
    return group;
  }

  const kindLabel = (kind) => t(`plugin.forge.kind.${kind}`);

  function renderForge(tab) {
    const view = el("forge-view");
    if (tab.path === FORGE_START_PATH) {
      unmountChat();
      forge.project = null;
      renderStart(view);
      return;
    }
    const [kind, id] = String(tab.path).split("/");
    if (forge.project?.kind === kind && forge.project?.id === id && view.dataset.project === tab.path) {
      // Back on the tab: the conversation returns to its panel.
      mountChat(forge.project.detail?.state?.sessionId ?? null, forge.project.detail?.session ?? null);
      return;
    }
    // Another project: the conversation's panels go back to their place
    // before the view is emptied, or they would go with it.
    unmountChat();
    forge.project = { kind, id, detail: null };
    forge.about = null;
    forge.designating = false;
    view.dataset.project = tab.path;
    view.innerHTML = "";
    view.appendChild(loadingNode());
    void loadProject(kind, id, tab);
  }

  function loadingNode() {
    const p = document.createElement("p");
    p.className = "dim forge-loading";
    p.textContent = t("plugin.forge.loading");
    return p;
  }

  function leave() {
    unmountChat();
    setDesignating(false);
  }

  /* ---- The start screen ------------------------------------------------------ */

  /** Every project of Coder's workspace, with the Forge's file when it has one
   *  (a project made outside the Forge has none, and still opens in it). */
  async function loadProjects() {
    try {
      const repoId = await forgeRepoId();
      const data = await core.api(projectsUrl(repoId));
      const projects = data.projects ?? [];
      let known = new Set();
      try {
        known = new Set((await core.share.list(FORGE_SHARE)).filter((e) => e.type === "file").map((e) => e.name));
      } catch {
        // No file of the Forge yet.
      }
      await Promise.all(
        projects.map(async (p) => {
          p.forge = known.has(`${p.kind}-${p.id}.json`) ? await readForgeState(p.kind, p.id) : null;
        }),
      );
      forge.projects = projects;
    } catch (err) {
      forge.projects = [];
      if (err?.code === "forge-repo-missing") core.toast(err.message, "ko");
    }
    return forge.projects;
  }

  function projectsMenuItems(onPick) {
    const items = forge.projects.map((p) => ({
      label: p.name,
      meta: `${kindLabel(p.kind)}${p.version ? ` · ${p.version}` : ""}${p.installedVersion ? ` · ${t("plugin.forge.installedShort", { version: p.installedVersion })}` : ""}`,
      iconHtml: kindIcon(p.kind),
      search: `${p.name} ${p.id}`,
      onClick: () => onPick(p),
    }));
    if (!items.length) items.push({ note: { title: t("plugin.forge.projects.none"), text: t("plugin.forge.projects.noneText") } });
    return items;
  }

  function renderStart(view) {
    const s = forge.start;
    view.dataset.project = "";
    view.innerHTML = "";
    void loadProjects().then(() => {
      if (view.dataset.project === "" && s.mode === "modify") renderStart(view);
    });

    // The band: what the screen is, Nouveau | Modifier, the projects.
    const bar = document.createElement("div");
    bar.className = "page-bar forge-bar";
    const text = document.createElement("span");
    text.className = "forge-bar-text";
    text.innerHTML = `<span class="page-bar-text"></span><span class="page-bar-meta"></span>`;
    text.querySelector(".page-bar-text").textContent = s.mode === "modify" ? t("plugin.forge.start.modifyTitle") : t("plugin.forge.start.newTitle");
    text.querySelector(".page-bar-meta").textContent = s.mode === "modify" ? t("plugin.forge.start.modifyMeta") : t("plugin.forge.start.newMeta");
    const modes = seg(
      [
        { value: "new", label: t("plugin.forge.start.new") },
        { value: "modify", label: t("plugin.forge.start.modify") },
      ],
      s.mode,
      (mode) => {
        s.mode = mode;
        renderStart(view);
      },
    );
    modes.classList.add("forge-start-switch");
    const actions = document.createElement("div");
    actions.className = "page-bar-actions";
    const projectsBtn = button({ label: t("plugin.forge.projects"), icon: "list-checks" });
    projectsBtn.classList.add("forge-choice-btn", "forge-projects-btn");
    projectsBtn.addEventListener("click", () => core.menu(projectsBtn, projectsMenuItems((p) => openForgeProject(p.kind, p.id, p.name)), { choice: true, label: t("plugin.forge.projects") }));
    actions.appendChild(projectsBtn);
    bar.append(text, modes, actions);

    const scroll = document.createElement("div");
    scroll.className = "forge-scroll forge-start";
    // On a phone the band has no room for the double button: it heads the page.
    const phoneModes = modes.cloneNode(true);
    phoneModes.className = "seg-switch forge-start-switch-phone";
    phoneModes.querySelectorAll(".seg-switch-btn").forEach((b, i) =>
      b.addEventListener("click", () => {
        s.mode = i === 0 ? "new" : "modify";
        renderStart(view);
      }),
    );
    scroll.appendChild(phoneModes);
    const col = (titleText) => {
      const c = document.createElement("div");
      c.className = "forge-start-col";
      if (titleText) {
        const h = document.createElement("h4");
        h.textContent = titleText;
        c.appendChild(h);
      }
      return c;
    };

    const foot = document.createElement("div");
    foot.className = "page-foot forge-foot";
    const footMeta = document.createElement("span");
    footMeta.className = "page-foot-meta";
    const footActions = document.createElement("div");
    footActions.className = "page-foot-actions";
    const go = button({ label: t("plugin.forge.start.go"), icon: "hammer", cls: "page-foot-primary" });
    footActions.appendChild(go);
    foot.append(footMeta, footActions);

    // The wish: an edit zone, from edge to edge.
    const wishZone = document.createElement("div");
    wishZone.className = "forge-wish edit-zone";
    const wish = document.createElement("textarea");
    wish.className = "forge-wish-input";
    wish.maxLength = FORGE_WISH_MAX;
    wish.rows = 5;
    wish.setAttribute("aria-label", s.mode === "modify" ? t("plugin.forge.start.changeWhat") : t("plugin.forge.start.wish"));
    wish.value = s.wish[s.mode] ?? "";
    const count = document.createElement("span");
    count.className = "forge-wish-count";
    const updateCount = () => {
      count.textContent = `${wish.value.length.toLocaleString(Allkin.i18n.locale)} / ${FORGE_WISH_MAX.toLocaleString(Allkin.i18n.locale)}`;
    };
    wish.addEventListener("input", () => {
      s.wish[s.mode] = wish.value;
      updateCount();
      core.setFieldError(wish, "");
    });
    wishZone.append(wish, count);

    if (s.mode === "new") {
      const types = col(t("plugin.forge.start.what"));
      const grid = document.createElement("div");
      grid.className = "forge-types";
      grid.setAttribute("role", "radiogroup");
      for (const kind of ["plugin", "service", "skill"]) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = `forge-type${s.kind === kind ? " is-on" : ""}`;
        card.setAttribute("role", "radio");
        card.setAttribute("aria-checked", String(s.kind === kind));
        card.innerHTML = `${kindIcon(kind)}<b></b><span></span>`;
        card.querySelector("b").textContent = kindLabel(kind);
        card.querySelector("span").textContent = t(`plugin.forge.kind.${kind}.text`);
        card.addEventListener("click", () => {
          s.kind = kind;
          for (const other of grid.children) {
            other.classList.toggle("is-on", other === card);
            other.setAttribute("aria-checked", String(other === card));
          }
          wish.placeholder = t(`plugin.forge.start.placeholder.${kind}`);
          updateFoot();
        });
        grid.appendChild(card);
      }
      types.appendChild(grid);
      wish.placeholder = t(`plugin.forge.start.placeholder.${s.kind}`);

      // A starting point, optional: chips, one at most; the software and the
      // documentation of an API ask a word more.
      const starts = col("");
      const h = document.createElement("h4");
      h.innerHTML = `<span></span> <span class="dim forge-optional"></span>`;
      h.firstElementChild.textContent = t("plugin.forge.start.from");
      h.lastElementChild.textContent = t("plugin.forge.start.optional");
      starts.appendChild(h);
      const chips = document.createElement("div");
      chips.className = "forge-starts";
      const extra = document.createElement("div");
      extra.className = "forge-start-extra hidden";
      // The software card: what Coder will do with a third-party software.
      const softwareCard = document.createElement("div");
      softwareCard.className = "forge-soft";
      softwareCard.innerHTML = `<div class="forge-soft-head">${glyph("desktop")}<b></b><span class="dim"><span class="forge-soft-name"></span></span></div><ul class="forge-will"></ul>`;
      softwareCard.querySelector("b").textContent = t("plugin.forge.start.software.title");
      softwareCard.querySelector(".forge-soft-name").textContent = t("plugin.forge.start.software.unnamed");
      const will = softwareCard.querySelector(".forge-will");
      for (const [icon, key] of [
        ["magnifying-glass", "software.find"],
        ["app-window", "software.page"],
        ["plug", "software.service"],
        ["graduation-cap", "software.skill"],
      ]) {
        const li = document.createElement("li");
        li.innerHTML = `${glyph(icon)}<span></span>`;
        li.querySelector("span").innerHTML = t(`plugin.forge.start.${key}Html`);
        will.appendChild(li);
      }
      const renderExtra = () => {
        extra.innerHTML = "";
        extra.classList.toggle("hidden", !(s.start === "software" || s.start === "api" || s.start === "api-docs" || s.start === "file"));
        if (extra.classList.contains("hidden")) return;
        const row = document.createElement("label");
        row.className = "forge-extra-row";
        const label = document.createElement("span");
        label.className = "forge-extra-label";
        const input = document.createElement("input");
        input.type = s.start === "api-docs" ? "url" : "text";
        input.maxLength = s.start === "api-docs" ? 500 : 120;
        if (s.start === "api-docs") {
          label.textContent = t("plugin.forge.start.docUrl");
          input.placeholder = "https://…";
          input.value = s.url;
          input.addEventListener("input", () => {
            s.url = input.value;
          });
        } else {
          label.textContent = t(`plugin.forge.start.name.${s.start}`);
          input.placeholder = t(`plugin.forge.start.namePlaceholder.${s.start}`);
          input.value = s.software;
          input.addEventListener("input", () => {
            s.software = input.value;
            updateFoot();
            if (s.start === "software") softwareCard.querySelector(".forge-soft-name").textContent = s.software.trim() || t("plugin.forge.start.software.unnamed");
          });
        }
        row.append(label, input);
        extra.appendChild(row);
        if (s.start === "software") extra.appendChild(softwareCard);
      };
      for (const kind of FORGE_STARTS) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `forge-start-chip${s.start === kind ? " is-on" : ""}`;
        chip.setAttribute("aria-pressed", String(s.start === kind));
        chip.innerHTML = `${glyph(START_GLYPHS[kind])}<span></span>`;
        chip.querySelector("span").textContent = t(`plugin.forge.start.kind.${kind}`);
        chip.addEventListener("click", () => {
          s.start = s.start === kind ? null : kind;
          for (const other of chips.children) {
            other.classList.toggle("is-on", other.dataset.start === s.start);
            other.setAttribute("aria-pressed", String(other.dataset.start === s.start));
          }
          renderExtra();
          updateFoot();
        });
        chip.dataset.start = kind;
        chips.appendChild(chip);
      }
      const note = document.createElement("p");
      note.className = "dim forge-start-note";
      note.textContent = t("plugin.forge.start.note");
      starts.append(chips, extra, note);
      renderExtra();

      scroll.append(types, wishZone, starts);

      const updateFoot = () => {
        const base = s.start === "software" && s.software.trim() ? s.software : wish.value.split(/\n/)[0];
        footMeta.innerHTML = "";
        footMeta.append(`${kindLabel(s.kind)} · ${t("plugin.forge.start.idProposed")} `);
        const code = document.createElement("code");
        code.textContent = proposeId(base);
        footMeta.appendChild(code);
      };
      wish.addEventListener("input", updateFoot);
      updateFoot();

      go.addEventListener("click", async () => {
        const text = wish.value.trim();
        if (!text) {
          core.setFieldError(wish, t("plugin.forge.start.wishRequired"));
          wish.focus();
          return;
        }
        const base = s.start === "software" && s.software.trim() ? s.software.trim() : text.split(/\n/)[0];
        const name = proposeName(base);
        go.disabled = true;
        try {
          const start = s.start ? { kind: s.start, ...(s.start === "api-docs" ? { url: s.url.trim() } : s.software.trim() ? { name: s.software.trim() } : {}) } : undefined;
          // The skeleton (Allkin's workshop), the Forge's file, then Coder.
          const repoId = await forgeRepoId();
          const result = await core.api(projectsUrl(repoId), { method: "POST", body: JSON.stringify({ kind: s.kind, name }) });
          const project = result.project;
          const state = await writeForgeState(project.kind, project.id, { mode: "new", wish: text, ...(start ? { start } : {}) });
          await openConversation(project, state);
          s.wish.new = "";
          s.start = null;
          s.software = "";
          s.url = "";
          openProjectInTab(core.activeTab(), project.kind, project.id, project.name);
        } catch (err) {
          if (err?.code === "agents-paused" || err?.code === "forge-coder-missing" || err?.code === "agent-disabled" || err?.code === "forge-repo-missing") core.toast(err.message, "ko");
          else core.setFieldError(wish, err.message);
        } finally {
          go.disabled = false;
        }
      });
    } else {
      // Modify: a project of the Forge — nothing else — chosen, then what to change.
      const choose = col(t("plugin.forge.start.modifyWhat"));
      const row = document.createElement("div");
      row.className = "forge-chooser";
      const target = s.target ? forge.projects.find((p) => p.kind === s.target.kind && p.id === s.target.id) ?? null : null;
      const pick = button({ label: target ? target.name : t("plugin.forge.start.choose"), icon: "caret-down" });
      pick.classList.add("forge-choice-btn");
      pick.addEventListener("click", () =>
        core.menu(
          pick,
          projectsMenuItems((p) => {
            s.target = { kind: p.kind, id: p.id };
            renderStart(view);
          }),
          { choice: true, label: t("plugin.forge.start.modifyWhat") },
        ),
      );
      const hint = document.createElement("span");
      hint.className = "dim";
      hint.textContent = tn("plugin.forge.start.amongProjects", forge.projects.length) + " · " + t("plugin.forge.start.onlyForge");
      row.append(pick, hint);
      choose.appendChild(row);
      if (target) {
        const card = document.createElement("div");
        card.className = "forge-chosen";
        card.innerHTML = `<span class="forge-bigicon">${kindIcon(target.kind)}</span><div class="forge-chosen-id"><b></b><span class="dim"></span><dl></dl></div>`;
        card.querySelector("b").textContent = target.name;
        const parts = [];
        const code = document.createElement("code");
        code.textContent = target.id;
        parts.push(code, ` · ${kindLabel(target.kind)}`);
        if (target.version) parts.push(` · ${target.version}`);
        if (target.installedVersion) parts.push(` · ${t("plugin.forge.installedShort", { version: target.installedVersion })}`);
        if (target.forge?.createdAt) parts.push(` · ${t("plugin.forge.start.madeOn", { date: core.formatDateTime(target.forge.createdAt) })}`);
        card.querySelector(".dim").append(...parts);
        const dl = card.querySelector("dl");
        const add = (dt, dd) => {
          if (!dd) return;
          const a = document.createElement("dt");
          a.textContent = dt;
          const b = document.createElement("dd");
          b.textContent = dd;
          dl.append(a, b);
        };
        if (target.kind === "plugin") {
          const names = Object.entries(target.parts ?? {})
            .filter(([, on]) => on)
            .map(([part]) => t(`plugin.forge.part.${part}`));
          add(t("plugin.forge.fiche.parts"), names.join(" · "));
        }
        add(t("plugin.forge.fiche.check"), issuesText(target.errors, target.warnings));
        choose.appendChild(card);
      }
      wish.placeholder = t("plugin.forge.start.changePlaceholder");

      const willCol = col(t("plugin.forge.start.willHappen"));
      const will = document.createElement("ul");
      will.className = "forge-will";
      for (const [icon, key] of [
        ["list-checks", "will.plan"],
        ["arrow-clockwise", "will.keeps"],
        ["download-simple", "will.update"],
      ]) {
        const li = document.createElement("li");
        li.innerHTML = `${glyph(icon)}<span></span>`;
        li.querySelector("span").innerHTML = t(`plugin.forge.start.${key}Html`, { version: target?.installedVersion ? ` ${target.installedVersion}` : "" });
        will.appendChild(li);
      }
      willCol.appendChild(will);
      scroll.append(choose, wishZone, willCol);

      footMeta.textContent = target
        ? `${target.name}${target.installedVersion ? ` · ${t("plugin.forge.installedShort", { version: target.installedVersion })}` : ""}`
        : t("plugin.forge.start.chooseFirst");
      go.disabled = !target;
      go.addEventListener("click", async () => {
        const text = wish.value.trim();
        if (!text) {
          core.setFieldError(wish, t("plugin.forge.start.wishRequired"));
          wish.focus();
          return;
        }
        go.disabled = true;
        try {
          await startModification(target, text);
          s.wish.modify = "";
          s.target = null;
          openProjectInTab(core.activeTab(), target.kind, target.id, target.name);
        } catch (err) {
          if (err?.code === "agents-paused" || err?.code === "forge-coder-missing" || err?.code === "agent-disabled") core.toast(err.message, "ko");
          else core.setFieldError(wish, err.message);
        } finally {
          go.disabled = false;
        }
      });
    }

    updateCount();
    view.append(bar, scroll, foot);
    Allkin.i18n.apply(view);
  }

  /** The modification of a project the Forge made: the Forge's file again —
   *  the mode, the wish, the installed version noted —, Coder's steps from
   *  the start, a fresh conversation. */
  async function startModification(project, wish) {
    const previous = (await readForgeState(project.kind, project.id)) ?? {};
    const state = await writeForgeState(project.kind, project.id, {
      ...previous,
      mode: "modify",
      wish,
      ...(project.installedVersion ? { modifyingFrom: project.installedVersion } : {}),
    });
    delete state.sessionId;
    await writeProgress(project.kind, project.id, { step: "understand", summary: "", skipped: [] });
    return openConversation(project, state);
  }

  /** The start tab becomes the project's: same tab, its path and name changed. */
  function openProjectInTab(tab, kind, id, name) {
    if (!tab || tab.kind !== FORGE_KIND) {
      openForgeProject(kind, id, name);
      return;
    }
    tab.path = `${kind}/${id}`;
    tab.name = name;
    core.persistTabs();
    core.renderTabBar();
    renderForge(tab);
  }

  /** An identifier proposed from a name, the way the server does it. */
  function proposeId(name) {
    const slug = String(name ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48)
      .replace(/-+$/g, "");
    return slug || "project";
  }

  /** A name proposed from the first line of the wish: a few words. */
  function proposeName(line) {
    const words = String(line ?? "")
      .replace(/[«»"“”]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join(" ");
    const name = words.replace(/[.,;:!?]+$/, "").slice(0, 60);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : appName();
  }

  function issuesText(errors, warnings) {
    if (!errors && !warnings) return t("plugin.forge.check.clean");
    const parts = [];
    if (errors) parts.push(tn("plugin.forge.check.errors", errors));
    if (warnings) parts.push(tn("plugin.forge.check.warnings", warnings));
    return parts.join(" · ");
  }

  /* ---- The page of a project (style D) ------------------------------------------- */

  /** The whole of a project: Allkin's workshop (the project, its issues, its
   *  files, its manifest), then the Forge's own files and Coder's session. */
  async function fetchDetail(kind, id) {
    const repoId = await forgeRepoId();
    const detail = await core.api(projectUrl(repoId, kind, id));
    const [state, progress] = await Promise.all([readForgeState(kind, id), readProgress(kind, id)]);
    detail.state = state;
    detail.progress = progress;
    detail.session = await sessionStatus(state?.sessionId);
    return detail;
  }

  async function loadProject(kind, id, tab) {
    const token = (forge.loading = {});
    let detail;
    try {
      detail = await fetchDetail(kind, id);
    } catch (err) {
      if (forge.loading !== token) return;
      const view = el("forge-view");
      view.innerHTML = "";
      view.appendChild(
        core.emptyState({
          icon: "alert",
          title: t("plugin.forge.project.missing"),
          text: err.message,
          action: { label: appName(), onClick: () => openForgeView() },
        }),
      );
      return;
    }
    if (forge.loading !== token || forge.project?.id !== id) return;
    forge.project.detail = detail;
    if (tab && detail.project?.name && tab.name !== detail.project.name) {
      tab.name = detail.project.name;
      core.persistTabs();
      core.renderTabBar();
    }
    renderProject();
    mountChat(detail.state?.sessionId ?? null, detail.session);
  }

  function projectIs(kind, id) {
    return forge.project?.kind === kind && forge.project?.id === id;
  }

  /** The page again, after a change — the preview kept where it is. */
  async function refreshProject({ preview = false } = {}) {
    const p = forge.project;
    if (!p) return;
    try {
      const detail = await fetchDetail(p.kind, p.id);
      if (!projectIs(p.kind, p.id)) return;
      const sessionBefore = p.detail?.state?.sessionId;
      p.detail = detail;
      renderBar();
      renderSteps();
      if (p.kind !== "plugin" || !forge.previewUrl) renderCanvas();
      else if (preview) reloadPreview();
      const sessionNow = detail.state?.sessionId;
      if (sessionNow && sessionNow !== sessionBefore) mountChat(sessionNow, detail.session);
    } catch {
      // The next change will try again.
    }
  }

  function renderProject() {
    const view = el("forge-view");
    unmountChat();
    view.innerHTML = "";
    view.dataset.project = `${forge.project.kind}/${forge.project.id}`;
    const bar = document.createElement("div");
    bar.className = "page-bar forge-bar";
    bar.id = "forge-bar";
    const steps = document.createElement("div");
    steps.className = "forge-steps";
    steps.id = "forge-steps";
    const canvas = document.createElement("div");
    canvas.className = "forge-canvas";
    canvas.id = "forge-canvas";
    const float = document.createElement("div");
    float.className = "forge-float";
    float.id = "forge-float";
    float.classList.toggle("is-collapsed", forge.floatCollapsed);
    view.append(bar, steps, canvas, float);
    renderBar();
    renderSteps();
    renderCanvas();
    renderFloat();
  }

  const detailShown = () => forge.project?.detail ?? null;

  function installState(detail) {
    const p = detail.project;
    if (p.kind !== "plugin") return { installed: Boolean(p.installedVersion), update: false };
    const installed = Boolean(p.installedVersion);
    const update = installed && p.version && p.version !== p.installedVersion;
    return { installed, update };
  }

  function renderBar() {
    const detail = detailShown();
    const bar = el("forge-bar");
    if (!detail || !bar) return;
    const p = detail.project;
    bar.innerHTML = "";
    const text = document.createElement("span");
    text.className = "forge-bar-text";
    const title = document.createElement("span");
    title.className = "page-bar-text";
    title.textContent = p.name;
    const meta = document.createElement("span");
    meta.className = "page-bar-meta";
    const bits = [kindLabel(p.kind)];
    const { installed, update } = installState(detail);
    if (p.kind === "plugin") {
      if (installed && update) bits.push(t("plugin.forge.meta.installedAndNext", { installed: p.installedVersion, next: p.version }));
      else if (installed) bits.push(t("plugin.forge.meta.installed", { version: p.installedVersion }));
      else if (p.version) bits.push(t("plugin.forge.meta.notInstalled", { version: p.version }));
    } else if (p.version) bits.push(p.version);
    bits.push(issuesText(p.errors, p.warnings));
    meta.textContent = bits.join(" · ");
    text.append(title, meta);

    // The tools of the preview: the device, the theme, Designate.
    const tools = document.createElement("div");
    tools.className = "forge-tools";
    if (p.kind === "plugin" && p.parts?.ui) {
      tools.appendChild(
        seg(
          [
            { value: "pc", icon: "desktop", title: t("plugin.forge.device.pc") },
            { value: "tel", icon: "device-mobile", title: t("plugin.forge.device.tel") },
          ],
          forge.device,
          (device) => {
            forge.device = device;
            try {
              localStorage.setItem(FORGE_DEVICE_KEY, device);
            } catch {
              // Not remembered.
            }
            el("forge-canvas")?.classList.toggle("is-tel", device === "tel");
          },
        ),
      );
      tools.appendChild(
        seg(
          [
            { value: "light", icon: "sun", title: t("plugin.forge.theme.light") },
            { value: "dark", icon: "moon", title: t("plugin.forge.theme.dark") },
          ],
          previewTheme(),
          (theme) => {
            forge.theme = theme;
            void loadPreview();
          },
        ),
      );
      const designate = button({ label: t("plugin.forge.designate"), icon: "cursor-click", cls: forge.designating ? "page-bar-primary forge-designate-btn" : "secondary forge-designate-btn", title: t("plugin.forge.designate.tip") });
      designate.id = "forge-designate-btn";
      designate.setAttribute("aria-pressed", String(forge.designating));
      designate.addEventListener("click", () => setDesignating(!forge.designating));
      tools.appendChild(designate);
    }

    const actions = document.createElement("div");
    actions.className = "page-bar-actions";
    const files = button({ label: t("plugin.forge.files"), icon: "files" });
    files.addEventListener("click", () => openFilesWindow());
    const issues = p.errors + p.warnings;
    const check = button({ label: issues ? t("plugin.forge.checkCount", { count: issues }) : t("plugin.forge.check"), icon: "shield-check" });
    check.classList.toggle("has-errors", p.errors > 0);
    check.classList.toggle("has-warnings", !p.errors && p.warnings > 0);
    check.addEventListener("click", () => openCheckWindow());
    actions.append(files, check);
    if (installed && p.kind === "plugin" && (p.parts?.ui || p.parts?.web)) {
      const open = button({ label: t("plugin.forge.open"), icon: "arrow-square-out" });
      open.addEventListener("click", () => core.openPluginPage(p.id));
      actions.appendChild(open);
    } else if (p.kind === "service") {
      const open = button({ label: t("plugin.forge.open"), icon: "arrow-square-out" });
      open.addEventListener("click", () => core.openServicesView());
      actions.appendChild(open);
    } else if (p.kind === "skill" && installed) {
      const open = button({ label: t("plugin.forge.open"), icon: "arrow-square-out" });
      open.addEventListener("click", () => core.openSkillsView());
      actions.appendChild(open);
    }
    const primary = primaryAction(detail);
    if (primary) actions.appendChild(primary);
    const more = button({ icon: "dots-three", title: t("plugin.forge.moreActions") });
    more.addEventListener("click", () => core.menu(more, projectMenuItems(detail), { label: p.name }));
    actions.appendChild(more);
    bar.append(text, tools, actions);
  }

  /** Install, Update to 1.0.N, or — for a service — nothing: the Services page connects it. */
  function primaryAction(detail) {
    const p = detail.project;
    if (p.kind === "plugin") {
      const { installed, update } = installState(detail);
      if (installed && !update) return null;
      const btn = button({ label: update ? t("plugin.forge.updateTo", { version: p.version }) : t("plugin.forge.install"), icon: "download-simple", cls: "page-bar-primary" });
      btn.disabled = p.errors > 0;
      if (p.errors > 0) btn.title = t("plugin.forge.install.blocked");
      btn.addEventListener("click", () => void installProject(detail));
      return btn;
    }
    if (p.kind === "skill") {
      const installed = Boolean(p.installedVersion);
      const update = installed && p.version && p.version !== p.installedVersion;
      if (installed && !update) return null;
      const btn = button({ label: update ? t("plugin.forge.updateTo", { version: p.version }) : t("plugin.forge.install"), icon: "download-simple", cls: "page-bar-primary" });
      btn.disabled = p.errors > 0;
      btn.addEventListener("click", () => void installSkill(detail));
      return btn;
    }
    return null;
  }

  function projectMenuItems(detail) {
    const p = detail.project;
    const sessionId = detail.state?.sessionId;
    const { installed } = installState(detail);
    return [
      { label: t("plugin.forge.menu.conversation"), icon: "chat", onClick: () => core.openTab(FORGE_AGENT, "chat", sessionId ? { composeSessionId: sessionId } : {}) },
      { label: t("plugin.forge.menu.folder"), icon: "folder", onClick: () => core.openAllkinFolder(`agents/${FORGE_AGENT}/workspace/${detail.path}`) },
      p.kind === "plugin" && installed && { label: t("plugin.forge.menu.pluginPage"), icon: "open", onClick: () => core.openPluginPage(p.id) },
      "sep",
      p.kind === "plugin" && installed && detail.state?.mode === "modify" && { label: t("plugin.forge.menu.revert"), icon: "restart", onClick: () => void revertProject(detail) },
      { label: t("plugin.forge.menu.delete"), icon: "trash", danger: true, onClick: () => void deleteProject(detail) },
    ];
  }

  /** The six steps under the band: done, current, skipped, to come. */
  function renderSteps() {
    const detail = detailShown();
    const strip = el("forge-steps");
    if (!detail || !strip) return;
    strip.innerHTML = "";
    const steps = stepsOf(detail.progress);
    strip.classList.toggle("hidden", !steps);
    if (!steps) return;
    const allDone = stepsAllDone(detail);
    for (const step of FORGE_STEPS) {
      const st = allDone && steps[step].state !== "skipped" ? "done" : steps[step].state;
      const node = document.createElement("span");
      node.className = `forge-step is-${st}`;
      const dot = document.createElement("i");
      if (st === "done") dot.innerHTML = glyph("check");
      else if (st === "skipped") dot.innerHTML = glyph("minus");
      const label = document.createElement("span");
      label.textContent = t(`plugin.forge.step.${step}`);
      node.append(dot, label);
      const summary = steps[step].summary;
      node.title = summary ? `${t(`plugin.forge.step.${step}`)} — ${summary}` : st === "skipped" ? t("plugin.forge.step.skipped") : t(`plugin.forge.step.${step}`);
      strip.appendChild(node);
    }
    const now = detail.progress.step;
    const say = document.createElement("span");
    say.className = "forge-steps-say dim";
    if (allDone) say.textContent = t("plugin.forge.step.allDone");
    else if (now === "install") say.textContent = t("plugin.forge.step.readyToInstall");
    else if (steps[now]?.summary) say.textContent = steps[now].summary;
    strip.appendChild(say);
  }

  /* ---- The canvas: the preview, or the sheet --------------------------------------- */

  function previewTheme() {
    if (forge.theme) return forge.theme;
    const forced = document.documentElement.dataset.theme;
    if (forced === "light" || forced === "dark") return forced;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function renderCanvas() {
    const detail = detailShown();
    const canvas = el("forge-canvas");
    if (!detail || !canvas) return;
    canvas.innerHTML = "";
    canvas.classList.toggle("is-tel", forge.device === "tel");
    const p = detail.project;
    if (p.kind === "plugin" && p.parts?.ui) {
      const frameWrap = document.createElement("div");
      frameWrap.className = "forge-frame";
      const frame = document.createElement("iframe");
      frame.className = "forge-preview-frame";
      frame.id = "forge-preview-frame";
      frame.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals");
      frame.referrerPolicy = "no-referrer";
      frame.title = t("plugin.forge.preview");
      frameWrap.appendChild(frame);
      const note = document.createElement("div");
      note.className = "forge-preview-note dim";
      note.textContent = t("plugin.forge.preview.note", { version: p.version ?? "" });
      canvas.append(frameWrap, note);
      void loadPreview();
      return;
    }
    if (p.kind === "plugin" && p.parts?.web) {
      const { installed } = installState(detail);
      const card = core.emptyState({
        icon: "web",
        title: t("plugin.forge.web.title"),
        text: installed ? t("plugin.forge.web.installedText") : t("plugin.forge.web.text"),
        action: installed ? { label: t("plugin.forge.open"), onClick: () => core.openPluginPage(p.id) } : p.errors ? null : { label: t("plugin.forge.install"), onClick: () => void installProject(detail) },
      });
      card.classList.add("forge-web-card");
      canvas.appendChild(card);
      return;
    }
    canvas.appendChild(renderFiche(detail));
  }

  /** The preview of the page, drawn by Allkin's workshop from the workspace
   *  without installing: an address in an origin of its own. */
  async function loadPreview() {
    const p = forge.project;
    if (!p || p.kind !== "plugin") return;
    try {
      const repoId = await forgeRepoId();
      const result = await core.api(`${projectUrl(repoId, "plugin", p.id)}/preview`, { method: "POST", body: JSON.stringify({ theme: previewTheme() }) });
      if (!projectIs(p.kind, p.id)) return;
      const frame = el("forge-preview-frame");
      if (!frame) return;
      if (result.kind === "ui") {
        forge.previewUrl = result.url;
        forge.previewKind = "ui";
        frame.src = result.url;
      } else {
        forge.previewUrl = null;
        forge.previewKind = result.kind;
        renderCanvas();
      }
    } catch (err) {
      core.toast(err.message, "ko");
    }
  }

  /** Coder wrote: the page is drawn again, the designation cleared. */
  function reloadPreview() {
    const frame = el("forge-preview-frame");
    if (!frame || !forge.previewUrl) return;
    clearAbout();
    const url = new URL(forge.previewUrl, location.origin);
    url.searchParams.set("v", String(Date.now()));
    frame.src = url.pathname + url.search;
  }

  /** The sheet of a project without a page: its manifest, readable. */
  function renderFiche(detail) {
    const p = detail.project;
    const m = detail.manifest ?? {};
    const lang = Allkin.i18n.language;
    const local = (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (typeof value === "object") return value[lang] ?? value.en ?? Object.values(value)[0] ?? "";
      return String(value);
    };
    const root = document.createElement("div");
    root.className = "forge-fiche";
    const head = document.createElement("div");
    head.className = "forge-fiche-head";
    head.innerHTML = `<span class="forge-bigicon">${kindIcon(p.kind)}</span><div class="forge-fiche-id"><b></b><span class="dim"></span><p></p></div>`;
    head.querySelector("b").textContent = p.name;
    const code = document.createElement("code");
    code.textContent = p.id;
    head.querySelector(".dim").append(code, ` · ${kindLabel(p.kind)}${p.version ? ` · ${p.version}` : ""}`);
    const description = local(m.locales?.[lang]?.description) || local(m.description);
    head.querySelector("p").textContent = description || "";
    root.appendChild(head);

    const section = (titleText) => {
      const sec = document.createElement("div");
      sec.className = "forge-fiche-sec";
      const h = document.createElement("h4");
      h.textContent = titleText;
      sec.appendChild(h);
      root.appendChild(sec);
      return sec;
    };
    const row = (sec, titleText, body, note = "") => {
      const r = document.createElement("div");
      r.className = "option-row forge-row";
      const label = document.createElement("span");
      label.className = "option-label";
      const tt = document.createElement("span");
      tt.className = "option-title";
      if (titleText instanceof Node) tt.appendChild(titleText);
      else tt.textContent = titleText;
      label.appendChild(tt);
      if (note) {
        const n = document.createElement("span");
        n.className = "option-note";
        n.textContent = note;
        label.appendChild(n);
      }
      const action = document.createElement("span");
      action.className = "option-action forge-row-body";
      if (body instanceof Node) action.appendChild(body);
      else action.textContent = body;
      r.append(label, action);
      sec.appendChild(r);
      return r;
    };

    if (p.kind === "plugin") {
      const parts = section(t("plugin.forge.fiche.parts"));
      const list = document.createElement("span");
      list.className = "forge-parts";
      for (const part of ["ui", "service", "web", "agent"]) {
        const on = Boolean(p.parts?.[part]);
        const s = document.createElement("span");
        s.className = `forge-part${on ? " on" : ""}`;
        s.innerHTML = `${glyph(on ? "check" : "minus")}<span></span>`;
        s.querySelector("span").textContent = t(`plugin.forge.part.${part}`);
        list.appendChild(s);
      }
      row(parts, t("plugin.forge.fiche.parts"), list);
      const rights = section(t("plugin.forge.fiche.rights"));
      const permissions = Array.isArray(m.permissions) ? m.permissions : [];
      if (!permissions.length) row(rights, t("plugin.forge.fiche.noRight"), "");
      for (const perm of permissions) {
        const name = typeof perm === "string" ? perm : perm?.name ?? perm?.id ?? "";
        const reason = typeof perm === "object" ? local(perm?.reason ?? perm?.locales?.[lang]?.reason) : "";
        const c = document.createElement("code");
        c.textContent = name;
        row(rights, c, reason);
      }
      const settings = Array.isArray(m.settings) ? m.settings : [];
      if (settings.length) {
        const sec = section(t("plugin.forge.fiche.settings"));
        for (const s of settings) {
          const def = s?.default !== undefined ? t("plugin.forge.fiche.default", { value: String(s.default) }) : "";
          row(sec, local(s?.label) || s?.key || "", `${s?.key ?? ""} · ${s?.type ?? ""}`, def);
        }
      }
    } else if (p.kind === "service") {
      const sec = section(t("plugin.forge.fiche.definition"));
      row(sec, t("plugin.forge.fiche.service.category"), String(m.category ?? ""));
      row(sec, t("plugin.forge.fiche.service.auth"), String(m.authType ?? ""));
      row(sec, t("plugin.forge.fiche.service.url"), String(m.apiBaseUrl ?? ""));
      row(sec, t("plugin.forge.fiche.service.test"), String(m.testPath ?? ""));
      const note = document.createElement("p");
      note.className = "dim forge-fiche-note";
      note.textContent = t("plugin.forge.fiche.service.note");
      root.appendChild(note);
    } else {
      const sec = section(t("plugin.forge.fiche.skill"));
      row(sec, t("plugin.forge.fiche.skill.name"), local(m.locales?.[lang]?.name) || p.name);
      row(sec, t("plugin.forge.fiche.skill.description"), local(m.locales?.[lang]?.description) || description || "");
      const note = document.createElement("p");
      note.className = "dim forge-fiche-note";
      note.textContent = t("plugin.forge.fiche.skill.note");
      root.appendChild(note);
    }

    const docs = section(t("plugin.forge.fiche.docs"));
    const list = document.createElement("span");
    list.className = "forge-parts";
    const readmes = p.kind === "plugin" ? ["README.md", "README-EN.md", "README-ES.md", "README-DE.md"] : ["README.md", "README-FR.md", "README-ES.md", "README-DE.md"];
    const present = new Set((detail.files ?? []).map((f) => f.path));
    for (const file of readmes) {
      const on = present.has(file);
      const s = document.createElement("span");
      s.className = `forge-part${on ? " on" : " off"}`;
      s.innerHTML = `${glyph(on ? "check" : "warning-circle")}<span></span>`;
      s.querySelector("span").textContent = file;
      list.appendChild(s);
    }
    row(docs, t("plugin.forge.fiche.readme"), list, t("plugin.forge.fiche.readmeNote"));
    return root;
  }

  /* ---- The floating conversation ------------------------------------------------ */

  function renderFloat() {
    const float = el("forge-float");
    const detail = detailShown();
    if (!float || !detail) return;
    unmountChat();
    float.innerHTML = "";
    const head = document.createElement("div");
    head.className = "forge-float-head";
    const avatar = document.createElement("span");
    avatar.className = "forge-float-avatar msg-avatar";
    core.renderAgentAvatar(avatar, FORGE_AGENT);
    const name = document.createElement("b");
    name.textContent = core.agentName(FORGE_AGENT);
    const meta = document.createElement("span");
    meta.className = "dim forge-float-meta";
    meta.id = "forge-float-meta";
    const now = detail.progress?.step;
    meta.textContent = now && !stepsAllDone(detail) ? t(`plugin.forge.step.${now}`) : "";
    const gap = document.createElement("span");
    gap.className = "forge-gap";
    const collapse = button({ icon: forge.floatCollapsed ? "caret-up" : "caret-down", title: forge.floatCollapsed ? t("plugin.forge.float.show") : t("plugin.forge.float.hide") });
    collapse.classList.add("forge-float-toggle");
    collapse.addEventListener("click", () => {
      forge.floatCollapsed = !forge.floatCollapsed;
      float.classList.toggle("is-collapsed", forge.floatCollapsed);
      renderFloat();
      if (!forge.floatCollapsed) mountChat(detail.state?.sessionId ?? null, detail.session);
    });
    head.append(avatar, name, meta, gap, collapse);
    head.addEventListener("click", (e) => {
      if (!forge.floatCollapsed || e.target.closest("button")) return;
      collapse.click();
    });
    const body = document.createElement("div");
    body.className = "forge-float-body";
    body.id = "forge-float-body";
    const about = document.createElement("div");
    about.className = "forge-about hidden";
    about.id = "forge-about";
    float.append(head, about, body);
    renderAbout();
  }

  /** The conversation's panels, lent by Allkin: moved into the float (a
   *  marker keeps their place), shown, and loaded on the project's session. */
  function mountChat(sessionId, status = null) {
    const body = el("forge-float-body");
    if (!body || forge.floatCollapsed) return;
    if (core.shownSplitKind() === "chat") core.closeSplit();
    core.borrowChat(body, FORGE_KIND);
    if (!sessionId || status === "closed") {
      offerConversation(body, status);
      return;
    }
    body.querySelector(".forge-no-session")?.remove();
    if (forge.chatSessionId === sessionId && core.chatSessionShown() === sessionId) return;
    forge.chatSessionId = sessionId;
    core.trackPageLoad(
      core.loadChat(FORGE_AGENT, sessionId).then(() => {
        for (const id of ["chat-messages-wrap", "chat-form"]) el(id)?.classList.remove("hidden");
      }),
    );
  }

  /** A project without a live conversation (made outside the Forge, or its
   *  conversation archived): a button starts one, the wish as first message. */
  function offerConversation(body, status) {
    for (const id of ["chat-messages-wrap", "chat-form"]) el(id)?.classList.add("hidden");
    let card = body.querySelector(".forge-no-session");
    if (!card) {
      card = document.createElement("div");
      card.className = "forge-no-session";
      body.prepend(card);
    }
    card.innerHTML = "";
    const p = document.createElement("p");
    p.className = "dim";
    p.textContent = status === "closed" ? t("plugin.forge.session.closed") : t("plugin.forge.session.none");
    const btn = button({ label: t("plugin.forge.session.start"), icon: "chat-circle", cls: "page-bar-primary" });
    btn.addEventListener("click", async () => {
      const detail = detailShown();
      if (!detail) return;
      btn.disabled = true;
      try {
        const project = detail.project;
        const state = detail.state ?? (await writeForgeState(project.kind, project.id, { mode: project.installedVersion ? "modify" : "new", wish: project.name }));
        const sessionId = await openConversation(project, state);
        await refreshProject();
        mountChat(sessionId, "active");
      } catch (err) {
        core.toast(err.message, "ko");
        btn.disabled = false;
      }
    });
    card.append(p, btn);
  }

  function unmountChat() {
    core.returnChat(FORGE_KIND);
    forge.chatSessionId = null;
  }

  /* ---- Designate ------------------------------------------------------------------ */

  function setDesignating(on) {
    forge.designating = on;
    const btn = el("forge-designate-btn");
    if (btn) {
      btn.className = on ? "page-bar-primary forge-designate-btn" : "secondary forge-designate-btn";
      btn.setAttribute("aria-pressed", String(on));
    }
    el("forge-canvas")?.classList.toggle("is-designating", on);
    el("forge-preview-frame")?.contentWindow?.postMessage({ type: "workshop-designate", on }, "*");
  }

  function clearAbout() {
    forge.about = null;
    renderAbout();
    el("forge-preview-frame")?.contentWindow?.postMessage({ type: "workshop-designate-clear" }, "*");
  }

  function renderAbout() {
    const about = el("forge-about");
    if (!about) return;
    about.innerHTML = "";
    const a = forge.about;
    about.classList.toggle("hidden", !a);
    if (!a) return;
    about.insertAdjacentHTML("beforeend", glyph("cursor-click"));
    const text = document.createElement("span");
    text.className = "forge-about-text";
    text.textContent = t("plugin.forge.about", { label: a.label });
    text.title = a.selector;
    const close = button({ icon: "x", title: t("plugin.forge.close") });
    close.classList.add("forge-about-close");
    close.addEventListener("click", () => clearAbout());
    about.append(text, close);
  }

  window.addEventListener("message", (e) => {
    const frame = el("forge-preview-frame");
    if (!frame || e.source !== frame.contentWindow) return;
    const m = e.data ?? {};
    if (m.type === "workshop-designated") {
      forge.about = { label: String(m.label ?? ""), selector: String(m.selector ?? "") };
      renderAbout();
      setDesignating(false);
      // The element named at the head of the message, the cursor after it.
      const input = core.composer();
      if (input && !input.closest(".hidden")) {
        const prefix = t("plugin.forge.aboutPrefix", { label: forge.about.label });
        const rest = forge.aboutPrefix && input.value.startsWith(forge.aboutPrefix) ? input.value.slice(forge.aboutPrefix.length) : input.value;
        forge.aboutPrefix = prefix;
        input.value = prefix + rest;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        core.resizeComposer();
      }
    }
  });

  document.addEventListener("submit", (e) => {
    if (e.target?.id === "chat-form" && forge.about && el("forge-float")?.contains(e.target)) clearAbout();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && forge.designating) setDesignating(false);
  });

  /* ---- Files and check, in windows ------------------------------------------------- */

  function openWindow({ title, meta = "", wide = false }) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop forge-window-backdrop";
    const modal = document.createElement("div");
    modal.className = `modal${wide ? " modal-wide" : ""} forge-window`;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    const head = document.createElement("div");
    head.className = "modal-head";
    const h = document.createElement("h2");
    h.className = "modal-title";
    h.textContent = title;
    head.appendChild(h);
    if (meta) {
      const m = document.createElement("span");
      m.className = "modal-head-meta";
      m.textContent = meta;
      head.appendChild(m);
    }
    head.appendChild(core.modalCloseButton());
    const body = document.createElement("div");
    body.className = "modal-body";
    const foot = document.createElement("div");
    foot.className = "modal-foot";
    modal.append(head, body, foot);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    core.onModalDismiss(modal, close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
    return { body, foot, close };
  }

  function openFilesWindow() {
    const detail = detailShown();
    if (!detail) return;
    const files = detail.files ?? [];
    const { body, foot, close } = openWindow({ title: t("plugin.forge.files"), meta: tn("plugin.forge.files.count", files.length), wide: true });
    const list = document.createElement("div");
    list.className = "forge-files list-zone";
    for (const f of files) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = `forge-file${f.changed ? " is-changed" : ""}`;
      row.innerHTML = `${fileIcon(f.path)}<span class="forge-file-name"></span><span class="forge-file-pill hidden"></span><span class="dim forge-file-size"></span><span class="dim forge-file-date"></span>`;
      row.querySelector(".forge-file-name").textContent = f.path;
      if (f.changed) {
        const pill = row.querySelector(".forge-file-pill");
        pill.classList.remove("hidden");
        pill.textContent = t("plugin.forge.files.changed");
      }
      row.querySelector(".forge-file-size").textContent = core.formatSize(f.size);
      row.querySelector(".forge-file-date").textContent = core.formatRelativeTime(f.modifiedAt);
      row.addEventListener("click", () => {
        close();
        core.openTab(FORGE_AGENT, "file", { path: `${detail.path}/${f.path}`, name: f.path.split("/").pop() });
      });
      list.appendChild(row);
    }
    if (!files.length) {
      const p = document.createElement("p");
      p.className = "dim";
      p.textContent = t("plugin.forge.files.none");
      list.appendChild(p);
    }
    body.appendChild(list);
    const note = document.createElement("span");
    note.className = "modal-foot-aside dim";
    note.textContent = detail.project.installedVersion ? t("plugin.forge.files.changedNote", { version: detail.project.installedVersion }) : t("plugin.forge.files.note");
    const folder = button({ label: t("plugin.forge.menu.folder"), icon: "folder-simple" });
    folder.addEventListener("click", () => {
      close();
      core.openAllkinFolder(`agents/${FORGE_AGENT}/workspace/${detail.path}`);
    });
    foot.append(note, folder);
  }

  function openCheckWindow() {
    const detail = detailShown();
    if (!detail) return;
    const issues = detail.issues ?? [];
    const p = detail.project;
    const { body, foot, close } = openWindow({ title: t("plugin.forge.check"), meta: issuesText(p.errors, p.warnings), wide: true });
    const list = document.createElement("div");
    list.className = "forge-issues";
    for (const issue of issues) {
      const row = document.createElement("div");
      row.className = `forge-issue is-${issue.level}`;
      row.innerHTML = `<i></i><span class="forge-issue-text"><b></b><span></span></span><span class="dim forge-issue-level"></span>`;
      row.querySelector("b").textContent = issue.file ?? "";
      row.querySelector(".forge-issue-text > span").textContent = issue.message;
      row.querySelector(".forge-issue-level").textContent = issue.level === "error" ? t("plugin.forge.check.error") : t("plugin.forge.check.warning");
      const ask = button({ label: t("plugin.forge.check.ask"), icon: "chat-circle" });
      ask.addEventListener("click", () => {
        close();
        askCoder(t("plugin.forge.check.askText", { file: issue.file ?? "", message: issue.message }));
      });
      row.appendChild(ask);
      list.appendChild(row);
    }
    if (!issues.length) list.appendChild(core.emptyState({ icon: "check", title: t("plugin.forge.check.clean"), text: t("plugin.forge.check.cleanText") }));
    body.appendChild(list);
    const note = document.createElement("span");
    note.className = "modal-foot-aside dim";
    note.textContent = t("plugin.forge.check.note");
    const again = button({ label: t("plugin.forge.check.again"), icon: "arrow-clockwise" });
    again.addEventListener("click", async () => {
      again.disabled = true;
      await refreshProject();
      close();
      openCheckWindow();
    });
    foot.append(note, again);
  }

  /** A sentence put in the composer of the conversation, for the user to send. */
  function askCoder(text) {
    if (forge.floatCollapsed) {
      forge.floatCollapsed = false;
      el("forge-float")?.classList.remove("is-collapsed");
      renderFloat();
      mountChat(detailShown()?.state?.sessionId ?? null, detailShown()?.session ?? null);
    }
    const input = core.composer();
    if (!input) return;
    input.value = text;
    input.focus();
    core.resizeComposer();
  }

  /* ---- Install, update, revert, delete --------------------------------------------- */

  /** The Integrations page's own window, on Coder's repository: no second way to install. */
  async function installProject(detail) {
    const p = detail.project;
    const m = detail.manifest ?? {};
    const { update } = installState(detail);
    const repoId = await forgeRepoId();
    const entry = {
      id: p.id,
      name: p.name,
      version: p.version ?? "",
      installedVersion: p.installedVersion,
      updateAvailable: update,
      author: typeof m.author === "string" ? m.author : "",
      requires: [],
      size: (detail.files ?? []).reduce((sum, f) => sum + (f.size ?? 0), 0),
      fileCount: (detail.files ?? []).length,
      hasService: Boolean(p.parts?.service),
      hasWeb: Boolean(p.parts?.web),
      hasUi: Boolean(p.parts?.ui),
      permissions: Array.isArray(m.permissions) ? m.permissions : [],
      repo: repoId,
      repoName: core.agentName(FORGE_AGENT),
    };
    const result = await core.installPlugin(entry, { repo: repoId });
    if (!result) return;
    core.toast(t(update ? "plugin.forge.updated.toast" : "plugin.forge.installed.toast", { name: p.name, version: result.version }));
    // Installed: the modification, if one was under way, is over.
    if (detail.state?.mode === "modify") {
      const { modifyingFrom: _from, ...rest } = detail.state;
      await writeForgeState(p.kind, p.id, { ...rest, mode: "new" });
    }
    await refreshProject({ preview: true });
    if (entry.hasUi && !core.isInterfacePluginLoaded(p.id)) {
      // The page of the integration adds to the interface: the page loads it
      // again — the Forge comes back on this tab.
      const ok = await core.confirm({ title: t("plugin.forge.reload.title", { name: p.name }), text: t("plugin.forge.reload.text"), okLabel: t("plugin.forge.reload.ok") });
      if (ok) location.reload();
    } else if (!update) core.openPluginPage(p.id);
  }

  /** A competence goes through the catalogue's refresh: Coder's repository is one of its sources. */
  async function installSkill(detail) {
    const p = detail.project;
    try {
      await core.api("/api/skill-catalogue?refresh=1");
      core.toast(t("plugin.forge.skill.installed", { name: p.name }));
      await refreshProject();
    } catch (err) {
      core.toast(err.message, "ko");
    }
  }

  async function revertProject(detail) {
    const p = detail.project;
    const ok = await core.confirm({
      title: t("plugin.forge.revert.title", { version: p.installedVersion ?? "" }),
      text: t("plugin.forge.revert.text"),
      okLabel: t("plugin.forge.revert.ok"),
      danger: true,
    });
    if (!ok) return;
    try {
      const repoId = await forgeRepoId();
      await core.api(`${projectUrl(repoId, "plugin", p.id)}/revert`, { method: "POST" });
      // Nothing is being modified any more; the conversation is kept.
      if (detail.state) {
        const { modifyingFrom: _from, ...rest } = detail.state;
        await writeForgeState(p.kind, p.id, { ...rest, mode: "new" });
      }
      await writeProgress(p.kind, p.id, { step: "install", summary: "", skipped: [] });
      core.toast(t("plugin.forge.revert.done", { version: p.installedVersion ?? "" }));
      await refreshProject({ preview: true });
    } catch (err) {
      core.toast(err.message, "ko");
    }
  }

  async function deleteProject(detail) {
    const p = detail.project;
    const ok = await core.confirm({
      title: t("plugin.forge.delete.title", { name: p.name }),
      text: p.installedVersion ? t("plugin.forge.delete.textInstalled") : t("plugin.forge.delete.text"),
      okLabel: t("plugin.forge.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      const repoId = await forgeRepoId();
      await core.api(projectUrl(repoId, p.kind, p.id), { method: "DELETE" });
      await removeForgeFiles(p.kind, p.id);
      core.toast(t("plugin.forge.delete.done", { name: p.name }));
      const tab = core.activeTab();
      if (tab?.kind === FORGE_KIND) {
        unmountChat();
        tab.path = FORGE_START_PATH;
        tab.name = appName();
        core.persistTabs();
        core.renderTabBar();
        renderForge(tab);
      }
    } catch (err) {
      core.toast(err.message, "ko");
    }
  }

  /* ---- What arrives live ---------------------------------------------------------- */

  /** Coder's tool calls, from the activity socket: a write in the project
   *  draws the preview and the check again, a little after the last one; a
   *  write of the progress file draws the steps. */
  core.onActivity((msg) => {
    const p = forge.project;
    if (!p || core.state.view !== FORGE_KIND) return;
    if (msg.type !== "agent_tool" || msg.agentId !== FORGE_AGENT || msg.phase !== "end") return;
    if (!WRITE_TOOLS.test(String(msg.tool ?? ""))) return;
    const item = String(msg.item ?? "");
    const progress = item.endsWith(`${p.kind}-${p.id}.progress.json`);
    const mine = !item || progress || item.includes(`/${p.id}/`) || item.includes(p.id);
    if (!mine) return;
    clearTimeout(forge.refreshTimer);
    forge.refreshTimer = setTimeout(() => void refreshProject({ preview: !progress }), progress ? 300 : 1200);
  });

  /* ---- What Allkin is told ---------------------------------------------------------- */

  Allkin.registerTabKind(FORGE_KIND, {
    panels: ["forge-view"],
    icon: FORGE_ICON,
    byPath: true,
    label: (tab) => (tab.path === FORGE_START_PATH ? appName() : tab.name || appName()),
    tooltip: (tab) => (tab.path === FORGE_START_PATH ? appName() : t("plugin.forge.tabTip", { name: tab.name || tab.path })),
    group: () => appName(),
    scroller: () => el("forge-view").querySelector(".forge-scroll") ?? el("forge-view"),
    activate: (tab) => renderForge(tab),
    leave: () => leave(),
    beforeClose: () => leave(),
    // The conversation is shown by the page itself: the agent of the page stands aside.
    holdsChat: true,
  });

  // The System window and the quick switcher: the Forge among the integrations' things to open.
  Allkin.registerApp({ key: "forge", name: appName(), meta: t("plugin.forge.app.meta"), icon: FORGE_ICON, open: () => openForgeView() });

  // "Create an integration", "Create a service", "Modify in the Forge": Allkin
  // asks the integration that provides the workshop.
  Allkin.provide("workshop", {
    create: (kind) => openForgeView({ mode: "new", kind: kind === "service" || kind === "skill" ? kind : "plugin" }),
    modify: (kind, id) => openForgeView({ mode: "modify", kind, id }),
    menuItem: (kind, id, repoId) => modifyMenuItem(kind, id, repoId),
  });

  // Coder's repository, known early: the ⋯ menus ask for it before any tab opens.
  void forgeRepoId().catch(() => {});
})();
