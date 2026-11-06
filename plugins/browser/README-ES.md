# Navegador

La vista en directo del navegador de sus agentes. Cada agente con el derecho «Navegador» dispone
de un Chrome propio en la máquina de Allkin, conservado entre conversaciones con las sesiones que
usted abre en él. Esta integración abre una pestaña por agente donde usted mira la página que
manipula, toma el control con un clic y se lo devuelve.

Las herramientas del navegador —navegar, leer la página, actuar en ella, tomar una captura,
gestionar las pestañas— son las de Allkin, montadas por el derecho «Navegador» de la página del
agente. Sin esta integración el agente navega igualmente: usted ve sus capturas y sus acciones en
la conversación, pero no la página en directo.

## Empezar

1. En **Ajustes › Navegador**, instale el navegador si aún no está (una descarga de unos 100 MB,
   una vez).
2. En la página de un agente, grupo **Derechos**, marque **Dispone de su propio navegador**;
   marque **Puede actuar en las páginas** si debe rellenar formularios, hacer clic, elegir.
3. Instale esta integración, concédale su derecho y recargue Allkin.
4. Pida algo al agente: en cuanto abra su navegador, la pestaña **Navegador** se abre junto a la
   conversación.

## La pantalla

La barra lleva **Atrás**, **Adelante**, **Recargar**, la dirección, la lista de pestañas del
navegador y un menú **⋯** (abrir la dirección en su propio navegador, copiarla, cerrar el
navegador del agente). Debajo, la página en directo; al pie, el estado de la emisión, **Captura**
(la imagen tal cual) y **Ajustar | Tamaño real**.

La **cápsula** al pie de la página dice quién tiene el control: «Plume está navegando · la
página», con un borde índigo alrededor de la página, o «Usted tiene el control · Plume espera».

## Tomar el control

Un clic en **Tomar el control**: su ratón y su teclado van a la página, la dirección se abre, las
pestañas le obedecen. El agente lo sabe en su próxima herramienta y espera. Así inicia sesión en
un sitio, pasa un captcha o corrige un formulario: lo que usted escribe va a Chrome y a ningún
otro lugar, ni a la conversación ni al diario. <kbd>Esc</kbd> o **Devolver el control** devuelve
la página al agente, que la relee antes de actuar.

## Lo que hace el agente, y lo que pide

- Navegar y leer no piden nada: leer la web ya es un derecho sin tarjeta.
- **Una secuencia de acciones, una tarjeta** en la conversación, cada paso nombrado por el
  elemento que toca. Usted la aprueba una vez, o **para esta sesión, en este sitio**.
- El agente nunca escribe una contraseña: Allkin lo rechaza, y le cede la página.
- Las descargas llegan a la carpeta `Downloads/` del agente.

## Lo que el navegador no alcanza

La red de la máquina (localhost, direcciones privadas, Tailscale) queda fuera de su alcance
mientras no la abra en **Ajustes › Navegador**; los sitios que allí prohíbe quedan fuera del
alcance de todos los agentes. Un navegador se cierra solo tras un tiempo sin petición ni
espectador; el número de navegadores abiertos a la vez está limitado. Cada acción deja una línea
en el diario, categoría **Navegador**.
