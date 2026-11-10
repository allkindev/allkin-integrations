# SearXNG

Un buscador propio, en su máquina. [SearXNG](https://github.com/searxng/searxng) es un
metabuscador libre: consulta varios buscadores a la vez, reúne sus resultados y no guarda ni
perfil ni historial. La integración lo instala y lo ejecuta por sí misma, **sin Docker**, y hace
con él dos cosas:

- **una página de búsqueda dentro de Allkin** — web, imágenes, vídeos, noticias, informática,
  ciencia, con elección del periodo;
- **la búsqueda web de sus agentes**, mediante el servicio «SearXNG»: sin clave, sin cuota, sin
  pasar por la búsqueda del proveedor de IA.

## Puesta en marcha

1. Conceda los tres permisos (más abajo se explica por qué).
2. Marque **Autorizar el inicio como servicio** y guarde.
3. Abra **SearXNG** desde la ventana Sistema (el logo de Allkin).

En el **primer inicio**, la integración descarga SearXNG e instala sus paquetes de Python en su
carpeta de datos: cuente **de uno a unos minutos**. La página dice por dónde va (descarga,
entorno de Python, paquetes) y luego la búsqueda se abre sola. Los inicios siguientes tardan unos
segundos.

La máquina necesita **git** y **Python 3.10 o posterior con su módulo venv**. En Debian y Ubuntu:
`sudo apt install git python3 python3-venv`. Si falta alguno, la página lo dice.

## Buscar

Escriba sus palabras, <kbd>Intro</kbd>. <kbd>/</kbd> vuelve al campo de búsqueda. Las categorías
y el periodo están en la barra; «Más resultados», al final de la página, carga la continuación.
Un resultado se abre en una pestaña nueva del navegador; su menú «⋯» copia el enlace. El pie de
la página cuenta los resultados y dice cuántos buscadores no respondieron (sus nombres al pasar
el ratón).

## Dar la búsqueda a sus agentes

1. Página **Servicios** → añada el servicio **SearXNG**.
2. Dirección: `http://127.0.0.1:9350` (el puerto de los ajustes de abajo). Sin clave.
3. En la página del agente, marque el servicio **SearXNG**.

El agente busca entonces mediante su SearXNG: de cada resultado recibe el título, la dirección,
un extracto y los buscadores que lo encontraron, en una forma corta que cuida su memoria de
trabajo.

## Ajustes

| Ajuste                       | Función                                                                              |
|------------------------------|--------------------------------------------------------------------------------------|
| Puerto local                 | Puerto de escucha de la integración en `127.0.0.1` (9350 por defecto); la dirección del servicio |
| Filtro de contenido          | Ninguno, moderado o estricto: lo que SearXNG pide a los buscadores que descarten     |
| Mantener SearXNG actualizado | Una vez por semana, al iniciar la integración (activado por defecto)                 |

Los buscadores consultados son los que SearXNG activa por defecto. Su archivo de ajustes se
reescribe en cada inicio a partir de estos: no lo modifique a mano.

## Permisos solicitados

- **Red** — descarga de SearXNG y de sus paquetes, escucha en el puerto local, peticiones a los
  buscadores en cada búsqueda.
- **Ejecución** — `git` y `python3` para la instalación, y luego el propio SearXNG.
- **Interfaz** — la página de búsqueda: su pestaña y su entrada en la ventana Sistema.

SearXNG solo escucha en la máquina (`127.0.0.1`): su página pasa por Allkin, detrás de su sesión,
y no se abre nada en la red. Las búsquedas salen de la dirección de **esta máquina** hacia los
buscadores: no ven ni su navegador ni sus cookies, pero sí esa dirección.

## Cuando no funciona

- **«SearXNG está detenido»** — no se han concedido todos los permisos, o el servicio no tiene
  permitido iniciarse: abra la página de la integración.
- **«SearXNG no pudo iniciarse»** — la página dice qué falta (git, Python, venv, conexión).
  Corríjalo y **reinicie** el servicio desde la página de la integración; su registro muestra el
  detalle.
- **Pocos o ningún resultado, «N buscadores no respondieron»** — los buscadores rechazan a veces
  las peticiones de un servidor durante un rato (CAPTCHA, tiempo agotado). Vuelva a intentarlo
  más tarde; la actualización semanal de SearXNG corrige lo que depende de un buscador que ha
  cambiado.
- **Empezar de cero** — detenga el servicio, elimine la carpeta `runtime` de la carpeta de datos
  de la integración e inicie de nuevo: SearXNG se reinstala.

Desinstalar la integración detiene SearXNG; sus ajustes y su copia de SearXNG se quedan en su
carpeta de datos: una nueva instalación los recupera.
