# Mettre Élémentaires sur GitHub

## 1. Créer le dépôt

1. Connecte-toi sur https://github.com.
2. Clique sur **+** en haut à droite, puis sur **New repository**.
3. Nom du dépôt : `elementaires`.
4. Choisis **Public**. GitHub Pages gratuit l'exige ; en privé, il faut un compte payant.
5. Ne coche **aucune** case (pas de README, pas de .gitignore, pas de licence) : ils sont déjà dans ce dossier.
6. Clique sur **Create repository**.

## 2. Envoyer les fichiers

### Option A : en ligne de commande (recommandée)

Dézippe l'archive, ouvre un terminal dans le dossier `elementaires`, puis tape :

```
git init
git add .
git commit -m "Première version d'Élémentaires"
git branch -M main
git remote add origin https://github.com/<ton-pseudo>/elementaires.git
git push -u origin main
```

Au moment du `push`, GitHub demande une identification. Ton mot de passe ne marche pas ici : il faut un **jeton d'accès**.
Pour en créer un : Settings → Developer settings → Personal access tokens → Fine-grained tokens. Donne-lui l'accès en écriture (« Contents : Read and write ») au dépôt `elementaires`.

### Option B : GitHub Desktop

Installe GitHub Desktop, fais **File → Add local repository**, choisis le dossier `elementaires`, puis **Publish repository**.

### Option C : par le site, sans rien installer

Sur la page du dépôt vide, clique sur **uploading an existing file**.
Le site accepte au maximum 100 fichiers par envoi, et le dossier `img` en contient plus de 150. Fais donc plusieurs envois :

1. Tous les fichiers de la racine, ainsi que les dossiers `src` et `impression`.
2. Le dossier `img`, en deux fois : les fichiers de **a** à **m**, puis de **n** à **z**.

Le fichier `.nojekyll` est caché sur la plupart des ordinateurs. S'il manque, ce n'est pas grave.

## 3. Mettre le jeu en ligne avec GitHub Pages

1. Dans le dépôt, va dans **Settings → Pages**.
2. Dans « Build and deployment », choisis **Source : Deploy from a branch**.
3. Choisis la branche **main** et le dossier **/ (root)**, puis clique sur **Save**.
4. Attends 1 à 2 minutes. Le jeu est alors en ligne à l'adresse :
   `https://<ton-pseudo>.github.io/elementaires/`

## 4. Mettre à jour plus tard

1. Remplace les fichiers modifiés dans ton dossier.
2. Tape `git add .`, `git commit -m "description du changement"`, puis `git push`.

Le site se met à jour tout seul en une minute environ.

## À savoir

- **Sauvegarde** : la progression est enregistrée dans le navigateur de chaque joueur. Changer d'appareil, ou vider les données du navigateur, repart de zéro.
- **Droits** : sans fichier LICENSE, le code et les illustrations restent « tous droits réservés ». Les autres peuvent les voir, mais pas les réutiliser.
- **Multijoueur** : ce dépôt servira de base au serveur en ligne, prévu plus tard.
