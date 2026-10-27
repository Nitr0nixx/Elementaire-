// --- Son : musique générative et bruitages, synthétisés avec Web Audio ---
const SND = (() => {
  let ctx = null, master, musicBus, sfxBus, noiseBuf, reverb, musicTimer = null, nextBar = 0, bar = 0;
  const pref = {music: true, sfx: true};
  try { const v = JSON.parse(localStorage.getItem('elementaires-son') || '{}'); if (typeof v.music === 'boolean') pref.music = v.music; if (typeof v.sfx === 'boolean') pref.sfx = v.sfx; } catch (e) {}
  const savePref = () => { try { localStorage.setItem('elementaires-son', JSON.stringify(pref)); } catch (e) {} };

  function init(){
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = .8; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = pref.music ? .22 : 0;
    sfxBus = ctx.createGain(); sfxBus.gain.value = pref.sfx ? .55 : 0;
    // petite réverbération synthétique
    reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    reverb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = .35; reverb.connect(wet); wet.connect(master);
    musicBus.connect(master); musicBus.connect(reverb);
    sfxBus.connect(master); sfxBus.connect(reverb);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }
  // Débloque l'audio au premier geste du joueur
  function unlock(){
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (pref.music && !musicTimer) startMusic();
  }
  ['pointerdown', 'keydown'].forEach(t => window.addEventListener(t, unlock, {passive: true}));

  // --- briques ---
  const now = () => ctx.currentTime;
  function tone(f, t, dur, {type = 'sine', vol = .3, a = .005, r = .2, bus = sfxBus, glide = 0, detune = 0} = {}){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * glide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol, t + Math.max(a, dur - r)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .05);
  }
  function noise(t, dur, {vol = .3, f = 1200, q = 1, type = 'bandpass', sweep = 0, bus = sfxBus, a = .004} = {}){
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (sweep) fl.frequency.exponentialRampToValueAtTime(Math.max(40, f * sweep), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + .05);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);   // note MIDI -> Hz

  // --- bruitages ---
  const EL_NOTE = {F:62, E:65, T:57, A:69, N:64, V:60};
  const FX = {
    click(){ const t = now(); tone(1400, t, .05, {type:'triangle', vol:.12, r:.04}); },
    select(){ const t = now(); tone(880, t, .08, {type:'triangle', vol:.12}); tone(1320, t + .04, .1, {type:'sine', vol:.08}); },
    play(o = {}){ const t = now(); noise(t, .28, {vol:.22, f:600, sweep:6, q:.7}); const b = EL_NOTE[o.el] || 62; [0, 7, 12].forEach((k, j) => tone(N(b + k), t + .06 + j * .045, .35, {type:'triangle', vol:.1, r:.25})); },
    summon(o = {}){ const t = now(); const b = EL_NOTE[o.el] || 62; tone(N(b - 24), t, .4, {type:'sine', vol:.35, glide:.6}); noise(t, .18, {vol:.15, f:300, type:'lowpass'}); tone(N(b + 12), t + .05, .5, {type:'sine', vol:.08}); },
    spell(o = {}){
      const t = now(), el = o.el;
      if (el === 'F'){ noise(t, .6, {vol:.3, f:900, sweep:.25, q:.6}); tone(N(50), t, .5, {type:'sawtooth', vol:.06, glide:.5}); }
      else if (el === 'E'){ noise(t, .7, {vol:.25, f:500, sweep:3, q:2}); [72, 76, 79].forEach((n, j) => tone(N(n), t + j * .06, .4, {vol:.06})); }
      else if (el === 'T'){ tone(N(33), t, .6, {type:'sine', vol:.4, glide:.7}); noise(t, .4, {vol:.25, f:180, type:'lowpass'}); }
      else if (el === 'A'){ noise(t, .7, {vol:.25, f:1600, sweep:.3, q:3}); noise(t + .1, .6, {vol:.15, f:2400, sweep:.4, q:4}); }
      else { [76, 79, 83, 88].forEach((n, j) => tone(N(n), t + j * .05, .35, {type:'triangle', vol:.08})); }
    },
    slash(o = {}){ const t = now(); noise(t, .16, {vol:.35, f:3200, sweep:.2, q:1.2}); tone(o.big ? 140 : 190, t + .05, .18, {type:'square', vol:.08, glide:.4}); },
    crit(){ const t = now(); tone(N(84), t, .25, {type:'square', vol:.06}); tone(N(91), t + .05, .3, {type:'triangle', vol:.08}); },
    hero(){ const t = now(); tone(70, t, .45, {type:'sine', vol:.55, glide:.5}); noise(t, .25, {vol:.3, f:220, type:'lowpass'}); },
    death(){ const t = now(); noise(t, .5, {vol:.3, f:2500, sweep:.15, q:.8}); [88, 84, 79, 72].forEach((n, j) => tone(N(n), t + j * .045, .2, {type:'triangle', vol:.06})); },
    dodge(){ const t = now(); noise(t, .3, {vol:.22, f:1800, sweep:2.5, q:5}); },
    evolve(){ const t = now(); [60, 64, 67, 72, 76, 79, 84].forEach((n, j) => tone(N(n), t + j * .07, .7, {type:'triangle', vol:.09, r:.5})); tone(N(48), t, 1.2, {type:'sine', vol:.2}); noise(t + .3, .9, {vol:.08, f:6000, sweep:.5, q:.5}); },
    terra(o = {}){ const t = now(); const b = EL_NOTE[o.el] || 62; tone(N(b), t, .3, {type:'sine', vol:.1}); tone(N(b + 7), t + .08, .35, {type:'sine', vol:.08}); },
    heal(){ const t = now(); [72, 79, 84].forEach((n, j) => tone(N(n), t + j * .06, .45, {vol:.07})); },
    mana(){ const t = now(); [84, 88, 91, 96].forEach((n, j) => tone(N(n), t + j * .04, .25, {type:'triangle', vol:.06})); },
    draw(){ const t = now(); noise(t, .12, {vol:.12, f:2600, sweep:.6, q:1}); },
    turn(){ const t = now(); [62, 69, 74].forEach((n, j) => tone(N(n), t + j * .09, .6, {type:'triangle', vol:.09, r:.4})); },
    out(){ const t = now(); [62, 58, 55, 50].forEach((n, j) => tone(N(n), t + j * .14, .5, {type:'sawtooth', vol:.06, r:.3})); },
    win(){ const t = now(); [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79, 84]].forEach((ch, j) => ch.forEach(n => tone(N(n), t + j * .22, j === 3 ? 1.6 : .3, {type:'triangle', vol:.08, r: j === 3 ? 1.2 : .15}))); },
    lose(){ const t = now(); [[62, 65, 69], [60, 63, 67], [58, 62, 65], [57, 60, 64]].forEach((ch, j) => ch.forEach(n => tone(N(n - 12), t + j * .35, .9, {type:'sine', vol:.07, r:.6}))); },
    prism(){ const t = now(); [74, 78, 81, 86, 90, 93, 98].forEach((n, j) => { tone(N(n), t + j * .055, 1.3, {type:'sine', vol:.07, r:1}); tone(N(n + 12), t + .02 + j * .055, .9, {type:'triangle', vol:.025, r:.7, detune:8}); }); noise(t, 1.4, {vol:.1, f:7000, sweep:.4, q:.6}); tone(N(50), t, 1.6, {vol:.18}); },
    coin(){ const t = now(); tone(N(88), t, .12, {type:'square', vol:.05}); tone(N(95), t + .07, .25, {type:'square', vol:.05}); },
    flip(o = {}){ const t = now(); noise(t, .1, {vol:.15, f:1800, q:1}); const r = o.r || 'C';
      if (r === 'R') tone(N(79), t + .05, .4, {vol:.08});
      if (r === 'E') [76, 83, 88].forEach((n, j) => tone(N(n), t + .05 + j * .06, .6, {type:'triangle', vol:.08}));
      if (r === 'L') { [72, 76, 79, 84, 88, 91].forEach((n, j) => tone(N(n), t + .05 + j * .06, 1, {type:'triangle', vol:.09})); tone(N(48), t, 1.4, {vol:.2}); } }
  };
  function play(name, o){ if (!pref.sfx || !ctx || ctx.state !== 'running' || !FX[name]) return; try { FX[name](o); } catch (e) {} }

  // --- musique : nappes modales et arpège lent, en ré éolien ---
  const PROG = [[50, 57, 62, 65], [46, 53, 58, 62], [41, 48, 53, 57], [48, 55, 60, 64]];
  const BAR = 60 / 66 * 4;
  function scheduleBar(t){
    const ch = PROG[bar % PROG.length];
    // nappe
    ch.forEach((n, k) => { [-6, 6].forEach(d => tone(N(n), t, BAR + .6, {type: k ? 'triangle' : 'sine', vol: k ? .045 : .08, a: 1.2, r: 1.4, bus: musicBus, detune: d})); });
    // basse
    tone(N(ch[0] - 12), t, BAR, {type:'sine', vol:.12, a:.3, r:1, bus:musicBus});
    // arpège
    const arp = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 24, ch[3] + 12, ch[2] + 12, ch[1] + 12];
    arp.forEach((n, j) => { if ((bar + j) % 3 === 2 && j % 2) return; tone(N(n), t + j * BAR / 8, .9, {type:'triangle', vol:.035, a:.01, r:.8, bus:musicBus}); });
    bar++;
  }
  function startMusic(){
    if (!ctx || musicTimer) return;
    nextBar = Math.max(nextBar, now() + .1);
    musicTimer = setInterval(() => { while (nextBar < now() + 1.2){ scheduleBar(nextBar); nextBar += BAR; } }, 300);
  }
  function stopMusic(){ if (musicTimer){ clearInterval(musicTimer); musicTimer = null; } }
  function setMusic(on){
    pref.music = on; savePref();
    if (!init()) return;
    musicBus.gain.setTargetAtTime(on ? .22 : 0, now(), .3);
    if (on){ if (ctx.state === 'suspended') ctx.resume(); startMusic(); } else setTimeout(() => { if (!pref.music) stopMusic(); }, 1500);
  }
  function setSfx(on){ pref.sfx = on; savePref(); if (init()) sfxBus.gain.setTargetAtTime(on ? .55 : 0, now(), .05); }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  return {play, setMusic, setSfx, pref};
})();
