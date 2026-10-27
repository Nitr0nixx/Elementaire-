# Élémentaires

Jeu de cartes à collectionner fantasy, jouable dans le navigateur.
Les créatures gagnent de l'expérience et **évoluent selon l'élément de la case** où elles se trouvent (Feu, Eau, Terre, Air).

## Jouer

- **En ligne** : une fois GitHub Pages activé (voir `GUIDE-GITHUB.md`), le jeu est à l'adresse
  `https://<ton-pseudo>.github.io/elementaires/`
- **Sur ton ordinateur** : ouvre `index.html` dans un navigateur.

## Contenu du jeu

- **Modes** : Duel contre l'IA, Duo (2 contre 2) et Mêlée (chacun pour soi à 3 ou 4 joueurs).
- **IA** : 3 niveaux de difficulté (Facile, Normal, Difficile).
- **Decks** : 4 familles (Orage, Profondeurs, Cimes, Vapeur), avec un talent propre à chacune en Mêlée.
- **Collection** : boosters, fabrication de cartes, construction de decks et progression par niveaux.
- **Apparences rares** : cartes prismatiques, et cartes « pleine image » pour les légendaires.
- **Tutoriel** guidé, musique et bruitages générés dans le navigateur, animations.
- **Version physique** : le kit d'impression est dans `impression/`.

La progression est sauvegardée dans le navigateur (localStorage), séparément sur chaque appareil.

## Structure

```
index.html              le jeu complet, généré à partir de src/
img/                    illustrations des cartes, héros, terrains et plateau
src/
  shell.html            page HTML et styles
  engine.js             règles du jeu, IA (indépendant de l'affichage)
  art.js                illustrations de secours dessinées en SVG
  ui.js                 affichage de la partie et du menu
  sound.js              musique et bruitages (Web Audio)
  anim.js               animations
  meta.js               collection, boosters, decks, progression
  tuto.js               tutoriel et niveaux de difficulté
  boot.js               démarrage
build.py                assemble src/ en index.html
impression/             kit d'impression PDF (cartes, plateau, règles)
```

## Modifier le jeu

Ne modifie pas `index.html` directement : change les fichiers de `src/`, puis régénère-le :

```
python3 build.py
```

Ensuite, envoie les fichiers modifiés sur GitHub (`git add`, `git commit`, `git push`).
