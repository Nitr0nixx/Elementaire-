// --- Collection, decks et progression ---
const BASE_IDS = DECKS.slice(0, 4).flatMap(D => D.cards);
const RARITY = {};
['dragon', 'tortue', 'roc', 'serpent'].forEach(id => RARITY[id] = 'L');
['golem', 'treant', 'colosse', 'vapeurel', 'bouledefeu', 'raz', 'chute', 'vapeur'].forEach(id => RARITY[id] = 'E');
['faucon', 'sirene', 'hibou', 'crapaud', 'griffon', 'kraken', 'ours', 'chien'].forEach(id => RARITY[id] = 'R');
BASE_IDS.forEach(id => { if (!RARITY[id]) RARITY[id] = 'C'; });
const RAR = {C:{name:'Commune', craft:40, dust:10}, R:{name:'Rare', craft:100, dust:25}, E:{name:'Épique', craft:250, dust:60}, L:{name:'Légendaire', craft:600, dust:150}};
const PACK_PRICE = 300, DECK_SIZE = 20, MAX_COPIES = 2;
// Cartes prismatiques : version purement esthétique d'une carte (aucun effet sur le jeu)
const PRISM_CHANCE = .025, prismCost = id => RAR[RARITY[id]].craft * 4;
function hasPrism(id){ return !!(SAVE && SAVE.prism && SAVE.prism[id]); }
// Pleine image : illustration sur toute la carte, réservée aux légendaires
const FULL_IDS = ['dragon', 'tortue', 'roc', 'serpent'], FULL_CHANCE = .125, FULL_COST = 3000;
function hasFull(id){ return !!(SAVE && SAVE.full && SAVE.full[id]); }
// Apparence choisie : n = normale, p = prismatique, f = pleine image
function lookOf(id){
  if (!SAVE) return 'n';
  const l = SAVE.look && SAVE.look[id];
  if (l === 'f' && hasFull(id)) return 'f';
  if (l === 'p' && hasPrism(id)) return 'p';
  if (l === 'n' || (SAVE.prismOff && SAVE.prismOff[id] && !l)) return 'n';
  return hasFull(id) ? 'f' : hasPrism(id) ? 'p' : 'n';
}
function isPrism(id){ return lookOf(id) === 'p'; }
function isFull(id){ return lookOf(id) === 'f'; }
const fullCount = () => SAVE && SAVE.full ? Object.keys(SAVE.full).length : 0;
const prismCount = () => SAVE && SAVE.prism ? Object.keys(SAVE.prism).length : 0;
function legendOf(fam){ return DECKS[fam].cards.find(id => RARITY[id] === 'L'); }
const byRarity = r => BASE_IDS.filter(id => RARITY[id] === r);
const xpNeed = lvl => 200 + 100 * (lvl - 1);
const today = () => new Date().toISOString().slice(0, 10);

let SAVE = null, store = 'memory', dbRef = null, saving = Promise.resolve();
const LS_KEY = 'elementaires-save-v1';

function famOf(list){
  const n = {};
  list.forEach(id => { const el = CARDS[id].el; n[el] = (n[el] || 0) + 1; });
  const els = Object.keys(n).sort((a, b) => n[b] - n[a]);
  if (els.length < 2) els.push(els[0] || 'F');
  const pair = els.slice(0, 2);
  let fam = [0, 1, 2, 3].find(k => DECKS[k].els.every(e => pair.includes(e)) && pair.every(e => DECKS[k].els.includes(e)));
  if (fam === undefined) fam = {F:0, E:3, T:1, A:2}[pair[0]];
  return {fam, els: pair};
}
function deckSpec(d){
  const {fam, els} = famOf(d.list), F = DECKS[fam];
  return {name:d.name, the:`ton deck « ${d.name} »`, hero:F.hero, plate:F.plate, els, talent:talentOfDeck(fam), fam, list:[...d.list], cards:[...new Set(d.list)]};
}
function validDeck(d){
  if (!d || d.list.length !== DECK_SIZE) return false;
  const c = {};
  return d.list.every(id => { c[id] = (c[id] || 0) + 1; return CARDS[id] && c[id] <= MAX_COPIES && c[id] <= (SAVE.coll[id] || 0); });
}

// --- Sauvegarde : base de données de l'artefact, sinon le navigateur ---
async function loadSave(){
  let local = null;
  try { const raw = localStorage.getItem(LS_KEY); if (raw) local = JSON.parse(raw); } catch (e) {}
  try {
    const c = window.claude;
    if (c && c.use){
      const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
      const id = user ? await user.id() : null;
      if (db && id){
        dbRef = db.doc(`data/users/${id}/save`);
        const snap = await dbRef.get();
        store = 'db';
        if (snap.exists) return JSON.parse(JSON.stringify(snap.data()));
        if (local){ persist(local); return local; }
        return null;
      }
    }
  } catch (e) { dbRef = null; }
  store = local !== undefined ? 'local' : 'memory';
  return local;
}
function persist(s){
  const data = JSON.parse(JSON.stringify(s || SAVE));
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); if (store === 'memory') store = 'local'; } catch (e) {}
  if (dbRef){
    saving = saving.then(() => dbRef.set(data)).catch(err => {
      if (err && (err.code === 'invalid_argument' || err.code === 'revoked' || err.code === 'not_granted')){ dbRef = null; store = 'local'; renderProfile(); }
    });
  }
}
function newSave(fam){
  const coll = {};
  BASE_IDS.forEach(id => coll[id] = 0);
  DECKS[fam].cards.forEach(id => coll[id] = 2);
  const list = DECKS[fam].cards.flatMap(id => [id, id]);
  return {v:1, created:today(), coins:0, xp:0, level:1, packs:2, coll, prism:{[legendOf(fam)]:1}, prismOff:{}, decks:[{id:'d' + Date.now(), name:DECKS[fam].name, list}], active:null, stats:{games:0, wins:0}, lastWin:null};
}

// --- Récompenses de fin de partie ---
const DIFF = {easy:{name:'Facile', mult:.5}, normal:{name:'Normal', mult:1}, hard:{name:'Difficile', mult:1.5}};
function grantRewards(){
  if (!SAVE || S.rewarded || S.practice) return '';
  S.rewarded = true;
  if (S.tuto){
    if (S.winner === 0 && !SAVE.tutoDone){ SAVE.tutoDone = true; SAVE.packs++; persist(); return `<div class="rewards"><p><b>Tutoriel terminé !</b> +1 booster offert.</p></div>`; }
    if (S.winner === 0) return `<div class="rewards"><p><b>Tutoriel terminé.</b></p></div>`;
    return `<div class="rewards"><p>Tu peux relancer le tutoriel depuis le menu.</p></div>`;
  }
  let coins, label;
  if (S.ffa){
    const N = S.players.length, order = S.outOrder || [];
    const place = S.winner === 0 ? 1 : (S.players[0].out ? N - order.indexOf(0) : 1);
    coins = place === 1 ? 150 : place === 2 ? 90 : 50; label = place === 1 ? 'Victoire en Mêlée' : `${place}e place en Mêlée`;
  } else if (S.duo){ coins = S.winner === 0 ? 120 : 50; label = S.winner === 0 ? 'Victoire en Duo' : 'Défaite en Duo'; }
  else { coins = S.winner === 0 ? 100 : S.winner === -1 ? 60 : 40; label = S.winner === 0 ? 'Victoire' : S.winner === -1 ? 'Égalité' : 'Défaite'; }
  const dm = DIFF[S.diff || 'normal'] || DIFF.normal;
  coins = Math.round(coins * dm.mult / 5) * 5;
  if (dm.mult !== 1) label += ` · ${dm.name} ×${String(dm.mult).replace('.', ',')}`;
  const won = S.winner === 0;
  let bonus = 0;
  if (won && SAVE.lastWin !== today()){ bonus = 100; SAVE.lastWin = today(); }
  SAVE.coins += coins + bonus; SAVE.xp += coins + bonus;
  SAVE.stats.games++; if (won) SAVE.stats.wins++;
  let ups = 0;
  while (SAVE.xp >= xpNeed(SAVE.level)){ SAVE.xp -= xpNeed(SAVE.level); SAVE.level++; SAVE.packs++; ups++; }
  persist();
  return `<div class="rewards"><p><b>${label}</b> : +${coins} Éclats${bonus ? ` · <b>première victoire du jour</b> : +${bonus}` : ''}</p>
    ${ups ? `<p class="lvl">Niveau ${SAVE.level} ! +${ups} booster${ups > 1 ? 's' : ''} offert${ups > 1 ? 's' : ''}.</p>` : ''}
    <div class="xpbar"><i style="width:${SAVE.xp / xpNeed(SAVE.level) * 100}%"></i><span>Niveau ${SAVE.level} · ${SAVE.xp}/${xpNeed(SAVE.level)} XP</span></div></div>`;
}

// --- Boosters ---
function rollCard(r){ const pool = byRarity(r); return pool[Math.floor(Math.random() * pool.length)]; }
function openPack(){
  if (!SAVE.packs) return null;
  SAVE.packs--;
  const x = Math.random(), last = x < .06 ? 'L' : x < .30 ? 'E' : 'R';
  const cards = [rollCard('C'), rollCard('C'), rollCard('C'), rollCard('R'), rollCard(last)];
  SAVE.prism = SAVE.prism || {}; SAVE.full = SAVE.full || {};
  const out = cards.map(id => {
    if (FULL_IDS.includes(id) && Math.random() < FULL_CHANCE){
      const was = SAVE.full[id], extra = was ? 600 : 0; SAVE.full[id] = 1;
      if (!was){ SAVE.look = SAVE.look || {}; SAVE.look[id] = 'f'; }
      if ((SAVE.coll[id] || 0) < MAX_COPIES){ SAVE.coll[id] = (SAVE.coll[id] || 0) + 1; SAVE.coins += extra; return {id, dust:extra, isNew: SAVE.coll[id] === 1, fl:true, flNew:!was}; }
      const d = RAR.L.dust + extra; SAVE.coins += d; return {id, dust:d, isNew:false, fl:true, flNew:!was};
    }
    const pz = Math.random() < PRISM_CHANCE;
    let prism = false, extra = 0;
    if (pz){ if (!SAVE.prism[id]){ SAVE.prism[id] = 1; prism = true; } else extra = RAR[RARITY[id]].craft; }
    if ((SAVE.coll[id] || 0) < MAX_COPIES){ SAVE.coll[id] = (SAVE.coll[id] || 0) + 1; SAVE.coins += extra; return {id, dust:extra, isNew: SAVE.coll[id] === 1, prism, pz}; }
    const d = RAR[RARITY[id]].dust + extra; SAVE.coins += d; return {id, dust:d, isNew:false, prism, pz};
  });
  persist();
  return out;
}

// --- Interface : profil, choix du deck de départ, collection ---
const ownedTotal = () => BASE_IDS.reduce((a, id) => a + (SAVE.coll[id] || 0), 0);
function renderProfile(){
  const el = $('#profile');
  if (!SAVE){ el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="pf-lvl"><b>${SAVE.level}</b><small>niveau</small></div>
    <div class="pf-mid"><div class="xpbar"><i style="width:${SAVE.xp / xpNeed(SAVE.level) * 100}%"></i><span>${SAVE.xp}/${xpNeed(SAVE.level)} XP</span></div>
    <div class="pf-row"><span class="coin">${SAVE.coins}</span><span class="pk">${SAVE.packs} booster${SAVE.packs > 1 ? 's' : ''}</span><span>${ownedTotal()}/80 cartes</span></div>
    ${store !== 'db' ? `<small class="pf-warn">${store === 'local' ? 'Progression enregistrée dans ce navigateur seulement.' : 'Progression non enregistrée sur cet appareil.'}</small>` : ''}</div>
    <button class="ghost banner" type="button" id="mColl"><span>Collection</span></button>`;
  $('#mColl').onclick = () => openColl('decks');
}
function renderStarter(){
  $('#starterList').innerHTML = DECKS.slice(0, 4).map((D, k) => `
    <button class="deck-opt orn el-${D.plate} ${pick === k ? 'on' : ''}" type="button" data-deck="${k}" aria-pressed="${pick === k}">
      <span class="d-medal medal">${heroPic(D, k)}</span>
      <span class="d-body"><span class="d-name">${D.name}</span>
        <span class="d-tags">${D.els.map(el => `<i class="el-${el}">${EL_NAME[el]}</i>`).join('')}<b>${DECK_INFO[k].style}</b></span>
        <span class="d-desc">${DECK_INFO[k].desc}</span>
        <span class="d-thumbs">${DECK_INFO[k].show.map(thumb).join('')}</span></span>
      <span class="d-check" aria-hidden="true">✓</span></button>`).join('');
}
$('#starterList').addEventListener('click', e => { const b = e.target.closest('.deck-opt'); if (!b) return; pick = +b.dataset.deck; renderStarter(); });
$('#mStarterGo').addEventListener('click', () => {
  SAVE = newSave(pick < 4 ? pick : 0); SAVE.active = SAVE.decks[0].id; persist();
  showMenu();
});

// Liste des decks du joueur pour lancer une partie
function activeDeck(){ return SAVE && (SAVE.decks.find(d => d.id === SAVE.active && validDeck(d)) || SAVE.decks.find(validDeck)); }
function deckRowHTML(d, on){
  const sp = deckSpec(d), F = DECKS[sp.fam];
  const top = [...new Set(d.list)].sort((a, b) => 'LERC'.indexOf(RARITY[a]) - 'LERC'.indexOf(RARITY[b])).slice(0, 3);
  const ok = validDeck(d);
  return `<button class="deck-opt orn el-${F.plate} ${on ? 'on' : ''} ${ok ? '' : 'bad'}" type="button" data-id="${d.id}" aria-pressed="${on}" ${ok ? '' : 'disabled'}>
    <span class="d-medal medal">${heroPic(F, sp.fam)}</span>
    <span class="d-body"><span class="d-name">${esc(d.name)}</span>
      <span class="d-tags">${sp.els.map(el => `<i class="el-${el}">${EL_NAME[el]}</i>`).join('')}<b>${TALENTS[sp.talent].name}</b></span>
      <span class="d-desc">${ok ? `${d.list.length} cartes · talent de Mêlée : ${TALENTS[sp.talent].name}` : 'Deck incomplet : termine-le dans la collection.'}</span>
      <span class="d-thumbs">${top.map(thumb).join('')}</span></span>
    <span class="d-check" aria-hidden="true">✓</span></button>`;
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
renderDecks = function(){
  const a = activeDeck();
  $('#deckList').innerHTML = SAVE.decks.map(d => deckRowHTML(d, a && d.id === a.id)).join('') +
    `<button class="ghost banner" type="button" id="dlEdit"><span>Gérer mes decks</span></button>`;
  $('#dlEdit').onclick = () => openColl('decks');
  $('#mStart').disabled = !a;
};
$('#deckList').addEventListener('click', e => {
  const b = e.target.closest('.deck-opt[data-id]'); if (!b) return;
  e.stopImmediatePropagation();
  SAVE.active = b.dataset.id; persist(); renderDecks();
}, true);
function registerActive(){
  const d = activeDeck(); if (!d) return false;
  DECKS[4] = deckSpec(d); pick = 4;
  return true;
}

// --- Écran Collection ---
let collTab = 'decks', filterEl = 'all', editing = null, packReveal = null, detailId = null;
function openColl(tab){
  collTab = tab || collTab; editing = null; packReveal = null; detailId = null;
  $('#menu').hidden = true; $('#game').hidden = true; $('#coll').hidden = false;
  document.body.classList.add('on-menu'); screen = 'coll';
  renderColl(); window.scrollTo(0, 0);
}
function closeColl(){ $('#coll').hidden = true; showMenu(); }
function miniCard(id, opts = {}){
  const n = SAVE.coll[id] || 0, r = RARITY[id];
  return `<button class="cc ${n ? '' : 'none'} ${opts.cls || ''}" type="button" data-card="${id}" ${opts.disabled ? 'disabled' : ''}>
    <span class="card el-${CARDS[id].el}">${cardFace(cardData(id))}</span>
    <span class="rar r-${r}" title="${RAR[r].name}"></span>${hasFull(id) ? '<span class="pz-mark fl" title="Pleine image obtenue">★</span>' : hasPrism(id) ? '<span class="pz-mark" title="Version prismatique obtenue">✦</span>' : ''}
    ${opts.badge !== undefined ? `<span class="cnt">${opts.badge}</span>` : `<span class="cnt">${n}/${MAX_COPIES}</span>`}
  </button>`;
}
function filteredIds(){ return BASE_IDS.filter(id => filterEl === 'all' || CARDS[id].el === filterEl).sort((a, b) => CARDS[a].cost - CARDS[b].cost || CARDS[a].name.localeCompare(CARDS[b].name)); }
function filterBar(){
  return `<div class="seg fl">${[['all', 'Toutes'], ['F', 'Feu'], ['E', 'Eau'], ['T', 'Terre'], ['A', 'Air']].map(([k, t]) => `<button type="button" data-fl="${k}" aria-pressed="${filterEl === k}">${t}</button>`).join('')}</div>`;
}
function renderColl(){

  $('#collHead').innerHTML = `<button class="ghost banner" type="button" id="cBack"><span>Retour</span></button>
    <div class="ch-res"><span class="coin">${SAVE.coins}</span><span class="pk">${SAVE.packs}</span></div>`;
  $('#cBack').onclick = () => { if (editing){ editing = null; renderColl(); } else if (packReveal){ packReveal = null; renderColl(); } else closeColl(); };
  document.querySelectorAll('#collTabs [data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === collTab)));
  $('#collTabs').hidden = !!(editing || packReveal);
  let h = '';
  if (editing) h = editorHTML();
  else if (packReveal) h = revealHTML();
  else if (collTab === 'cards') h = filterBar() + `<p class="c-note">${ownedTotal()}/80 cartes · <span class="pz-ico">✦</span> ${prismCount()}/${BASE_IDS.length} prismatiques · <span class="pz-ico fl">★</span> ${fullCount()}/${FULL_IDS.length} pleines images · touche une carte pour la voir ou la fabriquer.</p><div class="cgrid">${filteredIds().map(id => miniCard(id)).join('')}</div>`;
  else if (collTab === 'shop') h = shopHTML();
  else h = decksHTML();
  $('#collBody').innerHTML = h;
  fitNames($('#collBody'));
  if (detailId) showDetail(detailId);
}
// Decks
function decksHTML(){
  const a = activeDeck();
  return `<div class="deck-list">${SAVE.decks.map(d => `<div class="dk-wrap">${deckRowHTML(d, a && d.id === a.id)}
      <div class="dk-acts"><button class="ghost banner" type="button" data-edit="${d.id}"><span>Modifier</span></button>
      ${SAVE.decks.length > 1 ? `<button class="ghost banner" type="button" data-del="${d.id}"><span>${confirmDel === d.id ? 'Confirmer' : 'Supprimer'}</span></button>` : ''}</div></div>`).join('')}</div>
    ${SAVE.decks.length < 8 ? `<button class="btn-end m-gold" type="button" id="dkNew"><span>Nouveau deck<small>${DECK_SIZE} cartes, ${MAX_COPIES} exemplaires au plus par carte</small></span></button>` : ''}`;
}
let confirmDel = null;
function editorHTML(){
  const d = editing, cnt = {};
  d.list.forEach(id => cnt[id] = (cnt[id] || 0) + 1);
  const sp = d.list.length ? deckSpec(d) : null;
  const rows = Object.keys(cnt).sort((a, b) => CARDS[a].cost - CARDS[b].cost || CARDS[a].name.localeCompare(CARDS[b].name))
    .map(id => `<button class="dl-row el-${CARDS[id].el}" type="button" data-rm="${id}"><span class="dl-c">${CARDS[id].cost}</span><span class="dl-n">${CARDS[id].name}</span><span class="dl-x">×${cnt[id]}</span><span class="rar r-${RARITY[id]}"></span></button>`).join('');
  const pool = filteredIds().filter(id => SAVE.coll[id] > 0);
  return `<div class="ed-head orn m-gold">
      <label class="ed-name"><span>Nom du deck</span><input id="edName" type="text" maxlength="28" value="${esc(d.name)}"></label>
      <div class="ed-count ${d.list.length === DECK_SIZE ? 'ok' : ''}"><b>${d.list.length}</b>/${DECK_SIZE}</div>
      <p class="ed-info">${sp ? `Éléments principaux : ${sp.els.map(e => EL_NAME[e]).join(' et ')} · talent de Mêlée : ${TALENTS[sp.talent].name}` : 'Ajoute des cartes depuis ta collection.'}</p>
    </div>
    <div class="dl-list">${rows || '<p class="c-note">Ton deck est vide.</p>'}</div>
    ${filterBar()}
    <p class="c-note">Touche une carte pour l'ajouter. Touche une ligne du deck pour la retirer.</p>
    <div class="cgrid">${pool.map(id => { const left = Math.min(MAX_COPIES, SAVE.coll[id]) - (cnt[id] || 0); return miniCard(id, {badge: `${cnt[id] || 0}/${Math.min(MAX_COPIES, SAVE.coll[id])}`, disabled: left <= 0 || d.list.length >= DECK_SIZE, cls:'add'}); }).join('')}</div>
    <div class="ed-bar"><button class="btn-end m-gold" type="button" id="edSave" ${d.list.length === DECK_SIZE ? '' : 'disabled'}><span>${d.list.length === DECK_SIZE ? 'Enregistrer le deck' : `Encore ${DECK_SIZE - d.list.length} carte${DECK_SIZE - d.list.length > 1 ? 's' : ''}`}</span></button></div>`;
}
// Boutique et ouverture
function shopHTML(){
  return `<div class="shop">
    <div class="pack orn m-gold"><img src="img/dos.jpg" alt="" class="pk-img">
      <div><h3>Booster des Éléments</h3><p>5 cartes : 3 communes, 1 rare, et 1 carte rare ou mieux (24 % épique, 6 % légendaire).</p>
      <p class="c-note">Un exemplaire au-delà de ${MAX_COPIES} est converti en Éclats.</p></div></div>
    <button class="btn-end m-gold" type="button" id="pkOpen" ${SAVE.packs ? '' : 'disabled'}><span>Ouvrir un booster<small>${SAVE.packs} en réserve</small></span></button>
    <button class="btn-end m-gold alt" type="button" id="pkBuy" ${SAVE.coins >= PACK_PRICE ? '' : 'disabled'}><span>Acheter un booster<small>${PACK_PRICE} Éclats · tu en as ${SAVE.coins}</small></span></button>
    <div class="earn orn m-gold"><h3>Gagner des Éclats</h3>
      <ul><li>Duel : 100 en cas de victoire, 40 sinon.</li><li>Duo : 120 en cas de victoire, 50 sinon.</li><li>Mêlée : 150, 90 ou 50 selon ta place.</li><li>Première victoire du jour : +100.</li><li>Chaque niveau gagné offre un booster.</li></ul>
      <p class="c-note"><span class="pz-ico">✦</span> Chaque carte d'un booster a une petite chance (1 sur 40) d'être <b>prismatique</b> : une version scintillante, sans effet sur le jeu. Tu peux aussi en fabriquer depuis la fiche d'une carte.</p>
      <p class="c-note"><span class="pz-ico fl">★</span> Une légendaire tirée d'un booster a 1 chance sur 8 d'être en <b>pleine image</b> : l'illustration couvre toute la carte.</p>
      <p class="c-note">Les Éclats sont gagnés en jouant, jamais achetés.</p></div>
  </div>`;
}
function revealHTML(){
  const all = packReveal.every(c => c.shown);
  return `<h2 class="panel-title"><span class="banner"><span>Booster</span></span></h2>
    <div class="reveal">${packReveal.map((c, k) => `<button class="rv ${c.shown ? 'shown' : ''} r-${RARITY[c.id]} ${c.pz ? 'pz' : ''} ${c.fl ? 'fl' : ''}" type="button" data-rv="${k}">
      <span class="rv-in"><span class="rv-back"><img src="img/dos.jpg" alt=""></span><span class="rv-front card el-${CARDS[c.id].el}">${cardFace({...cardData(c.id), prism: c.pz, full: !!c.fl})}</span></span>
      ${c.shown ? `<span class="rv-tag ${c.pz ? 'pz' : ''} ${c.fl ? 'fl' : ''}">${c.fl ? (c.flNew ? 'Pleine image !' : `Pleine image en double · +${c.dust} Éclats`) : c.prism ? 'Prismatique !' : c.pz ? `Prismatique en double · +${c.dust} Éclats` : c.dust ? `Doublon · +${c.dust} Éclats` : c.isNew ? 'Nouvelle !' : RAR[RARITY[c.id]].name}</span>` : ''}</button>`).join('')}</div>
    ${all ? `<div class="rv-acts">${SAVE.packs ? `<button class="btn-end m-gold" type="button" id="pkAgain"><span>Ouvrir le suivant<small>${SAVE.packs} en réserve</small></span></button>` : ''}<button class="ghost banner" type="button" id="pkDone"><span>Voir ma collection</span></button></div>`
      : `<div class="rv-acts"><button class="ghost banner" type="button" id="pkAll"><span>Tout révéler</span></button></div>`}`;
}
function showDetail(id){
  detailId = id;
  const n = SAVE.coll[id] || 0, r = RAR[RARITY[id]], can = n < MAX_COPIES && SAVE.coins >= r.craft;
  const hp = hasPrism(id), pc = prismCost(id), hf = hasFull(id), canFull = FULL_IDS.includes(id), lk = lookOf(id);
  const looks = [['n', 'Normale'], ...(hp ? [['p', 'Prismatique']] : []), ...(hf ? [['f', 'Pleine image']] : [])];
  const prismUI = (looks.length > 1 ? `<div class="pz-box"><p class="cd-rar"><b>Apparence</b> ${hf ? '<span class="pz-ico fl">★</span>' : ''}${hp ? '<span class="pz-ico">✦</span>' : ''}</p>
        <div class="seg" role="group" aria-label="Apparence">${looks.map(([k, t]) => `<button type="button" data-look="${k}" aria-pressed="${lk === k}">${t}</button>`).join('')}</div></div>` : '')
    + (!n ? `<p class="c-note">Obtiens d'abord la carte pour débloquer ses apparences spéciales.</p>` : '')
    + (n && !hp ? `<button class="btn-end m-prism" type="button" id="cdPrism" ${SAVE.coins >= pc ? '' : 'disabled'}><span>Rendre prismatique<small>${pc} Éclats · purement esthétique</small></span></button>` : '')
    + (n && canFull && !hf ? `<button class="btn-end m-fullart" type="button" id="cdFull" ${SAVE.coins >= FULL_COST ? '' : 'disabled'}><span>Obtenir la pleine image<small>${FULL_COST} Éclats · illustration sur toute la carte</small></span></button>` : '');

  $('#cardDetail').innerHTML = `<div class="sheet orn spikes m-gold"><div class="sheet-in cd">
    <div class="card big el-${CARDS[id].el}">${cardFace(cardData(id))}</div>
    <div class="cd-txt"><p class="cd-rar"><span class="rar r-${RARITY[id]} inl"></span> <b>${r.name}</b> · tu en as ${n}/${MAX_COPIES}</p>
      ${cardInfo(id)}
      ${n < MAX_COPIES ? `<button class="btn-end m-gold" type="button" id="cdCraft" ${can ? '' : 'disabled'}><span>Fabriquer<small>${r.craft} Éclats · tu en as ${SAVE.coins}</small></span></button>` : '<p class="c-note">Tu as le maximum d\'exemplaires.</p>'}
      ${prismUI}
      <button class="ghost banner" type="button" data-cd-close><span>Fermer</span></button></div></div></div>`;
  $('#cardDetail').hidden = false;
  fitNames($('#cardDetail'));
  bindTilt('#cardDetail .card.big');
  $('#cardDetail').querySelectorAll('[data-look]').forEach(b => b.onclick = () => { SAVE.look = SAVE.look || {}; SAVE.look[id] = b.dataset.look; persist(); renderColl(); });
  const flb = $('#cdFull');
  if (flb) flb.onclick = () => { if (SAVE.coins < FULL_COST || hasFull(id)) return; SND.play('prism'); SAVE.coins -= FULL_COST; SAVE.full = SAVE.full || {}; SAVE.full[id] = 1; SAVE.look = SAVE.look || {}; SAVE.look[id] = 'f'; persist(); renderColl(); };
  const pzb = $('#cdPrism');
  if (pzb) pzb.onclick = () => { if (SAVE.coins < pc || hasPrism(id)) return; SND.play('prism'); SAVE.coins -= pc; SAVE.prism = SAVE.prism || {}; SAVE.prism[id] = 1; SAVE.look = SAVE.look || {}; if (SAVE.look[id] !== 'f') SAVE.look[id] = 'p'; persist(); renderColl(); };
  const cr = $('#cdCraft');
  if (cr) cr.onclick = () => { if (SAVE.coins < r.craft || (SAVE.coll[id] || 0) >= MAX_COPIES) return; SND.play('evolve'); SAVE.coins -= r.craft; SAVE.coll[id] = (SAVE.coll[id] || 0) + 1; persist(); renderColl(); };
}
$('#cardDetail').addEventListener('click', e => { if (e.target.id === 'cardDetail' || e.target.closest('[data-cd-close]')){ $('#cardDetail').hidden = true; detailId = null; } });
$('#collTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; collTab = b.dataset.tab; confirmDel = null; renderColl(); });
$('#collBody').addEventListener('input', e => { if (e.target.id === 'edName' && editing) editing.name = e.target.value.slice(0, 28); });
$('#collBody').addEventListener('click', e => {
  const t = e.target;
  const fl = t.closest('[data-fl]'); if (fl){ filterEl = fl.dataset.fl; renderColl(); return; }
  const ed = t.closest('[data-edit]'); if (ed){ const d = SAVE.decks.find(x => x.id === ed.dataset.edit); editing = {id:d.id, name:d.name, list:[...d.list]}; renderColl(); return; }
  const del = t.closest('[data-del]'); if (del){
    if (confirmDel === del.dataset.del){ SAVE.decks = SAVE.decks.filter(d => d.id !== del.dataset.del); if (SAVE.active === del.dataset.del) SAVE.active = SAVE.decks[0].id; confirmDel = null; persist(); }
    else confirmDel = del.dataset.del;
    renderColl(); return;
  }
  if (t.closest('#dkNew')){ editing = {id:null, name:`Deck ${SAVE.decks.length + 1}`, list:[]}; renderColl(); return; }
  const pickDeck = t.closest('.deck-opt[data-id]'); if (pickDeck && !editing){ SAVE.active = pickDeck.dataset.id; persist(); renderColl(); return; }
  if (editing){
    const rm = t.closest('[data-rm]'); if (rm){ const k = editing.list.indexOf(rm.dataset.rm); if (k >= 0) editing.list.splice(k, 1); renderColl(); return; }
    const add = t.closest('.cc.add'); if (add && !add.disabled){ editing.list.push(add.dataset.card); renderColl(); return; }
    if (t.closest('#edSave')){
      const nm = (editing.name || '').trim() || 'Mon deck';
      if (editing.id){ const d = SAVE.decks.find(x => x.id === editing.id); d.name = nm; d.list = editing.list; }
      else { const d = {id:'d' + Date.now(), name:nm, list:editing.list}; SAVE.decks.push(d); SAVE.active = d.id; }
      editing = null; persist(); renderColl(); return;
    }
    return;
  }
  const cc = t.closest('.cc'); if (cc){ showDetail(cc.dataset.card); return; }
  if (t.closest('#pkBuy')){ if (SAVE.coins >= PACK_PRICE){ SND.play('coin'); SAVE.coins -= PACK_PRICE; SAVE.packs++; persist(); renderColl(); } return; }
  if (t.closest('#pkOpen') || t.closest('#pkAgain')){ const r = openPack(); if (r){ packReveal = r.map(c => ({...c, shown:false})); renderColl(); } return; }
  const rv = t.closest('[data-rv]'); if (rv && packReveal){ const c = packReveal[+rv.dataset.rv]; if (!c.shown) SND.play(c.pz || c.fl ? 'prism' : 'flip', {r: RARITY[c.id]}); c.shown = true; renderColl(); return; }
  if (t.closest('#pkAll')){ const best = packReveal.filter(c => !c.shown).map(c => RARITY[c.id]).sort((a, b) => 'LERC'.indexOf(a) - 'LERC'.indexOf(b))[0]; SND.play(packReveal.some(c => !c.shown && (c.pz || c.fl)) ? 'prism' : 'flip', {r: best || 'C'}); packReveal.forEach(c => c.shown = true); renderColl(); return; }
  if (t.closest('#pkDone')){ packReveal = null; collTab = 'cards'; renderColl(); return; }
});

// --- Démarrage : charger la sauvegarde puis afficher le menu ---
async function bootMeta(){
  $('#profile').hidden = false;
  $('#profile').innerHTML = '<p class="c-note">Chargement de ta collection…</p>';
  SAVE = await loadSave();
  if (SAVE && !SAVE.decks.some(d => d.id === SAVE.active)) SAVE.active = SAVE.decks[0] && SAVE.decks[0].id;
  // Cadeau pour les sauvegardes d'avant les prismatiques : la légendaire de ta famille de départ
  if (SAVE && !SAVE.prism){ const d = SAVE.decks[0]; SAVE.prism = {[legendOf(d ? famOf(d.list).fam : 0)]:1}; SAVE.prismOff = {}; SAVE.prismGift = 1; persist(); }
  if (!SAVE){ $('#profile').hidden = true; pick = 0; renderStarter(); showPanel('#starterPanel'); return; }
  renderProfile();
}

