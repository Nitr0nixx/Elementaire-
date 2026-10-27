// --- Animations : cartes en vol, révélation des cartes adverses, pioche, tour, fin de partie ---
let flyFrom = null, prevHand = null;
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
