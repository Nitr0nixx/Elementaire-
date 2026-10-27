s=open('src/shell.html').read()
for k,f in [('ENGINE','engine.js'),('ART','art.js'),('UI','ui.js'),('SOUND','sound.js'),('ANIM','anim.js'),('META','meta.js'),('TUTO','tuto.js'),('BOOT','boot.js')]:
    s=s.replace('/*%s*/'%k, open('src/'+f).read())
open('index.html','w').write(s)
