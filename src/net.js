// --- Parties en ligne avec un code : Duel, Duo et Mêlée, places libres tenues par des IA ---
// Chaque appareil fait tourner le même moteur avec la même graine ; seules les actions des humains voyagent.
// L'hôte relaie tout (topologie en étoile) et fixe ainsi un ordre unique. Les IA sont jouées par chaque appareil,
// calculées dans le repère de l'hôte pour donner exactement les mêmes coups partout.
const NET = (() => {
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const rid = n => Array.from({length: n}, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
  const newCode = () => rid(5);
  const cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  const me = rid(8);
  let tr = null, role = null, code = null, hostId = null;
  let onMsg = null, onState = null, onLost = null;
  // --- fiabilité par lien : séquences, accusés, renvois, détection de silence ---
  const links = new Map();
  function link(id){
    let L = links.get(id);
    if (!L){ L = {out: 0, lastIn: 0, pending: new Map(), early: new Map(), seen: Date.now(), lost: false}; links.set(id, L); }
    return L;
  }
  function raw(to, o){ try { tr && tr.send(to, {f: me, t: to, h: role === 'host' ? 1 : 0, o}); } catch (e) {} }
  function send(to, d){ if (!to) return; const L = link(to); if (L.lost) return; const m = {s: ++L.out, d}; L.pending.set(m.s, m); raw(to, m); }
  function sendAll(d, except){ for (const [id, L] of links) if (id !== except && !L.lost) send(id, d); }
  function receive(env){
    if (!env || typeof env !== 'object' || env.f === me || (env.t !== me && env.t !== '*')) return;
    const from = String(env.f).slice(0, 16), o = env.o;
    if (role === 'guest'){ if (!env.h) return; if (!hostId) hostId = from; if (from !== hostId) return; }
    else if (env.h) return;
    const L = link(from); L.seen = Date.now();
    if (L.lost || !o || typeof o !== 'object' || o.ping) return;
    if (typeof o.a === 'number'){ for (const k of [...L.pending.keys()]) if (k <= o.a) L.pending.delete(k); return; }
    if (typeof o.s !== 'number') return;
    if (o.s > L.lastIn) L.early.set(o.s, o.d);
    while (L.early.has(L.lastIn + 1)){ L.lastIn++; const d = L.early.get(L.lastIn); L.early.delete(L.lastIn); try { onMsg && onMsg(from, d); } catch (e) { console.error(e); } }
    raw(from, {a: L.lastIn});
  }
  let timers = [];
  function startTimers(){
    timers.forEach(clearInterval);
    timers = [
      setInterval(() => { for (const [id, L] of links) if (!L.lost) for (const m of L.pending.values()) raw(id, m); }, 1500),
      setInterval(() => {
        for (const [id, L] of links){
          if (L.lost) continue;
          raw(id, {ping: 1});
          if (Date.now() - L.seen > 20000){ L.lost = true; try { onLost && onLost(id); } catch (e) {} }
        }
      }, 4000)
    ];
  }
  function state(s, info){ try { onState && onState(s, info); } catch (e) {} }

  // --- transport 1 : salon partagé de la page publiée dans Claude ---
  async function viaRoom(){
    const c = window.claude; if (!c || !c.use) return null;
    const room = await c.use('room'); if (!room) return null;
    let r; try { r = await room.join('elem-' + code.toLowerCase()); } catch (e) { return null; }
    r.on('g', m => { if (!m.isMe) receive(m.data); }, () => state('error', 'room'));
    return {kind: 'room', send: (to, env) => r.emit('g', env).catch(() => {}), close: () => { try { r.leave(); } catch (e) {} }};
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
      const conns = new Set(), byId = new Map();   // connexions PeerJS, et identifiant de jeu -> connexion
      const t = {kind: 'peer', peer: null,
        send: (to, env) => {
          if (role === 'host'){ const list = to === '*' ? [...conns] : [byId.get(to)]; list.forEach(c => { if (c && c.open) c.send(env); }); }
          else { const c = [...conns][0]; if (c && c.open) c.send(env); }
        },
        close: () => { try { conns.forEach(c => c.close()); t.peer && t.peer.destroy(); } catch (e) {} }};
      const wire = conn => {
        conns.add(conn);
        conn.on('data', env => { if (env && env.f) byId.set(String(env.f).slice(0, 16), conn); receive(env); });
        conn.on('close', () => { conns.delete(conn); for (const [id, c] of byId) if (c === conn){ const L = links.get(id); if (L && !L.lost){ L.lost = true; try { onLost && onLost(id); } catch (e) {} } } });
      };
      const peer = role === 'host' ? new Peer('elementaires-' + code, {debug: 0}) : new Peer({debug: 0});
      t.peer = peer;
      peer.on('open', () => {
        if (role === 'host') peer.on('connection', conn => { if (conns.size >= 3){ conn.close(); return; } wire(conn); });
        else wire(peer.connect('elementaires-' + code, {reliable: true}));
        resolve(t);
      });
      peer.on('error', err => {
        const k = err && err.type;
        if (k === 'unavailable-id') state('taken'); else if (k === 'peer-unavailable') state('nohost'); else state('error', k || 'peer');
        resolve(null);
      });
    });
  }
  // --- transport de test : plusieurs onglets du même navigateur (adresse terminée par ?nettest) ---
  function viaLocal(){
    const bc = new BroadcastChannel('elem-' + code);
    bc.onmessage = e => receive(e.data);
    return {kind: 'local', send: (to, env) => bc.postMessage(env), close: () => bc.close()};
  }
  // L'invité se présente en diffusion jusqu'à ce que l'hôte réponde (son accusé lui donne l'identité de l'hôte)
  let helloT = null;
  function hello(){
    clearInterval(helloT);
    const go = () => { if (hostId){ clearInterval(helloT); state('linked'); return; } raw('*', {s: 0, d: null}); };
    go(); helloT = setInterval(go, 1000);
  }
  async function open(r, c){
    close();
    role = r; code = c;
    let t = null;
    if (/[?&]nettest\b/.test(location.search)) t = viaLocal();
    if (!t) t = await viaRoom();
    if (!t) t = await viaPeer();
    if (!t){ state('error', 'transport'); return false; }
    tr = t; startTimers();
    if (role === 'guest') hello();
    return true;
  }
  function close(){ timers.forEach(clearInterval); timers = []; clearInterval(helloT); if (tr) tr.close(); tr = null; links.clear(); hostId = null; }
  function drop(id){ const L = links.get(id); if (L) L.lost = true; }
  return {
    newCode, cleanCode, open, close, send, sendAll, drop,
    toHost(d){ send(hostId, d); },
    on(fn){ onMsg = fn; }, onState(fn){ onState = fn; }, onLost(fn){ onLost = fn; },
    get me(){ return me; }, get role(){ return role; }, get code(){ return code; }, get hostId(){ return hostId; },
    get kind(){ return tr && tr.kind; }, get live(){ return !!tr; },
    links: () => [...links.entries()].filter(([, L]) => !L.lost).map(([id]) => id)
  };
})();

// ================= Salon =================
const NET_MODES = {duel: {n: 2, name: 'Duel', sub: '1 contre 1'}, duo: {n: 4, name: 'Duo', sub: '2 contre 2'}, ffa3: {n: 3, name: 'Mêlée à 3', sub: 'chacun pour soi'}, ffa4: {n: 4, name: 'Mêlée à 4', sub: 'chacun pour soi'}};
let lobby = {mode: 'duel', allies: true, guests: []};   // côté hôte : invités {id, deck}
let lobbySeen = null;                                    // côté invité : dernier état du salon reçu
let netQ = Promise.resolve(), netView = 'choose';
const escTxt = s => String(s || '').replace(/[<>&"'`]/g, '').slice(0, 28);
function myNetDeck(){ if (!registerActive()) return null; return {name: escTxt(DECKS[4].name), list: [...DECKS[4].list]}; }
// Un deck reçu n'est jamais pris tel quel : on vérifie la liste et on recalcule sa famille ici
function netDeckSpec(d, mine){
  const cnt = {};
  const ok = d && Array.isArray(d.list) && d.list.length === DECK_SIZE && d.list.every(id => typeof id === 'string' && CARDS[id] && BASE_IDS.includes(id) && (cnt[id] = (cnt[id] || 0) + 1) <= MAX_COPIES);
  if (!ok) return null;
  const spec = deckSpec({name: escTxt(d.name) || 'Deck', list: d.list});
  spec.the = mine ? `ton deck « ${spec.name} »` : `le deck « ${spec.name} »`;
  return spec;
}
const lobbyHumans = () => 1 + lobby.guests.length;
function lobbyState(){
  return {t: 'lobby', mode: lobby.mode, allies: lobby.allies, players: [{name: escTxt((activeDeck() || {}).name)}, ...lobby.guests.map(g => ({name: g.deck ? escTxt(g.deck.name) : '…'}))]};
}
function pushLobby(){ if (NET.role !== 'host') return; NET.sendAll(lobbyState()); if (netView === 'host' && screen !== 'game') renderNet('host'); }

// ================= Repères : chaque appareil se voit en joueur 0 =================
// Fait de l'ancien joueur r le joueur 0 (rotation des places, plateaux, équipes et références)
function rotateState(S, r){
  const N = S.players.length; r = ((r % N) + N) % N; if (!r) return S;
  const m = p => (p - r + N) % N;
  const rot = a => a.map((_, j) => a[(j + r) % N]);
  S.players = rot(S.players);
  if (S.ffa){ const B = S.board; S.board = B.map((_, s) => B[(((s >> 1) + r) % N) * 2 + (s & 1)]); S.teams = rot(S.teams); S.outOrder = (S.outOrder || []).map(m); }
  else if (r & 1){ S.board.reverse(); S.teams.reverse(); }
  S.players.forEach((P, j) => { P.team = S.duo ? j % 2 : j; });
  S.board.forEach(row => row.forEach(c => { if (c.u) c.u.owner = m(c.u.owner); }));
  S.active = m(S.active); S.first = m(S.first);
  if (S.winner !== null && S.winner >= 0) S.winner = S.ffa ? m(S.winner) : (r & 1 ? 1 - S.winner : S.winner);
  if (S.diffs){ const d = {}; for (const k in S.diffs) d[m(+k)] = S.diffs[k]; S.diffs = d; }
  return S;
}
const hostIdx = p => (p + S.net.k) % S.net.N;
const locIdx = h => (h - S.net.k + S.net.N) % S.net.N;
function hostSide(s){ if (s < 0) return s; if (S.ffa) return hostIdx(s >> 1) * 2 + (s & 1); return S.net.k & 1 ? 1 - s : s; }
function locSide(s){ if (s < 0) return s; if (S.ffa) return locIdx(s >> 1) * 2 + (s & 1); return S.net.k & 1 ? 1 - s : s; }
function hostFrame(){ const C = clone(S); C.fx = []; C.log = []; delete C.net; return rotateState(C, (S.net.N - S.net.k) % S.net.N); }
// Empreinte de l'état dans le repère de l'hôte : identique partout si les parties sont synchronisées
function netHash(){
  const C = hostFrame();
  let s = '';
  C.players.forEach(P => { s += `${P.hand.join('.')}|${P.deck.length}|${P.mana}|${P.max}|${P.out ? 1 : 0};`; });
  C.teams.forEach(T => { s += T.hp + ','; });
  C.board.forEach(row => row.forEach(c => { s += c.el + (c.u ? `${c.u.card}:${c.u.dmg}:${c.u.xp}:${c.u.stage}:${c.u.owner}` : '-') + ','; }));
  let h = 0; for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) | 0;
  return h;
}
function labelFor(p){
  const ai = S.net.ai[p], tag = ai ? ' (IA)' : '';
  if (p === 0) return 'Tu';
  if (S.duo) return (p === 2 ? 'Ton allié' : `Adversaire ${p === 1 ? 1 : 2}`) + tag;
  if (S.ffa) return `${ai ? 'IA' : 'Joueur'} ${p + 1}`;
  return ai ? "L'adversaire (IA)" : "L'adversaire";
}
function relabel(){ S.players.forEach((P, p) => { P.label = labelFor(p); P.you = p === 0; }); }

// ================= Lancement =================
function hostLaunch(){
  const M = NET_MODES[lobby.mode], mine = myNetDeck();
  if (!mine) return netStatus("Choisis d'abord un deck complet.", true);
  const live = NET.links();
  const humans = [{id: NET.me, deck: mine}, ...lobby.guests.filter(g => g.deck && live.includes(g.id)).map(g => ({id: g.id, deck: g.deck}))];
  if (humans.length < 2) return netStatus('Il faut au moins un autre joueur dans le salon.', true);
  if (humans.length > M.n) return netStatus(`Trop de joueurs pour ce mode (${M.n} places).`, true);
  let seats = Array(M.n).fill(null);
  if (lobby.mode === 'duo'){
    const order = humans.length === 2 ? (lobby.allies ? [0, 2] : [0, 1]) : [0, 1, 2, 3];
    humans.forEach((h, k) => { seats[order[k]] = h; });
  } else {
    humans.forEach((h, k) => { seats[k] = h; });
    if (lobby.mode !== 'duel') seats = seats.sort(() => Math.random() - .5);   // places autour de la table tirées au sort
  }
  const fams = humans.map(h => netDeckSpec(h.deck, false)).filter(Boolean).map(s => s.fam);
  const free = [0, 1, 2, 3].filter(f => !fams.includes(f)).sort(() => Math.random() - .5);
  seats = seats.map(s => s || {ai: lobby.mode.startsWith('ffa') && free.length ? free.shift() : Math.floor(Math.random() * 4)});
  const first = lobby.mode.startsWith('ffa') ? Math.floor(Math.random() * M.n) : (Math.random() < .5 ? 0 : 1);
  const m = {t: 'start', g: Date.now() % 1e9, seed: Math.floor(Math.random() * 2147483646) + 1, mode: lobby.mode, first, seats};
  NET.sendAll(m); startNetMatch(m);
}
function startNetMatch(m){
  const M = NET_MODES[m.mode]; if (!M || !Array.isArray(m.seats) || m.seats.length !== M.n) return;
  const k = m.seats.findIndex(s => s && s.id === NET.me); if (k < 0) return;
  const idx = [], aiH = [];
  for (let j = 0; j < M.n; j++){
    const s = m.seats[j];
    if (s && s.id){ const spec = netDeckSpec(s.deck, j === k); if (!spec){ netStatus('Un deck reçu est invalide. Partie annulée.', true); return; } DECKS[5 + j] = spec; idx.push(5 + j); }
    else { idx.push(Math.max(0, Math.min(3, (s && s.ai) | 0))); aiH.push(j); }
  }
  sel = null; inspect = null; busy = false; running = false; vigie = null; inspectP = null; TUTO = null; logPick = null; tradePick = null;
  netQ = Promise.resolve();
  S = newGame(m.seed, idx, m.first, m.mode === 'duel' ? 'duel' : m.mode === 'duo' ? 'duo' : 'ffa');
  S.diffs = {}; aiH.forEach(j => { S.diffs[j] = 'normal'; });
  rotateState(S, k);
  S.mode = m.mode === 'duel' ? 'ai' : m.mode === 'duo' ? 'duo' : 'ffa';
  S.net = {g: m.g, k, N: M.n, mode: m.mode, ai: {}, ids: {}};
  for (let j = 0; j < M.n; j++){ const p = locIdx(j); if (m.seats[j].id) S.net.ids[p] = m.seats[j].id; else S.net.ai[p] = true; }
  relabel();
  S.log = []; S.fx = [];
  const nAI = aiH.length, nH = M.n - nAI;
  S.log.push(`${M.name} en ligne : ${nH} joueurs${nAI ? ` et ${nAI} IA` : ''}.`);
  if (S.duo) S.log.push(S.net.ai[2] ? 'Ton allié est une IA.' : 'Ton allié est un joueur.');
  S.log.push(S.active === 0 ? 'Tu commences.' : `${S.players[S.active].label} commence.`);
  $('#resultModal').hidden = true; $('#menu').hidden = true;
  showGame(); dealAnim();
  if (S.active === 0) setTimeout(() => turnBanner('À toi de commencer !'), 500);
  else if (S.net.ai[S.active]) netQ = netQ.then(() => sleep(pace(900))).then(runAIs);
}

// ================= Déroulement =================
const gameOver = () => S.winner !== null;
async function runAIs(){
  while (S && S.net && !gameOver() && !over() && S.net.ai[S.active]) await netAiTurn(S.active);
  if (S && S.net && !over() && S.active === 0) turnBanner('À toi de jouer !');
  step();
}
// Coup d'IA calculé dans le repère de l'hôte, puis ramené dans le nôtre
function netAiChoose(p){
  const C = hostFrame();
  const mv = aiChoose(C, hostIdx(p));
  S.seed = C.seed;
  return mv ? {hi: mv.hi, t: {side: locSide(mv.t.side), i: mv.t.i}} : null;
}
async function netAiTurn(p){
  busy = true; step(); await sleep(pace(300));
  let m;
  while (!over() && !gameOver() && (m = netAiChoose(p))){ play(S, p, m.hi, m.t); step(); await sleep(pace(reduced ? 600 : 950)); }
  if (!over() && !gameOver()){
    await runCombat(p);
    if (!over() && !gameOver()){ startTurn(S, nextPlayer(S, p)); step(); await sleep(pace(350)); }
  }
  busy = false;
}
async function netApply(d){
  if (!S || !S.net || d.g !== S.net.g || over() || gameOver()) return;
  const p = locIdx(d.p | 0);
  if (d.t === 'play'){
    if (S.active !== p || S.net.ai[p]) return;
    const t = d.side < 0 ? {side: -1, i: -1} : {side: locSide(d.side), i: d.i};
    if (!targets(S, p, d.hi).some(x => x.side === t.side && x.i === t.i)){ netDesync(); return; }
    play(S, p, d.hi, t); step();
    await sleep(pace(reduced ? 600 : 1000));
  } else if (d.t === 'vigie'){
    if (S.active !== p || !Array.isArray(d.w)) return;
    doVigie(S, p, [locSide(d.w[0]), d.w[1], locSide(d.w[2]), d.w[3]]); step();
    await sleep(pace(500));
  } else if (d.t === 'end'){
    if (S.active !== p) return;
    if (d.h !== netHash()) netDesync();
    busy = true; step();
    await runCombat(p);
    if (!over() && !gameOver()){ startTurn(S, nextPlayer(S, p)); step(); await sleep(pace(300)); }
    busy = false;
    await runAIs();
  } else if (d.t === 'ai'){
    if (S.net.ai[p] || p === 0) return;
    const was = S.players[p].label;
    S.net.ai[p] = true; S.diffs = S.diffs || {}; S.diffs[p] = 'normal'; relabel();
    S.log.push(`${was} a quitté la partie : une IA prend sa place.`); step();
    if (S.active === p) await runAIs();
  }
}
function netDesync(){ if (S.netWarned) return; S.netWarned = true; S.log.push('⚠ Les parties ne sont plus identiques : recommencez une partie si quelque chose semble incohérent.'); render(); }
// Une action locale : appliquée ici, puis envoyée à l'hôte (ou par l'hôte à tous)
function netOut(d){ if (NET.role === 'host') NET.sendAll(d); else NET.toHost(d); }
function netAfterPlay(hi, t){ if (S && S.net) netOut({t: 'play', g: S.net.g, p: hostIdx(0), hi, side: hostSide(t.side), i: t.i}); }
function netAfterVigie(w){ if (S && S.net) netOut({t: 'vigie', g: S.net.g, p: hostIdx(0), w: [hostSide(w[0]), w[1], hostSide(w[2]), w[3]]}); }
function netEndTurn(){
  netOut({t: 'end', g: S.net.g, p: hostIdx(0), h: netHash()});
  const job = (async () => {
    busy = true; sel = null; inspect = null; vigie = null; inspectP = null; step();
    await runCombat(0);
    if (!over() && !gameOver()){ startTurn(S, nextPlayer(S, 0)); step(); await sleep(pace(300)); }
    busy = false;
    await runAIs();
  })();
  netQ = netQ.then(() => job);
}
// Un joueur humain parti : l'hôte le remplace par une IA, au même moment pour tout le monde
function hostReplace(id){
  if (!S || !S.net || gameOver()) return;
  const p = Object.keys(S.net.ids).map(Number).find(q => S.net.ids[q] === id);
  if (p === undefined || S.net.ai[p]) return;
  const d = {t: 'ai', g: S.net.g, p: hostIdx(p)};
  NET.sendAll(d); netQ = netQ.then(() => netApply(d)).catch(e => console.error(e));
}
// L'hôte est parti : les autres joueurs humains sont remplacés par des IA, la partie continue ici
function hostGone(){
  if (!S || !S.net || gameOver()) return;
  for (let p = 1; p < S.net.N; p++) if (!S.net.ai[p] && S.net.ids[p]){ const d = {t: 'ai', g: S.net.g, p: hostIdx(p)}; netQ = netQ.then(() => netApply(d)); }
  netQ = netQ.then(() => { S.log.push("L'hôte s'est déconnecté : la partie continue contre des IA."); step(); });
}
function netLeave(){ if (NET.live){ if (NET.role === 'host') NET.sendAll({t: 'bye'}); else NET.toHost({t: 'bye'}); const was = NET.code; setTimeout(() => { if (NET.code === was) NET.close(); }, 400); } if (S && S.net) S.done = true; }
function netRematch(){ if (NET.role === 'host') hostLaunch(); }

// ================= Messages =================
NET.on((from, d) => {
  if (!d || typeof d !== 'object') return;
  if (NET.role === 'host'){
    if (d.t === 'hi' || d.t === 'deck'){
      if (!lobby.guests.some(g => g.id === from)) hostAddGuest(from);
      const g = lobby.guests.find(x => x.id === from); if (g){ g.deck = d.deck; pushLobby(); }
      return;
    }
    if (d.t === 'bye'){ hostLose(from); return; }
    if (['play', 'vigie', 'end'].includes(d.t)){
      if (!S || !S.net || d.g !== S.net.g || S.net.ids[locIdx(d.p | 0)] !== from) return;   // un invité ne joue que sa propre place
      NET.sendAll(d, from);
      netQ = netQ.then(() => netApply(d)).catch(e => console.error(e));
    }
    return;
  }
  // invité
  if (d.t === 'lobby'){ lobbySeen = d; if ((netView === 'wait' || netView === 'join') && screen !== 'game') renderNet('wait'); return; }
  if (d.t === 'start'){ startNetMatch(d); return; }
  if (d.t === 'bye'){ hostGone(); netStatus("L'hôte a fermé le salon.", true); NET.close(); return; }
  if (['play', 'vigie', 'end', 'ai'].includes(d.t)) netQ = netQ.then(() => netApply(d)).catch(e => console.error(e));
});
function hostAddGuest(id){
  if (lobby.guests.length >= 3){ NET.drop(id); return; }
  lobby.guests.push({id, deck: null});
  netStatus('Un joueur a rejoint le salon !'); SND.play('mana');
}
function hostLose(id){
  const had = lobby.guests.some(g => g.id === id);
  lobby.guests = lobby.guests.filter(g => g.id !== id); NET.drop(id);
  if (S && S.net && !gameOver()) hostReplace(id);
  if (had && screen !== 'game') netStatus('Un joueur a quitté le salon.');
  pushLobby();
}
NET.onLost(id => { if (NET.role === 'host') hostLose(id); else { hostGone(); netStatus("Connexion avec l'hôte perdue.", true); } });
NET.onState((s, info) => {
  if (s === 'linked' && NET.role === 'guest'){ NET.toHost({t: 'hi', deck: myNetDeck()}); netStatus('Connecté au salon !'); renderNet('wait'); return; }
  if (s === 'taken'){ netHost(); return; }   // code déjà pris : on en tire un autre
  if (s === 'nohost'){ netStatus("Aucun salon n'attend avec ce code. Vérifie-le avec l'hôte.", true); NET.close(); return; }
  if (s === 'error' && !(S && S.net && screen === 'game')) netStatus(info === 'transport' ? "Impossible d'ouvrir une connexion en ligne depuis cette page. Utilise la version du jeu publiée sur GitHub." : 'Erreur de connexion. Réessaie.', true);
});

// ================= Écran « En ligne » =================
function netStatus(txt, err){ const s = $('#netStatus'); if (!s) return; s.textContent = txt; s.classList.toggle('err', !!err); s.hidden = !txt; }
function deckChooser(){
  const a = activeDeck();
  return `<h3 class="net-h">Ton deck</h3><div class="deck-list net-decks">${SAVE.decks.map(d => deckRowHTML(d, a && d.id === a.id)).join('')}</div>
    <button class="ghost banner" type="button" id="netDeck"><span>Gérer mes decks</span></button>`;
}
function seatsHTML(mode, names){
  const M = NET_MODES[mode], rows = [];
  for (let j = 0; j < Math.max(M.n, names.length); j++){
    const nm = names[j];
    rows.push(`<li class="${nm ? 'hum' : 'ai'} ${j >= M.n ? 'over' : ''}"><b>${j === 0 ? 'Hôte' : nm ? `Joueur ${j + 1}` : `Place ${j + 1}`}</b><span>${nm ? `deck « ${escTxt(nm.name)} »` : 'IA'}</span></li>`);
  }
  const extra = names.length > M.n ? `<p class="net-warn">Trop de joueurs pour ce mode : ${M.n} places.</p>` : '';
  return `<ul class="net-seats">${rows.join('')}</ul>${extra}`;
}
function renderNet(view = netView){
  netView = view;
  let h;
  if (view === 'host'){
    const st = lobbyState(), ok = lobby.guests.length && lobbyHumans() <= NET_MODES[lobby.mode].n;
    h = `<div class="net-code orn m-gold"><small>Code du salon</small><b id="netCode">${NET.code}</b>
        <button class="ghost banner" type="button" id="netCopy"><span>Copier le code</span></button></div>
      <h3 class="net-h">Mode de jeu</h3>
      <div class="seg net-modes" role="group" aria-label="Mode">${Object.entries(NET_MODES).map(([k, M]) => `<button type="button" data-mode="${k}" aria-pressed="${lobby.mode === k}">${M.name}<small>${M.sub}</small></button>`).join('')}</div>
      ${lobby.mode === 'duo' && lobbyHumans() === 2 ? `<div class="seg net-modes" role="group" aria-label="Équipes"><button type="button" data-allies="1" aria-pressed="${lobby.allies}">Alliés<small>contre 2 IA</small></button><button type="button" data-allies="0" aria-pressed="${!lobby.allies}">Adversaires<small>chacun avec une IA</small></button></div>` : ''}
      <h3 class="net-h">Joueurs</h3>${seatsHTML(lobby.mode, st.players)}
      <button class="btn-end m-gold" type="button" id="netLaunch" ${ok ? '' : 'disabled'}><span>Lancer la partie<small>${lobby.guests.length ? `${lobbyHumans()} joueurs · places libres jouées par des IA` : 'En attente de joueurs…'}</small></span></button>
      ${deckChooser()}`;
  } else if (view === 'join'){
    h = `<label class="net-in"><span>Code du salon</span><input id="netInput" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCDE"></label>
      <button class="btn-end m-gold" type="button" id="netGo"><span>Rejoindre</span></button>${deckChooser()}`;
  } else if (view === 'wait'){
    const L = lobbySeen;
    h = `<div class="net-code orn m-gold"><small>Salon</small><b>${NET.code}</b></div>
      ${L && NET_MODES[L.mode] ? `<h3 class="net-h">${NET_MODES[L.mode].name} · ${NET_MODES[L.mode].sub}</h3>${seatsHTML(L.mode, Array.isArray(L.players) ? L.players.slice(0, 4) : [])}` : ''}
      <p class="c-note center">L'hôte choisit le mode et lance la partie.</p>${deckChooser()}`;
  } else {
    h = `<button class="btn-end m-gold" type="button" id="netCreate"><span>Créer un salon<small>Tu choisis le mode et tu donnes le code à tes amis</small></span></button>
      <button class="btn-end m-gold alt" type="button" id="netJoin"><span>Rejoindre un salon<small>Entre le code de l'hôte</small></span></button>${deckChooser()}`;
  }
  $('#netBody').innerHTML = h;
  if (view === 'join') setTimeout(() => { const i = $('#netInput'); if (i) i.focus(); }, 50);
}
function netHost(){ lobby = {mode: lobby.mode || 'duel', allies: true, guests: []}; NET.open('host', NET.newCode()); renderNet('host'); netStatus('En attente de joueurs…'); }
function openNet(){
  if (!SAVE){ renderStarter(); showPanel('#starterPanel'); return; }
  if (S && S.net && !gameOver()) netLeave();
  NET.close(); showPanel('#netPanel'); renderNet('choose'); netStatus('');
}
$('#netPanel').addEventListener('click', e => {
  const t = e.target;
  if (t.closest('#netCreate')){ if (!myNetDeck()) return netStatus("Choisis d'abord un deck complet.", true); netHost(); return; }
  if (t.closest('#netJoin')){ renderNet('join'); netStatus(''); return; }
  if (t.closest('#netGo')){
    const c = NET.cleanCode($('#netInput').value);
    if (c.length !== 5) return netStatus('Le code fait 5 caractères.', true);
    if (!myNetDeck()) return netStatus("Choisis d'abord un deck complet.", true);
    netStatus('Connexion…'); lobbySeen = null; NET.open('guest', c);
    return;
  }
  const md = t.closest('[data-mode]'); if (md){ lobby.mode = md.dataset.mode; pushLobby(); renderNet('host'); return; }
  const al = t.closest('[data-allies]'); if (al){ lobby.allies = al.dataset.allies === '1'; pushLobby(); renderNet('host'); return; }
  if (t.closest('#netLaunch')){ hostLaunch(); return; }
  if (t.closest('#netCopy')){
    const c = NET.code;
    (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => netStatus('Code copié ! En attente de joueurs…')).catch(() => netStatus(`Ton code : ${c}`));
    return;
  }
  const dk = t.closest('.deck-opt[data-id]');
  if (dk){
    SAVE.active = dk.dataset.id; persist();
    const keep = $('#netInput') ? $('#netInput').value : '';
    renderNet(); if (keep && $('#netInput')) $('#netInput').value = keep;
    if (NET.role === 'guest' && NET.hostId) NET.toHost({t: 'deck', deck: myNetDeck()});
    if (NET.role === 'host') pushLobby();
    return;
  }
  if (t.closest('#netDeck')){ netLeave(); NET.close(); openColl('decks'); return; }
  if (t.closest('#netBack')){ netLeave(); NET.close(); showPanel('#mainPanel'); return; }
});
$('#netPanel').addEventListener('input', e => { if (e.target.id === 'netInput') e.target.value = NET.cleanCode(e.target.value); });
$('#netPanel').addEventListener('keydown', e => { if (e.target.id === 'netInput' && e.key === 'Enter') $('#netGo').click(); });
