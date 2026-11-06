# Pont Telegram

Parlez à vos agents depuis Telegram. Vous créez autant de bots que vous voulez, chacun relié à
**un ou plusieurs agents**, et vous les gérez depuis la page **Telegram** d'Allkin : qui peut
leur écrire, quel agent répond, les conversations en cours. Chaque bot écoute en continu (long
polling : rien à ouvrir sur votre box, aucune adresse publique). Quand un agent veut lancer une
commande, elle arrive dans le chat avec deux boutons : **Autoriser** ou **Refuser**.

## Mise en route

1. Accordez les quatre droits de l'intégration, cochez **Autoriser le démarrage en service**,
   enregistrez, puis rechargez la page d'Allkin (la page Telegram s'ajoute à l'interface).
2. Ouvrez **Telegram** depuis la fenêtre Système, puis **Ajouter un bot** :
   - dans Telegram, écrivez `/newbot` à **@BotFather** : un nom, puis un identifiant qui finit par
     `bot`. Il vous répond par un **jeton** ;
   - collez le jeton : Allkin le vérifie auprès de Telegram et affiche le bot reconnu ;
   - choisissez le ou les agents qui répondent ; l'étoile désigne celui qui répond d'abord ;
   - **Lancer le bot**.
3. Écrivez au bot. Vous recevez un **code** et votre demande apparaît en haut de la page :
   **Autoriser**, et vous pouvez lui parler.

Plusieurs bots peuvent servir le même agent, et un bot peut servir plusieurs agents.

## La page Telegram

- **Le tableau des bots** : ses agents, les personnes qui peuvent lui écrire, les messages du jour
  et des sept derniers jours, le dernier message, son état (à l'écoute, en pause, en erreur — un
  jeton révoqué par exemple, avec ce qu'il faut faire).
- **Une ligne se déplie** sur les conversations du bot : qui parle à quel agent, ce qui a été dit
  en dernier, où en est la conversation (au travail, attend une validation, répondu), et un bouton
  pour l'ouvrir dans Allkin.
- **Les demandes d'accès** en haut : une personne inconnue qui écrit au bot reçoit un code ; vous
  l'autorisez ou la refusez d'un clic.
- Le menu **⋯** d'un bot : réglages, pause, lien d'invitation, ouvrir dans Telegram, supprimer.
- La recherche et le filtre par agent dans la barre de la page.

## Les réglages d'un bot

| Section    | Ce qu'on y règle                                                                                  |
|------------|---------------------------------------------------------------------------------------------------|
| Agents     | les agents du bot, celui par défaut ; changer d'agent avec `/agent` ; après combien de silence une nouvelle conversation commence |
| Accès      | les personnes autorisées, l'agent de chacune, qui peut valider les commandes ; les invitations ; les groupes |
| Validation | valider les commandes depuis Telegram, ou les refuser d'office                                     |
| Messages   | accepter les fichiers et photos (déposés dans `Upload/` de l'agent) ; « en train d'écrire… »      |
| Bot        | remplacer le jeton, le menu des commandes publié dans Telegram, la langue des messages du bot      |

Un **lien d'invitation** (`t.me/<bot>?start=…`) ajoute une personne en un message : valable
7 jours, une seule fois. Dans un **groupe**, le bot n'entre que si une personne autorisée l'y
ajoute et si les groupes sont acceptés ; il n'y répond qu'aux personnes autorisées, quand on le
mentionne ou qu'on lui répond.

## Dans le chat

| Commande  | Effet                                                              |
|-----------|--------------------------------------------------------------------|
| `/agent`  | choisir l'agent à qui l'on parle, parmi ceux du bot (en boutons)   |
| `/new`    | repartir sur une conversation vierge avec le même agent            |
| `/who`    | l'agent et la conversation de ce chat                              |
| `/help`   | ce que le bot comprend                                             |

Chaque chat garde sa conversation : elle survit aux redémarrages et se retrouve dans l'historique
de l'agent. Les **formulaires** qu'un agent peut demander ne se remplissent pas depuis Telegram :
ils sont annulés avec un mot d'explication.

## Réglages de l'intégration

- **Port local** : où le service sert l'API de la page, sur 127.0.0.1 seulement ; la page passe
  par Allkin, derrière votre session.
- **Adresse de l'API Telegram** : à ne changer que pour un serveur Bot API à vous.
- Les trois réglages **(ancienne version)** ne servent qu'une fois : le bot de la version
  précédente est repris dans la page, avec ses utilisateurs autorisés. Laissez-les vides ensuite.

## Droits

| Droit      | Pourquoi                                                                               |
|------------|----------------------------------------------------------------------------------------|
| Réseau     | interroger Telegram pour chaque bot, y renvoyer les réponses, télécharger les fichiers ; servir l'API de la page en local |
| Agents     | ouvrir une conversation avec un agent par la socket d'Allkin                           |
| Fichiers   | déposer les fichiers reçus dans le dossier Upload de l'agent                           |
| Interface  | ajouter la page Telegram à Allkin                                                      |

Le bot ne donne aucun droit : chaque agent garde exactement ceux de sa page. Les jetons restent
sur le serveur, dans le dossier privé de l'intégration ; ils ne sont jamais montrés ni donnés à
un agent.

## Quand ça ne marche pas

- **La page dit que le service ne répond pas** : ouvrez la page de l'intégration, vérifiez que
  les quatre droits sont accordés et que le service tourne ; son journal dit pourquoi il s'arrête.
- **Jeton refusé** : le jeton a été révoqué dans @BotFather. Menu ⋯ › Réglages › Bot ›
  Remplacer, avec le nouveau jeton du même bot.
- **Lu ailleurs** : un autre programme (un autre serveur, un webhook) lit les messages de ce
  bot ; un bot ne peut être lu que par un seul.
- **Le bot ne répond pas à quelqu'un** : sa demande attend peut-être en haut de la page.
