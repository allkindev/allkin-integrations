# Puente Telegram

Hable con sus agentes desde Telegram. Usted crea tantos bots como quiera, cada uno unido a **uno o
varios agentes**, y los gestiona desde la página **Telegram** de Allkin: quién puede escribirles,
qué agente responde, las conversaciones en curso. Cada bot escucha en continuo (long polling: nada
que abrir en su router, ninguna dirección pública). Cuando un agente quiere ejecutar un comando,
llega al chat con dos botones: **Autorizar** o **Rechazar**.

## Puesta en marcha

1. Conceda los cuatro derechos de la integración, marque **Permitir el arranque como servicio**,
   guarde y recargue la página de Allkin (la página Telegram se añade a la interfaz).
2. Abra **Telegram** desde la ventana Sistema y luego **Añadir un bot**:
   - en Telegram, escriba `/newbot` a **@BotFather**: un nombre y luego un identificador que
     termine en `bot`. Le responde con un **token**;
   - pegue el token: Allkin lo comprueba con Telegram y muestra el bot reconocido;
   - elija el agente o los agentes que responden; la estrella elige el que responde primero;
   - **Arrancar el bot**.
3. Escriba al bot. Recibe un **código** y su solicitud aparece arriba de la página:
   **Autorizar**, y ya puede hablarle.

Varios bots pueden servir al mismo agente, y un bot puede servir a varios agentes.

## La página Telegram

- **La tabla de los bots**: sus agentes, las personas que pueden escribirle, los mensajes de hoy y
  de los últimos siete días, el último mensaje, su estado (escuchando, en pausa, en error — un
  token revocado, por ejemplo, con lo que hay que hacer).
- **Una fila se despliega** sobre las conversaciones del bot: quién habla con qué agente, lo último
  que se dijo, en qué punto está (trabajando, espera una validación, respondido) y un botón para
  abrirla en Allkin.
- **Las solicitudes de acceso** arriba: un desconocido que escribe al bot recibe un código; usted
  lo autoriza o lo rechaza con un clic.
- El menú **⋯** de un bot: ajustes, pausa, enlace de invitación, abrir en Telegram, eliminar.
- La búsqueda y el filtro por agente en la barra de la página.

## Los ajustes de un bot

| Sección    | Lo que se ajusta                                                                                 |
|------------|--------------------------------------------------------------------------------------------------|
| Agentes    | los agentes del bot, el de por defecto; cambiar de agente con `/agent`; tras cuánto silencio empieza una conversación nueva |
| Acceso     | las personas autorizadas, el agente de cada una, quién puede validar los comandos; invitaciones; grupos |
| Validación | validar los comandos desde Telegram, o rechazarlos de entrada                                    |
| Mensajes   | aceptar archivos y fotos (depositados en `Upload/` del agente); «escribiendo…»                   |
| Bot        | reemplazar el token, el menú de comandos publicado en Telegram, el idioma de los mensajes del bot |

Un **enlace de invitación** (`t.me/<bot>?start=…`) añade a una persona en un mensaje: válido
7 días, una sola vez. En un **grupo**, el bot solo se queda si lo añade una persona autorizada y
se aceptan los grupos; allí solo responde a las personas autorizadas, cuando se le menciona o se
le responde.

## En el chat

| Comando  | Efecto                                                           |
|----------|------------------------------------------------------------------|
| `/agent` | elegir el agente con el que se habla, entre los del bot (botones) |
| `/new`   | empezar una conversación nueva con el mismo agente               |
| `/who`   | el agente y la conversación de este chat                         |
| `/help`  | lo que entiende el bot                                           |

Cada chat conserva su conversación: sobrevive a los reinicios y aparece en el historial del
agente. Los **formularios** que un agente puede pedir no se rellenan desde Telegram: se cancelan
con una explicación.

## Ajustes de la integración

- **Puerto local**: donde el servicio sirve la API de la página, solo en 127.0.0.1; la página pasa
  por Allkin, tras su sesión.
- **Dirección de la API de Telegram**: solo se cambia para un servidor Bot API propio.
- Los tres ajustes **(versión anterior)** solo sirven una vez: el bot de la versión anterior se
  retoma en la página, con sus usuarios autorizados. Déjelos vacíos después.

## Derechos

| Derecho    | Por qué                                                                                |
|------------|----------------------------------------------------------------------------------------|
| Red        | consultar Telegram para cada bot, devolver las respuestas, descargar los archivos; servir la API de la página en local |
| Agentes    | abrir una conversación con un agente a través del socket de Allkin                     |
| Archivos   | depositar los archivos recibidos en la carpeta Upload del agente                       |
| Interfaz   | añadir la página Telegram a Allkin                                                     |

El bot no concede ningún derecho: cada agente conserva exactamente los de su página. Los tokens se
quedan en el servidor, en la carpeta privada de la integración; nunca se muestran ni se dan a un
agente.

## Cuando no funciona

- **La página dice que el servicio no responde**: abra la página de la integración, compruebe que
  los cuatro derechos están concedidos y que el servicio funciona; su registro dice por qué se para.
- **Token rechazado**: el token se revocó en @BotFather. Menú ⋯ › Ajustes › Bot › Reemplazar, con
  el nuevo token del mismo bot.
- **Leído en otro sitio**: otro programa (otro servidor, un webhook) lee los mensajes de este bot;
  un bot solo puede ser leído por uno.
- **El bot no responde a alguien**: su solicitud quizá espera arriba de la página.
