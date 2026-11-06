# Navigateur

La vue en direct du navigateur de vos agents. Chaque agent qui a le droit « Navigateur » dispose
d'un Chrome à lui sur la machine d'Allkin, gardé entre les conversations avec les sessions que
vous y ouvrez. Cette intégration ouvre un onglet par agent où vous regardez la page qu'il manipule,
reprenez la main d'un clic, puis la lui rendez.

Les outils du navigateur — naviguer, lire la page, agir dessus, prendre une capture, gérer les
onglets — sont ceux d'Allkin, montés par le droit « Navigateur » de la page de l'agent. Sans
cette intégration, l'agent navigue quand même : vous voyez ses captures et ses actions dans la
conversation, mais pas la page en direct.

## Commencer

1. Dans **Paramètres › Navigateur**, installez le navigateur si ce n'est pas fait (un
   téléchargement d'environ 100 Mo, une fois).
2. Sur la page d'un agent, groupe **Droits**, cochez **Dispose de son navigateur** ; cochez
   **Peut agir sur les pages** s'il doit remplir des formulaires, cliquer, choisir.
3. Installez cette intégration, accordez-lui son droit et rechargez Allkin.
4. Demandez quelque chose à l'agent : dès qu'il ouvre son navigateur, l'onglet **Navigateur**
   s'ouvre à côté de la conversation.

## L'écran

La barre porte **Précédent**, **Suivant**, **Recharger**, l'adresse, la liste des onglets du
navigateur et un menu **⋯** (ouvrir l'adresse dans votre propre navigateur, la copier, fermer le
navigateur de l'agent). Dessous, la page en direct ; au pied, l'état de la diffusion, **Capture**
(l'image telle qu'elle est) et **Ajuster | Taille réelle**.

La **capsule** au bas de la page dit qui a la main : « Plume navigue · la page » avec un liseré
indigo autour de la page, ou « Vous avez la main · Plume attend ».

## Reprendre la main

Un clic sur **Reprendre la main** : votre souris et votre clavier vont à la page, l'adresse
s'ouvre, les onglets vous obéissent. L'agent est prévenu à son prochain outil et attend. C'est
ainsi que vous vous connectez à un site, passez un captcha ou corrigez un formulaire : ce que
vous tapez va à Chrome et nulle part ailleurs, ni dans la conversation, ni dans le journal.
<kbd>Échap</kbd> ou **Rendre la main** redonne la page à l'agent, qui la relit avant d'agir.

## Ce que l'agent fait, et ce qu'il demande

- Naviguer et lire ne demandent rien : lire le web est déjà un droit sans carte.
- **Une séquence d'actions, une carte** dans la conversation, avec chaque pas nommé par
  l'élément qu'il touche. Vous l'approuvez une fois, ou **pour cette session, sur ce site**.
- L'agent ne tape jamais un mot de passe : Allkin refuse, et il vous passe la main.
- Les téléchargements atterrissent dans le dossier `Downloads/` de l'agent.

## Le Chrome de votre propre ordinateur

Quand Allkin Client est ouvert sur ce serveur et que son réglage **Navigateur** est allumé pour
ce serveur, un agent qui a aussi le droit **Vos ordinateurs** peut ouvrir **le Chrome de votre
PC**, sous vos yeux : la fenêtre apparaît sur votre écran, dans un profil « Allkin » à part (vos
sessions y restent d'une fois sur l'autre, vos mots de passe n'y sont pas), et l'agent y
navigue comme dans le sien. Un clic ou une touche de votre part dans la fenêtre reprend la
main : l'agent attend, et reprend quinze secondes après votre dernier geste. Fermer la fenêtre
ferme le navigateur de l'agent, qui ne le rouvre pas de lui-même. Les cartes et les lignes de la
conversation disent « Dans le Chrome de … ». Cette intégration n'ouvre pas d'onglet pour ce
navigateur-là — il est sur votre écran —, mais **Paramètres › Navigateur › Voir** le montre
quand même, depuis un téléphone par exemple.

## Ce que le navigateur n'atteint pas

Le réseau de la machine (localhost, adresses privées, Tailscale) reste hors de portée tant que
vous ne l'ouvrez pas dans **Paramètres › Navigateur** ; les sites que vous y interdisez sont hors
de portée de tous les agents. Un navigateur se ferme seul après un temps sans demande ni regard ;
le nombre de navigateurs ouverts à la fois est plafonné. Chaque action laisse une ligne dans le
journal, catégorie **Navigateur**.
