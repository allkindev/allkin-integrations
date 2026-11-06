# Forge

La Forge est l'atelier où **Coder**, l'agent système d'Allkin, fabrique et modifie avec vous des
intégrations, des services et des compétences — sans rien installer avant que vous l'ayez vu.

## Commencer

1. Installez l'intégration depuis la fenêtre **Ajouter** de la page Intégrations, accordez-lui
   son droit sur sa page et rechargez Allkin.
2. Ouvrez la **Forge** depuis la fenêtre Système, ou avec **Créer une intégration** sur la page
   Intégrations et **Créer un service** sur la page Services.
3. Dites ce que vous voulez — le type (intégration, service, compétence), votre demande, et si
   vous le souhaitez un point de départ : un logiciel tiers, une API, la documentation d'une
   API, une page, un agent, un fichier. **Commencer avec Coder** crée le squelette du projet
   dans l'espace de travail de Coder et ouvre sa conversation.

Coder a besoin d'être activé (sa page, groupe « Activation »).

## La page d'un projet

- **La bande** : le nom du projet, sa version installée et celle en cours, le résultat de la
  vérification ; les outils de l'aperçu (ordinateur ou téléphone, thème clair ou sombre,
  **Désigner**) ; Fichiers, Vérification, Ouvrir, **Installer** ou **Mettre à jour**, et le menu
  « ⋯ » (la conversation de Coder, le dossier, la page de l'intégration, revenir à la version
  installée, supprimer).
- **Les six étapes** de Coder : comprendre, planifier, maquetter, construire, vérifier,
  installer — faites, en cours, mises de côté, à venir —, avec une ligne sur l'étape en cours.
- **L'aperçu** : la page de l'intégration, dessinée depuis l'espace de travail de Coder sans
  l'installer, dans un cadre isolé. Un service ou une compétence n'a rien à montrer : la fiche
  de son manifeste prend la place. Une page servie par le service de l'intégration ne se voit
  qu'une fois installée.
- **La conversation** avec Coder flotte à droite (une feuille en bas sur un téléphone), repliée
  d'un clic. **Désigner** puis un clic sur un élément de l'aperçu le nomme en tête de votre
  message : « À propos de « Bouton Enregistrer » : … ».

Après chaque écriture de Coder, l'aperçu et la vérification sont relus. **Installer** passe par
la fenêtre d'installation de la page Intégrations, depuis le dépôt de Coder ; rien n'est installé
tant que la vérification signale une erreur.

## Modifier ce que la Forge a fabriqué

L'écran de départ, onglet **Modifier** : choisissez un projet de la Forge, dites ce qui doit
changer. La version installée continue de tourner pendant le travail ; la fenêtre Fichiers marque
ce qui diffère d'elle ; **Mettre à jour en 1.0.N** livre la nouvelle version, et « Revenir à la
version installée » abandonne la modification. Seul ce que la Forge a fabriqué se modifie ici :
rien de ce qui vient d'un dépôt ou d'une autre source.

## Ce que la Forge écrit, et où

Rien dans les fichiers du projet. La Forge note ce qu'elle sait d'un projet dans le dossier
partagé, dans son propre dossier `forge/` : `<type>-<id>.json` (votre demande, le point de
départ, la conversation) et `<type>-<id>.progress.json`, que **Coder écrit lui-même** pour dire
l'étape où il en est. Supprimer un projet le déplace dans la corbeille de l'espace de travail
de Coder ; ce qui est installé le reste.
