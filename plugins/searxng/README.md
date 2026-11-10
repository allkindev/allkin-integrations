# SearXNG

Un moteur de recherche à vous, sur votre machine. [SearXNG](https://github.com/searxng/searxng)
est un métamoteur libre : il interroge plusieurs moteurs de recherche à la fois, rassemble leurs
résultats, et ne garde ni profil ni historique. L'intégration l'installe et le lance elle-même,
**sans Docker**, puis en fait deux choses :

- **une page de recherche dans Allkin** — web, images, vidéos, actualités, informatique,
  sciences, avec le choix de la période ;
- **la recherche web de vos agents**, par le service « SearXNG » : sans clé, sans quota, sans
  passer par la recherche du fournisseur d'IA.

## Mise en route

1. Accordez les trois droits (voir plus bas pourquoi).
2. Cochez **Autoriser le démarrage en service**, puis enregistrez.
3. Ouvrez **SearXNG** depuis la fenêtre Système (le logo d'Allkin).

Au **premier démarrage**, l'intégration télécharge SearXNG et installe ses paquets Python dans
son dossier de données : comptez **une à quelques minutes**. La page dit où elle en est
(téléchargement, environnement Python, paquets), puis la recherche s'ouvre toute seule. Les
démarrages suivants prennent quelques secondes.

La machine doit avoir **git** et **Python 3.10 ou plus récent avec son module venv**. Sur Debian
et Ubuntu : `sudo apt install git python3 python3-venv`. S'il en manque un, la page le dit.

## Chercher

Tapez vos mots, <kbd>Entrée</kbd>. <kbd>/</kbd> ramène au champ de recherche. Les catégories et
la période sont dans la barre ; « Plus de résultats » en bas de page charge la suite. Un résultat
s'ouvre dans un nouvel onglet du navigateur ; son menu « ⋯ » copie le lien. Le pied de page compte
les résultats et dit combien de moteurs n'ont pas répondu (leur nom au survol).

## Donner la recherche à vos agents

1. Page **Services** → ajoutez le service **SearXNG**.
2. Adresse : `http://127.0.0.1:9350` (le port des réglages ci-dessous). Aucune clé.
3. Sur la page de l'agent, cochez le service **SearXNG**.

L'agent cherche alors par votre SearXNG : il reçoit pour chaque résultat le titre, l'adresse, un
extrait et les moteurs qui l'ont trouvé, sous une forme courte qui ménage sa mémoire de travail.

## Réglages

| Réglage                 | Rôle                                                                                   |
|-------------------------|----------------------------------------------------------------------------------------|
| Port local              | Port d'écoute de l'intégration sur `127.0.0.1` (défaut 9350) ; c'est l'adresse du service |
| Filtre de contenu       | Aucun, modéré ou strict : ce que SearXNG demande aux moteurs d'écarter                 |
| Mettre SearXNG à jour   | Une fois par semaine, au démarrage de l'intégration (activé par défaut)                |

Les moteurs interrogés sont ceux que SearXNG active par défaut. Son fichier de réglages est
réécrit à chaque démarrage à partir de ceux-ci : ne le modifiez pas à la main.

## Droits demandés

- **Réseau** — téléchargement de SearXNG et de ses paquets, écoute sur le port local, requêtes
  vers les moteurs de recherche à chaque recherche.
- **Exécution** — `git` et `python3` pour l'installation, puis SearXNG lui-même.
- **Interface** — la page de recherche : son onglet et son entrée dans la fenêtre Système.

SearXNG n'écoute que sur la machine (`127.0.0.1`) : votre page passe par Allkin, derrière votre
session, et rien n'est ouvert sur le réseau. Les recherches partent de l'adresse de **cette
machine** vers les moteurs : ils ne voient ni votre navigateur ni vos cookies, mais ils voient
cette adresse.

## Quand ça ne marche pas

- **« SearXNG est arrêté »** — les droits ne sont pas tous accordés, ou le service n'est pas
  autorisé à démarrer : ouvrez la page de l'intégration.
- **« SearXNG n'a pas pu démarrer »** — la page dit ce qui manque (git, Python, venv, connexion).
  Corrigez, puis **redémarrez** le service depuis la page de l'intégration ; son journal montre
  le détail.
- **Peu ou pas de résultats, « N moteurs n'ont pas répondu »** — les moteurs refusent parfois les
  requêtes d'un serveur pendant un moment (CAPTCHA, délai dépassé). Réessayez plus tard ; la mise
  à jour hebdomadaire de SearXNG corrige ce qui tient à un moteur qui a changé.
- **Repartir de zéro** — arrêtez le service, supprimez le dossier `runtime` du dossier de données
  de l'intégration, redémarrez : SearXNG est réinstallé.

Désinstaller l'intégration arrête SearXNG ; ses réglages et sa copie de SearXNG restent dans son
dossier de données : une réinstallation les retrouve.
