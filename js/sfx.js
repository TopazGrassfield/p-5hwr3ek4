/* UIDiorama 022 — clack·release를 018 소리로 되돌림 (020 — 효과음 (019에서 복사, clack·release를 묵직한 카세트 데크 버튼으로 바꿈, ?clack=A|B|C) (Web Audio API 합성. 외부 음원·라이브러리 없음)
   같은 합성 함수를 실시간 재생(AudioContext)과 파일 굽기(OfflineAudioContext → WAV)에 함께 씀.
   window.LBSFX.play(name)  /  .unlock()  /  .setMuted(b)  /  .renderWav(names, gap) → base64 WAV
   소리 (길이):
     clack   버튼 누름 — 묵직한 카세트 데크 버튼 "철-컥": 탁한 철 + 25~45ms 뒤 걸쇠 컥 + 본체 쿵(80~200Hz) + 스프링 꼬리 (~150ms)
     release 버튼 뗌 — 낮은 틱-턱 (~60ms)
     tick    커서 이동·호버 (~25ms)
     open    메뉴 열기 — 낮은 웅 + 반짝 (~0.75s)
     close   메뉴 닫기 — 꺼짐 (~0.5s)
     swap    화면 전환 — 짧은 데이터 쓸림 (~0.2s)
     back    돌아가기 — 내려가는 두 음 (~0.22s)                                                         */
(function () {
  'use strict';
  const LEN = { clack: 0.18, release: 0.08, clackA: 0.18, clackB: 0.18, clackC: 0.18, releaseA: 0.08, releaseB: 0.08, releaseC: 0.08, tick: 0.04, open: 0.8, close: 0.55, swap: 0.24, back: 0.26 };

  /* 시드 고정 난수 (굽기 결과가 매번 같게). 실시간은 Math.random 으로 변화를 줌 */
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const noiseCache = new WeakMap();
  function noiseBuf(ctx) {
    if (noiseCache.has(ctx)) return noiseCache.get(ctx);
    const n = Math.round(ctx.sampleRate * 1.0), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), r = rng(7);
    for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
    noiseCache.set(ctx, b); return b;
  }
  // 엔벨로프: 순간 상승 → 지수 감쇠
  function env(g, t, peak, atk, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
  }
  function noise(ctx, out, t, { type = 'bandpass', f = 2000, q = 1, peak = 0.5, atk = 0.001, dec = 0.02, f2 = null, off = 0 }) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx);
    const bq = ctx.createBiquadFilter(); bq.type = type; bq.frequency.setValueAtTime(f, t); bq.Q.value = q;
    if (f2) bq.frequency.exponentialRampToValueAtTime(f2, t + atk + dec);
    const g = ctx.createGain(); env(g, t, peak, atk, dec);
    s.connect(bq).connect(g).connect(out);
    s.start(t, off % 0.9); s.stop(t + atk + dec + 0.02);
  }
  function tone(ctx, out, t, { f = 440, f2 = null, type = 'sine', peak = 0.2, atk = 0.001, dec = 0.05, glide = null }) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || atk + dec));
    const g = ctx.createGain(); env(g, t, peak, atk, dec);
    o.connect(g).connect(out); o.start(t); o.stop(t + atk + dec + 0.02);
  }

  /* 020: 묵직한 카세트 데크 버튼 "철-컥" — 판 3가지 (?clack=A|B|C 로 바꿔 듣기, 기본 = DEFAULT_CLACK)
     구조: ① 버튼 머리가 닿는 탁한 '철' (1.5~2kHz 잡음, 짧음)
           → ② 25~45ms 뒤 걸쇠 '컥' = 1~2.5kHz 잡음(넓은 필터)이 3번 잘게 부딪힘(금속 걸쇠 덜걱) + 맨 앞 2~4ms 짧은 딸깍(고역은 작게)
              + 그 밑에 본체에 부딪히는 '쿵'(80~200Hz, 저역 통과 잡음 위주, 30~60ms 감쇠)
           → ③ 짧은 스프링 떨림 꼬리
     순음은 '쿵' 바닥에만 아주 작게. 공진 필터(Q 높음)·순음이 많으면 나무 블록처럼 들림 (018·020 1차 판별) */
  const CLACK = {
    // hit=①철 중심Hz, gap=①→② 간격초, b0→b1=쿵 Hz, bv=쿵 세기, bd=쿵 감쇠초, latch=[[중심Hz, Q, 세기]…], ld=걸쇠 감쇠초,
    // chat=[[지연초, 비율]…] 걸쇠 덜걱, sn=딸깍 세기, tail=[꼬리Hz, 세기]
    A: { hit: 1900, gap: 0.032, b0: 150, b1: 100, bv: 0.70, bd: 0.09, latch: [[1300, 6, 1.1], [2000, 7, 1.0], [3000, 9, 0.3]], ld: 0.055,
         chat: [[0, 1], [0.004, 0.55], [0.009, 0.35], [0.015, 0.2]], sn: 0.42, tail: [820, 0.16] },
    B: { hit: 1600, gap: 0.036, b0: 135, b1: 90, bv: 0.95, bd: 0.11, latch: [[1150, 4.5, 1.2], [1750, 5.5, 1.0], [2600, 7, 0.3]], ld: 0.06,
         chat: [[0, 1], [0.005, 0.5], [0.012, 0.25]], sn: 0.4, tail: [640, 0.14] },
    C: { hit: 2100, gap: 0.028, b0: 170, b1: 110, bv: 0.55, bd: 0.08, latch: [[1500, 8, 1.1], [2300, 10, 1.1], [3400, 12, 0.4]], ld: 0.07,
         chat: [[0, 1], [0.004, 0.6], [0.009, 0.4], [0.016, 0.22]], sn: 0.45, tail: [1150, 0.22] },
  };
  const DEFAULT_CLACK = 'B';
  let clackSel = DEFAULT_CLACK;
  try { const q = new URLSearchParams(location.search).get('clack'); if (q && CLACK[q.toUpperCase()]) clackSel = q.toUpperCase(); } catch (e) { /* */ }
  // 본체 '쿵': 저역 통과 잡음 두 겹 + 바닥에 아주 작은 미끄러지는 사인
  function thump(ctx, out, t, f0, f1, peak, dec, r) {
    noise(ctx, out, t, { type: 'lowpass', f: f0 * 1.6, q: 0.8, peak: peak * 1.3, atk: 0.002, dec, f2: f1 * 1.4, off: r() });
    noise(ctx, out, t, { type: 'bandpass', f: (f0 + f1) / 2, q: 1.2, peak: peak * 1.1, atk: 0.002, dec: dec * 0.7, off: r() });
    tone(ctx, out, t, { f: f0, f2: f1, peak: peak * 0.3, atk: 0.002, dec: dec * 0.6, glide: dec * 0.6 });
  }
  function clackOf(k) {
    const C = CLACK[k];
    return (ctx, out, t, p, v, r) => {
      // ① '철': 버튼 머리가 닿음 (탁한 중역 잡음, 고역 약하게)
      noise(ctx, out, t, { type: 'bandpass', f: C.hit * p, q: 1.2, peak: 0.7 * v, dec: 0.016, off: r() });
      noise(ctx, out, t, { type: 'lowpass', f: 700 * p, q: 0.7, peak: 0.22 * v, dec: 0.02, off: r() });
      // ② '컥': 끝까지 눌려 걸쇠가 걸림 — 짧은 딸깍 + 잘게 3~4번 덜걱 + 본체 울림
      const t2 = t + C.gap + r() * 0.004;
      noise(ctx, out, t2, { type: 'highpass', f: 3200 * p, q: 0.7, peak: C.sn * v, dec: 0.004, off: r() });
      C.chat.forEach(([d, s], i) => C.latch.forEach(([f, q, a]) =>
        noise(ctx, out, t2 + d + (i ? r() * 0.0015 : 0), { type: 'bandpass', f: f * p * (1 - i * 0.04), q, peak: a * s * v, dec: i ? C.ld * 0.45 : C.ld, off: r() })));
      thump(ctx, out, t2, C.b0 * p, C.b1 * p, C.bv * v, C.bd, r);
      // ③ 스프링 떨림 꼬리 (아주 작게, 두 번 끊김)
      [0.06, 0.09].forEach((d, i) => noise(ctx, out, t2 + d + r() * 0.004, { type: 'bandpass', f: C.tail[0] * p, q: 6, peak: C.tail[1] * v * (i ? 0.6 : 1), dec: 0.03, off: r() }));
    };
  }
  function releaseOf(k) {
    const C = CLACK[k];
    return (ctx, out, t, p, v, r) => {
      // 작은 '틱-턱': 걸쇠 풀림(탁한 중역, 잘게 두 번) → 버튼이 위로 올라와 멈춤(낮은 툭)
      [[0, 1], [0.005, 0.45]].forEach(([d, s]) => noise(ctx, out, t + d, { type: 'bandpass', f: C.latch[0][0] * 1.1 * p, q: 1.6, peak: 0.45 * s * v, dec: 0.025, off: r() }));
      noise(ctx, out, t, { type: 'highpass', f: 3000 * p, q: 0.7, peak: C.sn * 0.4 * v, dec: 0.003, off: r() });
      const t2 = t + 0.026 + r() * 0.004;
      noise(ctx, out, t2, { type: 'bandpass', f: C.hit * 0.6 * p, q: 1.4, peak: 0.32 * v, dec: 0.025, off: r() });
      thump(ctx, out, t2, C.b0 * 1.25 * p, C.b1 * 1.3 * p, C.bv * 0.35 * v, 0.06, r);
    };
  }

  /* p = 높이 배율(±4%), v = 세기 배율(±10%), r = 난수 */
  const SYN = {
    /* 022: 사용자 요청으로 clack·release를 018(020 이전) 소리로 되돌림. 020 묵직한 판은 clackA/B/C로만 남김 */
    clack(ctx, out, t, p, v, r) {
      // 1) 플라스틱 버튼 머리가 닿는 딸깍 (밝고 아주 짧음)
      noise(ctx, out, t, { type: 'bandpass', f: 4300 * p, q: 1.4, peak: 0.8 * v, dec: 0.01, off: r() });
      noise(ctx, out, t + 0.006, { type: 'highpass', f: 2500 * p, q: 0.7, peak: 0.25 * v, dec: 0.008, off: r() });
      tone(ctx, out, t, { f: 2950 * p, peak: 0.06 * v, dec: 0.012 });
      // 2) 28ms 뒤 걸쇠가 걸리며 내려가는 금속성 '척' (잡음을 좁은 필터 여러 개로 울려 금속 판 느낌, 순음은 짧게만)
      const t2 = t + 0.028 + r() * 0.004;
      noise(ctx, out, t2, { type: 'bandpass', f: 1400 * p, q: 1.2, peak: 0.55 * v, dec: 0.022, f2: 900 * p, off: r() });
      [[1780, 9], [2930, 12], [4410, 14], [6150, 16]].forEach(([f, q]) => noise(ctx, out, t2, { type: 'bandpass', f: f * p, q, peak: 0.9 * v, dec: 0.035, off: r() }));
      tone(ctx, out, t2, { f: 180 * p, f2: 110 * p, peak: 0.1 * v, atk: 0.002, dec: 0.03, glide: 0.03 });
      // 3) 걸린 뒤 작은 덜컹 (기구 유격)
      noise(ctx, out, t2 + 0.042 + r() * 0.01, { type: 'bandpass', f: 3100 * p, q: 3, peak: 0.14 * v, dec: 0.008, off: r() });
    },
    release(ctx, out, t, p, v, r) {
      noise(ctx, out, t, { type: 'bandpass', f: 2700 * p, q: 2, peak: 0.22 * v, dec: 0.01, off: r() });
      tone(ctx, out, t + 0.004, { f: 3150 * p, peak: 0.035 * v, dec: 0.03 });                 // 스프링 울림
      noise(ctx, out, t + 0.022, { type: 'bandpass', f: 1500 * p, q: 3, peak: 0.08 * v, dec: 0.012, off: r() }); // 되튐
    },
    clackA: clackOf('A'), clackB: clackOf('B'), clackC: clackOf('C'),
    releaseA: releaseOf('A'), releaseB: releaseOf('B'), releaseC: releaseOf('C'),
    tick(ctx, out, t, p, v) {
      tone(ctx, out, t, { f: 4300 * p, peak: 0.05 * v, dec: 0.014 });
      tone(ctx, out, t, { f: 2150 * p, peak: 0.025 * v, dec: 0.01 });
    },
    open(ctx, out, t, p, v, r) {
      // 낮은 웅 (기음 + 2배음, 저역 통과가 열리며 커짐)
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8;
      lp.frequency.setValueAtTime(180, t); lp.frequency.exponentialRampToValueAtTime(900, t + 0.35); lp.frequency.exponentialRampToValueAtTime(300, t + 0.75);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28 * v, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      lp.connect(g).connect(out);
      [[62, 'sine', 1], [124, 'triangle', 0.5], [186.5, 'sine', 0.25]].forEach(([f, ty, a]) => {
        const o = ctx.createOscillator(), og = ctx.createGain(); o.type = ty; og.gain.value = a;
        o.frequency.setValueAtTime(f * 0.8 * p, t); o.frequency.exponentialRampToValueAtTime(f * p, t + 0.25);
        o.connect(og).connect(lp); o.start(t); o.stop(t + 0.8);
      });
      noise(ctx, out, t, { type: 'bandpass', f: 600, f2: 5000, q: 0.9, peak: 0.05 * v, atk: 0.2, dec: 0.25, off: r() });
      // 반짝 (올라가는 높은 음 4개)
      [2637, 3136, 3951, 5274].forEach((f, i) => tone(ctx, out, t + 0.22 + i * 0.045, { f: f * p, peak: 0.028 * v, atk: 0.004, dec: 0.22 - i * 0.03 }));
    },
    close(ctx, out, t, p, v, r) {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sine'; o2.type = 'triangle';
      o.frequency.setValueAtTime(120 * p, t); o.frequency.exponentialRampToValueAtTime(42 * p, t + 0.42);
      o2.frequency.setValueAtTime(240 * p, t); o2.frequency.exponentialRampToValueAtTime(80 * p, t + 0.42);
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(1200, t); lp.frequency.exponentialRampToValueAtTime(150, t + 0.45);
      g.gain.setValueAtTime(0.24 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
      o.connect(lp); o2.connect(lp); lp.connect(g).connect(out);
      o.start(t); o2.start(t); o.stop(t + 0.5); o2.stop(t + 0.5);
      [3951, 3136, 2349].forEach((f, i) => tone(ctx, out, t + i * 0.04, { f: f * p, peak: 0.022 * v, dec: 0.12 }));
      noise(ctx, out, t + 0.02, { type: 'bandpass', f: 4000, f2: 400, q: 0.8, peak: 0.05 * v, dec: 0.35, off: r() });
    },
    swap(ctx, out, t, p, v, r) {
      noise(ctx, out, t, { type: 'bandpass', f: 7000 * p, f2: 1400 * p, q: 1.2, peak: 0.12 * v, atk: 0.012, dec: 0.15, off: r() });
      [1568, 2093, 1760, 2637].forEach((f, i) => tone(ctx, out, t + 0.02 + i * 0.03, { f: f * p, type: 'square', peak: 0.008 * v, dec: 0.02 }));
    },
    back(ctx, out, t, p, v) {
      tone(ctx, out, t, { f: 1397 * p, peak: 0.06 * v, atk: 0.003, dec: 0.07 });
      tone(ctx, out, t + 0.075, { f: 932 * p, peak: 0.06 * v, atk: 0.003, dec: 0.12 });
      tone(ctx, out, t + 0.075, { f: 466 * p, type: 'triangle', peak: 0.04 * v, atk: 0.003, dec: 0.1 });
    },
  };

  /* 믹스: 소리별 음량 → 묶음 압축 → 전체 음량(낮게) */
  const LEVEL = { clack: 1.0, release: 0.8, clackA: 1.0, clackB: 1.0, clackC: 1.0, releaseA: 0.8, releaseB: 0.8, releaseC: 0.8, tick: 0.7, open: 0.85, close: 0.8, swap: 0.7, back: 0.8 };
  const MASTER = 0.5;
  function bus(ctx) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.002; comp.release.value = 0.12;
    const g = ctx.createGain(); g.gain.value = MASTER;
    comp.connect(g).connect(ctx.destination);
    return comp;
  }
  function synth(ctx, out, name, t, r) {
    const p = 1 + (r() - 0.5) * 0.08, v = 0.9 + r() * 0.2; // 높이 ±4%, 세기 ±10%
    const g = ctx.createGain(); g.gain.value = LEVEL[name]; g.connect(out);
    SYN[name](ctx, g, t, p, v, r);
  }

  /* ---------- 실시간 ---------- */
  let ctx = null, out = null, muted = false;
  try { muted = localStorage.getItem('lb018-mute') === '1'; } catch (e) { /* file:// */ }
  const listeners = [];
  function unlock() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); out = bus(ctx); }
    if (ctx.state === 'suspended') ctx.resume();
  }
  function play(name) {
    if (muted || !ctx || ctx.state !== 'running' || !SYN[name]) return;
    synth(ctx, out, name, ctx.currentTime + 0.005, Math.random);
  }
  function setMuted(m) { muted = m; try { localStorage.setItem('lb018-mute', m ? '1' : '0'); } catch (e) { /* */ } listeners.forEach((f) => f(m)); }
  // 브라우저 자동재생 규칙: 첫 사용자 입력(마우스·터치·키) 때 켬
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, unlock, { capture: true, passive: true }));

  /* ---------- 파일 굽기 (OfflineAudioContext → 16bit WAV, base64) ---------- */
  async function renderWav(names, gap = 0.45, rate = 48000, seed = 18) {
    const times = []; let T = 0.1;
    names.forEach((n) => { times.push(T); T += LEN[n] + gap; });
    const oc = new OfflineAudioContext(1, Math.ceil((T - gap + 0.1) * rate), rate);
    const o = bus(oc), r = rng(seed);
    names.forEach((n, i) => synth(oc, o, n, times[i], r));
    const buf = await oc.startRendering(), d = buf.getChannelData(0);
    const ab = new ArrayBuffer(44 + d.length * 2), dv = new DataView(ab);
    const w = (o2, s) => [...s].forEach((c, i) => dv.setUint8(o2 + i, c.charCodeAt(0)));
    w(0, 'RIFF'); dv.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, rate, true);
    dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, d.length * 2, true);
    let peak = 0;
    for (let i = 0; i < d.length; i++) { const s = Math.max(-1, Math.min(1, d[i])); peak = Math.max(peak, Math.abs(s)); dv.setInt16(44 + i * 2, s * 32767, true); }
    let bin = ''; const u8 = new Uint8Array(ab);
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { b64: btoa(bin), times, peak, seconds: d.length / rate };
  }

  window.LBSFX = { play, unlock, setMuted, get muted() { return muted; }, get state() { return ctx ? ctx.state : 'none'; }, onMute: (f) => listeners.push(f), renderWav, LEN, names: Object.keys(SYN), get clack() { return clackSel; } };
})();
