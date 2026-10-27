// --- Interface ---
const SIG = {
  F:'<path fill="currentColor" d="M12 2c.8 3.6 5.8 5.8 5.8 11.6a5.8 5.8 0 0 1-11.6 0c0-2.9 1.7-4.8 2.8-6.6.1 2 1 3.1 2.1 3.3-.2-3 .1-5.6.9-8.3z"/>',
  E:'<path fill="currentColor" d="M12 2.5s6.8 7.6 6.8 12.4a6.8 6.8 0 0 1-13.6 0C5.2 10.1 12 2.5 12 2.5z"/>',
  T:'<path fill="currentColor" d="M1.5 20.5 8.8 7.6l3.9 6.3 2.9-4.1 6.9 10.7z"/>',
  A:'<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M3 8.5h10.5a3 3 0 1 0-3-3M3 13.5h15a3 3 0 1 1-3 3M3 18.5h6"/>',
  N:'<path fill="currentColor" d="M12 2l7 10-7 10-7-10z"/>'
};
const sigil = (el, cls = '') => `<svg class="sig ${cls}" viewBox="0 0 24 24" aria-hidden="true">${SIG[el]}</svg>`;
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pace = ms => reduced ? Math.min(ms, 150) : ms;
const STAGE = ['Novice', 'Adepte', 'Légende'];

function frameSVG(el){
  const p = PAL[el], mir = s => `<g transform="matrix(-1 0 0 1 100 0)">${s}</g>`;
  let o = '';
  if (el === 'F'){
    const f = `<path d="M3 98 C1 84 8 78 5 62 C10 71 12 80 11 98Z" fill="${p.m}" stroke="${LEAD}" stroke-width=".9"/><path d="M5.5 98 C4.5 89 7.5 85 7 77 C9.5 83 10 89 9 98Z" fill="${p.l}"/><path d="M4 40 C3 34 7 30 6 24 C9 29 10 34 8 40Z" fill="${p.m}" stroke="${LEAD}" stroke-width=".8"/>`;
    o = f + mir(f);
  } else if (el === 'E'){
    o = `<path d="M2 131 Q8 125 14 131 T26 131 T38 131 T50 131 T62 131 T74 131 T86 131 T98 131 L98 139 Q98 140.5 96 140.5 L4 140.5 Q2 140.5 2 139Z" fill="${p.d}" stroke="${LEAD}" stroke-width=".9"/>`;
    const d = `<path d="M7 66 C9.5 71 10.5 73 10.5 75.5 A3.5 3.5 0 0 1 3.5 75.5 C3.5 73 4.5 71 7 66Z" fill="${p.l}" stroke="${LEAD}" stroke-width=".8"/><path d="M7 84 C8.5 87 9 88 9 89.5 A2 2 0 0 1 5 89.5 C5 88 5.5 87 7 84Z" fill="${p.m}" stroke="${LEAD}" stroke-width=".7"/>`;
    o += d + mir(d);
  } else if (el === 'T'){
    const s = `<rect x="4" y="88" width="6" height="6" fill="${p.l}" stroke="${LEAD}" stroke-width=".9" transform="rotate(45 7 91)"/><rect x="4" y="60" width="6" height="14" rx="1" fill="${p.m}" stroke="${LEAD}" stroke-width=".9"/><circle cx="7" cy="50" r="2.2" fill="${GOLD}" stroke="${LEAD}" stroke-width=".7"/><circle cx="7" cy="40" r="1.6" fill="${p.a}" stroke="${LEAD}" stroke-width=".6"/>`;
    o = s + mir(s) + `<path d="M3 133 L20 130 L36 134 L52 130 L68 134 L84 130 L97 133" fill="none" stroke="${p.l}" stroke-width="1" opacity=".7"/>`;
  } else {
    const c = 'M7 97 C2 87 12 81 8 72 C6 67 2.5 70 4 74', f2 = 'M7 58 C4 50 9 44 7 36';
    const s = `<path d="${c}" fill="none" stroke="${LEAD}" stroke-width="3.2"/><path d="${c}" fill="none" stroke="${p.l}" stroke-width="1.5"/><path d="${f2}" fill="none" stroke="${LEAD}" stroke-width="2.6"/><path d="${f2}" fill="none" stroke="${p.m}" stroke-width="1.2"/>`;
    o = s + mir(s);
  }
  return `<svg class="frame" viewBox="0 0 100 142" preserveAspectRatio="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="97" height="139" rx="7" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
    <rect x="3.6" y="3.6" width="92.8" height="134.8" rx="5.5" fill="none" stroke="#000" stroke-opacity=".55"/>
    ${o}
    <path d="M2 100 L98 100 L94 107 L98 114 L2 114 L6 107Z" fill="#efe0b8" stroke="${LEAD}" stroke-width="1.1"/>
    <path d="M6 101.6 L94 101.6 M6 112.4 L94 112.4" stroke="${GOLD}" stroke-width=".7"/>
  </svg>`;
}

const IMG = new Set(['dragon', 'embrasement', 'salamandre', 'sylphe', 'faucon', 'griffon', 'golem', 'bourrasque', 'ascension', 'ondine', 'gobelin', 'sirene', 'kraken', 'tortue', 'treant', 'inondation', 'seisme', 'raz', 'seve', 'bouledefeu', 'eclat', 'kobold', 'harpie', 'hibou', 'ours', 'roc', 'colosse', 'vent', 'sentier', 'chute', 'cimes', 'diablotin', 'anguille', 'crapaud', 'chien', 'vapeurel', 'brume', 'coulee', 'vapeur', 'larme', 'serpent']);
const EVO_IMG = {'sylphe:1:A':'sylphe-vents', 'sylphe:1:F':'feu-follet', 'gobelin:1:T':'gobelin-colosse', 'gobelin:1:E':'gobelin-corsaire', 'dragon:2':'dragon-primordial', 'salamandre:1:F':'salamandre-ardente', 'dragon:1:F':'dragon-brasier', 'tortue:1:T':'tortue-montagne', 'tortue:1:E':'leviathan', 'tortue:2':'gardien-monde', 'salamandre:1:A':'wyverne-braise', 'dragon:1:A':'dragon-tempetes', 'ondine:1:E':'ondine-marees', 'ondine:1:T':'nymphe-marais',
  'kobold:1:T':'kobold-sentinelle', 'kobold:1:A':'kobold-planeur', 'harpie:1:A':'harpie-rafales', 'harpie:1:T':'harpie-falaises', 'roc:1:A':'roc-nuees', 'roc:1:T':'roc-granit', 'roc:2':'roi-cimes',
  'diablotin:1:F':'diablotin-infernal', 'diablotin:1:E':'diablotin-vapeurs', 'anguille:1:E':'murene', 'anguille:1:F':'anguille-lave', 'serpent:1:E':'hydre-marees', 'serpent:1:F':'serpent-magma', 'serpent:2':'hydre-primordiale'};
function imgOf(key, stage, el){
  if (!stage) return IMG.has(key) ? key : null;
  return EVO_IMG[stage === 2 ? `${key}:2` : `${key}:1:${el}`] || null;
}
const FR = {
  F:{d:'#2a0705', m:'#b8301a', l:'#ff9a3c', g:'#ffe0a0', bg1:'#3a0d08', bg2:'#140403', shape:'flame'},
  A:{d:'#081c38', m:'#2f78c8', l:'#a8e4ff', g:'#ecfbff', bg1:'#0d2b52', bg2:'#050f1f', shape:'crystal'},
  E:{d:'#04212e', m:'#168aa6', l:'#66e0e6', g:'#d8fdff', bg1:'#073246', bg2:'#021118', shape:'crystal'},
  T:{d:'#122008', m:'#4b7d22', l:'#a8d65a', g:'#eef8c0', bg1:'#1d3010', bg2:'#080f04', shape:'leaf'},
  N:{d:'#3d2a0c', m:'#a8782a', l:'#e6b85a', g:'#fff1c4', bg1:'#2a2016', bg2:'#0e0a06', shape:'crystal'}
};
const SPIKE = {
  crystal:(f) => `<path d="M0 -15 L4.2 -3 L0 2 L-4.2 -3Z" fill="${f.l}" stroke="${f.d}" stroke-width=".9"/><path d="M0 -15 L1.6 -3 L0 0Z" fill="${f.g}"/>`,
  flame:(f) => `<path d="M0 -17 C3.5 -11 6.5 -6 4.2 0.5 L-4.2 0.5 C-6.5 -6 -2 -8.5 0 -17Z" fill="${f.m}" stroke="${f.d}" stroke-width=".9"/><path d="M0 -10 C2 -6.5 3.2 -3 2 0 L-2 0 C-3.2 -3 -1 -5.5 0 -10Z" fill="${f.l}"/>`,
  leaf:(f) => `<path d="M0 -16 C6.5 -11 6.5 -3 0 1.5 C-6.5 -3 -6.5 -11 0 -16Z" fill="${f.m}" stroke="${f.d}" stroke-width=".9"/><path d="M0 -13 L0 0" stroke="${f.l}" stroke-width=".9"/>`
};
const PRISM_FM = ['#3b2a6e', '#4fc9ef', '#fff6d6', '#f07ad6', '#f6c552'], GOLD_FM = ['#4a2e0a', '#c9962e', '#fff4c8', '#c9962e', '#4a2e0a'];
function frameSVG2(el, spell, nums = {}){
  const f = FR[el], n = ++artN, sp = SPIKE[f.shape](f), P = nums.prism, FL = nums.full;
  const fmStops = (P || FL) ? (FL ? GOLD_FM : PRISM_FM).map((c, k) => `<stop offset="${k / 4}" stop-color="${c}"/>`).join('') : `<stop offset="0" stop-color="${f.d}"/><stop offset=".3" stop-color="${f.m}"/><stop offset=".5" stop-color="${f.g}"/><stop offset=".7" stop-color="${f.m}"/><stop offset="1" stop-color="${f.d}"/>`;
  const num = (cx, cy, fs, v, fill = '#fff') => v === undefined || v === null ? '' : `<text x="${cx}" y="${(cy + fs * .35).toFixed(1)}" text-anchor="middle" font-family="'Alegreya SC', 'Palatino Linotype', Georgia, serif" font-weight="800" font-size="${fs}" fill="${fill}" stroke="#1a0f06" stroke-width="${(fs / 7).toFixed(1)}" stroke-linejoin="round" paint-order="stroke" style="font-variant-numeric:lining-nums">${v}</text>`;
  const at = (x, y, a, s = 1) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${sp}</g>`;
  const medal = (cx, cy, r, fill, noTop) => `${noTop ? '' : at(cx, cy - r - 1, 0, .7)}${at(cx - r - 1, cy, -90, .7)}${at(cx + r + 1, cy, 90, .7)}${at(cx, cy + r + 1, 180, .7)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="url(#fm${n})" stroke-width="3.2"/><circle cx="${cx}" cy="${cy}" r="${r - 3.4}" fill="none" stroke="${f.d}" stroke-width="1"/>`;
  return `<svg class="frame" viewBox="0 0 200 300" aria-hidden="true"><defs>
    <linearGradient id="fm${n}" x1="0" y1="0" x2="1" y2="1">${fmStops}</linearGradient>
    <linearGradient id="fb${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.bg1}"/><stop offset="1" stop-color="${f.bg2}"/></linearGradient>
    <radialGradient id="fg${n}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${f.l}"/><stop offset=".45" stop-color="${f.m}"/><stop offset="1" stop-color="${f.d}"/></radialGradient>
    <radialGradient id="fd${n}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#3a2a22"/><stop offset="1" stop-color="#0c0806"/></radialGradient>
    <linearGradient id="fp${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ead2"/><stop offset="1" stop-color="#dac69c"/></linearGradient></defs>
    ${FL ? '' : `<path fill-rule="evenodd" fill="url(#fb${n})" d="M14 1.5 H186 Q198.5 1.5 198.5 14 V286 Q198.5 298.5 186 298.5 H14 Q1.5 298.5 1.5 286 V14 Q1.5 1.5 14 1.5Z M13 31 V197 H187 V31Z"/>`}
    <rect x="4.5" y="4.5" width="191" height="291" rx="11" fill="none" stroke="url(#fm${n})" stroke-width="4.5"/>
    <rect x="8" y="8" width="184" height="284" rx="8" fill="none" stroke="${f.d}" stroke-width="1"/>
    ${FL ? '' : `<rect x="13" y="31" width="174" height="166" fill="none" stroke="url(#fm${n})" stroke-width="3.5"/>
    <rect x="15" y="33" width="170" height="162" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="1.2"/>`}
    ${at(9, 9, -45, 1.5)}${at(191, 9, 45, 1.5)}${at(9, 291, -135, 1.5)}${at(191, 291, 135, 1.5)}
    ${at(3, 95, -90)}${at(3, 150, -90, .8)}${at(197, 95, 90)}${at(197, 150, 90, .8)}${at(100, 4, 0, .9)}
    <path d="M40 9 H160 L169 20.5 L160 32 H40 L31 20.5Z" fill="url(#fd${n})" stroke="url(#fm${n})" stroke-width="2.2"/>
    <path d="M52 190 H148 L155 198.5 L148 207 H52 L45 198.5Z" fill="url(#fd${n})" stroke="url(#fm${n})" stroke-width="1.8"/>
    ${spell ? `<rect x="15" y="211" width="170" height="62" rx="6" fill="${FL ? 'rgba(14,9,5,.66)' : `url(#fp${n})`}" stroke="url(#fm${n})" stroke-width="2.6"/>` : `<rect x="15" y="210" width="170" height="51" rx="6" fill="${FL ? 'rgba(14,9,5,.66)' : `url(#fp${n})`}" stroke="url(#fm${n})" stroke-width="2.6"/>`}
    ${FL ? '' : `<g transform="translate(146 220) scale(1.85)" color="${f.d}" opacity=".16"><svg width="24" height="24" viewBox="0 0 24 24">${SIG[el]}</svg></g>`}
    ${medal(25, 25, 19, `url(#fg${n})`)}${medal(175, 25, 17, `url(#fd${n})`)}
    <g transform="translate(164.5 14.5) scale(.88)" color="${f.l}"><svg width="24" height="24" viewBox="0 0 24 24">${SIG[el]}</svg></g>
    ${spell ? '' : medal(30, 279, 16, `url(#fg${n})`, true) + medal(170, 279, 16, `url(#fg${n})`, true)}
    ${num(25, 25, 28, nums.cost)}${spell ? '' : num(30, 279, 22, nums.atk, nums.buff ? '#fff1a8' : '#fff') + num(170, 279, 22, nums.hp, nums.buff ? '#fff1a8' : nums.hurt ? '#ffb4a8' : '#fff')}
    ${FL ? `<path d="M100 279 L111 290 L100 301 L89 290Z" fill="url(#fm${n})" stroke="#3a2008" stroke-width="1"/><path d="M100 283.5 L101.8 288.2 L106.5 288.4 L102.8 291.3 L104.1 296 L100 293.3 L95.9 296 L97.2 291.3 L93.5 288.4 L98.2 288.2Z" fill="#fff8dc"/>` : P ? `<path d="M100 281 L109 291 L100 300 L91 291Z" fill="url(#fm${n})" stroke="#fff" stroke-width="1"/><path d="M100 285 L102 289.5 L106.5 291 L102 292.5 L100 297 L98 292.5 L93.5 291 L98 289.5Z" fill="#fff"/>` : `<path d="M100 286 L107 293 L100 300 L93 293Z" fill="${f.l}" stroke="${f.d}" stroke-width="1"/>`}
  </svg>`;
}
function rulesText(o){
  const d = CARDS[o.key];
  if (d.type === 'spell') return d.text;
  if (o.stage) return (o.ab || []).map(a => AB[a]).join('<br>') || '<i>Forme évoluée.</i>';
  const out = (d.ab || []).map(a => AB[a]);
  if (d.evo){
    out.push(`<b>Évolue à ${d.xp} XP</b>`);
    Object.entries(d.evo).forEach(([el, f]) => out.push(`${EL_NAME[el]} : ${f.name} ${f.atk}/${f.hp}`));
    if (d.legend) out.push(`puis ${d.legend.name} ★`);
  }
  return out.join('<br>');
}
function unitArt(u){
  const im = imgOf(u.card, u.stage, u.el);
  return im ? `<div class="u-img"><img src="img/${im}-art.jpg" alt="" draggable="false"></div>` : artSVG(u.card, u.el, u.stage);
}
function cardFace(o){
  const img = imgOf(o.key, o.stage || 0, o.el);
  if (o.full && !o.stage) o = {...o, prism: false};
  const full = o.full && !o.stage;
  return `${full ? `<div class="c-full"><img src="img/${o.key}-full.jpg" alt="" draggable="false"></div>` : `<div class="c-win">${img ? `<img src="img/${img}.jpg" alt="" draggable="false">` : artSVG(o.key, o.el, o.stage || 0, 'rect')}</div>`}
    ${o.prism ? '<div class="holo"></div>' : ''}
    ${frameSVG2(o.el, o.atk === undefined, {cost:o.cost, atk:o.atk, hp:o.hp, buff:o.buff, hurt:o.hurt, prism:o.prism, full})}
    ${o.prism ? '<div class="holo hf"></div><div class="glint"></div><div class="sparks"></div>' : full ? '<div class="glint gold"></div><div class="sparks"></div>' : ''}
    <div class="c-name ${o.name.length > 15 ? 'xlong' : o.name.length > 11 ? 'long' : ''}">${o.name}</div>
    <div class="c-type">${o.typeLine}</div>
    <div class="c-rules ${full ? 'fl' : ''} ${o.atk === undefined ? 'sp' : ''} ${!o.stage && CARDS[o.key].legend ? 'dense' : ''}"><div>${rulesText(o)}</div></div>`;
}
// Réduit le nom d'une carte jusqu'à ce qu'il tienne dans son bandeau
function fitNames(root){
  (root || document).querySelectorAll('.c-name').forEach(n => {
    n.style.fontSize = '';
    let f = parseFloat(getComputedStyle(n).fontSize), k = 0;
    while (n.scrollWidth > n.clientWidth + 1 && k++ < 20){ f *= .94; n.style.fontSize = f + 'px'; }
  });
  (root || document).querySelectorAll('.c-rules').forEach(r => {
    const inner = r.firstElementChild; if (!inner) return;
    r.style.fontSize = '';
    let f = parseFloat(getComputedStyle(r).fontSize), k = 0;
    while (inner.offsetHeight > r.clientHeight - 2 && k++ < 20){ f *= .94; r.style.fontSize = f + 'px'; }
  });
}
function cardData(id, p = 0){
  const d = CARDS[id], sp = d.type === 'spell';
  return {key:id, el:d.el, name:d.name, cost:d.cost, typeLine:`${sp ? 'Sort' : 'Créature'} — ${EL_NAME[d.el]}`, atk: sp ? undefined : d.atk, hp:d.hp, prism: p === 0 && isPrism(id), full: p === 0 && isFull(id)};
}
function unitData(side, i){
  const c = S.board[side][i], u = c.u, d = CARDS[u.card];
  return {key:u.card, el:u.el, stage:u.stage, ab:u.ab, name:u.name, cost:d.cost, typeLine:`${d.evo ? STAGE[u.stage] : 'Créature'} — ${EL_NAME[u.el]}`, atk:effAtk(u, c), hp:effHp(u, c), buff:bonus(u, c) === 1, hurt:u.dmg > 0, prism:u.owner === 0 && isPrism(u.card), full:u.owner === 0 && !u.stage && isFull(u.card)};
}

let S, sel = null, inspect = null, busy = false;

const SHORT = ['Toi', 'Adv. 1', 'Allié', 'Adv. 2'];
function gemsHTML(P){
  let g = '';
  for (let k = 0; k < 10; k++) g += `<span class="gem ${k < P.max ? (k < P.mana ? 'on' : 'spent') : ''}"></span>`;
  return `<div class="mana" title="Mana">${g}<span class="mana-n">${P.mana}/${P.max}</span></div>`;
}
function hpHTML(t){
  const T = S.teams[t], hp = Math.max(0, T.hp);
  return `<div class="hpbar"><i style="width:${hp / T.max * 100}%"></i><b>${hp} PV</b></div>`;
}
function heroHTML(t){
  const ids = S.players.map((P, p) => p).filter(p => S.players[p].team === t);
  if (!S.duo){
    const p = ids[0], P = S.players[p];
    return `<div class="medal" title="${P.name}">${heroPic(deckOf(p), P.deckId)}</div>
    <div class="h-body"><div class="h-id"><span class="h-name banner"><span>${p ? 'Adversaire' : 'Toi'}</span></span>${p ? `<span class="h-meta backs" title="${P.hand.length} cartes en main">${P.hand.map((_, k) => `<img src="img/dos.jpg" alt="" style="--r:${(k - (P.hand.length - 1) / 2) * 7}deg">`).join('')}</span>` : ''}<span class="h-meta">${p ? '' : `Main ${P.hand.length} · `}Pioche ${P.deck.length}</span></div>
    <div class="h-row">${hpHTML(t)}${gemsHTML(P)}</div></div>`;
  }
  const me = S.players[0];
  return `<div class="h-body"><div class="tps">${ids.map(p => { const P = S.players[p]; return `
      <div class="tp ${S.active === p ? 'on' : ''}" title="${P.name}">
        <span class="medal sm">${heroPic(deckOf(p), P.deckId)}</span>
        <span class="tp-txt"><b>${SHORT[p]}</b><small>${DECKS[P.deckId].name}</small><small>Main ${P.hand.length} · ${P.mana}/${P.max} ◆</small></span>
      </div>`; }).join('')}</div>
    <div class="h-row">${hpHTML(t)}</div>${t === 0 ? `<div class="h-row">${gemsHTML(me)}</div>` : ''}</div>`;
}
function unitHTML(u, c){
  const a = effAtk(u, c), h = effHp(u, c), bon = bonus(u, c) === 1;
  const fl = u.owner === 0 && !u.stage && isFull(u.card), pz = !fl && u.owner === 0 && isPrism(u.card);
  return `<div class="unit el-${u.el} st-${u.stage} ${u.sick ? 'sick' : ''} ${bon ? 'match' : ''} ${pz ? 'prism' : ''} ${fl ? 'fullart' : ''}">
    ${fl ? `<div class="u-img"><img src="img/${u.card}-full.jpg" alt="" draggable="false"></div><div class="u-holo"><div class="glint gold"></div></div>` : unitArt(u)}${pz ? '<div class="u-holo"><div class="holo"></div><div class="glint"></div></div>' : ''}
    ${u.stage ? `<div class="u-stars">${'★'.repeat(u.stage)}</div>` : ''}
    ${u.ab.includes('dodge') && !u.dodged ? '<span class="shield" title="Esquive"></span>' : ''}
    ${u.need ? `<div class="xp"><i style="width:${Math.min(100, u.xp / u.need * 100)}%"></i></div>` : ''}
    <span class="stat atk ${bon ? 'buff' : ''}">${a}</span><span class="stat hp ${bon ? 'buff' : ''} ${u.dmg ? 'hurt' : ''}">${h}</span>
    ${S.duo ? `<span class="own own-${u.owner === 0 ? 'me' : u.owner === 2 ? 'ally' : 'foe'}" title="${S.players[u.owner].label}">${heroPic(deckOf(u.owner), S.players[u.owner].deckId)}</span>` : ''}
  </div>`;
}
function cellHTML(side, i, tg, top){
  const c = S.board[side][i];
  if (top === undefined) top = !S.ffa && side === 1;
  const isT = tg.some(t => t.side === side && t.i === i);
  const label = `${EL_NAME[c.el]}${c.u ? ' : ' + c.u.name : ', vide'}`;
  return `<div class="cell el-${c.el} ${isT ? 'tgt' : ''}" data-side="${side}" data-i="${i}" data-top="${top ? 1 : 0}" ${vigie && vigie.side === side && vigie.i === i ? 'data-vsel="1"' : ''} role="button" tabindex="0" aria-label="${label}">
    <div class="terrain"></div>
    <div class="slot">${c.u ? unitHTML(c.u, c) : sigil(c.el, 'wm')}</div>
    <div class="plate">${sigil(c.el)}${EL_NAME[c.el]}</div>
  </div>`;
}
function formLine(f){ return `<b>${f.name}</b> ${f.atk}/${f.hp}${f.ab && f.ab.length ? ' (' + f.ab.map(a => AB_SHORT[a]).join(', ') + ')' : ''}`; }
function evoText(d){
  if (!d.evo) return '';
  const parts = Object.entries(d.evo).map(([el, f]) => `sur ${EL_NAME[el]} → ${formLine(f)}`);
  let s = `Évolue à ${d.xp} XP : ${parts.join(' · ')}. Ailleurs, elle suit la branche ${EL_NAME[d.el]}.`;
  if (d.legend) s += ` Puis à ${d.legend.xp} XP : ${formLine(d.legend)}, Légende.`;
  return s;
}
function cardInfo(id){
  const d = CARDS[id];
  if (d.type === 'spell') return `<h3>${d.name}</h3><p class="sub">Sort · ${EL_NAME[d.el]} · ${d.cost} mana</p><p>${d.text}</p>`;
  const abs = (d.ab || []).map(a => AB[a]).join(' ');
  return `<h3>${d.name}</h3><p class="sub">Créature · ${EL_NAME[d.el]} · ${d.cost} mana · ${d.atk}/${d.hp}</p>${abs ? `<p>${abs}</p>` : ''}${d.evo ? `<p>${evoText(d)}</p>` : ''}`;
}
function unitInfo(side, i){
  const c = S.board[side][i], u = c.u, d = CARDS[u.card];
  const lines = [];
  if (bonus(u, c)) lines.push('Sur son élément : +1/+1.');
  if (u.ab.length) lines.push(u.ab.map(a => AB[a]).join(' '));
  if (u.sick) lines.push("Vient d'arriver : attaquera à la fin de son prochain tour.");
  if (u.need){
    const next = u.stage === 0
      ? `Si elle évolue ici (case ${EL_NAME[c.el]}) : ${formLine(d.evo[d.evo[c.el] ? c.el : u.el])}.`
      : `Prochaine étape : ${formLine(d.legend)}.`;
    lines.push(`XP ${u.xp}/${u.need}. ${next}`);
  }
  const ownerTxt = S.ffa ? (u.owner === 0 ? 'À toi' : `À ${S.players[u.owner].label}`) : S.duo ? ['À toi', 'Adversaire 1', 'À ton allié', 'Adversaire 2'][u.owner] : (side ? 'Adverse' : 'À toi');
  if (S.duo && u.need && harmony(S, side, i, u)) lines.push('Harmonie : +1 XP par tour grâce à sa voisine alliée.');
  return `<h3>${u.name}</h3><p class="sub">${ownerTxt} · ${d.evo ? STAGE[u.stage] + ' · ' : ''}${EL_NAME[u.el]}</p>` + lines.map(l => `<p>${l}</p>`).join('');
}
function hintFor(id, tg){
  const d = CARDS[id];
  if (S.active !== 0 || busy || over()) return "Attends ton tour pour jouer.";
  if (d.cost > S.players[0].mana) return 'Pas assez de mana pour cette carte.';
  if (!tg.length) return 'Aucune cible possible pour le moment.';
  if (d.type !== 'spell') return S.duo ? 'Choisis une case libre de ton équipe.' : S.ffa ? 'Choisis une case libre sur un de tes deux fronts.' : 'Choisis une case libre de ton côté.';
  if (d.target === 'none') return 'Touche la carte pour la jouer.';
  if (d.target === 'cell') return "Choisis une case, de ton côté ou chez l'adversaire.";
  if (d.target === 'ownunit') return S.duo ? 'Choisis une de tes créatures ou une de ton allié.' : 'Choisis une de tes créatures.';
  if (d.target === 'owncell') return S.duo ? 'Choisis une case de ton équipe.' : 'Choisis une case de ton côté.';
  return 'Choisis une créature.';
}

function render(){
  if (!S) return;
  if (TUTO) tutoAdvance();

  let tg = sel !== null ? targets(S, 0, sel) : [];
  if (TUTO && sel !== null && tstep() && tstep().cells){ const ok = tstep().cells(); tg = tg.filter(t => ok.some(o => o.side === t.side && o.i === t.i)); }
  const tbl = document.querySelector('.table');
  tbl.classList.toggle('ffa', !!S.ffa);
  ['#hero0', '#hero1', '#board'].forEach(s => { $(s).hidden = !!S.ffa; });
  $('#ffa').hidden = !S.ffa;
  if (S.ffa) renderFFA(tg); else {
  $('#hero1').innerHTML = heroHTML(1);
  $('#hero0').innerHTML = heroHTML(0);
  const act = teamOf(S, S.active);
  $('#hero1').className = `hero orn spikes el-${deckOf(1).plate}${act === 1 ? ' active' : ''}${S.duo ? ' team' : ''}`;
  $('#hero0').className = `hero orn spikes el-${deckOf(0).plate}${act === 0 ? ' active' : ''}${S.duo ? ' team' : ''}`;
  $('#board').style.setProperty('--lanes', S.lanes);
  document.querySelector('.table').classList.toggle('duo', !!S.duo);
  $('#row1').innerHTML = S.board[1].map((c, i) => cellHTML(1, i, tg)).join('');
  $('#row0').innerHTML = S.board[0].map((c, i) => cellHTML(0, i, tg)).join('');
  }
  const me = S.players[0];
  $('#hand').innerHTML = me.hand.map((id, hi) => {
    const ok = S.active === 0 && !busy && targets(S, 0, hi).length > 0;
    return `<button class="card el-${CARDS[id].el} ${ok ? '' : 'dim'} ${sel === hi ? 'sel' : ''}" data-hi="${hi}" type="button" aria-label="${CARDS[id].name}, coût ${CARDS[id].cost}">${cardFace(cardData(id))}</button>`;
  }).join('');
  markDrawn();
  const turnWho = S.active === 0 ? (busy ? 'Combat…' : 'À toi') : S.duo ? `${SHORT[S.active]}…` : S.ffa ? `${S.players[S.active].label}…` : 'Adversaire…';
  const turnTxt = over() ? 'Partie terminée' : `Tour ${Math.ceil(S.turn / S.players.length)} · ${turnWho}`;
  $('#turnLabel').textContent = turnTxt;
  if (S.ffa) $('#ffaTurn').textContent = turnTxt;
  $('#btnEnd').disabled = busy || S.active !== 0 || over();

  let html;
  if (sel !== null){
    const id = me.hand[sel];
    html = `<div class="card el-${CARDS[id].el}">${cardFace(cardData(id))}</div><div class="info-txt">${cardInfo(id)}<p class="hint">${hintFor(id, tg)}</p></div>`;
  } else if (inspect && S.board[inspect.side][inspect.i].u){
    const u = S.board[inspect.side][inspect.i].u;
    html = `<div class="card el-${u.el}">${cardFace(unitData(inspect.side, inspect.i))}</div><div class="info-txt">${unitInfo(inspect.side, inspect.i)}</div>`;
  } else if (vigie !== null){
    html = `<div class="info-txt"><h3>Vigie</h3><p>${vigie === true ? 'Touche une première case de tes fronts.' : 'Touche une deuxième case : leurs jetons d\'élément seront échangés.'}</p><p class="hint"><button class="ghost banner" type="button" data-vigie-cancel><span>Annuler</span></button></p></div>`;
  } else if (inspectP !== null){
    html = `<div class="info-txt">${playerInfo(inspectP)}</div>`;
  } else {
    const last = S.log.slice(-3).reverse();
    html = `<div class="info-txt">${last.length ? last.map(l => `<p class="log-line">${l}</p>`).join('') : '<p class="log-line">Touche une carte de ta main pour la jouer.</p>'}</div>`;
  }
  $('#info').innerHTML = html;
  fitNames();
  bindTilt();
  $('#btnEnd').classList.remove('tuto-hl');
  tutoAfterRender();
  if (over() && !busy) showResult();
}
const over = () => S.winner !== null || (S.ffa && S.players[0].out);
let vigie = null, inspectP = null;
const TALENTS = {
  elan:{name:'Élan', txt:"Une fois par tour, ta première attaque qui touche un héros inflige +1 dégât."},
  reflux:{name:'Reflux', txt:"Quand une de tes créatures évoluées meurt, ton héros récupère 1 PV."},
  vigie:{name:'Vigie', txt:"Une fois par tour, tu peux échanger les jetons d'élément de deux de tes cases."},
  brume:{name:'Brume épaisse', txt:"Tes créatures ne subissent jamais de dégâts doublés."}
};
const talentOf = p => TALENTS[talentOfDeck(S.players[p].deckId)];
function playerInfo(p){
  const P = S.players[p], T = talentOf(p), nb = neighbors(S, 0);
  const rel = p === 0 ? 'Toi' : P.out ? 'Éliminé' : nb.includes(p) ? 'Ton voisin : vos fronts se font face' : "Pas ton voisin : tu ne peux l'atteindre qu'avec des sorts";
  return `<h3>${p === 0 ? 'Toi' : P.label}</h3><p class="sub">${P.name} · ${rel}</p><p><b>Talent : ${T.name}.</b> ${T.txt}</p><p>${Math.max(0, S.teams[p].hp)} PV · ${P.hand.length} cartes en main · pioche ${P.deck.length}</p>`;
}
function plateHTML(p){
  const P = S.players[p], T = S.teams[p], hp = Math.max(0, T.hp), D = deckOf(p);
  return `<button class="fp el-${D.plate} ${S.active === p && !over() ? 'on' : ''} ${P.out ? 'out' : ''} ${p === 0 ? 'me' : ''}" type="button" id="fp${p}" data-p="${p}">
    <span class="medal sm">${heroPic(D, P.deckId)}</span>
    <span class="fp-txt"><b>${p === 0 ? 'Toi' : P.label}</b><small>${TALENTS[talentOfDeck(P.deckId)].name}</small>
      ${P.out ? '<small class="ko">Éliminé</small>' : `<span class="fp-hp"><i style="width:${hp / T.max * 100}%"></i><em>${hp} PV</em></span><small>Main ${P.hand.length}${p === 0 ? '' : ` · ${P.mana}/${P.max} ◆`}</small>`}</span>
  </button>`;
}
// Les frontières : chaque front droit face au front gauche du voisin suivant
function borders(){
  const alive = S.players.map((P, p) => p).filter(p => !S.players[p].out), out = [];
  if (alive.length < 2) return out;
  alive.forEach(q => { const a = 2 * q + 1, b = oppSide(S, a); if (b >= 0) out.push({a, b, pa: q, pb: b >> 1}); });
  return out;
}
function borderHTML(B, tg, far){
  // en bas : toi, sinon le premier joueur du couple
  let bot = B.a, top = B.b;
  if ((B.b >> 1) === 0){ bot = B.b; top = B.a; }
  const pt = top >> 1, pb = bot >> 1;
  const name = p => p === 0 ? 'Toi' : S.players[p].label;
  return `<div class="border ${far ? 'far' : ''}">
    <div class="b-title">${name(pt)} <span>⚔</span> ${name(pb)}</div>
    <div class="row">${S.board[top].map((c, i) => cellHTML(top, i, tg, true)).join('')}</div>
    <div class="b-mid"></div>
    <div class="row">${S.board[bot].map((c, i) => cellHTML(bot, i, tg, false)).join('')}</div>
  </div>`;
}
function renderFFA(tg){
  const bs = borders();
  const mine = bs.filter(B => (B.a >> 1) === 0 || (B.b >> 1) === 0);
  // ton front gauche à gauche, ton front droit à droite
  mine.sort((x, y) => ((x.a >> 1) === 0 ? 1 : 0) - ((y.a >> 1) === 0 ? 1 : 0));
  const prev = nextAlive(S, 0, -1);
  // à gauche la frontière de ton voisin de gauche, à droite celle de ton voisin de droite
  const far = bs.filter(B => !mine.includes(B)).sort((x, y) => ((y.a >> 1) === prev || (y.b >> 1) === prev ? 1 : 0) - ((x.a >> 1) === prev || (x.b >> 1) === prev ? 1 : 0));
  $('#ffaPlates').innerHTML = S.players.map((P, p) => p).filter(p => p !== 0).map(plateHTML).join('');
  $('#ffaMe').className = `fme orn el-${deckOf(0).plate}`;
  $('#ffaMe').innerHTML = plateHTML(0) + (S.players[0].out ? '' : gemsHTML(S.players[0]));
  $('#ffaFar').innerHTML = far.map(B => borderHTML(B, tg, true)).join('');
  $('#ffaFar').style.gridTemplateColumns = `repeat(${Math.max(1, far.length)}, minmax(0, 1fr))`;
  $('#ffaFar').hidden = !far.length;
  $('#ffaMine').innerHTML = mine.map(B => borderHTML(B, tg, false)).join('');
  const P = S.players[0];
  $('#btnVigie').hidden = !(hasTalent(S, 0, 'vigie') && S.active === 0 && !busy && !P.vig && !over());
}

function floatText(host, text, cls){
  if (!host) return;
  const f = document.createElement('span');
  f.className = 'float ' + cls; f.textContent = text;
  host.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}
function cellEl(side, i){ return document.querySelector(`.cell[data-side="${side}"][data-i="${i}"]`); }
const ELC = {F:'#ff9a3c', A:'#a8e4ff', E:'#66e0e6', T:'#b5dc6a'};
function fxLayer(host){ if (!host) return null; const d = document.createElement('div'); d.className = 'fx'; host.appendChild(d); setTimeout(() => d.remove(), 900); return d; }
function slash(host, col, big){
  const d = fxLayer(host); if (!d) return;
  d.style.setProperty('--fc', col);
  d.innerHTML = `<svg class="slash ${big ? 'big' : ''}" viewBox="0 0 100 100" aria-hidden="true"><path d="M18 22 L82 78"/><path d="M34 12 L90 62"/><path d="M10 40 L66 90"/></svg><span class="flash"></span>`;
}
function sparks(host, col, n = 9){
  const d = fxLayer(host); if (!d) return;
  d.style.setProperty('--fc', col);
  let s = '';
  for (let k = 0; k < n; k++){
    const a = (k / n) * Math.PI * 2 + Math.random() * .6, r = 26 + Math.random() * 22;
    s += `<i class="spark" style="--dx:${(Math.cos(a) * r).toFixed(0)}px; --dy:${(Math.sin(a) * r).toFixed(0)}px; --d:${(Math.random() * 80).toFixed(0)}ms"></i>`;
  }
  d.innerHTML = s;
}
function ghost(cell, g, bounce){
  if (!cell || !g) return;
  const slot = cell.querySelector('.slot'); if (!slot) return;
  const w = document.createElement('div');
  w.className = 'unit phantom el-' + g.el + ' ' + (bounce ? 'swept' : 'shatter');
  w.innerHTML = unitArt({card:g.card, stage:g.stage, el:g.el});
  slot.appendChild(w);
  setTimeout(() => w.remove(), 800);
}
const heroEl = t => S.ffa ? $('#fp' + t) : $('#hero' + t);
function flushFx(){
  const anim = !reduced;
  let atkCol = null, delay = 0;
  for (const e of S.fx){
    const cell = e.i !== undefined ? cellEl(e.side, e.i) : null;
    const unit = cell && cell.querySelector('.unit');
    const later = fn => delay ? setTimeout(fn, delay) : fn();
    switch (e.k){
      case 'attack':
        if (unit){ unit.classList.add(cell.dataset.top === '1' ? 'lunge-down' : 'lunge-up'); atkCol = getComputedStyle(unit).getPropertyValue('--ml').trim() || '#ffe0a0'; }
        delay = anim ? 160 : 0; break;
      case 'summon': onSummonFx(e); break;
      case 'cast': onCastFx(e); break;
      case 'dmg': later(() => {
        SND.play('slash', {big: e.n >= 4});
        floatText(cell, '−' + e.n, 'dmg');
        if (unit) unit.classList.add('shake');
        if (anim){ slash(cell, atkCol || ELC.F, e.n >= 4); sparks(cell, atkCol || ELC.F, 7); }
      }); break;
      case 'super': later(() => { SND.play('crit'); floatText(cell, '×2', 'info'); if (anim && cell){ cell.classList.remove('crit'); void cell.offsetWidth; cell.classList.add('crit'); } }); break;
      case 'dodge': later(() => { SND.play('dodge'); floatText(cell, 'Esquive', 'info'); if (unit) unit.classList.add('sidestep'); }); break;
      case 'evolve': later(() => { SND.play('evolve'); if (unit) unit.classList.add('evolve'); floatText(cell, 'Évolution !', 'evo'); if (anim) sparks(cell, '#ecd6ff', 14); }); break;
      case 'terra': SND.play('terra', {el: S.board[e.side] && S.board[e.side][e.i] ? S.board[e.side][e.i].el : 'N'}); if (cell){ cell.classList.remove('ripple'); void cell.offsetWidth; cell.classList.add('ripple'); } break;
      case 'face': later(() => {
        SND.play('hero');
        const h = heroEl(e.side); if (!h) return; floatText(h, '−' + e.n, 'dmg');
        h.classList.remove('shake', 'hurtflash'); void h.offsetWidth; h.classList.add('shake', 'hurtflash');
        if (anim && atkCol){ slash(h.querySelector('.medal'), atkCol, true); sparks(h.querySelector('.medal'), atkCol, 10); }
      }); break;
      case 'heal': SND.play('heal'); floatText(heroEl(e.side), '+' + e.n, 'heal'); break;
      case 'out': later(() => { SND.play('out'); const h = heroEl(e.side); if (h){ floatText(h, 'Éliminé', 'dmg'); h.classList.add('shake'); } }); break;
      case 'harmony': floatText(cell, 'Harmonie', 'evo'); if (anim) sparks(cell, '#ffe9a8', 8); break;
      case 'mana': { SND.play('mana'); const h = heroEl(e.side); if (!h) break; floatText(h, '+1 mana', 'mana'); if (anim) sparks(h.querySelector('.mana') || h, '#9bbcf5', 10); break; }
      case 'death': later(() => { if (!e.bounce) SND.play('death'); if (anim) ghost(cell, e.u, e.bounce); else floatText(cell, '✕', 'dmg'); if (anim && e.u && !e.bounce) sparks(cell, ELC[e.u.el], 12); }); break;
    }
  }
  S.fx = [];
}
function step(){ render(); flushFx(); }

async function runCombat(p){
  for (const a of attackers(S, p)){
    const c = S.board[a.side][a.i];
    if (c.u && c.u.owner === p && !c.u.sick){ attackAt(S, p, a.side, a.i); step(); await sleep(pace(480)); if (over()) return; }
  }
  upkeep(S, p); step(); await sleep(pace(350));
}
async function endPlayerTurn(){
  if (busy || S.active !== 0 || over()) return;
  if (TUTO && !tutoAllowEnd()) return;
  busy = true; sel = null; inspect = null; vigie = null; inspectP = null; step();
  await runCombat(0);
  if (!over()){ startTurn(S, nextPlayer(S, 0)); step(); await sleep(pace(500)); }
  await advance();
}
// Fait jouer les IA jusqu'à ce que ce soit à toi
async function advance(){
  if (running) return;
  running = true; busy = true;
  try {
    while (!over() && S.active !== 0) await aiTurn(S.active);
  } finally { running = false; busy = false; step(); if (!over() && S.active === 0) turnBanner('À toi de jouer !'); }
}
let running = false;
async function aiTurn(p){
  let m;
  step(); await sleep(pace(300));
  while (!over() && (m = aiChoose(S, p))){ play(S, p, m.hi, m.t); step(); await sleep(pace(reduced ? 750 : 1050)); }
  if (!over()){
    await runCombat(p);
    if (!over()){ startTurn(S, nextPlayer(S, p)); step(); await sleep(pace(400)); }
  }
}

function showResult(){
  if (S.ffa) return showResultFFA();
  const w = S.winner;
  const title = w === 0 ? 'Victoire' : w === 1 ? 'Défaite' : 'Égalité';
  const mirror = deckOf(0) === deckOf(1);
  const sub = S.duo
    ? (w === 0 ? `Ton allié et toi avez vaincu ${deckOf(1).the} et ${deckOf(3).the}.` : w === 1 ? `${cap(deckOf(1).the)} et ${deckOf(3).the} l'emportent cette fois.` : 'Les deux équipes tombent en même temps.')
    : (w === 0 ? `Tu as vaincu ${deckOf(1).the}${mirror ? ' adverses' : ''}.` : w === 1 ? `${cap(deckOf(1).the)}${mirror ? ' adverses' : ''} l'emportent cette fois.` : 'Les deux héros tombent en même temps.');
  $('#resultBody').innerHTML = `<h2>${title}</h2><p>${sub}</p><p style="color:var(--muted)">Partie jouée en ${Math.ceil(S.turn / S.players.length)} tours.</p>${grantRewards()}<button class="btn-end m-gold" type="button" id="btnAgain"><span>Rejouer</span></button><div class="menu-row"><button class="ghost banner" type="button" id="btnResMenu"><span>Menu principal</span></button></div>`;
  $('#resultModal').hidden = false;
  celebrate(w === 0);
  $('#btnAgain').onclick = () => { $('#resultModal').hidden = true; if (S.custom){ DECKS[4] = S.custom; pick = 4; } newMatch(); };
  $('#btnResMenu').onclick = () => { $('#resultModal').hidden = true; S.done = true; showMenu(); };
}

function resultButtons(){
  return `<button class="btn-end m-gold" type="button" id="btnAgain"><span>Rejouer</span></button><div class="menu-row"><button class="ghost banner" type="button" id="btnResMenu"><span>Menu principal</span></button></div>`;
}
function showResultFFA(){
  const N = S.players.length, order = S.outOrder || [];
  let title, sub;
  if (S.winner === 0){ title = 'Victoire'; sub = 'Tu es le dernier debout.'; }
  else if (S.winner === -1 && !S.players[0].out){ title = 'Égalité'; sub = 'Les derniers joueurs tombent en même temps.'; }
  else {
    const place = N - order.indexOf(0);
    title = place === 2 ? '2e place' : `${place}e place`;
    const w = S.winner >= 0 ? S.players[S.winner].label : null;
    sub = `Tu es éliminé.${w ? ` ${w} l'emporte avec ${DECKS[S.players[S.winner].deckId].the}.` : ''}`;
  }
  $('#resultBody').innerHTML = `<h2>${title}</h2><p>${sub}</p><p style="color:var(--muted)">Mêlée à ${N} joueurs · ${Math.ceil(S.turn / N)} tours.</p>${grantRewards()}${resultButtons()}`;
  $('#resultModal').hidden = false;
  celebrate(S.winner === 0);
  $('#btnAgain').onclick = () => { $('#resultModal').hidden = true; if (S.custom){ DECKS[4] = S.custom; pick = 4; } newMatch(); };
  $('#btnResMenu').onclick = () => { $('#resultModal').hidden = true; S.done = true; showMenu(); };
}
function onCell(side, i){
  if (over()) return;
  if (TUTO && !tutoAllowCell(side, i)) return;
  inspectP = null;
  if (vigie !== null){
    if (!sidesOf(S, 0).includes(side) || (S.board[side][i].u && S.board[side][i].u.ab.includes('anchor'))) return;
    if (vigie === true){ vigie = {side, i}; render(); return; }
    if (vigie.side === side && vigie.i === i){ vigie = true; render(); return; }
    const w = [vigie.side, vigie.i, side, i]; vigie = null;
    if (S.board[w[0]][w[1]].el !== S.board[side][i].el) doVigie(S, 0, w);
    step(); return;
  }
  if (sel !== null){
    if (!busy && S.active === 0 && targets(S, 0, sel).some(t => t.side === side && t.i === i)){
      const hi = sel; sel = null;
      flyFrom = rectOf(document.querySelector(`.hand .card[data-hi="${hi}"]`));
      play(S, 0, hi, {side, i});
      inspect = S.board[side][i].u ? {side, i} : null;
      step();
      return;
    }
    sel = null;
  }
  inspect = S.board[side][i].u ? {side, i} : null;
  render();
}
$('#board').addEventListener('click', e => { const c = e.target.closest('.cell'); if (c) onCell(+c.dataset.side, +c.dataset.i); });
$('#ffa').addEventListener('click', e => {
  const c = e.target.closest('.cell'); if (c) return onCell(+c.dataset.side, +c.dataset.i);
  const f = e.target.closest('.fp'); if (f){ inspectP = +f.dataset.p; sel = null; inspect = null; render(); }
});
$('#ffa').addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const c = e.target.closest('.cell'); if (!c) return;
  e.preventDefault(); onCell(+c.dataset.side, +c.dataset.i);
});
$('#btnVigie').addEventListener('click', () => { if (busy || S.active !== 0) return; vigie = true; sel = null; inspect = null; inspectP = null; render(); });
$('#info').addEventListener('click', e => { if (e.target.closest('[data-vigie-cancel]')){ vigie = null; render(); } });
$('#board').addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const c = e.target.closest('.cell'); if (!c) return;
  e.preventDefault(); onCell(+c.dataset.side, +c.dataset.i);
});
$('#hand').addEventListener('click', e => {
  const b = e.target.closest('.card'); if (!b) return;
  const hi = +b.dataset.hi;
  if (TUTO && !tutoAllowCard(hi)) return;
  const d = CARDS[S.players[0].hand[hi]];
  if (d.target === 'none' && !busy && S.active === 0 && targets(S, 0, hi).length){
    flyFrom = rectOf(b); sel = null; inspect = null; play(S, 0, hi, {side:-1, i:-1}); step(); return;
  }
  sel = sel === hi ? null : hi; inspect = null; inspectP = null; vigie = null;
  render();
});
$('#btnEnd').addEventListener('click', endPlayerTurn);
$('#btnRules').addEventListener('click', () => { $('#rules').hidden = false; });
$('#rules').addEventListener('click', e => { if (e.target.id === 'rules' || e.target.closest('[data-close]')) $('#rules').hidden = true; });
$('#btnNew').addEventListener('click', () => { if (!busy){ if (S && S.custom){ DECKS[4] = S.custom; pick = 4; } newMatch(); } });

function bindTilt(sel = '.hand .card'){
  if (reduced) return;
  document.querySelectorAll(sel).forEach(card => {
    card.onpointermove = e => {
      if (card.classList.contains('sel')) return;
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((x - .5) * 16) + 'deg');
      card.style.setProperty('--rx', ((.5 - y) * 16) + 'deg');
      card.style.setProperty('--mx', (x * 100) + '%');
      card.style.setProperty('--my', (y * 100) + '%');
    };
    card.onpointerleave = () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); };
  });
}

let screen = 'menu', mode = 'ai';
const deckOf = p => DECKS[S.players[p].deckId ?? p];
const cap = t => t[0].toUpperCase() + t.slice(1);
let pick = 0, aiDeck = 1;
const DECK_INFO = [
  {style:'Agressif', desc:"Des créatures rapides qui frappent fort. Le Jeune dragon peut devenir Légende.", show:['dragon', 'griffon', 'bouledefeu']},
  {style:'Résistant', desc:"Des créatures solides, des soins et du contrôle. La Tortue ancestrale peut devenir Légende.", show:['tortue', 'kraken', 'raz']},
  {style:'Positionnel', desc:"Prépare le terrain de ton côté et punis les attaques. L'Oiseau-roc peut devenir Légende.", show:['roc', 'harpie', 'chute'], art:['roc', 'A']},
  {style:'Usure', desc:"Brûle les PV adverses et soigne les tiens. Le Serpent de mer peut devenir Légende.", show:['serpent', 'anguille', 'vapeur'], art:['serpent', 'E']}
];
const HERO_IMG = new Set(['orage', 'profondeurs', 'cimes', 'vapeur']);
function heroPic(D, k){
  if (HERO_IMG.has(D.hero)) return `<img src="img/heros-${D.hero}.jpg" alt="">`;
  const [key, el] = DECK_INFO[k].art; return `<span class="h-art">${artSVG(key, el, 0)}</span>`;
}
function thumb(id){ const d = CARDS[id]; return (IMG.has(id) || !d) ? `<img src="img/${id}-art.jpg" alt="">` : `<span class="t-art">${artSVG(id, d.el, 0)}</span>`; }
function renderDecks(){
  $('#deckList').innerHTML = DECKS.map((D, k) => `
    <button class="deck-opt orn el-${D.plate} ${pick === k ? 'on' : ''}" type="button" data-deck="${k}" aria-pressed="${pick === k}">
      <span class="d-medal medal">${heroPic(D, k)}</span>
      <span class="d-body">
        <span class="d-name">${D.name}</span>
        <span class="d-tags">${D.els.map(el => `<i class="el-${el}">${EL_NAME[el]}</i>`).join('')}<b>${DECK_INFO[k].style}</b></span>
        <span class="d-desc">${DECK_INFO[k].desc}</span>
        <span class="d-thumbs">${DECK_INFO[k].show.map(thumb).join('')}</span>
      </span>
      <span class="d-check" aria-hidden="true">✓</span>
    </button>`).join('');
}

function showPanel(id){ ['#mainPanel', '#deckPanel', '#starterPanel'].forEach(s => { $(s).hidden = s !== id; }); $('#showcase').hidden = id !== '#mainPanel'; $('#profile').hidden = id === '#starterPanel' || !SAVE; }
function newMatch(){
  sel = null; inspect = null; busy = false; running = false; vigie = null; inspectP = null;
  let first = Math.random() < .5 ? 0 : 1;
  const fam = pick < 4 ? pick : DECKS[pick].fam;
  if (mode === 'ffa'){
    const others = [0, 1, 2, 3].filter(k => k !== fam).sort(() => Math.random() - .5).slice(0, ffaN - 1);
    first = Math.floor(Math.random() * ffaN);
    S = newGame(Date.now() % 2147483647, [pick, ...others], first, 'ffa');
    S.log.push(`Mêlée à ${ffaN} : ${S.players.slice(1).map(P => `${P.label} joue ${DECKS[P.deckId].the}`).join(', ')}.`);
    S.log.push(first === 0 ? 'Tu commences, avec 20 PV.' : `${S.players[first].label} commence. Tu as ${S.teams[0].hp} PV pour compenser ta place.`);
  } else if (mode === 'duo'){
    const rest = [0, 1, 2, 3].filter(k => k !== fam).sort(() => Math.random() - .5);
    S = newGame(Date.now() % 2147483647, [pick, rest[0], rest[1], rest[2]], first);
    S.log.push(`Ton allié joue ${DECKS[rest[1]].the}. En face : ${DECKS[rest[0]].the} et ${DECKS[rest[2]].the}.`);
    S.log.push(first === 0 ? "Ton équipe commence. L'équipe adverse reçoit une carte de plus et un Éclat de mana." : "L'équipe adverse commence. Ton équipe reçoit une carte de plus, et ton allié un Éclat de mana.");
  } else {
    aiDeck = Math.floor(Math.random() * 4);
    S = newGame(Date.now() % 2147483647, [pick, aiDeck], first);
    S.log.push(`Ton adversaire a tiré au sort son deck : ${DECKS[aiDeck].the}.`);
    S.log.push(first === 0 ? "Tu commences. L'adversaire reçoit un Éclat de mana." : "L'adversaire commence. Tu reçois un Éclat de mana et une carte de plus.");
  }
  S.mode = mode;
  S.diff = (SAVE && SAVE.diff) || 'normal';
  if (S.duo) S.diffs = {2: 'normal'};
  TUTO = null;
  if (pick >= 4) S.custom = DECKS[pick];
  $('#resultModal').hidden = true;
  showGame();
  dealAnim();
  if (S.active !== 0) setTimeout(() => { if (S.winner === null) advance(); }, pace(900));
  else setTimeout(() => turnBanner('À toi de commencer !'), 500);
}
function dealAnim(){
  const t = document.querySelector('.table'); if (!t || reduced) return;
  t.classList.remove('deal'); void t.offsetWidth; t.classList.add('deal');
  setTimeout(() => t.classList.remove('deal'), 1200);
}
function showGame(){
  screen = 'game';
  $('#menu').hidden = true; $('#game').hidden = false; document.body.classList.remove('on-menu');
  render();
  renderSoundBtns();
}
function showMenu(){
  screen = 'menu';
  $('#game').hidden = true; $('#coll').hidden = true; $('#menu').hidden = false; $('#mMultiNote').hidden = true; showPanel(SAVE ? '#mainPanel' : '#starterPanel');
  renderProfile();
  document.body.classList.add('on-menu');
  const live = S && !over() && !S.done && S.turn > 1 && !S.tuto;
  const reco = !!(SAVE && !SAVE.tutoDone);
  $('#mTuto').classList.toggle('reco', reco);
  $('#mTuto span').textContent = reco ? 'Tutoriel (recommandé)' : 'Tutoriel';
  $('#mContinue').hidden = !live;
  if (live) $('#mContinueSub').textContent = S.ffa ? `Mêlée · Tour ${Math.ceil(S.turn / S.players.length)} · ${Math.max(0, S.teams[0].hp)} PV · ${S.players.filter(P => !P.out).length} joueurs en lice` : `${S.duo ? 'Duo · ' : ''}Tour ${Math.ceil(S.turn / S.players.length)} · ${Math.max(0, S.teams[0].hp)} PV contre ${Math.max(0, S.teams[1].hp)} PV`;

  $('#showcase').innerHTML = [['dragon', 'F', 2, 'Dragon Primordial'], ['ondine', 'E', 1, 'Ondine des marées'], ['tortue', 'T', 2, 'Gardien du Monde']]
    .map(([k, el, st, name]) => { const f = st === 2 ? CARDS[k].legend : CARDS[k].evo[el]; return `<div class="card el-${el}">${cardFace({key:k, el, stage:st, ab:f.ab || [], name, cost:CARDS[k].cost, typeLine:`${st === 2 ? 'Légende' : 'Adepte'} — ${EL_NAME[el]}`, atk:f.atk, hp:f.hp})}</div>`; })
    .join('');
  fitNames($('#showcase'));
  if (!SAVE) return;
  const first = live ? $('#mContinue') : $('#mAI');
  try { first.focus({preventScroll:true}); } catch (e) {}
}
function openDecks(m){
  if (!SAVE){ renderStarter(); showPanel('#starterPanel'); return; }
  mode = m; renderDecks(); showPanel('#deckPanel');
  renderDiff();
  $('#vsTitle').textContent = m === 'duo' ? 'Ton allié et tes adversaires' : m === 'ffa' ? 'Tes adversaires' : 'Ton adversaire';
  $('#vsText').textContent = m === 'duo' ? "Les trois autres decks sont répartis au hasard entre ton allié IA et les deux adversaires IA." : m === 'ffa' ? "Les autres decks vont aux IA, et les places autour de la table sont tirées au sort. Chaque deck a un talent propre à la Mêlée." : "L'IA tire son deck au sort au début de la partie. Il peut être identique au tien.";
  $('#ffaCount').hidden = m !== 'ffa';
  try { $('#mStart').focus({preventScroll:true}); } catch (e) {}
}
$('#mAI').addEventListener('click', () => openDecks('ai'));
$('#mDuo').addEventListener('click', () => openDecks('duo'));
$('#mFfa').addEventListener('click', () => openDecks('ffa'));
let ffaN = 4;
$('#ffaCount').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; ffaN = +b.dataset.n; document.querySelectorAll('#ffaCount [data-n]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.n === ffaN))); });
$('#mStart').addEventListener('click', () => { if (registerActive()) newMatch(); });
$('#mBack').addEventListener('click', () => showPanel('#mainPanel'));
$('#mContinue').addEventListener('click', () => { showGame(); if (S.active !== 0 && S.winner === null) advance(); });
$('#mMulti').addEventListener('click', () => { $('#mMultiNote').hidden = false; });
$('#mRules').addEventListener('click', () => { $('#rules').hidden = false; });
$('#mTuto').addEventListener('click', () => startTutorial());
$('#btnMenu').addEventListener('click', () => { if (!busy){ sel = null; inspect = null; showMenu(); } });
async function start(data){
  if (data && data.S && data.S.custom) DECKS[4] = data.S.custom;
  await bootMeta();
  if (data && data.S && data.S.teams && data.S.board.length){ S = data.S; S.fx = []; mode = S.mode || 'ai'; if (data.screen === 'game'){ showGame(); if (S.active !== 0 && S.winner === null) advance(); } else showMenu(); }
  else showMenu();
}
