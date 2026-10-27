// --- Illustrations en vitrail (SVG, viewBox 0 0 100 120) ---
const LEAD = '#1a130b', GOLD = '#d9b45a', IV = '#f1e3bf', EYE = '#fff4b8', ROCK = '#3d342c', WOOD = '#6b4a2a', LEAF = '#5f8a34', LEAF2 = '#86b04c';
const PAL = {
  F:{d:'#9e2418', m:'#e0612b', l:'#f6b846', a:'#ffe38a', b1:'#45110b', b2:'#6b1d12'},
  E:{d:'#173f86', m:'#2d7fc4', l:'#79c8e6', a:'#d6f3ff', b1:'#0e2350', b2:'#173a74'},
  T:{d:'#4a2f16', m:'#8b6a2f', l:'#c79a4a', a:'#7da23e', b1:'#2b1b0c', b2:'#463015'},
  A:{d:'#1f5f66', m:'#4fae9c', l:'#b8e6d6', a:'#f4fbf6', b1:'#113a3f', b2:'#1c5658'},
  N:{d:'#5a3f12', m:'#b8862e', l:'#f0c860', a:'#fff1c4', b1:'#2a1d0b', b2:'#44300f'}
};
const ARCH = 'M0 120 L0 50 C0 22 24 5 50 0 C76 5 100 22 100 50 L100 120 Z';
const P = (d, f) => `<path d="${d}" fill="${f}"/>`;
const E = (cx, cy, rx, ry, f, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
const C = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;
const Ln = (d, w = 1.4) => `<path d="${d}" fill="none" stroke-width="${w}"/>`;
const M = s => `<g transform="matrix(-1 0 0 1 100 0)">${s}</g>`;
const band = (d, col, w) => `<path d="${d}" fill="none" stroke="${LEAD}" stroke-width="${w + 3}"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
const ring = (cx, cy, r, col) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${LEAD}" stroke-width="7"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="4" opacity=".85"/>`;
const star = (cx, cy, r, f) => P(`M${cx} ${cy - r}L${cx + r * .28} ${cy - r * .28}L${cx + r} ${cy}L${cx + r * .28} ${cy + r * .28}L${cx} ${cy + r}L${cx - r * .28} ${cy + r * .28}L${cx - r} ${cy}L${cx - r * .28} ${cy - r * .28}Z`, f);
function halo(cx, cy, r){
  let s = '';
  for (let k = 0; k < 16; k++){
    const a1 = k / 16 * Math.PI * 2, a2 = a1 + Math.PI / 16, ri = r * .55;
    const f = n => n.toFixed(1);
    s += P(`M${f(cx + Math.cos(a1) * ri)} ${f(cy + Math.sin(a1) * ri)}L${f(cx + Math.cos((a1 + a2) / 2) * r * 1.25)} ${f(cy + Math.sin((a1 + a2) / 2) * r * 1.25)}L${f(cx + Math.cos(a2) * ri)} ${f(cy + Math.sin(a2) * ri)}Z`, k % 2 ? GOLD : '#f6e3a0');
  }
  return s + ring(cx, cy, r * .62, GOLD);
}

function panes(el){
  const p = PAL[el], cx = 50, cy = 68, N = 14;
  let s = `<rect width="100" height="120" fill="${p.b1}"/><g stroke="${LEAD}" stroke-width="1.1">`;
  for (let k = 0; k < N; k++){
    const a1 = k / N * Math.PI * 2, a2 = (k + 1) / N * Math.PI * 2;
    s += P(`M${cx} ${cy}L${(cx + Math.cos(a1) * 140).toFixed(1)} ${(cy + Math.sin(a1) * 140).toFixed(1)}L${(cx + Math.cos(a2) * 140).toFixed(1)} ${(cy + Math.sin(a2) * 140).toFixed(1)}Z`, k % 2 ? p.b1 : p.b2);
  }
  s += `<circle cx="${cx}" cy="${cy}" r="36" fill="${p.d}" fill-opacity=".45"/><circle cx="${cx}" cy="${cy}" r="52" fill="none"/>`;
  s += `<circle cx="50" cy="15" r="6" fill="${GOLD}"/><circle cx="50" cy="15" r="2.5" fill="${p.l}"/>`;
  return s + '</g>';
}

const ART = {
  salamandre(p, s, br){
    let o = s ? ring(52, 80, 36, p.a) : '';
    if (s && br === 'A') o += P('M50 78 L20 44 L31 50 L32 36 L43 52 L49 38 L56 60 Z', p.l) + Ln('M50 78 L31 50 M50 78 L43 52');
    o += P('M32 92 Q10 98 12 82 Q14 70 27 75 Q19 79 21 85 Q23 91 35 86 Z', p.m);
    o += P('M38 88 L30 100 L37 101 L45 91Z', p.d) + P('M48 92 L46 104 L53 104 L55 92Z', p.d) + P('M60 91 L64 103 L70 101 L66 89Z', p.d) + P('M67 85 L78 95 L81 91 L72 82Z', p.d);
    o += s && br !== 'A'
      ? P('M33 82 L35 56 L43 73 L47 46 L53 71 L60 52 L63 78 Z', p.a) + P('M40 80 L44 63 L48 77 L53 60 L57 79Z', p.l)
      : P('M36 78 L40 67 L44 76 L49 64 L53 75 L58 66 L61 77 Z', p.l);
    o += E(52, 84, 23, 10, p.m) + E(52, 88, 16, 5, p.l);
    o += C(43, 81, 2.2, p.a) + C(52, 79, 2.6, p.a) + C(61, 81, 2.2, p.a);
    o += E(77, 75, 12, 8, p.m, -15) + P('M85 71 L94 73 L87 79Z', p.m);
    if (s) o += P('M72 68 L68 58 L76 66Z', IV) + P('M78 66 L78 56 L82 66Z', IV);
    return o + C(80, 72, 2.4, EYE) + C(80.5, 72, 1, LEAD);
  },
  sylphe(p, s, br){
    const fire = s && br === 'F';
    let o = s ? ring(50, 72, 38, p.a) : '';
    if (s && !fire){ const w = P('M50 86 C34 82 20 92 24 106 C34 104 44 96 50 90Z', p.m); o += w + M(w); }
    const wing = P('M50 72 C34 44 12 48 15 70 C18 86 38 84 50 78Z', p.l) + P('M48 74 C38 58 26 58 26 70 C28 79 40 78 48 76Z', p.a);
    o += wing + M(wing);
    o += fire
      ? P('M50 64 C64 78 62 98 50 114 C46 100 34 96 41 84 C44 78 46 72 50 64Z', p.m) + P('M50 78 C57 88 55 99 50 107 C47 99 44 92 50 78Z', p.a)
      : P('M50 64 L37 106 Q50 113 63 106 Z', p.m) + P('M50 71 L44 104 L56 104Z', p.l);
    o += Ln('M46 72 L35 86 M54 72 L65 86', 2.2);
    o += P('M41 58 C39 43 61 43 59 58 C58 65 54 62 50 70 C46 62 42 65 41 58Z', fire ? p.l : p.d);
    o += C(50, 56, 6.5, IV) + C(47.6, 55.5, 1, LEAD) + C(52.4, 55.5, 1, LEAD);
    if (fire) o += star(30, 30, 4, p.a) + star(72, 26, 3, p.a);
    else o += band('M14 34 C24 28 30 36 26 40', p.a, 2) + band('M74 30 C84 24 90 32 86 36', p.a, 2);
    return o;
  },
  faucon(p){
    const wing = P('M50 64 L8 48 L15 57 L6 62 L19 66 L12 73 L25 73 L21 79 L46 74Z', p.m) + Ln('M46 70 L18 61 M46 72 L22 71');
    let o = wing + M(wing);
    o += P('M43 88 L50 108 L57 88Z', p.d) + E(50, 76, 9, 16, p.l) + Ln('M44 72 Q50 76 56 72 M44 80 Q50 84 56 80', 1);
    o += C(50, 58, 7.5, IV) + P('M46.5 61 L50 69 L53.5 61Z', GOLD) + C(47, 57, 1.4, LEAD) + C(53, 57, 1.4, LEAD);
    o += `<rect x="38" y="92" width="24" height="7" rx="3" fill="${IV}"/>` + Ln('M42 92 L42 99 M58 92 L58 99', 1.1) + P('M48 99 L50 104 L52 99Z', '#a3212a');
    return o;
  },
  griffon(p){
    const LION = '#c99a44', LIOND = '#8d6526';
    let o = P('M74 94 Q93 92 88 76 Q86 70 82 74 Q86 82 76 88Z', LIOND) + C(85, 71, 4.5, LIOND);
    o += P('M54 76 L34 34 L45 43 L47 30 L58 45 L65 34 L67 56 L69 74Z', p.m) + P('M56 74 L45 43 L52 50 L60 74Z', p.l) + Ln('M58 74 L58 45');
    o += P('M70 94 L76 109 L83 107 L78 92Z', LIOND) + P('M52 96 L48 109 L55 109 L58 96Z', LIOND);
    o += E(61, 88, 20, 12, LION);
    o += P('M44 82 L30 72 L26 77 L40 89Z', LIOND) + P('M30 72 L25 70 L26 74Z', IV) + P('M27 76 L22 76 L25 79Z', IV);
    o += P('M37 68 C35 82 50 89 55 78 L50 61Z', IV) + Ln('M40 72 L46 76 M41 78 L48 81', 1);
    o += C(42, 59, 10, IV) + P('M33 57 L21 63 L34 66Z', GOLD) + C(43, 56, 2.2, EYE) + C(43, 56, .9, LEAD);
    return o + P('M46 50 L55 43 L52 53Z', p.l);
  },
  dragon(p, s, br){
    const leg = s === 2;
    let o = leg ? halo(50, 58, 42) : s ? ring(50, 72, 40, p.a) : '';
    if (s && br === 'A' || leg && p === PAL.A){ const bolt = P('M16 14 L26 14 L20 28 L28 28 L12 50 L18 33 L10 33Z', p.a); o += bolt + M(bolt); }
    const w = leg ? 'M52 70 L6 20 L15 40 L3 46 L17 56 L7 67 L46 82Z' : s ? 'M52 72 L12 30 L19 45 L8 51 L21 60 L12 70 L46 83Z' : 'M52 74 L25 47 L27 58 L18 62 L29 69 L46 83Z';
    const ribs = leg ? 'M50 74 L15 40 M50 76 L17 56' : s ? 'M50 75 L19 45 M50 77 L21 60' : 'M50 77 L27 58';
    const wing = P(w, p.l) + Ln(ribs);
    o += wing + M(wing);
    if (s && br !== 'A' && !(leg && p === PAL.A)){ const fl = P('M14 92 L18 78 L22 90 L26 80 L28 94Z', p.a); o += fl + M(fl); }
    o += P('M60 104 Q80 113 85 98 Q87 92 92 96 L90 87 L83 92 Q78 104 64 98Z', p.d);
    const legD = P('M36 100 L29 113 L41 113 L43 104Z', p.d); o += legD + M(legD);
    o += E(50, 95, 17, 14, p.m) + E(50, 97, 9, 11, p.l) + Ln('M42 93 L58 93 M42 99 L58 99', 1.1);
    o += P('M44 85 L46 60 L54 60 L56 85Z', p.m) + Ln('M47 68 L53 68 M46 76 L54 76', 1.1);
    const horn = leg ? '' : s ? P('M43 47 L31 27 L48 42Z', IV) : P('M43 47 L38 35 L47 43Z', IV);
    o += horn + M(horn);
    o += P('M39 52 L50 39 L61 52 L59 62 L50 69 L41 62Z', p.m) + P('M44 60 L50 71 L56 60Z', p.d);
    const eye = P('M43 52 L48.5 54 L44 56.5Z', EYE); o += eye + M(eye);
    if (leg) o += P('M37 42 L39 28 L44 37 L50 23 L56 37 L61 28 L63 42Z', GOLD) + C(50, 34, 2.2, '#c0283a');
    return o;
  },
  golem(p){
    const arm = P('M31 68 L20 96 L31 101 L39 76Z', ROCK) + E(25, 99, 7, 6, ROCK); let o = arm + M(arm);
    const legR = P('M38 98 L34 114 L47 114 L48 98Z', ROCK); o += legR + M(legR);
    o += P('M34 63 L66 63 L71 92 L58 101 L42 101 L29 92Z', ROCK);
    o += P('M45 69 L51 79 L47 88 L53 97 L50 97 L44 88 L48 79 L42 69Z', p.l) + P('M60 72 L64 80 L62 80 L58 73Z', p.l) + P('M36 78 L40 86 L38 86 L34 79Z', p.l);
    o += C(55, 76, 5, p.a);
    const sh = E(32, 64, 9, 6.5, '#574a3e'); o += sh + M(sh);
    o += P('M39 44 L61 44 L63 61 L37 61Z', '#574a3e');
    const eye = P('M42 50 L48 52.5 L42 55Z', p.a); o += eye + M(eye);
    o += `<rect x="44" y="56" width="12" height="2.6" fill="${p.l}"/>`;
    return o + E(30, 40, 3, 5, p.l, 20) + E(72, 36, 2.5, 4, p.a, -20);
  },
  ondine(p, s, br){
    const marsh = s && br === 'T';
    let o = s ? ring(50, 66, 38, p.a) : '';
    if (marsh) o += P('M17 112 L21 60 L25 112Z', LEAF) + P('M77 112 L81 64 L85 112Z', LEAF) + E(21, 57, 3, 8, p.d) + E(81, 61, 3, 8, p.d);
    o += P('M38 50 C29 70 34 92 27 104 L44 96 L50 60 L56 96 L73 104 C66 92 71 70 62 50Z', p.d);
    o += P('M44 62 C40 76 42 88 40 98 L60 98 C58 88 60 76 56 62Z', p.l);
    const arm = P('M45 66 L33 46 L36 44 L48 62Z', IV); o += arm + M(arm);
    o += C(50, 52, 8, IV) + C(47, 51.5, 1.1, LEAD) + C(53, 51.5, 1.1, LEAD);
    if (s && !marsh) o += P('M41 45 L43 37 L47 43 L50 34 L53 43 L57 37 L59 45Z', GOLD);
    if (marsh) o += E(42, 44, 4, 2, LEAF2, -30) + E(58, 44, 4, 2, LEAF2, 30);
    o += C(50, 32, s ? 9 : 7, p.a) + C(48, 30, s ? 3.5 : 2.5, '#ffffff');
    o += P('M4 120 L4 100 Q14 90 24 100 Q34 110 44 98 Q54 88 64 100 Q74 110 84 98 Q92 90 96 100 L96 120Z', p.m);
    o += P('M4 120 L4 110 Q18 102 30 110 Q44 118 56 108 Q70 100 82 110 Q90 114 96 110 L96 120Z', p.d);
    if (marsh) o += E(30, 106, 7, 2.5, LEAF2) + E(72, 108, 6, 2.2, LEAF2);
    return o;
  },
  gobelin(p, s, br){
    const col = s && br === 'T', cor = s && br === 'E', SK = '#7c9a3c', SKD = '#4d6626';
    let g = '';
    const ear = P('M39 55 L17 46 L34 64Z', SK); g += ear + M(ear);
    const legG = P('M38 97 L36 110 L46 110 L46 97Z', SKD); g += legG + M(legG);
    g += P('M36 71 L64 71 L68 98 L32 98Z', p.m) + P('M36 90 L64 90 L66 98 L34 98Z', p.d);
    g += P('M36 73 L25 90 L31 93 L40 80Z', SK);
    if (cor) g += P('M64 86 L88 54 L91 57 L69 90Z', '#cfd6dc') + P('M62 84 L70 90 L68 92 L60 86Z', GOLD);
    else if (col) g += P('M63 84 L80 58 L95 68 L73 94Z', p.l) + Ln('M78 66 L84 74 M86 66 L82 72', 1.1);
    else g += C(72, 82, 8, p.l) + Ln('M68 79 L74 85 L72 88', 1.1);
    g += P('M62 74 L70 84 L66 87 L58 78Z', SK);
    if (col){ const sh = E(36, 71, 9, 5.5, p.d); g += sh + M(sh); }
    g += E(50, 58, 13, 11, SK) + C(45, 57, 2.4, EYE) + C(55, 57, 2.4, EYE) + C(45, 57, 1, LEAD) + C(55, 57, 1, LEAD);
    g += P('M44 64 Q50 70 56 64Z', '#3a1d10') + P('M47 64 L48 67 L49 64Z', IV) + P('M51 64 L52 67 L53 64Z', IV);
    if (cor) g += P('M37 52 Q50 39 63 52 L63 55 L37 55Z', '#a3212a') + P('M63 52 L72 50 L70 56Z', '#a3212a');
    if (col) g += P('M38 51 L50 40 L62 51Z', p.d);
    let o = s ? ring(50, 76, 37, p.a) : '';
    return o + (col ? `<g transform="translate(50 108) scale(1.12) translate(-50 -108)">${g}</g>` : g);
  },
  sirene(p){
    let o = P('M28 113 Q35 97 54 99 Q74 101 81 113Z', '#4a4038') + P('M4 120 L4 112 Q30 106 50 112 Q72 118 96 110 L96 120Z', p.d);
    o += P('M40 46 C29 60 33 80 29 92 L48 78 L50 50Z', p.d);
    o += P('M48 78 C40 92 46 103 62 103 C72 103 80 97 82 89 C76 95 66 97 60 93 C56 89 56 84 54 78Z', p.m) + P('M80 91 L94 80 L90 95 L97 104 L80 97Z', p.l);
    o += Ln('M52 88 Q55 85 58 88 M58 94 Q61 91 64 94 M50 96 Q53 93 56 96', 1);
    o += P('M44 60 C42 70 44 78 48 81 L56 81 C58 76 58 68 56 60Z', IV) + C(47, 66, 2.5, p.a) + C(53, 66, 2.5, p.a);
    o += P('M56 64 L66 57 L68 60.5 L58 68Z', IV) + P('M63 49 L77 55 L66 62Z', GOLD) + Ln('M66 52 L70 58', 1);
    o += C(50, 52, 7.5, IV) + C(47.5, 51.5, 1, LEAD) + C(52.5, 51.5, 1, LEAD) + P('M42 48 C44 42 56 42 58 48 C54 45 46 45 42 48Z', p.d);
    return o;
  },
  kraken(p){
    const t1 = P('M38 74 C25 84 17 97 26 105 C33 109 35 100 30 98 C26 96 30 88 44 80Z', p.m);
    const t2 = P('M42 79 C33 92 33 106 42 112 C46 108 40 104 41 98 C42 92 46 87 48 82Z', p.m);
    const t3 = P('M32 70 C20 72 10 66 12 56 C14 50 20 52 19 57 C18 62 24 64 34 64Z', p.m);
    let o = t1 + t2 + t3 + M(t1 + t2 + t3);
    o += C(26, 100, 1.6, p.l) + C(23, 92, 1.6, p.l) + C(74, 100, 1.6, p.l) + C(77, 92, 1.6, p.l) + C(41, 104, 1.4, p.l) + C(59, 104, 1.4, p.l);
    o += P('M29 66 C27 34 73 34 71 66 C71 79 29 79 29 66Z', p.m) + P('M35 54 C37 41 50 37 57 41 C46 42 40 48 38 57Z', p.l);
    o += C(50, 46, 2.6, p.a) + C(60, 52, 2, p.a) + C(41, 46, 1.8, p.a);
    return o + E(41, 66, 6.5, 5.5, EYE) + E(59, 66, 6.5, 5.5, EYE) + E(41, 66, 2, 4, LEAD) + E(59, 66, 2, 4, LEAD);
  },
  tortue(p, s, br){
    const mont = s === 1 && br === 'T', lev = s === 1 && br === 'E', leg = s === 2, SK = lev ? '#4a8fa0' : '#7f8f4a';
    let o = leg ? halo(50, 54, 44) : s ? ring(50, 80, 40, p.a) : '';
    if (leg) o += P('M48 66 L46 38 L54 38 L52 66Z', WOOD) + C(50, 30, 14, LEAF) + C(39, 37, 8, LEAF2) + C(61, 37, 8, LEAF2) + C(50, 24, 5, LEAF2);
    if (lev){ const fin = P('M28 94 L6 106 L30 103Z', p.l); o += fin + M(fin); }
    else { o += E(28, 104, 8, 6, SK) + E(72, 104, 8, 6, SK); }
    o += lev ? P('M78 84 L97 79 L93 93 L80 97Z', SK) + C(89, 85, 2, EYE) : P('M76 92 C80 80 96 80 96 90 C96 98 84 100 76 98Z', SK) + C(89, 87, 2, EYE) + C(89.3, 87, .9, LEAD);
    o += P('M17 97 C19 58 81 58 83 97Z', p.m);
    if (lev) o += P('M30 70 L34 58 L38 68Z', p.l) + P('M44 64 L50 50 L56 64Z', p.l) + P('M62 68 L66 58 L70 70Z', p.l);
    o += P('M40 72 L50 66 L60 72 L60 84 L50 90 L40 84Z', p.l);
    const pl = P('M23 93 L29 77 L40 84 L40 95Z', p.d) + P('M31 70 L40 72 L40 84 L29 77Z', p.l); o += pl + M(pl);
    o += P('M15 96 L85 96 L83 101 L17 101Z', p.d);
    if (mont) o += P('M30 72 L42 44 L50 58 L57 40 L70 72Z', '#8a8f96') + P('M39 51 L42 44 L45 51Z', IV) + P('M54 47 L57 40 L60 47Z', IV);
    return o;
  },
  treant(p){
    let o = '';
    const root = P('M37 112 L22 117 L41 105Z', '#5a3c20'); o += root + M(root);
    o += P('M36 113 L40 70 L60 70 L64 113Z', WOOD) + Ln('M44 98 L46 108 M56 96 L55 108 M47 74 L48 80', 1.1);
    const arm = P('M41 76 L17 58 L21 53 L43 70Z', WOOD) + Ln('M24 59 L18 50 M28 62 L26 54', 1.6) + C(17, 50, 5, LEAF2); o += arm + M(arm);
    o += C(50, 48, 21, LEAF) + C(31, 54, 10, LEAF) + C(69, 54, 10, LEAF) + C(50, 31, 12, LEAF2) + C(38, 40, 7, LEAF2) + C(62, 40, 7, LEAF2);
    o += C(44, 46, 2.2, '#f2b33d') + C(58, 34, 2, '#f2b33d');
    const eye = P('M43 82 L48 84 L43 86Z', EYE); o += eye + M(eye);
    return o + P('M44 94 Q50 99 56 94 Q50 102 44 94Z', LEAD);
  },
  // Sorts
  embrasement(p){
    let o = P('M50 20 C59 43 77 52 73 82 C71 101 29 101 27 82 C25 61 41 53 50 20Z', p.m);
    o += P('M50 45 C56 59 65 66 63 84 C61 96 39 96 37 84 C35 70 45 62 50 45Z', p.l) + P('M50 65 C54 73 57 80 55 88 C53 94 47 94 45 88 C43 80 47 73 50 65Z', p.a);
    const st = P('M6 102 L26 97 L42 104 L36 116 L10 116Z', ROCK) + P('M28 112 L44 106 L50 118 L30 120Z', '#574a3e'); o += st + M(st);
    return o + star(20, 40, 3, p.a) + star(80, 34, 3.5, p.a) + star(74, 60, 2.5, p.l);
  },
  bourrasque(p){
    let o = band('M14 44 C16 24 52 22 56 40 C60 56 38 60 36 48 C35 42 42 40 44 44', p.l, 6);
    o += band('M86 70 C84 92 46 96 42 78 C38 62 62 58 64 70 C65 76 58 78 56 74', p.l, 6);
    o += band('M10 92 C30 86 60 100 92 90', p.m, 4) + band('M18 18 C40 12 66 22 88 14', p.m, 3);
    return o + E(70, 38, 6, 3, LEAF2, -30) + E(26, 74, 5, 2.6, LEAF2, 25) + E(78, 104, 5, 2.4, LEAF, -10) + Ln('M66 40 L74 36 M23 75 L29 73', 1);
  },
  bouledefeu(p){
    let o = P('M14 108 C26 86 42 72 54 58 L66 72 C50 78 34 94 14 108Z', p.l) + P('M24 106 C36 92 46 84 56 76 L60 80 C48 86 38 96 24 106Z', p.a);
    o += P('M64 30 L68 22 L70 32 L80 26 L76 36 L88 38 L78 44 L86 52 L76 52 L80 62 L70 58 L66 68 L62 58 L52 62 L56 52 L46 50 L54 44 L46 36 L58 36 L54 26Z', p.m);
    return o + C(66, 46, 12, p.l) + C(64, 44, 6, p.a) + C(62, 42, 2.4, '#ffffff');
  },
  ascension(p){
    let o = P('M50 20 L72 46 L61 46 L61 70 L39 70 L39 46 L28 46Z', p.l) + P('M50 30 L64 46 L56 46 L56 66 L44 66 L44 46 L36 46Z', p.a);
    const fe = P('M30 96 C20 84 22 72 30 66 C32 78 36 88 30 96Z', p.m) + Ln('M30 94 L28 72', 1); o += fe + M(fe);
    o += P('M40 100 L60 100 L56 112 L44 112Z', GOLD);
    return o + star(22, 36, 4, p.a) + star(78, 30, 3, p.a) + star(80, 60, 2.6, IV) + star(18, 60, 2.6, IV) + star(50, 86, 3, p.a);
  },
  inondation(p){
    let o = P('M50 18 C60 33 65 42 65 51 A15 15 0 0 1 35 51 C35 42 40 33 50 18Z', p.l) + P('M46 40 C42 46 41 52 44 56 C40 54 38 46 46 40Z', '#ffffff');
    o += P('M0 120 L0 78 Q12 68 24 78 Q36 88 48 76 Q60 66 72 78 Q84 88 100 76 L100 120Z', p.d);
    o += P('M0 120 L0 92 Q14 84 28 92 Q42 100 56 90 Q70 82 84 92 Q92 96 100 92 L100 120Z', p.m);
    return o + P('M0 120 L0 106 Q20 100 40 106 Q60 112 80 104 L100 104 L100 120Z', p.l) + C(30, 72, 2, p.a) + C(70, 70, 2.4, p.a);
  },
  seisme(p){
    let o = P('M46 72 L54 72 L61 88 L52 100 L59 120 L41 120 L48 100 L39 88Z', '#f2b33d');
    o += P('M0 66 L46 72 L39 88 L48 100 L41 120 L0 120Z', p.m) + P('M100 62 L54 72 L61 88 L52 100 L59 120 L100 120Z', p.d);
    o += Ln('M10 84 L24 90 L30 104 M88 80 L76 92 L80 106', 1.2);
    return o + P('M30 40 L42 34 L46 46 L34 50Z', p.l) + P('M60 28 L70 32 L66 42 L56 38Z', p.l) + P('M46 52 L54 50 L55 58 L47 59Z', p.m) + P('M74 50 L80 52 L78 58 L72 56Z', p.l);
  },
  raz(p){
    let o = P('M6 114 C8 60 38 30 74 33 C93 35 97 52 85 60 C77 66 66 60 70 52 C74 46 66 42 58 46 C40 56 40 86 52 114Z', p.m);
    o += P('M20 114 C24 76 40 52 58 46 C46 56 44 84 52 114Z', p.l) + P('M70 34 C82 36 90 44 86 54 C84 46 78 40 70 34Z', p.a);
    return o + C(88, 60, 3, IV) + C(80, 64, 2.4, IV) + C(92, 52, 2, IV) + P('M0 120 L0 112 L100 108 L100 120Z', p.d);
  },
  eclat(p){
    let o = '';
    for (let k = 0; k < 8; k++){ const r = k * 45; o += `<path d="M50 62 L47 24 L50 14 L53 24Z" fill="${k % 2 ? p.l : p.a}" transform="rotate(${r} 50 62)" opacity=".85"/>`; }
    o += P('M50 34 L68 58 L50 92 L32 58Z', '#5d8de0') + P('M50 34 L68 58 L50 62Z', '#cfe0ff') + P('M50 34 L32 58 L50 62Z', '#8fb2f0') + P('M32 58 L50 62 L50 92Z', '#2a4a8f') + P('M68 58 L50 62 L50 92Z', '#3d64b0');
    return o + star(30, 34, 3, '#ffffff') + star(72, 40, 2.6, p.a) + star(70, 86, 2.2, '#ffffff') + star(26, 82, 2.6, p.a);
  },
  seve(p){
    let o = P('M0 28 C30 24 62 32 100 22 L100 30 C62 40 30 33 0 37Z', WOOD);
    o += E(22, 40, 8, 3.4, LEAF2, 30) + E(76, 36, 8, 3.4, LEAF, -25) + E(40, 22, 7, 3, LEAF, -20) + E(64, 20, 6, 2.6, LEAF2, 15);
    o += P('M48 33 L52 33 L52 42 L48 42Z', WOOD);
    o += P('M50 40 C60 56 66 66 66 76 A16 16 0 0 1 34 76 C34 66 40 56 50 40Z', '#e8a23a') + P('M50 54 C56 64 58 70 58 78 A8 8 0 0 1 42 78 C42 70 44 64 50 54Z', '#ffe38a');
    return o + star(26, 70, 3.4, p.a) + star(76, 66, 3, IV) + star(30, 100, 2.6, IV) + star(70, 98, 3, p.a);
  }
};

// Illustrations provisoires des nouveaux decks : dessins existants réutilisés
Object.assign(ART, {kobold:ART.gobelin, harpie:ART.sylphe, hibou:ART.faucon, ours:ART.griffon, roc:ART.faucon, colosse:ART.golem,
  vent:ART.bourrasque, sentier:ART.seisme, chute:ART.seisme, cimes:ART.ascension,
  diablotin:ART.salamandre, anguille:ART.ondine, crapaud:ART.kraken, chien:ART.griffon, serpent:ART.dragon, vapeurel:ART.ondine,
  brume:ART.inondation, coulee:ART.embrasement, vapeur:ART.bouledefeu, larme:ART.seve});
let artN = 0;
function artSVG(key, el, stage = 0, extra = ''){
  const n = ++artN, p = PAL[el];
  if (extra === 'rect') return `<svg class="art" viewBox="0 12 100 95.5" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="ag${n}" cx=".42" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>${panes(el)}<g stroke="${LEAD}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${ART[key](p, stage, el)}</g><rect width="100" height="120" fill="url(#ag${n})"/></svg>`;
  return `<svg class="art" viewBox="0 0 100 120" aria-hidden="true"><defs><clipPath id="ac${n}"><path d="${ARCH}"/></clipPath>
  <radialGradient id="ag${n}" cx=".42" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="av${n}" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>
  <g clip-path="url(#ac${n})">${panes(el)}<g stroke="${LEAD}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${ART[key](p, stage, el)}</g>
  <rect width="100" height="120" fill="url(#ag${n})"/><rect width="100" height="120" fill="url(#av${n})"/>${extra}</g>
  <path d="${ARCH}" fill="none" stroke="${LEAD}" stroke-width="5"/><path d="${ARCH}" fill="none" stroke="${GOLD}" stroke-width="2.2"/></svg>`;
}
