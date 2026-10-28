// --- Animations : cartes en vol, révélation des cartes adverses, pioche, tour, fin de partie ---
let flyFrom = null, prevHand = null;
// Historique discret des cartes jouées (bord gauche de la ligne centrale)
let playLog = {game:null, items:[]}, logPick = null;
const LOG_SHOW = 4;
function logPlay(e){
  if (playLog.game !== S){ playLog = {game:S, items:[]}; logPick = null; }
  playLog.items.push({p:e.p, id:e.id, turn:Math.ceil(S.turn / S.players.length)});
  renderPlayLog(true);
}
function whoOf(p){ return p === 0 ? 'Toi' : S.duo ? SHORT[p] : S.ffa ? S.players[p].label : 'Adversaire'; }
function renderPlayLog(fresh){
  if (playLog.game !== S){ playLog = {game:S, items:[]}; logPick = null; }
  const items = playLog.items.slice(-LOG_SHOW).reverse();
  const base = playLog.items.length - 1;
  const html = items.map((it, k) => {
    const idx = base - k, side = it.p === 0 ? 'me' : S.duo && it.p === 2 ? 'ally' : 'foe';
    return `<button type="button" class="pl pl-${side} el-${CARDS[it.id].el} ${fresh && k === 0 ? 'new' : ''} ${logPick === idx ? 'on' : ''}" data-log="${idx}" aria-label="${CARDS[it.id].name}, joué par ${whoOf(it.p)}"><img src="img/${it.id}.jpg" alt="" draggable="false">${CARDS[it.id].type === 'spell' ? '<i class="pl-sp"></i>' : ''}</button>`;
  }).join('');
  document.querySelectorAll('.playlog').forEach(d => { d.innerHTML = html; d.hidden = !items.length; });
}
// Échanges de combat : attaquant, cible (créature ou héros), dégâts, mort
let tradeLog = {game:null, items:[]}, tradePick = null, curTrade = null;
const TRADE_SHOW = 2;
function artOf(id, st, el){ const im = imgOf(id, st || 0, el); return im ? `img/${im}.jpg` : null; }
function tradeFx(e){
  if (tradeLog.game !== S){ tradeLog = {game:S, items:[]}; tradePick = null; curTrade = null; }
  if (e.k === 'attack'){ curTrade = {p:e.p, a:{id:e.id, st:e.st, el:e.el}, side:e.side, hits:[], turn:Math.ceil(S.turn / S.players.length)}; tradeLog.items.push(curTrade); if (tradeLog.items.length > 40) tradeLog.items.shift(); return true; }
  if (!curTrade) return false;
  if (e.k === 'dmg' && e.side !== curTrade.side){ const h = curTrade.hits.find(x => x.side === e.side && x.i === e.i); if (h) h.n += e.n; else curTrade.hits.push({side:e.side, i:e.i, id:e.id, st:e.st, el:e.el, n:e.n}); return true; }
  if (e.k === 'death' && e.side !== curTrade.side && !e.bounce){ const h = curTrade.hits.find(x => x.side === e.side && x.i === e.i); if (h) h.dead = true; return true; }
  if (e.k === 'death' && e.side === curTrade.side && !e.bounce){ curTrade.aDead = true; return true; }
  if (e.k === 'dodge' && e.side !== curTrade.side){ curTrade.hits.push({side:e.side, i:e.i, dodge:true, id:(S.board[e.side][e.i].u || {}).card}); return true; }
  if (e.k === 'face' && e.side !== curTrade.side){ curTrade.hits.push({hero:true, n:e.n}); return true; }
  return false;
}
function renderTrades(fresh){
  if (tradeLog.game !== S){ tradeLog = {game:S, items:[]}; tradePick = null; }
  const done = tradeLog.items.filter(t => t.hits.length);
  const items = done.slice(-TRADE_SHOW).reverse();
  const html = items.map((t, k) => {
    const idx = tradeLog.items.indexOf(t), mine = t.p === 0, h = t.hits[0];
    const aImg = artOf(t.a.id, t.a.st, t.a.el);
    const tgt = h.hero ? `<span class="tr-hero">${t.hits.length > 1 ? '+' : ''}${h.n}</span>` : `<span class="tr-c ${h.dead ? 'dead' : ''}">${h.id && artOf(h.id, h.st, h.el) ? `<img src="${artOf(h.id, h.st, h.el)}" alt="">` : ''}</span>`;
    const res = h.hero ? '' : h.dodge ? '<i class="tr-r">esq.</i>' : h.dead ? '<i class="tr-r kill">✝</i>' : `<i class="tr-r">−${h.n}</i>`;
    return `<button type="button" class="tr ${mine ? 'tr-me' : 'tr-foe'} ${fresh && k === 0 ? 'new' : ''} ${tradePick === idx ? 'on' : ''}" data-trade="${idx}" aria-label="Échange : ${CARDS[t.a.id].name}">
      <span class="tr-c ${t.aDead ? 'dead' : ''}">${aImg ? `<img src="${aImg}" alt="">` : ''}</span><i class="tr-x">⚔</i>${tgt}${res}</button>`;
  }).join('');
  document.querySelectorAll('.tradelog').forEach(d => { d.innerHTML = html; d.hidden = !items.length; });
}
function tradeInfoHTML(){
  const t = tradeLog.items[tradePick]; if (!t) return null;
  const nm = (id, st, el) => { const d = CARDS[id]; return !st ? d.name : st === 2 ? d.legend.name : (d.evo[el] || {}).name || d.name; };
  const who = t.p === 0 ? 'Ta créature' : 'La créature adverse';
  const lines = t.hits.map(h => h.hero ? `<li>frappe ${t.p === 0 ? 'le <b>héros adverse</b>' : 'ton <b>héros</b>'} : −${h.n} PV</li>`
    : h.dodge ? `<li><b>${CARDS[h.id] ? CARDS[h.id].name : 'Une créature'}</b> esquive l'attaque</li>`
    : `<li>${h.dead ? 'détruit' : 'blesse'} <b>${nm(h.id, h.st, h.el)}</b> : −${h.n} PV${h.dead ? ' ✝' : ''}</li>`).join('');
  const d = CARDS[t.a.id], f = !t.a.st ? null : t.a.st === 2 ? d.legend : d.evo[t.a.el];
  const face = !f ? cardData(t.a.id, t.p) : {key:t.a.id, el:t.a.el, stage:t.a.st, ab:f.ab || [], name:f.name, cost:d.cost, typeLine:`${t.a.st === 2 ? 'Légende' : 'Adepte'} — ${EL_NAME[t.a.el]}`, atk:f.atk, hp:f.hp};
  return `<div class="card el-${t.a.el}">${cardFace(face)}</div>
    <div class="info-txt"><p class="sub log-who">${who} · tour ${t.turn}</p><h3>${nm(t.a.id, t.a.st, t.a.el)} attaque</h3><ul class="tr-list">${lines}</ul>${t.aDead ? '<p>Elle meurt pendant l\'échange.</p>' : ''}</div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-trade]');
  if (b){ const k = +b.dataset.trade; tradePick = tradePick === k ? null : k; logPick = null; sel = null; inspect = null; inspectP = null; render(); return; }
  if (tradePick !== null && e.target.closest('#game') && !e.target.closest('#info')){ tradePick = null; }
}, true);
function logInfoHTML(){
  const it = playLog.items[logPick]; if (!it) return null;
  return `<div class="card el-${CARDS[it.id].el}">${cardFace(cardData(it.id, it.p))}</div><div class="info-txt"><p class="sub log-who">Jouée par <b>${whoOf(it.p)}</b> · tour ${it.turn}</p>${cardInfo(it.id)}</div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-log]');
  if (b){ const k = +b.dataset.log; logPick = logPick === k ? null : k; tradePick = null; sel = null; inspect = null; inspectP = null; render(); return; }
  if (logPick !== null && e.target.closest('#game') && !e.target.closest('#info')){ logPick = null; }
}, true);
const ANIM_OK = () => !reduced;
function cardEl(id, p){
  const el = document.createElement('div');
  el.className = 'flycard card el-' + CARDS[id].el;
  el.innerHTML = cardFace(cardData(id, p));
  return el;
}
function rectOf(el){ return el ? el.getBoundingClientRect() : null; }
// Une carte vole d'un rectangle à un autre (positions à l'écran)
function flyCard(id, from, to, {fade = false, dur = 420, hold = 0, big = false, p = 1} = {}){
  return new Promise(res => {
    if (!ANIM_OK() || !from || !to) return res();
    const W = 100, H = 150;
    const el = cardEl(id, p);
    el.style.cssText = `position:fixed; left:0; top:0; z-index:60; font-size:10px; pointer-events:none; transform-origin:0 0; margin:0`;
    document.body.appendChild(el);
    fitNames(el);
    const at = (r, s) => `translate(${r.left + (r.width - W * s) / 2}px, ${r.top + (r.height - H * s) / 2}px) scale(${s})`;
    const s0 = from.width / W, s1 = Math.min(to.width / W, to.height / H);
    const frames = [{transform: at(from, s0), opacity: .9}];
    if (big){
      const vw = innerWidth, vh = innerHeight, sb = Math.min(1.6, vw / W * .42);
      const mid = {left: vw / 2 - 1, top: vh * .38 - 1, width: 2, height: 2};
      frames.push({transform: at(mid, sb), opacity: 1, offset: .35}, {transform: at(mid, sb), opacity: 1, offset: .6});
    }
    frames.push({transform: at(to, s1), opacity: fade ? 0 : 1});
    const a = el.animate(frames, {duration: dur + (big ? 520 : 0), easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards'});
    a.onfinish = () => { el.remove(); res(); };
  });
}
// Position de départ d'une carte jouée par un adversaire : sa plaque
function playerAnchor(p){
  const el = S.ffa ? $('#fp' + p) : $('#hero' + teamOf(S, p));
  const r = rectOf(el && (el.querySelector('.medal') || el));
  return r;
}
function targetRect(e){
  if (e.i >= 0 && e.side >= 0){ const c = cellEl(e.side, e.i); return rectOf(c && (c.querySelector('.slot') || c)); }
  return playerAnchor(e.p);
}
function onSummonFx(e){
  logPlay(e);
  const cell = cellEl(e.side, e.i), unit = cell && cell.querySelector('.unit');
  SND.play('summon', {el: CARDS[e.id].el});
  if (!ANIM_OK()){ return; }
  const to = targetRect(e);
  const mine = e.p === 0 && flyFrom;
  if (unit) unit.style.opacity = '0';
  const go = mine ? flyCard(e.id, flyFrom, to, {dur: 360, p: 0}) : flyCard(e.id, playerAnchor(e.p), to, {big: true, dur: 380, p: e.p});
  if (mine) SND.play('play', {el: CARDS[e.id].el});
  go.then(() => {
    const u = cell && cell.isConnected ? cell.querySelector('.unit') : (cellEl(e.side, e.i) || {}).querySelector?.('.unit');
    if (u){ u.style.opacity = ''; u.classList.add('drop'); }
    const c = cellEl(e.side, e.i); if (c) sparks(c, ELC[CARDS[e.id].el] || '#ffe0a0', 8);
  });
  flyFrom = null;
}
function onCastFx(e){
  logPlay(e);
  SND.play('play', {el: e.el});
  const to = targetRect(e);
  const mine = e.p === 0 && flyFrom;
  const go = !ANIM_OK() ? Promise.resolve() : mine ? flyCard(e.id, flyFrom, to, {fade: true, dur: 380, p: 0}) : flyCard(e.id, playerAnchor(e.p), to, {fade: true, big: true, dur: 380, p: e.p});
  go.then(() => {
    SND.play('spell', {el: e.el});
    const host = e.i >= 0 ? cellEl(e.side, e.i) : (S.ffa ? $('#fp' + e.p) : $('#hero' + teamOf(S, e.p)));
    if (host && ANIM_OK()){ sparks(host, ELC[e.el] || '#ffe0a0', 14); host.classList.remove('spellhit'); void host.offsetWidth; host.classList.add('spellhit'); }
  });
  flyFrom = null;
}
// Cartes piochées : glissent dans la main
function markDrawn(){
  const hand = S.players[0].hand;
  if (prevHand && prevHand.game === S && hand.length > prevHand.ids.length){
    const nodes = document.querySelectorAll('.hand .card');
    for (let k = prevHand.ids.length; k < hand.length; k++) if (nodes[k]) nodes[k].classList.add('drawn');
    SND.play('draw');
  }
  prevHand = {game: S, ids: [...hand]};
}
// Bannière de début de tour
function turnBanner(txt){
  SND.play('turn');
  if (!ANIM_OK()) return;
  const b = $('#turnBanner');
  b.querySelector('span').textContent = txt;
  b.hidden = false; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  clearTimeout(turnBanner.t); turnBanner.t = setTimeout(() => { b.hidden = true; }, 1500);
}
// Fin de partie : confettis et rayons pour une victoire
function celebrate(win){
  SND.play(win ? 'win' : 'lose');
  const sheet = document.querySelector('#resultModal .sheet');
  if (!sheet) return;
  sheet.classList.remove('pop', 'lost'); void sheet.offsetWidth; sheet.classList.add('pop'); if (!win) sheet.classList.add('lost');
  document.querySelectorAll('.confetti').forEach(c => c.remove());
  if (!win || !ANIM_OK()) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#ff9a3c', '#66e0e6', '#a8d65a', '#a8e4ff', '#f0c860', '#c9a8ff'];
  for (let k = 0; k < 46; k++){
    const i = document.createElement('i');
    i.style.cssText = `left:${Math.random() * 100}%; background:${cols[k % cols.length]}; --dx:${(Math.random() * 120 - 60).toFixed(0)}px; --r:${(Math.random() * 720 - 360).toFixed(0)}deg; animation-delay:${(Math.random() * .6).toFixed(2)}s; animation-duration:${(1.6 + Math.random() * 1.2).toFixed(2)}s`;
    box.appendChild(i);
  }
  $('#resultModal').appendChild(box);
  setTimeout(() => box.remove(), 3600);
}
// Sons de l'interface
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.closest('.hand')) SND.play('select');
  else if (b.closest('.rv')) return;
  else SND.play('click');
}, true);
function renderSoundBtns(){
  document.querySelectorAll('[data-snd]').forEach(b => {
    const k = b.dataset.snd, on = SND.pref[k];
    b.setAttribute('aria-pressed', String(on));
    b.title = (k === 'music' ? 'Musique' : 'Bruitages') + (on ? ' : activée' : ' : coupée');
    b.classList.toggle('off', !on);
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-snd]'); if (!b) return;
  const k = b.dataset.snd;
  if (k === 'music') SND.setMusic(!SND.pref.music); else SND.setSfx(!SND.pref.sfx);
  renderSoundBtns();
});
renderSoundBtns();
