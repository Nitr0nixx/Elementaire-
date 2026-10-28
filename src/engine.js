// ===ENGINE START===
const ELS = ['F','E','T','A'];
const EL_NAME = {F:'Feu', E:'Eau', T:'Terre', A:'Air', N:'Neutre'};
const BEATS = {F:'A', A:'T', T:'E', E:'F'};
const AB = {
  dodge:"Esquive : ignore la première attaque reçue.",
  burn:"Brûlure : inflige 1 au héros adverse à la fin de chacun de tes tours.",
  cleave:"Tempête : frappe aussi les couloirs voisins.",
  heal:"Marée : soigne ton héros de 1 à la fin de chacun de tes tours.",
  anchor:"Ancré : sa case ne peut pas changer d'élément.",
  draw:"Pioche 1 carte en arrivant.",
  roots:"Racines : à sa mort, sa case devient Terre.",
  riposte:"Riposte : inflige 1 dégât à chaque créature qui l'attaque.",
  eboulis:"Éboulis : à son arrivée, la case d'en face, chez l'adversaire, devient Terre.",
  mist:"Brume : à sa mort, sa case devient Eau."
};
const AB_SHORT = {dodge:'Esquive', burn:'Brûlure', cleave:'Tempête', heal:'Marée', anchor:'Ancré', draw:'Pioche', roots:'Racines', riposte:'Riposte', eboulis:'Éboulis', mist:'Brume'};
const ARRIVAL = ['draw', 'eboulis'];

const CARDS = {
  // Enfants de l'Orage
  salamandre:{name:'Salamandre', cost:1, el:'F', atk:2, hp:1, xp:3, evo:{F:{name:'Salamandre ardente', atk:4, hp:2}, A:{name:'Wyverne de braise', atk:3, hp:3}}},
  sylphe:{name:'Sylphe', cost:1, el:'A', atk:1, hp:2, xp:3, evo:{A:{name:'Sylphe des vents', atk:2, hp:4, ab:['dodge']}, F:{name:'Feu follet', atk:3, hp:2, ab:['burn']}}},
  faucon:{name:'Faucon messager', cost:2, el:'A', atk:2, hp:2, ab:['draw']},
  griffon:{name:'Griffon', cost:3, el:'A', atk:3, hp:3},
  dragon:{name:'Jeune dragon', cost:4, el:'F', atk:3, hp:4, xp:4, evo:{F:{name:'Dragon du Brasier', atk:6, hp:6}, A:{name:'Dragon des Tempêtes', atk:5, hp:5, ab:['cleave']}}, legend:{xp:6, name:'Dragon Primordial', atk:8, hp:8, ab:['cleave']}},
  golem:{name:'Golem de lave', cost:5, el:'F', atk:4, hp:6, ab:['anchor']},
  embrasement:{name:'Embrasement', cost:2, type:'spell', el:'F', target:'cell', fx:'setF', text:"Une case devient Feu."},
  bourrasque:{name:'Bourrasque', cost:2, type:'spell', el:'A', target:'cell', fx:'gust', text:"Une case devient Air. La créature dessus est poussée vers un couloir voisin libre."},
  bouledefeu:{name:'Boule de feu', cost:3, type:'spell', el:'F', target:'unit', fx:'dmg4', text:"Inflige 4 dégâts à une créature."},
  ascension:{name:"Souffle d'ascension", cost:3, type:'spell', el:'A', target:'ownunit', fx:'xp2', text:"+2 XP à une de tes créatures capables d'évoluer."},
  // Gardiens des Profondeurs
  ondine:{name:'Ondine', cost:1, el:'E', atk:1, hp:2, xp:3, evo:{E:{name:'Ondine des marées', atk:2, hp:4, ab:['heal']}, T:{name:'Nymphe des marais', atk:3, hp:3}}},
  gobelin:{name:'Gobelin des roches', cost:1, el:'T', atk:2, hp:1, xp:3, evo:{T:{name:'Gobelin colosse', atk:3, hp:4}, E:{name:'Gobelin corsaire', atk:4, hp:2}}},
  sirene:{name:'Sirène', cost:2, el:'E', atk:2, hp:2, ab:['draw']},
  kraken:{name:'Kraken juvénile', cost:3, el:'E', atk:3, hp:3},
  tortue:{name:'Tortue ancestrale', cost:4, el:'T', atk:2, hp:6, xp:4, evo:{T:{name:'Tortue-Montagne', atk:3, hp:10}, E:{name:'Léviathan', atk:6, hp:6}}, legend:{xp:6, name:'Gardien du Monde', atk:5, hp:12, ab:['heal','anchor']}},
  treant:{name:'Tréant', cost:5, el:'T', atk:4, hp:6, ab:['roots']},
  inondation:{name:'Inondation', cost:2, type:'spell', el:'E', target:'cell', fx:'setE', text:"Une case devient Eau."},
  seisme:{name:'Séisme', cost:2, type:'spell', el:'T', target:'cell', fx:'quake', text:"Une case devient Terre. La créature dessus subit 1 dégât."},
  raz:{name:'Raz-de-marée', cost:3, type:'spell', el:'E', target:'unit', fx:'bounce', text:"Renvoie une créature dans la main de son propriétaire."},
  seve:{name:'Sève ancienne', cost:3, type:'spell', el:'T', target:'ownunit', fx:'xp2', text:"+2 XP à une de tes créatures capables d'évoluer."},
  // Veilleurs des Cimes
  kobold:{name:'Kobold des cimes', cost:1, el:'T', atk:2, hp:1, xp:3, evo:{T:{name:'Kobold sentinelle', atk:3, hp:4}, A:{name:'Kobold planeur', atk:4, hp:2}}},
  harpie:{name:'Harpie', cost:1, el:'A', atk:1, hp:2, xp:3, evo:{A:{name:'Harpie des rafales', atk:2, hp:4, ab:['dodge']}, T:{name:'Harpie des falaises', atk:3, hp:2, ab:['riposte']}}},
  hibou:{name:'Hibou messager', cost:2, el:'A', atk:2, hp:2, ab:['draw']},
  ours:{name:'Ours des crêtes', cost:3, el:'T', atk:3, hp:3},
  roc:{name:'Oiseau-roc juvénile', cost:4, el:'A', atk:3, hp:4, xp:4, evo:{A:{name:'Roc des nuées', atk:5, hp:5, ab:['cleave']}, T:{name:'Roc de granit', atk:4, hp:8, ab:['anchor']}}, legend:{xp:6, name:'Roi des Cimes', atk:7, hp:9, ab:['cleave']}},
  colosse:{name:'Colosse des cimes', cost:5, el:'T', atk:4, hp:6, ab:['eboulis']},
  vent:{name:'Vent des hauteurs', cost:2, type:'spell', el:'A', target:'cell', fx:'setA', text:"Une case devient Air."},
  sentier:{name:'Sentier de pierre', cost:2, type:'spell', el:'T', target:'owncell', fx:'path', text:"Une case de ton côté devient Terre. Ta créature dessus gagne +1 XP."},
  chute:{name:'Chute de pierres', cost:3, type:'spell', el:'T', target:'unit', fx:'rocks', text:"Inflige 3 dégâts à une créature, et 1 aux créatures adverses des couloirs voisins."},
  cimes:{name:'Souffle des cimes', cost:3, type:'spell', el:'A', target:'ownunit', fx:'xp2', text:"+2 XP à une de tes créatures capables d'évoluer."},
  // Fils de la Vapeur
  diablotin:{name:'Diablotin', cost:1, el:'F', atk:2, hp:1, xp:3, evo:{F:{name:'Diablotin infernal', atk:4, hp:2}, E:{name:'Diablotin des vapeurs', atk:3, hp:3}}},
  anguille:{name:'Anguille', cost:1, el:'E', atk:1, hp:2, xp:3, evo:{E:{name:'Murène des récifs', atk:2, hp:4, ab:['heal']}, F:{name:'Anguille de lave', atk:3, hp:2, ab:['burn']}}},
  crapaud:{name:'Crapaud des geysers', cost:2, el:'E', atk:2, hp:2, ab:['draw']},
  chien:{name:'Chien des cendres', cost:3, el:'F', atk:3, hp:3},
  serpent:{name:'Serpent de mer', cost:4, el:'E', atk:3, hp:4, xp:4, evo:{E:{name:'Hydre des marées', atk:5, hp:5, ab:['cleave']}, F:{name:'Serpent de magma', atk:6, hp:6}}, legend:{xp:6, name:'Hydre primordiale', atk:6, hp:10, ab:['heal']}},
  vapeurel:{name:'Élémentaire de vapeur', cost:5, el:'E', atk:4, hp:6, ab:['mist']},
  brume:{name:'Brume', cost:2, type:'spell', el:'E', target:'cell', fx:'setE', text:"Une case devient Eau."},
  coulee:{name:'Coulée de lave', cost:2, type:'spell', el:'F', target:'cell', fx:'lava', text:"Une case devient Feu. La créature dessus subit 1 dégât."},
  vapeur:{name:'Vapeur brûlante', cost:3, type:'spell', el:'F', target:'unit', fx:'steam', text:"Inflige 3 dégâts à une créature, et soigne ton héros de 1."},
  larme:{name:'Larme de phénix', cost:3, type:'spell', el:'F', target:'ownunit', fx:'xp2', text:"+2 XP à une de tes créatures capables d'évoluer."},
  // Donnée au joueur qui commence en second
  eclat:{name:'Éclat de mana', cost:0, type:'spell', el:'N', target:'none', fx:'mana1', text:"Gagne 1 mana pour ce tour seulement."}
};
const DECKS = [
  {name:"Enfants de l'Orage", the:"les Enfants de l'Orage", hero:'orage', plate:'F', els:['F','A'], cards:['salamandre','sylphe','faucon','griffon','dragon','golem','embrasement','bourrasque','bouledefeu','ascension']},
  {name:'Gardiens des Profondeurs', the:'les Gardiens des Profondeurs', hero:'profondeurs', plate:'E', els:['E','T'], cards:['ondine','gobelin','sirene','kraken','tortue','treant','inondation','seisme','raz','seve']},
  {name:'Veilleurs des Cimes', the:'les Veilleurs des Cimes', hero:'cimes', plate:'T', els:['A','T'], cards:['kobold','harpie','hibou','ours','roc','colosse','vent','sentier','chute','cimes']},
  {name:'Fils de la Vapeur', the:'les Fils de la Vapeur', hero:'vapeur', plate:'V', els:['E','F'], cards:['diablotin','anguille','crapaud','chien','serpent','vapeurel','brume','coulee','vapeur','larme']}
];

function rnd(S){ S.seed = (S.seed + 0x6D2B79F5) | 0; let t = S.seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function shuffle(S, a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd(S) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function clone(S){ return typeof structuredClone === 'function' ? structuredClone(S) : JSON.parse(JSON.stringify(S)); }
function ev(S, e){ S.fx.push(e); }
function log(S, t){ S.log.push(t); if (S.log.length > 40) S.log.shift(); }

// Modes : duel (2 joueurs), duo (4 joueurs, équipes A = 0 et 2, B = 1 et 3), mêlée (3 ou 4 joueurs, chacun pour soi).
// Plateau : S.board[side][lane]. Duel et duo : side = équipe (0 ou 1). Mêlée : side 2p = front gauche du joueur p, 2p+1 = front droit.
function newGame(seed, decks = [0, 1], first = 0, mode){
  mode = mode || (decks.length === 4 ? 'duo' : 'duel');
  const duo = mode === 'duo', ffa = mode === 'ffa', N = decks.length;
  const L = duo ? 6 : ffa ? 2 : 5, HP = duo || !ffa ? 30 : 20;   // Duel et Duo : 30 PV ; Mêlée : 20 PV + compensation de place
  const S = {seed: seed | 0, uid: 1, turn: 0, active: 0, winner: null, log: [], fx: [], board: [], players: [], duo, ffa, mode, lanes: L, teams: [], order: []};
  const LABELS = duo ? ['Tu', 'Adversaire 1', 'Ton allié', 'Adversaire 2'] : ffa ? ['Tu', 'Joueur 2', 'Joueur 3', 'Joueur 4'] : ['Tu', "L'adversaire"];
  const rndEl = () => ELS[Math.floor(rnd(S) * 4)];
  for (let p = 0; p < N; p++){
    const D = DECKS[decks[p]], deck = [];
    if (D.list) deck.push(...D.list); else D.cards.forEach(id => deck.push(id, id));
    shuffle(S, deck);
    S.players.push({deckId: decks[p], team: duo ? p % 2 : p, name: D.name, label: LABELS[p], you: p === 0, mana: 0, max: 0, deck, hand: [], fatigue: 0, out: false});
  }
  const nT = duo ? 2 : N;
  for (let t = 0; t < nT; t++) S.teams.push({hp: HP, max: HP});
  const row = els => els.map(el => ({el, u: null}));
  if (duo){
    for (let t = 0; t < 2; t++){
      const a = DECKS[decks[t]], b = DECKS[decks[t + 2]];
      S.board.push(row(shuffle(S, [a.els[0], a.els[1], b.els[0], b.els[1], rndEl(), rndEl()])));
    }
  } else if (ffa){
    for (let p = 0; p < N; p++){
      const D = DECKS[decks[p]], els = shuffle(S, [D.els[0], D.els[1], rndEl(), rndEl()]);
      S.board.push(row(els.slice(0, 2)), row(els.slice(2)));
    }
  } else {
    for (let p = 0; p < 2; p++){ const D = DECKS[decks[p]]; S.board.push(row(shuffle(S, [D.els[0], D.els[1], rndEl(), rndEl(), rndEl()]))); }
  }
  S.first = first;
  const firstTeam = S.players[first].team;
  for (let k = 0; k < N; k++){
    const p = (first + k) % N, n = S.players[p].team === firstTeam ? 3 : 4;
    for (let c = 0; c < n; c++) draw(S, p);
  }
  // Duel et duo : le joueur suivant reçoit l'Éclat. Mêlée : le dernier à jouer.
  S.players[ffa ? (first + N - 1) % N : (first + 1) % N].hand.push('eclat');
  // Mêlée : +1 PV par place après le premier joueur, +2 de plus pour le dernier
  if (ffa) for (let k = 1; k < N; k++){ const p = (first + k) % N, b = k + (k === N - 1 ? 2 : 0); S.teams[p].hp += b; S.teams[p].max += b; }
  startTurn(S, first);
  S.fx = [];
  return S;
}
const teamOf = (S, p) => S.players[p].team;
function act(S, p, tu, il){ return `${S.players[p].label} ${S.players[p].you ? tu : il}`; }
const teamOfSide = (S, side) => S.ffa ? side >> 1 : side;
const sidesOf = (S, t) => S.ffa ? [2 * t, 2 * t + 1] : [t];
function nextAlive(S, p, dir){
  const N = S.players.length;
  for (let k = 1; k <= N; k++){ const q = (p + dir * k + N * k) % N; if (!S.players[q].out) return q; }
  return p;
}
// Le front qui fait face à ce front (-1 si personne)
function oppSide(S, side){
  if (!S.ffa) return 1 - side;
  const p = side >> 1;
  if (side & 1){ const q = nextAlive(S, p, 1); return q === p ? -1 : 2 * q; }
  const q = nextAlive(S, p, -1); return q === p ? -1 : 2 * q + 1;
}
// Talents de Mêlée (un par deck)
const TALENT = ['elan', 'reflux', 'vigie', 'brume'];
const talentOfDeck = id => (DECKS[id] && DECKS[id].talent) || TALENT[id];
const hasTalent = (S, p, t) => S.ffa && p >= 0 && talentOfDeck(S.players[p].deckId) === t;
function vigieSwaps(S, p){
  const cells = [];
  sidesOf(S, p).forEach(s => S.board[s].forEach((c, i) => { if (!(c.u && c.u.ab.includes('anchor'))) cells.push([s, i]); }));
  const out = [];
  for (let a = 0; a < cells.length; a++) for (let b = a + 1; b < cells.length; b++){
    const [s1, i1] = cells[a], [s2, i2] = cells[b];
    if (S.board[s1][i1].el !== S.board[s2][i2].el) out.push([s1, i1, s2, i2]);
  }
  return out;
}
function doVigie(S, p, w){
  const [s1, i1, s2, i2] = w, c1 = S.board[s1][i1], c2 = S.board[s2][i2], t = c1.el;
  c1.el = c2.el; c2.el = t; S.players[p].vig = true;
  ev(S, {k:'terra', side:s1, i:i1}); ev(S, {k:'terra', side:s2, i:i2});
  log(S, `${act(S, p, 'échanges', 'échange')} deux terrains (Vigie).`);
  cleanup(S); checkWin(S);
}
const enemyOfSide = (S, side) => { const o = oppSide(S, side); return o < 0 ? -1 : teamOfSide(S, o); };
function neighbors(S, p){ const a = nextAlive(S, p, 1), b = nextAlive(S, p, -1); return [...new Set([a, b])].filter(q => q !== p); }

function mkUnit(S, id, owner){
  const d = CARDS[id];
  return {uid: S.uid++, card: id, owner, name: d.name, el: d.el, atk: d.atk, hp: d.hp, dmg: 0,
    ab: (d.ab || []).filter(a => !ARRIVAL.includes(a)), xp: 0, need: d.xp || 0, stage: 0, sick: true, dodged: false};
}
function bonus(u, c){ return c.el === u.el ? 1 : 0; }
function effAtk(u, c){ return u.atk + bonus(u, c); }
function maxHp(u, c){ return u.hp + bonus(u, c); }
function effHp(u, c){ return maxHp(u, c) - u.dmg; }
function maxStage(u){ const d = CARDS[u.card]; return d.legend ? 2 : (d.evo ? 1 : 0); }

function draw(S, p){
  const P = S.players[p], T = S.teams[P.team];
  if (P.out) return;
  if (!P.deck.length){ P.fatigue++; T.hp -= P.fatigue; ev(S, {k:'face', side:P.team, n:P.fatigue}); log(S, `${P.label} n'a plus de cartes : fatigue de ${P.fatigue}.`); checkWin(S); return; }
  const c = P.deck.pop();
  if (P.hand.length >= 8){ if (P.you) log(S, `Main pleine : ${CARDS[c].name} est défaussée.`); }
  else P.hand.push(c);
}
function startTurn(S, p){
  S.active = p; S.turn++;
  const P = S.players[p];
  P.max = Math.min(10, P.max + 1); P.mana = P.max; P.elan = false; P.vig = false;
  if (!P.you && hasTalent(S, p, 'vigie')){
    let best = null, bs = evalState(S, p) + 0.5;
    for (const w of vigieSwaps(S, p)){ const T = clone(S); T.fx = []; T.log = []; doVigie(T, p, w); const sc = evalState(T, p); if (sc > bs){ bs = sc; best = w; } }
    if (best) doVigie(S, p, best);
  }
  sidesOf(S, P.team).forEach(s => S.board[s].forEach(c => { if (c.u && c.u.owner === p) c.u.sick = false; }));
  draw(S, p);
}
function eliminate(S, t){
  const P = S.players[t]; if (P.out) return;
  P.out = true; P.hand = []; (S.outOrder = S.outOrder || []).push(t);
  sidesOf(S, t).forEach(s => S.board[s].forEach(c => { c.u = null; }));
  ev(S, {k:'out', side:t});
  log(S, `${P.label} ${P.you ? 'es éliminé' : 'est éliminé'} !`);
  const k = S.active;
  if (k !== t && !S.players[k].out){ log(S, `${act(S, k, 'pioches', 'pioche')} 2 cartes (prime).`); S.elimPrime = (S.elimPrime || 0) + 1; draw(S, k); draw(S, k); }
}
function checkWin(S){
  if (S.winner !== null) return;
  if (S.ffa){
    if (S.checking) return;
    S.checking = true;
    let dead;
    while ((dead = S.players.findIndex((P, p) => !P.out && S.teams[p].hp <= 0)) >= 0) eliminate(S, dead);
    S.checking = false;
    const alive = S.players.map((P, p) => p).filter(p => !S.players[p].out);
    if (alive.length === 1) S.winner = alive[0];
    else if (!alive.length) S.winner = -1;
    return;
  }
  const a = S.teams[0].hp <= 0, b = S.teams[1].hp <= 0;
  if (a && b) S.winner = -1; else if (a) S.winner = 1; else if (b) S.winner = 0;
}

function targets(S, p, hi){
  const P = S.players[p], d = CARDS[P.hand[hi]], out = [], t = P.team, mine = sidesOf(S, t);
  if (!d || P.out || d.cost > P.mana || S.winner !== null || S.active !== p) return out;
  if (d.type !== 'spell'){ mine.forEach(s => S.board[s].forEach((c, i) => { if (!c.u) out.push({side:s, i}); })); return out; }
  if (d.target === 'none'){ out.push({side:-1, i:-1}); return out; }
  S.board.forEach((row, s) => {
    if (S.ffa && S.players[s >> 1].out) return;
    const own = mine.includes(s);
    row.forEach((c, i) => {
      if (d.target === 'cell' && !(c.u && c.u.ab.includes('anchor'))) out.push({side:s, i});
      else if (d.target === 'unit' && c.u) out.push({side:s, i});
      else if (d.target === 'owncell' && own && !(c.u && c.u.ab.includes('anchor'))) out.push({side:s, i});
      else if (d.target === 'ownunit' && c.u && own && c.u.need > 0 && c.u.stage < maxStage(c.u)) out.push({side:s, i});
    });
  });
  return out;
}

function play(S, p, hi, t){
  if (!targets(S, p, hi).some(x => x.side === t.side && x.i === t.i)) return false;
  const P = S.players[p], id = P.hand.splice(hi, 1)[0], d = CARDS[id];
  P.mana -= d.cost;
  if (d.type !== 'spell'){
    S.board[t.side][t.i].u = mkUnit(S, id, p);
    ev(S, {k:'summon', side:t.side, i:t.i, p, id});
    log(S, `${act(S, p, 'invoques', 'invoque')} ${d.name}.`);
    if ((d.ab || []).includes('draw')) draw(S, p);
    if ((d.ab || []).includes('eboulis')){ const o = oppSide(S, t.side); if (o >= 0) setEl(S, o, t.i, 'T'); }
  } else {
    log(S, `${act(S, p, 'lances', 'lance')} ${d.name}.`);
    ev(S, {k:'cast', side:t.side, i:t.i, p, id, el:d.el});
    spell(S, p, d.fx, t);
  }
  cleanup(S); checkWin(S);
  return true;
}

function setEl(S, side, i, el){
  const c = S.board[side][i];
  if (c.u && c.u.ab.includes('anchor')) return;
  c.el = el; ev(S, {k:'terra', side, i});
}
function damage(S, side, i, n){
  const u = S.board[side][i].u; if (!u) return;
  u.dmg += n; ev(S, {k:'dmg', side, i, n, id:u.card, st:u.stage, el:u.el, o:u.owner});
}
function gainXp(S, side, i, n){
  const c = S.board[side][i], u = c.u;
  if (!u || !u.need) return;
  u.xp += n; tryEvolve(S, side, i);
}
function tryEvolve(S, side, i){
  const c = S.board[side][i], u = c.u, d = CARDS[u.card];
  while (u.need > 0 && u.xp >= u.need){
    let f;
    if (u.stage === 0 && d.evo){ const br = d.evo[c.el] ? c.el : u.el; f = d.evo[br]; u.el = br; u.need = d.legend ? d.legend.xp : 0; }
    else if (u.stage === 1 && d.legend){ f = d.legend; u.need = 0; }
    else { u.need = 0; break; }
    const old = u.name;
    u.stage++; u.name = f.name; u.atk = f.atk; u.hp = f.hp; u.dmg = 0; u.ab = [...(f.ab || [])]; u.dodged = false; u.xp = 0;
    ev(S, {k:'evolve', side, i});
    log(S, `${old} évolue en ${f.name} !`);
  }
}
function cleanup(S){
  S.board.forEach((row, s) => row.forEach((c, i) => {
    const u = c.u;
    if (u && effHp(u, c) <= 0){
      c.u = null; ev(S, {k:'death', side:s, i, u:{card:u.card, stage:u.stage, el:u.el}}); log(S, `${u.name} tombe au combat.`);
      if (hasTalent(S, u.owner, 'reflux') && u.stage > 0 && !S.players[u.owner].out) healTeam(S, S.players[u.owner].team, 1);
      if (u.ab.includes('roots')) setEl(S, s, i, 'T');
      if (u.ab.includes('mist')) setEl(S, s, i, 'E');
    }
  }));
}
function healTeam(S, t, n){
  const T = S.teams[t], h = Math.min(n, T.max - T.hp);
  if (h > 0){ T.hp += h; ev(S, {k:'heal', side:t, n:h}); }
}

function spell(S, p, fx, t){
  const tm = teamOf(S, p);
  if (fx === 'mana1'){ S.players[p].mana += 1; ev(S, {k:'mana', side:tm}); return; }
  const c = S.board[t.side][t.i], W = S.board[t.side].length;
  switch (fx){
    case 'setF': setEl(S, t.side, t.i, 'F'); break;
    case 'setE': setEl(S, t.side, t.i, 'E'); break;
    case 'setA': setEl(S, t.side, t.i, 'A'); break;
    case 'path': setEl(S, t.side, t.i, 'T'); if (c.u) gainXp(S, t.side, t.i, 1); break;
    case 'lava': setEl(S, t.side, t.i, 'F'); if (c.u) damage(S, t.side, t.i, 1); break;
    case 'rocks': {
      damage(S, t.side, t.i, 3);
      // les couloirs voisins de la cible, chez un adversaire
      const es = teamOfSide(S, t.side) === tm ? oppSide(S, t.side) : t.side;
      if (es >= 0) [t.i - 1, t.i + 1].forEach(j => { if (j >= 0 && j < S.board[es].length && S.board[es][j].u) damage(S, es, j, 1); });
      break;
    }
    case 'steam': damage(S, t.side, t.i, 3); healTeam(S, tm, 1); break;
    case 'gust': {
      setEl(S, t.side, t.i, 'A');
      if (c.u){
        const j = [t.i - 1, t.i + 1].find(j => j >= 0 && j < W && !S.board[t.side][j].u);
        if (j !== undefined){ S.board[t.side][j].u = c.u; c.u = null; ev(S, {k:'push', side:t.side, i:j}); }
      }
      break;
    }
    case 'quake': setEl(S, t.side, t.i, 'T'); if (c.u) damage(S, t.side, t.i, 1); break;
    case 'dmg4': damage(S, t.side, t.i, 4); break;
    case 'xp2': gainXp(S, t.side, t.i, 2); break;
    case 'bounce': {
      const u = c.u; c.u = null; ev(S, {k:'death', side:t.side, i:t.i, u:{card:u.card, stage:u.stage, el:u.el}, bounce:true});
      const O = S.players[u.owner];
      if (O.hand.length < 8) O.hand.push(u.card);
      break;
    }
  }
}

// La créature du joueur p sur (side, i) attaque tout droit
function attackAt(S, p, side, i){
  const c = S.board[side][i], u = c.u;
  if (!u || u.owner !== p || u.sick || S.winner !== null || S.players[p].out) return;
  const os = oppSide(S, side); if (os < 0) return;
  const atk = effAtk(u, c), W = S.board[os].length;
  ev(S, {k:'attack', side, i, id:u.card, st:u.stage, el:u.el, p});
  const lanes = u.ab.includes('cleave') ? [i, i - 1, i + 1] : [i];
  for (const j of lanes){
    if (j < 0 || j >= W) continue;
    const dc = S.board[os][j];
    if (dc.u){
      const d = dc.u;
      if (d.ab.includes('dodge') && !d.dodged){ d.dodged = true; ev(S, {k:'dodge', side:os, i:j}); continue; }
      const mult = BEATS[u.el] === d.el && !hasTalent(S, d.owner, 'brume') ? 2 : 1;
      if (mult === 2) ev(S, {k:'super', side:os, i:j, a:u.el, d:d.el});
      const uid = d.uid;
      damage(S, os, j, atk * mult);
      if (d.ab.includes('riposte')){ damage(S, side, i, 1); ev(S, {k:'riposte', side, i}); }
      cleanup(S);
      if ((!dc.u || dc.u.uid !== uid) && c.u === u) gainXp(S, side, i, 2);
      if (c.u !== u) break;
    } else if (j === i){
      const et = teamOfSide(S, os), P = S.players[p];
      let n = atk;
      if (hasTalent(S, p, 'elan') && !P.elan){ n += 1; P.elan = true; }
      S.teams[et].hp -= n; ev(S, {k:'face', side:et, n});
      checkWin(S);
      if (S.winner !== null) return;
    }
  }
  checkWin(S);
}
// Compatibilité : attaque du couloir i sur le côté de l'équipe (duel et duo)
function attackLane(S, p, i){ attackAt(S, p, teamOf(S, p), i); }
// Liste des créatures du joueur p qui attaquent, dans l'ordre
function attackers(S, p){
  const out = [];
  sidesOf(S, teamOf(S, p)).forEach(s => S.board[s].forEach((c, i) => { if (c.u && c.u.owner === p && !c.u.sick) out.push({side:s, i}); }));
  return out;
}
// Harmonie (Duo) : une créature voisine d'une créature alliée d'un autre élément gagne +1 XP
function harmony(S, t, i, u){
  if (!S.duo) return false;
  return [i - 1, i + 1].some(j => { const n = j >= 0 && j < S.lanes && S.board[t][j].u; return n && n.owner !== u.owner && n.el !== u.el; });
}
function upkeep(S, p){
  const t = teamOf(S, p);
  sidesOf(S, t).forEach(s => S.board[s].forEach((c, i) => {
    const u = c.u; if (!u || u.owner !== p || S.winner !== null) return;
    if (u.ab.includes('burn')){ const e = enemyOfSide(S, s); if (e >= 0){ S.teams[e].hp -= 1; ev(S, {k:'face', side:e, n:1}); } }
    if (u.ab.includes('heal')) healTeam(S, t, 1);
    if (!u.sick){
      const h = harmony(S, s, i, u);
      if (h && u.need) ev(S, {k:'harmony', side:s, i});
      gainXp(S, s, i, 1 + (c.el === u.el ? 1 : 0) + (h ? 1 : 0));
    }
  }));
  checkWin(S);
}
const nextPlayer = (S, p) => S.ffa ? nextAlive(S, p, 1) : (p + 1) % S.players.length;
function endTurn(S){
  const p = S.active;
  for (const a of attackers(S, p)) attackAt(S, p, a.side, a.i);
  if (S.winner === null) upkeep(S, p);
  if (S.winner === null) startTurn(S, nextPlayer(S, p));
}

// --- IA ---
function unitVal(S, side, i){
  const c = S.board[side][i], u = c.u, a = effAtk(u, c), h = effHp(u, c);
  let v = a * 2 + h * 1.3 + u.stage * 4 + u.ab.length * 1.2;
  if (u.need) v += (u.xp / u.need) * 3;
  const os = oppSide(S, side), opp = os >= 0 ? S.board[os][i] && S.board[os][i].u : null;
  if (!opp) v += a * 1.2; else if (BEATS[u.el] === opp.el) v += a;
  return v;
}
function evalState(S, p){
  const t = teamOf(S, p);
  if (S.ffa){
    if (S.players[p].out || (S.winner !== null && S.winner !== t)) return -1e6;
    if (S.winner === t) return 1e6;
    const nb = neighbors(S, p);
    let s = S.teams[t].hp * 1.5 + S.players[p].hand.length;
    S.players.forEach((P, q) => {
      if (q === p || P.out) return;
      const w = nb.includes(q) ? 2 : 0.6;
      s -= S.teams[q].hp * w + P.hand.length * 0.3;
    });
    s -= (S.players.length - S.players.filter(P => P.out).length) * 4;
    sidesOf(S, t).forEach(sd => {
      S.board[sd].forEach((c, i) => { if (c.u) s += unitVal(S, sd, i); });
      const o = oppSide(S, sd);
      if (o >= 0) S.board[o].forEach((c, i) => { if (c.u) s -= unitVal(S, o, i); });
    });
    return s;
  }
  if (S.winner === t) return 1e6;
  if (S.winner === 1 - t) return -1e6;
  if (S.winner === -1) return -5e5;
  let hand = 0;
  S.players.forEach(P => { hand += P.team === t ? P.hand.length : -P.hand.length; });
  let s = S.teams[t].hp * 1.5 - S.teams[1 - t].hp * 2 + hand;
  for (let i = 0; i < S.lanes; i++){
    if (S.board[t][i].u) s += unitVal(S, t, i);
    if (S.board[1 - t][i].u) s -= unitVal(S, 1 - t, i);
  }
  return s;
}
function evalAfter(T, p){
  const X = clone(T); X.fx = []; X.log = [];
  for (const a of attackers(X, p)) attackAt(X, p, a.side, a.i);
  if (X.winner === null) upkeep(X, p);
  if (aiLevel(T, p) === 'hard' && X.winner === null && !(X.ffa && X.players[p].out)){
    // Difficile : anticipe aussi la riposte du joueur suivant
    const q = nextPlayer(X, p);
    if (teamOf(X, q) !== teamOf(X, p)){
      const s0 = evalState(X, p);
      sidesOf(X, teamOf(X, q)).forEach(s => X.board[s].forEach(c => { if (c.u && c.u.owner === q) c.u.sick = false; }));
      for (const a of attackers(X, q)) attackAt(X, q, a.side, a.i);
      return 0.4 * s0 + 0.6 * evalState(X, p);
    }
  }
  return evalState(X, p);
}
// Niveau de l'IA : 'easy', 'normal' ou 'hard' (par joueur si S.diffs est défini)
function aiLevel(S, p){ return (S.diffs && S.diffs[p]) || S.diff || 'normal'; }
function aiChoose(S, p, depth = 0){
  const lvl = aiLevel(S, p);
  const base = clone(S); base.fx = []; base.log = [];
  const pass = evalAfter(base, p);
  let best = null, bs = pass + 0.5;
  const cands = [];
  const seen = new Set();
  base.players[p].hand.forEach((id, hi) => {
    if (seen.has(id)) return; seen.add(id);
    for (const t of targets(base, p, hi)){
      const T = clone(base);
      play(T, p, hi, t);
      let sc;
      if (CARDS[id].fx === 'mana1'){
        // L'éclat ne vaut que s'il rend jouable un meilleur coup
        if (depth) continue;
        const m = aiChoose(T, p, 1);
        if (!m) continue;
        sc = m.score - 0.3;
      } else sc = evalAfter(T, p);
      cands.push({hi, t, score: sc});
      if (sc > bs){ bs = sc; best = {hi, t, score: sc}; }
    }
  });
  if (lvl === 'easy' && !depth){
    // Facile : s'arrête parfois trop tôt et choisit souvent un coup au hasard parmi les coups utiles
    if (rnd(S) < 0.25) return null;
    const ok = cands.filter(c => c.score > pass);
    if (ok.length && rnd(S) < 0.55) return ok[Math.floor(rnd(S) * ok.length)];
  }
  return best;
}
// ===ENGINE END===
