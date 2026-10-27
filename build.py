s=open('src/shell.html').read()
for k,f in [('ENGINE','engine.js'),('ART','art.js'),('UI','ui.js'),('SOUND','sound.js'),('ANIM','anim.js'),('META','meta.js'),('TUTO','tuto.js'),('BOOT','boot.js')]:
    s=s.replace('/*%s*/'%k, open('src/'+f).read())

# Version autonome (GitHub Pages, ouverture locale) : page HTML complète
HEAD = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#120c07">
"""
standalone = HEAD + s
open('index.html','w').write(standalone)
