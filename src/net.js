// --- Duel en ligne avec un code ---
// Les deux navigateurs font tourner le même moteur, avec la même graine : seules les actions voyagent
// (« joue la carte n sur telle case », « fin du tour »). Le moteur étant déterministe, les deux parties restent identiques.
// Transport : le salon partagé de la page dans Claude, sinon une connexion directe WebRTC (PeerJS) sur le site GitHub.
const NET = (() => {
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const newCode = () => Array.from({length: 5}, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
  const cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  let tr = null, role = null, code = null, onMsg = null, onState = null;
  // --- couche de fiabilité : numéros de séquence, accusés de réception, renvois ---
  let out = 0, lastIn = 0, pending = new Map(), early = new Map(), resendT = null, lastSeen = 0, aliveT = null;
  function resetRel(){ out = 0; lastIn = 0; pending = new Map(); early = new Map(); }
  function rawSend(o){ try { tr && tr.send(o); } catch (e) {} }
  function send(d){ const m = {s: ++out, d}; pending.set(m.s, m); rawSend(m); }
  function receive(o){
    if (!o || typeof o !== 'object') return;
    lastSeen = Date.now();
    if (o.ping) return;
    if (typeof o.a === 'number'){ for (const k of [...pending.keys()]) if (k <= o.a) pending.delete(k); return; }
    if (typeof o.s !== 'number') return;
    if (o.s > lastIn) early.set(o.s, o.d);
    while (early.has(lastIn + 1)){ lastIn++; const d = early.get(lastIn); early.delete(lastIn); try { onMsg && onMsg(d); } catch (e) { console.error(e); } }
    rawSend({a: lastIn});
  }
  function startTimers(){
    clearInterval(resendT); clearInterval(aliveT); lastSeen = Date.now();
    resendT = setInterval(() => { for (const m of pending.values()) rawSend(m); }, 1500);
    aliveT = setInterval(() => { rawSend({ping: 1}); if (tr && tr.ready && Date.now() - lastSeen > 20000) state('lost'); }, 4000);
  }
  function state(s, info){ try { onState && onState(s, info); } catch (e) {} }

  // --- transport 1 : salon partagé de la page publiée dans Claude ---
  async function viaRoom(){
    const c = window.claude; if (!c || !c.use) return null;
    const room = await c.use('room'); if (!room) return null;
    let r;
    try { r = await room.join('elem-' + code.toLowerCase()); } catch (e) { return null; }
    const t = {kind: 'room', ready: false, other: null, send: o => r.emit('g', o).catch(() => {}), close: () => { try { r.leave(); } catch (e) {} }};
    r.on('g', m => {
      if (m.isMe) return;
      if (!t.other) t.other = m.peer;
      if (m.peer !== t.other) return;   // un troisième visiteur sur le même code est ignoré
      if (!t.ready){ t.ready = true; state('linked'); }
      receive(m.data);
    }, () => state('error', 'room'));
    return t;
  }
  // --- transport 2 : WebRTC direct via le service public PeerJS (site GitHub, application installée) ---
  function loadPeer(){
    if (window.Peer) return Promise.resolve(true);
    const srcs = ['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js', 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];
    return srcs.reduce((p, src) => p.then(ok => ok || new Promise(res => {
      const s = document.createElement('script'); s.src = src; s.onload = () => res(!!window.Peer); s.onerror = () => res(false); document.head.appendChild(s);
    })), Promise.resolve(false));
  }
  async function viaPeer(){
    if (!(await loadPeer())) return null;
    return new Promise(resolve => {
      const t = {kind: 'peer', ready: false, conn: null, peer: null, send: o => { if (t.conn && t.conn.open) t.conn.send(o); }, close: () => { try { t.conn && t.conn.close(); t.peer && t.peer.destroy(); } catch (e) {} }};
      const wire = conn => {
        t.conn = conn;
        conn.on('open', () => { t.ready = true; state('linked'); });
        conn.on('data', receive);
        conn.on('close', () => { if (t.ready) state('lost'); });
        conn.on('error', () => state('error', 'conn'));
      };
      const id = role === 'host' ? 'elementaires-' + code : undefined;
      const peer = id ? new Peer(id, {debug: 0}) : new Peer({debug: 0});
      t.peer = peer;
      peer.on('open', () => {
        if (role === 'host') peer.on('connection', conn => { if (t.conn){ conn.close(); return; } wire(conn); });
        else wire(peer.connect('elementaires-' + code, {reliable: true}));
        resolve(t);
      });
      peer.on('error', err => {
        const k = err && err.type;
        if (k === 'unavailable-id') state('taken');
        else if (k === 'peer-unavailable') state('nohost');
        else state('error', k || 'peer');
        resolve(null);
      });
    });
  }
  // --- transport de test : deux onglets du même navigateur (adresse terminée par ?nettest) ---
  function viaLocal(){
    const bc = new BroadcastChannel('elem-' + code), me = Math.random().toString(36).slice(2);
    const t = {kind: 'local', ready: false, send: o => bc.postMessage({from: me, o}), close: () => bc.close()};
    bc.onmessage = e => { if (e.data.from === me) return; if (!t.ready){ t.ready = true; state('linked'); } receive(e.data.o); };
    return t;
  }

  async function open(r, c){
    close();
    role = r; code = c; resetRel();
    let t = null;
    if (/[?&]nettest\b/.test(location.search)) t = viaLocal();
    if (!t) t = await viaRoom();
    if (!t) t = await viaPeer();
    if (!t){ state('error', 'transport'); return false; }
    tr = t; startTimers();
    if (role === 'guest') send({t: 'hello'});   // renvoyé tant que l'hôte n'a pas répondu
    return true;
  }
  function close(){
    clearInterval(resendT); clearInterval(aliveT);
    if (tr) tr.close();
    tr = null;
  }
  return {
    newCode, cleanCode, open, close, send,
    on(fn){ onMsg = fn; }, onState(fn){ onState = fn; },
    get role(){ return role; }, get code(){ return code; }, get kind(){ return tr && tr.kind; }, get ready(){ return !!(tr && tr.ready); }
  };
})();

// --- Mise en place d'une partie en ligne ---
let netQ = Promise.resolve(), netGame = 0, netRematchAsked = false;
const escTxt = s => String(s || '').replace(/[<>&"'`]/g, '').slice(0, 28);
function myNetDeck(){
  if (!registerActive()) return null;
  return {name: escTxt(DECKS[4].name), list: [...DECKS[4].list]};
}
// Un deck reçu n'est jamais pris tel quel : on vérifie la liste et on recalcule sa famille ici
function netDeckSpec(d, mine){
  const cnt = {};
  const ok = d && Array.isArray(d.list) && d.list.length === DECK_SIZE && d.list.every(id => typeof id === 'string' && CARDS[id] && BASE_IDS.includes(id) && (cnt[id] = (cnt[id] || 0) + 1) <= MAX_COPIES);
  if (!ok) return null;
  const spec = deckSpec({name: escTxt(d.name) || 'Deck', list: d.list});
  spec.the = mine ? `ton deck « ${spec.name} »` : `le deck « ${spec.name} » de ton adversaire`;
  return spec;
}
// La partie est toujours créée du point de vue de l'hôte (joueur 0) ; l'invité la retourne pour se voir en bas.
function mirrorDuel(S){
  S.players.reverse(); S.board.reverse(); S.teams.reverse();
  S.players.forEach((P, p) => { P.team = p; P.you = p === 0; P.label = p === 0 ? 'Tu' : "L'adversaire"; });
  S.board.forEach(row => row.forEach(c => { if (c.u) c.u.owner = 1 - c.u.owner; }));
  S.active = 1 - S.active; S.first = 1 - S.first;
  if (S.winner === 0 || S.winner === 1) S.winner = 1 - S.winner;
  S.log = []; S.fx = [];
}
// Empreinte de l'état, identique sur les deux machines (ordre de l'hôte) : sert à détecter une désynchronisation
function netHash(){
  const order = S.net.role === 'host' ? [0, 1] : [1, 0];
  let s = '';
  order.forEach(p => {
    const P = S.players[p], T = S.teams[p];
    s += `${T.hp}|${P.hand.join('.')}|${P.deck.length}|${P.mana}|${P.max};`;
    S.board[p].forEach(c => { s += c.el + (c.u ? `${c.u.card}:${c.u.dmg}:${c.u.xp}:${c.u.stage}` : '-') + ','; });
  });
  let h = 0; for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) | 0;
  return h;
}
function startNetMatch(m){
  const hostSpec = netDeckSpec(m.host, NET.role === 'host'), guestSpec = netDeckSpec(m.guest, NET.role === 'guest');
  if (!hostSpec || !guestSpec){ netStatus('Le deck reçu est invalide. Partie annulée.', true); return; }
  DECKS[5] = hostSpec; DECKS[6] = guestSpec;
  sel = null; inspect = null; busy = false; running = false; vigie = null; inspectP = null; TUTO = null;
  netQ = Promise.resolve(); netGame = m.g; netRematchAsked = false;
  S = newGame(m.seed, [5, 6], m.first);
  if (NET.role === 'guest') mirrorDuel(S);
  S.mode = 'net'; S.net = {role: NET.role, g: m.g};
  const foe = DECKS[NET.role === 'host' ? 6 : 5];
  S.log.push(`Duel en ligne : ton adversaire joue « ${foe.name} ».`);
  S.log.push(S.active === 0 ? "Tu commences. Ton adversaire reçoit un Éclat de mana." : "Ton adversaire commence. Tu reçois un Éclat de mana et une carte de plus.");
  $('#resultModal').hidden = true; $('#menu').hidden = true;
  showGame(); dealAnim();
  setTimeout(() => turnBanner(S.active === 0 ? 'À toi de commencer !' : "Ton adversaire commence"), 500);
}
function hostStart(guestDeck){
  const mine = myNetDeck(); if (!mine) return;
  const m = {t: 'start', g: Date.now() % 1e9, seed: Math.floor(Math.random() * 2147483646) + 1, first: Math.random() < .5 ? 0 : 1, host: mine, guest: guestDeck};
  NET.send(m); startNetMatch(m);
}
// --- Messages reçus ---
NET.on(d => {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'hello' && NET.role === 'host'){ const mine = myNetDeck(); if (mine) NET.send({t: 'deck?'}); return; }
  if (d.t === 'deck?' && NET.role === 'guest'){ const mine = myNetDeck(); if (mine) NET.send({t: 'deck', deck: mine}); return; }
  if (d.t === 'deck' && NET.role === 'host'){ hostStart(d.deck); return; }
  if (d.t === 'start' && NET.role === 'guest'){ startNetMatch(d); return; }
  if (d.t === 'rematch'){ if (NET.role === 'host') NET.send({t: 'deck?'}); else netRematchAsked = true; return; }
  if (d.t === 'bye'){ netEnd('Ton adversaire a quitté la partie.'); return; }
  if (!S || !S.net || d.g !== S.net.g) return;
  netQ = netQ.then(() => netApply(d)).catch(e => console.error(e));
});
NET.onState((s, info) => {
  if (s === 'linked'){ netStatus(NET.role === 'host' ? 'Adversaire trouvé ! Lancement…' : 'Connecté ! Lancement…'); return; }
  if (s === 'taken'){ netHost(); return; }   // code déjà pris : on en tire un autre
  if (s === 'nohost'){ netStatus("Aucune partie n'attend avec ce code. Vérifie-le avec ton adversaire.", true); NET.close(); return; }
  if (s === 'lost'){ if (S && S.net && !over()) netEnd('La connexion avec ton adversaire est perdue.'); else netStatus('Connexion perdue.', true); return; }
  if (s === 'error'){ if (!(S && S.net && screen === 'game')) netStatus(info === 'transport' ? "Impossible d'ouvrir une connexion en ligne depuis cette page. Utilise la version du jeu publiée sur GitHub." : 'Erreur de connexion. Réessaie.', true); }
});
async function netApply(d){
  if (over()) return;
  if (d.t === 'play'){
    if (S.active !== 1) return;
    const t = d.side < 0 ? {side: -1, i: -1} : {side: 1 - d.side, i: d.i};
    if (!targets(S, 1, d.hi).some(x => x.side === t.side && x.i === t.i)){ netDesync(); return; }
    play(S, 1, d.hi, t); step();
    await sleep(pace(reduced ? 600 : 1000));
  } else if (d.t === 'end'){
    if (S.active !== 1) return;
    if (d.h !== netHash()) netDesync();
    busy = true; step();
    await runCombat(1);
    if (!over()){ startTurn(S, 0); step(); await sleep(pace(300)); }
    busy = false; step();
    if (!over()) turnBanner('À toi de jouer !');
  }
}
function netDesync(){ if (S.netWarned) return; S.netWarned = true; S.log.push('⚠ Les deux parties ne sont plus identiques : recommence une partie si quelque chose semble incohérent.'); render(); }
// Appelé par l'interface après chacune de tes actions
function netAfterPlay(hi, t){ if (S && S.net) NET.send({t: 'play', g: S.net.g, hi, side: t.side, i: t.i}); }
function netEndTurn(){
  NET.send({t: 'end', g: S.net.g, h: netHash()});
  const job = (async () => {
    busy = true; sel = null; inspect = null; vigie = null; inspectP = null; step();
    await runCombat(0);
    if (!over()){ startTurn(S, 1); step(); await sleep(pace(300)); }
    busy = false; step();
  })();
  netQ = netQ.then(() => job);
}
function netEnd(msg){
  if (S && S.net && !over()){ S.winner = 0; S.log.push(msg + ' Victoire par abandon.'); render(); }
  netStatus(msg, true);
}
function netLeave(){ if (NET.ready) NET.send({t: 'bye'}); setTimeout(() => NET.close(), 400); if (S && S.net) S.done = true; }
function netRematch(){ if (NET.role === 'host') NET.send({t: 'deck?'}); else NET.send({t: 'rematch'}); netStatus('Revanche demandée…'); }

// --- Écran « Duel en ligne » ---
function netStatus(txt, err){ const s = $('#netStatus'); if (!s) return; s.textContent = txt; s.classList.toggle('err', !!err); s.hidden = !txt; }
function renderNet(view = 'choose'){
  const a = activeDeck();
  const deck = a ? `<p class="c-note center">Ton deck : <b>${escTxt(a.name)}</b> · <button class="linkbtn" type="button" id="netDeck">changer</button></p>` : '';
  let h;
  if (view === 'host') h = `<div class="net-code orn m-gold"><small>Code de la partie</small><b id="netCode">${NET.code}</b>
      <button class="ghost banner" type="button" id="netCopy"><span>Copier le code</span></button></div>
      <p class="c-note center">Donne ce code à ton adversaire. La partie démarre dès qu'il le saisit.</p>`;
  else if (view === 'join') h = `<label class="net-in"><span>Code de la partie</span><input id="netInput" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="ABCDE"></label>
      <button class="btn-end m-gold" type="button" id="netGo"><span>Rejoindre</span></button>`;
  else h = `<button class="btn-end m-gold" type="button" id="netCreate"><span>Créer une partie<small>Tu obtiens un code à donner à ton adversaire</small></span></button>
      <button class="btn-end m-gold alt" type="button" id="netJoin"><span>Rejoindre une partie<small>Entre le code de ton adversaire</small></span></button>`;
  $('#netBody').innerHTML = deck + h;
  netStatus(view === 'host' ? 'En attente de ton adversaire…' : '');
  if (view === 'join') setTimeout(() => { const i = $('#netInput'); if (i) i.focus(); }, 50);
}
function netHost(){ NET.open('host', NET.newCode()); renderNet('host'); }
function openNet(){
  if (!SAVE){ renderStarter(); showPanel('#starterPanel'); return; }
  NET.close(); showPanel('#netPanel'); renderNet('choose');
}
$('#netPanel').addEventListener('click', e => {
  const t = e.target;
  if (t.closest('#netCreate')){ if (!myNetDeck()) return netStatus("Choisis d'abord un deck complet.", true); netHost(); return; }
  if (t.closest('#netJoin')){ renderNet('join'); return; }
  if (t.closest('#netGo')){
    const c = NET.cleanCode($('#netInput').value);
    if (c.length !== 5) return netStatus('Le code fait 5 caractères.', true);
    if (!myNetDeck()) return netStatus("Choisis d'abord un deck complet.", true);
    netStatus('Connexion…'); NET.open('guest', c); return;
  }
  if (t.closest('#netCopy')){
    const c = NET.code;
    (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => netStatus('Code copié ! En attente de ton adversaire…')).catch(() => netStatus(`Ton code : ${c}`));
    return;
  }
  if (t.closest('#netDeck')){ NET.close(); openDecks('net'); return; }
  if (t.closest('#netBack')){ NET.close(); showPanel('#mainPanel'); return; }
});
$('#netPanel').addEventListener('input', e => { if (e.target.id === 'netInput') e.target.value = NET.cleanCode(e.target.value); });
$('#netPanel').addEventListener('keydown', e => { if (e.target.id === 'netInput' && e.key === 'Enter') $('#netGo').click(); });
