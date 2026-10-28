// --- Sauvegarde : export / import de la progression, et reprise de la partie en cours ---

// ===== Export / import =====
const b64u = {
  enc(bytes){ let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec(str){ const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(s.length); for (let k = 0; k < s.length; k++) out[k] = s.charCodeAt(k); return out; }
};
async function zip(bytes, mode){
  const st = new Blob([bytes]).stream().pipeThrough(mode === 'c' ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(st).arrayBuffer());
}
function savePayload(){ return {app: 'elementaires', v: 1, at: new Date().toISOString(), save: SAVE}; }
async function exportCode(){
  const raw = new TextEncoder().encode(JSON.stringify(savePayload()));
  if (typeof CompressionStream === 'function'){ try { return 'ELEM1.' + b64u.enc(await zip(raw, 'c')); } catch (e) {} }
  return 'ELEM0.' + b64u.enc(raw);
}
async function decodeImport(text){
  text = String(text || '').trim();
  let obj = null;
  if (text.startsWith('{')) obj = JSON.parse(text);
  else {
    const m = text.replace(/\s+/g, '').match(/^ELEM([01])\.([A-Za-z0-9_-]+)$/);
    if (!m) throw new Error('format');
    let bytes = b64u.dec(m[2]);
    if (m[1] === '1') bytes = await zip(bytes, 'd');
    obj = JSON.parse(new TextDecoder().decode(bytes));
  }
  if (!obj || obj.app !== 'elementaires') throw new Error('format');
  const s = sanitizeSave(obj.save);
  if (!s) throw new Error('contenu');
  return {save: s, at: obj.at};
}
// Une sauvegarde importée n'est jamais prise telle quelle : chaque champ est vérifié et borné
function sanitizeSave(o){
  if (!o || typeof o !== 'object' || !o.coll || !Array.isArray(o.decks)) return null;
  const int = (v, lo, hi, d) => Number.isFinite(+v) ? Math.max(lo, Math.min(hi, Math.floor(+v))) : d;
  const ids = new Set(BASE_IDS);
  const s = {v: 1, created: typeof o.created === 'string' ? o.created.slice(0, 10) : today(),
    coins: int(o.coins, 0, 1e7, 0), xp: int(o.xp, 0, 1e7, 0), level: int(o.level, 1, 999, 1), packs: int(o.packs, 0, 999, 0),
    coll: {}, decks: [], active: null, stats: {games: int(o.stats && o.stats.games, 0, 1e7, 0), wins: int(o.stats && o.stats.wins, 0, 1e7, 0)},
    lastWin: typeof o.lastWin === 'string' ? o.lastWin.slice(0, 10) : null, tutoDone: !!o.tutoDone,
    diff: ['easy', 'normal', 'hard'].includes(o.diff) ? o.diff : 'normal',
    prism: {}, prismOff: {}, full: {}, look: {}};
  BASE_IDS.forEach(id => { s.coll[id] = int(o.coll[id], 0, MAX_COPIES, 0); });
  const flagSet = (src, allowed) => { const r = {}; if (src && typeof src === 'object') for (const k in src) if (allowed.has(k) && src[k]) r[k] = 1; return r; };
  s.prism = flagSet(o.prism, ids); s.prismOff = flagSet(o.prismOff, ids); s.full = flagSet(o.full, new Set(FULL_IDS));
  if (o.look && typeof o.look === 'object') for (const k in o.look) if (ids.has(k) && ['n', 'p', 'f'].includes(o.look[k])) s.look[k] = o.look[k];
  o.decks.slice(0, 8).forEach(d => {
    if (!d || !Array.isArray(d.list)) return;
    const cnt = {}, list = d.list.filter(id => ids.has(id) && (cnt[id] = (cnt[id] || 0) + 1) <= MAX_COPIES).slice(0, DECK_SIZE);
    const id = String(d.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24) || 'd' + Math.random().toString(36).slice(2, 9);
    if (!s.decks.some(x => x.id === id)) s.decks.push({id, name: String(d.name || 'Deck').replace(/[<>&"]/g, '').slice(0, 28), list});
  });
  if (!s.decks.length) return null;
  s.active = s.decks.some(d => d.id === o.active) ? o.active : s.decks[0].id;
  return s;
}
const saveSummary = s => `niveau ${s.level} · ${BASE_IDS.reduce((a, id) => a + (s.coll[id] || 0), 0)}/80 cartes · ${s.coins} Éclats · ${s.decks.length} deck${s.decks.length > 1 ? 's' : ''}`;
let pendingImport = null;
function openSaveModal(){
  pendingImport = null;
  const m = $('#saveModal');
  m.innerHTML = `<div class="sheet orn spikes m-gold"><div class="sheet-in sv">
    <h2>Sauvegarde</h2>
    <p class="c-note">Ta progression : <b>${saveSummary(SAVE)}</b>.</p>
    <h4>Exporter</h4>
    <p>Garde une copie de ta progression, ou transfère-la sur un autre appareil ou une autre version du jeu.</p>
    <div class="sv-row"><button class="btn-end m-gold" type="button" id="svCopy"><span>Copier le code</span></button>
      <button class="btn-end m-gold alt" type="button" id="svFile"><span>Télécharger le fichier</span></button></div>
    <h4>Importer</h4>
    <p>Colle un code de sauvegarde, ou choisis un fichier <code>.json</code> exporté depuis le jeu.</p>
    <textarea id="svIn" rows="3" spellcheck="false" placeholder="ELEM1.…"></textarea>
    <div class="sv-row"><button class="btn-end m-gold" type="button" id="svCheck"><span>Importer ce code</span></button>
      <label class="btn-end m-gold alt sv-file"><span>Choisir un fichier</span><input type="file" id="svPick" accept=".json,application/json,text/plain"></label></div>
    <div id="svConfirm"></div>
    <p class="sv-msg" id="svMsg" role="status" aria-live="polite"></p>
    <div class="menu-row"><button class="ghost banner" type="button" data-sv-close><span>Fermer</span></button></div>
  </div></div>`;
  m.hidden = false;
}
function svMsg(t, err){ const e = $('#svMsg'); if (e){ e.textContent = t; e.classList.toggle('err', !!err); } }
async function svShowImport(text){
  try {
    const r = await decodeImport(text);
    pendingImport = r.save;
    $('#svConfirm').innerHTML = `<div class="sv-cmp orn m-gold"><p><b>Sauvegarde trouvée</b>${r.at ? ` (exportée le ${new Date(r.at).toLocaleDateString('fr-FR')})` : ''} : ${saveSummary(r.save)}.</p>
      <p>Elle va <b>remplacer</b> ta progression actuelle (${saveSummary(SAVE)}).</p>
      <button class="btn-end m-gold" type="button" id="svApply"><span>Remplacer ma progression</span></button></div>`;
    svMsg('');
  } catch (e) {
    pendingImport = null; $('#svConfirm').innerHTML = '';
    svMsg(e.message === 'contenu' ? 'Ce code ne contient pas de sauvegarde valide.' : "Ce n'est pas un code de sauvegarde d'Élémentaires.", true);
  }
}
async function svDownload(){
  const name = `elementaires-sauvegarde-${today()}.json`, data = JSON.stringify(savePayload(), null, 1);
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl){ await dl.save({filename: name, data}); svMsg('Fichier enregistré.'); return; }
  } catch (e) { if (e && e.code === 'declined') return svMsg('Téléchargement annulé.'); }
  try {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], {type: 'application/json'})); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    svMsg('Fichier téléchargé.');
  } catch (e) { svMsg("Le téléchargement n'est pas possible ici : utilise « Copier le code ».", true); }
}
$('#saveModal').addEventListener('click', async e => {
  const t = e.target;
  if (t.id === 'saveModal' || t.closest('[data-sv-close]')){ $('#saveModal').hidden = true; return; }
  if (t.closest('#svCopy')){
    const code = await exportCode();
    try { await navigator.clipboard.writeText(code); svMsg(`Code copié (${code.length} caractères). Colle-le dans un message ou une note pour le garder.`); }
    catch (x) { $('#svIn').value = code; $('#svIn').select(); svMsg('Copie automatique impossible : le code est dans la zone ci-dessus, copie-le à la main.'); }
    return;
  }
  if (t.closest('#svFile')){ svDownload(); return; }
  if (t.closest('#svCheck')){ svShowImport($('#svIn').value); return; }
  if (t.closest('#svApply') && pendingImport){
    SAVE = pendingImport; pendingImport = null; persist(); clearGame(); S = null;
    $('#saveModal').hidden = true; SND.play('evolve'); showMenu();
    return;
  }
});
$('#saveModal').addEventListener('change', e => {
  if (e.target.id !== 'svPick' || !e.target.files || !e.target.files[0]) return;
  const f = e.target.files[0];
  if (f.size > 200000) return svMsg('Ce fichier est trop gros pour être une sauvegarde.', true);
  f.text().then(svShowImport).catch(() => svMsg('Fichier illisible.', true));
});

// ===== Reprise de la partie en cours (parties hors ligne : IA, Duo, Mêlée) =====
const GAME_KEY = 'elementaires-partie-v1';
let gameSaveT = null;
function canSaveGame(){ return S && !S.net && !S.tuto && !TUTO && !S.done && !over() && !busy && S.active === 0 && SAVE; }
function saveGameSoon(){
  clearTimeout(gameSaveT);
  gameSaveT = setTimeout(() => {
    if (!canSaveGame()) return;
    try {
      const snap = clone(S); snap.fx = [];
      localStorage.setItem(GAME_KEY, JSON.stringify({v: 1, at: Date.now(), S: snap, deck4: DECKS[4] || null}));
    } catch (e) {}
  }, 400);
}
function clearGame(){ clearTimeout(gameSaveT); try { localStorage.removeItem(GAME_KEY); } catch (e) {} }
function restoreGame(){
  try {
    const raw = localStorage.getItem(GAME_KEY); if (!raw) return false;
    const o = JSON.parse(raw), G = o && o.S;
    if (!G || !Array.isArray(G.players) || !Array.isArray(G.board) || !Array.isArray(G.teams) || G.winner !== null || G.net || G.tuto) { clearGame(); return false; }
    if (Date.now() - (o.at || 0) > 14 * 864e5){ clearGame(); return false; }   // au-delà de deux semaines, on oublie
    if (G.players.some(P => P.deckId === 4)){
      if (!o.deck4 || !Array.isArray(o.deck4.list)) { clearGame(); return false; }
      DECKS[4] = deckSpec({name: String(o.deck4.name || 'Deck').slice(0, 28), list: o.deck4.list});
      G.custom = DECKS[4];
    }
    if (G.players.some(P => !DECKS[P.deckId])) { clearGame(); return false; }
    G.fx = []; G.done = false; G.restored = true;
    S = G; mode = G.mode === 'duo' ? 'duo' : G.mode === 'ffa' ? 'ffa' : 'ai';
    return true;
  } catch (e) { clearGame(); return false; }
}
