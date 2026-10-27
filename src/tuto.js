// --- Difficulté ---
function renderDiff(){
  const d = (SAVE && SAVE.diff) || 'normal';
  $('#diffSeg').innerHTML = Object.entries(DIFF).map(([k, v]) => `<button type="button" data-diff="${k}" aria-pressed="${k === d}">${v.name}</button>`).join('');
  $('#diffNote').textContent = {easy:"L'IA joue sans plan et fait des erreurs. Récompenses ×0,5.", normal:"L'IA cherche le meilleur coup du tour. Récompenses normales.", hard:"L'IA anticipe aussi ta riposte. Récompenses ×1,5."}[d];
}
$('#diffSeg').addEventListener('click', e => {
  const b = e.target.closest('[data-diff]'); if (!b || !SAVE) return;
  SAVE.diff = b.dataset.diff; persist(); renderDiff();
});

// --- Tutoriel : une partie guidée contre l'IA facile ---
let TUTO = null;
const boardHas = id => S.board[0].some(c => c.u && c.u.owner === 0 && c.u.card === id);
const cellsWhere = f => S.board[0].map((c, i) => f(c) ? {side:0, i} : null).filter(Boolean);
const salStage = () => { const c = S.board[0].find(c => c.u && c.u.card === 'salamandre'); return c ? c.u.stage : -1; };
const TSTEPS = [
  {txt:() => "Bienvenue dans <b>Élémentaires</b> ! Ton but : faire tomber les PV du héros adverse à zéro. Je te guide pour cette première partie.", next:true},
  {txt:() => "Voici ta main. Touche la <b>Salamandre</b> : une créature de Feu qui coûte 1 mana.", hand:'salamandre', done:() => boardHas('salamandre') || (sel !== null && S.players[0].hand[sel] === 'salamandre')},
  {txt:() => "Pose-la sur la <b>case de Feu</b> en surbrillance. Sur une case de son élément, une créature gagne <b>+1 ATQ et +1 PV</b>.", hand:'salamandre', cells:() => cellsWhere(c => c.el === 'F' && !c.u), done:() => boardHas('salamandre')},
  {txt:() => "Elle vient d'arriver et attendra ton prochain tour pour attaquer. Touche <b>Fin du tour</b>.", end:true, done:() => S.active === 0 && S.turn >= 3},
  {txt:() => "Chaque créature attaque <b>la case d'en face</b> à la fin de ton tour. Si cette case est vide, elle frappe directement le héros adverse.", next:true},
  {txt:() => "Ton mana monte de 1 à chaque tour. Pose la <b>Sylphe</b> sur la <b>case d'Air</b>.", hand:'sylphe', cells:() => cellsWhere(c => c.el === 'A' && !c.u), done:() => boardHas('sylphe')},
  {txt:() => "La barre violette sous une créature, c'est son <b>XP</b> : +1 par tour, +1 de plus sur son élément, +2 quand elle en détruit une autre. Barre pleine, elle <b>évolue</b>. Touche <b>Fin du tour</b>.", end:true, done:() => S.active === 0 && S.turn >= 5},
  {txt:() => salStage() === 0 ? "Tu as pioché <b>Souffle d'ascension</b> : +2 XP. Joue-le sur ta <b>Salamandre</b> pour la faire évoluer." : "Tu as pioché <b>Souffle d'ascension</b> : +2 XP. Joue-le sur une de tes créatures qui peut encore évoluer.",
    hand:'ascension', cells:() => { const h = S.players[0].hand.indexOf('ascension'); return h < 0 ? [] : targets(S, 0, h); },
    skip:() => { const h = S.players[0].hand.indexOf('ascension'); return h < 0 || !targets(S, 0, h).length; },
    done:() => !S.players[0].hand.includes('ascension')},
  {txt:() => salStage() > 0 ? "<b>Évolution !</b> Une créature évolue <b>selon l'élément de sa case</b> : sur le Feu, la Salamandre devient Salamandre ardente ; sur l'Air, elle serait devenue Wyverne de braise. Touche une créature pour voir ses évolutions." : "Une créature évolue <b>selon l'élément de sa case</b> : touche une créature pour voir ce qu'elle deviendra là où elle est.", next:true},
  {txt:() => "Les sorts de terrain comme <b>Embrasement</b> changent l'élément d'une case : pour préparer une évolution ou retirer un bonus adverse. Tu sais l'essentiel. À toi de gagner !", next:true},
];
const tstep = () => TUTO && !TUTO.free ? TSTEPS[TUTO.step] : null;
function tutoAdvance(){
  let st;
  while ((st = tstep()) && ((st.done && st.done()) || (st.skip && st.skip()))){ TUTO.step++; if (TUTO.step >= TSTEPS.length) TUTO.free = true; }
}
function tutoAllowCard(hi){ const st = tstep(); if (!st) return true; return !!st.hand && S.players[0].hand[hi] === st.hand; }
function tutoAllowCell(side, i){
  const st = tstep(); if (!st || sel === null) return true;
  if (!st.cells) return false;
  return st.cells().some(t => t.side === side && t.i === i);
}
function tutoAllowEnd(){ const st = tstep(); return !st || !!st.end; }
function tutoAfterRender(){
  const box = $('#coach');
  const st = tstep();
  if (!st){ box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div class="co-av medal sm"><img src="img/heros-orage.jpg" alt=""></div>
    <div class="co-txt"><small>Tutoriel · étape ${TUTO.step + 1}/${TSTEPS.length}</small><p>${st.txt()}</p>
    ${st.next ? `<button class="ghost banner" type="button" id="coNext"><span>${TUTO.step === TSTEPS.length - 1 ? 'Jouer !' : 'Suivant'}</span></button>` : ''}</div>
    <button class="co-skip" type="button" id="coSkip" aria-label="Passer le tutoriel">Passer</button>`;
  if (st.hand){ const k = S.players[0].hand.indexOf(st.hand); const c = document.querySelector(`.hand .card[data-hi="${k}"]`); if (c && sel === null) c.classList.add('tuto-hl'); }
  if (st.cells && sel !== null) st.cells().forEach(t => { const c = cellEl(t.side, t.i); if (c) c.classList.add('tuto-hl'); });
  if (st.end) $('#btnEnd').classList.add('tuto-hl');
}
$('#coach').addEventListener('click', e => {
  if (e.target.closest('#coNext')){ TUTO.step++; if (TUTO.step >= TSTEPS.length) TUTO.free = true; render(); }
  if (e.target.closest('#coSkip')){ TUTO.free = true; render(); }
});
function startTutorial(){
  sel = null; inspect = null; inspectP = null; vigie = null; busy = false; running = false;
  mode = 'ai'; pick = 0;
  S = newGame(20261027, [0, 1], 0);
  S.tuto = true; S.diff = 'easy'; S.mode = 'ai';
  const P = S.players[0];
  S.board[0] = ['T', 'F', 'E', 'A', 'T'].map(el => ({el, u:null}));
  S.board[1] = ['E', 'T', 'A', 'F', 'E'].map(el => ({el, u:null}));
  const hand = ['salamandre', 'sylphe', 'griffon', 'faucon'], later = ['ascension', 'embrasement'];
  const rest = DECKS[0].cards.flatMap(id => [id, id]);
  [...hand, ...later].forEach(id => rest.splice(rest.indexOf(id), 1));
  shuffle(S, rest);
  P.hand = hand; P.deck = [...rest, ...later];
  S.log = ['Tutoriel : tu joues les Enfants de l\'Orage contre une IA facile.'];
  TUTO = {step:0, free:false};
  $('#resultModal').hidden = true;
  showGame();
}
