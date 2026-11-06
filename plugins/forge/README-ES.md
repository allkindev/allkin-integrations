# Forja

La Forja es el taller donde **Coder**, el agente del sistema de Allkin, fabrica y modifica con
usted integraciones, servicios y competencias, sin instalar nada antes de que lo haya visto.

## Empezar

1. Instale la integración desde la ventana **Añadir** de la página Integraciones, concédale su
   derecho en su página y recargue Allkin.
2. Abra la **Forja** desde la ventana Sistema, o con **Crear una integración** en la página
   Integraciones y **Crear un servicio** en la página Servicios.
3. Diga lo que quiere: el tipo (integración, servicio, competencia), su petición y, si lo desea,
   un punto de partida: un software de terceros, una API, la documentación de una API, una
   página, un agente, un archivo. **Empezar con Coder** crea el esqueleto del proyecto en el
   espacio de trabajo de Coder y abre su conversación.

Coder tiene que estar activado (su página, grupo «Activación»).

## La página de un proyecto

- **La banda**: el nombre del proyecto, su versión instalada y la que está en curso, el resultado
  de la comprobación; las herramientas de la vista previa (ordenador o teléfono, tema claro u
  oscuro, **Señalar**); Archivos, Comprobación, Abrir, **Instalar** o **Actualizar**, y el menú
  «⋯» (la conversación de Coder, la carpeta, la página de la integración, volver a la versión
  instalada, eliminar).
- **Las seis etapas** de Coder: comprender, planificar, maquetar, construir, comprobar, instalar
  — hechas, en curso, apartadas, por venir —, con una línea sobre la etapa en curso.
- **La vista previa**: la página de la integración, dibujada desde el espacio de trabajo de Coder
  sin instalarla, en un marco aislado. Un servicio o una competencia no tiene nada que mostrar:
  la ficha de su manifiesto ocupa su lugar. Una página servida por el propio servicio de la
  integración solo se ve una vez instalada.
- **La conversación** con Coder flota a la derecha (una hoja abajo en un teléfono), plegada con
  un clic. **Señalar** y luego un clic en un elemento de la vista previa lo nombra al principio
  de su mensaje: «Sobre «Botón Guardar»: …».

Tras cada escritura de Coder, la vista previa y la comprobación se vuelven a leer. **Instalar**
pasa por la ventana de instalación de la página Integraciones, desde el repositorio de Coder; no
se instala nada mientras la comprobación señale un error.

## Modificar lo que la Forja ha fabricado

La pantalla de inicio, pestaña **Modificar**: elija un proyecto de la Forja, diga qué debe
cambiar. La versión instalada sigue funcionando durante el trabajo; la ventana Archivos marca lo
que difiere de ella; **Actualizar a 1.0.N** entrega la nueva versión, y «Volver a la versión
instalada» abandona la modificación. Solo lo que la Forja ha fabricado se modifica aquí: nada de
lo que viene de un repositorio o de otra fuente.

## Lo que la Forja escribe, y dónde

Nada en los archivos del proyecto. La Forja anota lo que sabe de un proyecto en la carpeta
compartida, en su propia carpeta `forge/`: `<tipo>-<id>.json` (su petición, el punto de partida,
la conversación) y `<tipo>-<id>.progress.json`, que **Coder escribe él mismo** para decir en qué
etapa está. Eliminar un proyecto lo mueve a la papelera del espacio de trabajo de Coder; lo que
está instalado sigue instalado.
