/* UIDiorama 009 — 포터블 콘솔 화면 동작
   주소 옵션 (렌더·캡처용):
     ?theme=k1|k2|k3   내부 강조색          ?clean=1   구석 조작판 숨김
     ?still=1          쉬는 움직임·시차 끔 (정지 캡처)
     ?freeze=ms        여는 동작을 ms 지점에 멈춤     ?closeAt=ms  닫는 동작을 ms 지점에 멈춤
     ?closed=1         닫힌 상태로 시작
     ?sel=i  ?hover=i  ?press=i   메뉴 키 상태 강제 (0부터)
     ?mx=-1..1&my=-1..1  마우스 위치 흉내       ?bob=0..1  떠 있음 흔들림 위상 흉내
     ?guard=1          인물 얼굴 상자 표시                                      */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search);
  const num = (k, d) => (Q.has(k) ? parseFloat(Q.get(k)) : d);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STILL = Q.get('still') === '1';
  let motion = !reduce && !STILL;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const stage = $('#stage');

  /* ---------- 데이터 (보기용 임시 값, 능력치는 LBCombatGameMode.cpp 프로토타입 값) ---------- */
  const ICON = {
    squad: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.6c2.9.2 5.5 2.3 5.5 5.4"/>',
    inv: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M9 12h6"/>',
    map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v14l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v14M15 6.5v14"/>',
    log: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3"/><path d="M9 11h6M9 14.5h6M9 18h3.5"/>',
    cfg: '<path d="M4 7h9M18 7h2M4 17h3M11 17h9"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
    save: '<path d="M13 4h6v16h-6"/><path d="M9.5 8l-4 4 4 4M5.5 12H16"/>',
  };
  const MENU = [
    { id: 'squad', no: '01', ko: '원정대', code: 'SQUAD', wv: '4/4', wc: '대원', scode: 'SQUAD · 대원 4' },
    { id: 'inv', no: '02', ko: '인벤토리', code: 'INVENTORY', wv: '7/12', wc: '짐 무게', scode: 'INVENTORY · 7/12' },
    { id: 'map', no: '03', ko: '지도', code: 'MAP', wv: '3/5', wc: '현재 방', scode: 'MAP · 심도 11' },
    { id: 'log', no: '04', ko: '기록', code: 'LOG', wv: '18', wc: '새 기록 2', scode: 'LOG · 18건' },
    { id: 'cfg', no: '05', ko: '설정', code: 'CONFIG', wv: 'SYS', wc: '화면·소리', scode: 'CONFIG' },
    { id: 'save', no: '06', ko: '저장·나가기', code: 'SAVE / EXIT', wv: '13:12', wc: '마지막 저장', scode: 'SAVE · 착륙지에서만' },
  ];
  const SQUAD = [
    { n: '토파즈', k: '토', r: '약화·강화 술사', hp: 9, max: 11, acc: 4, agi: 3, tgh: 3 },
    { n: '오팔', k: '오', r: '주 공격 술사', hp: 4, max: 8, acc: 5, agi: 4, tgh: 2 },
    { n: '네모필라', k: '네', r: '은신·치명', hp: 9, max: 9, acc: 5, agi: 6, tgh: 2 },
    { n: '오이라', k: '이', r: '동행', hp: 4, max: 4, acc: 2, agi: 3, tgh: 2 },
  ];
  const ITEMS = [
    ['치료 앰플', 2], ['응급 처치 키트', 1], ['수류탄', 3], ['탄약 묶음', 4], ['유물 파편', 1],
    ['야영 키트', 1], ['지형 안정화 장치(+1)', 1], ['옛 과자 봉지', 2], ['고용주의 짐 꾸러미', 1, '의뢰'],
  ];

  const SCREENS = {
    squad() {
      const rows = SQUAD.map((m) => {
        const low = m.hp / m.max <= 0.5;
        const cells = Array.from({ length: m.max }, (_, i) => `<i class="${i < m.hp ? (low ? 'on low' : 'on') : ''}"></i>`).join('');
        return `<div class="sq-row sq-grid">
          <div class="sq-who"><span class="port">${m.k}</span><div><div class="sq-name">${m.n}</div><div class="sq-role">${m.r}</div></div></div>
          <div class="hp"><span class="hp-cells">${cells}</span><b>${m.hp}<small>/${m.max}</small></b></div>
          <div class="st">${m.acc}</div><div class="st">${m.agi}</div><div class="st">${m.tgh}</div></div>`;
      }).join('');
      return `<div class="hdr sq-grid"><span>대원</span><span>체력</span><span style="text-align:center">명중</span><span style="text-align:center">민첩</span><span style="text-align:center">견고함</span></div>${rows}`;
    },
    inv() {
      const slots = Array.from({ length: 15 }, (_, i) => {
        const it = ITEMS[i];
        if (!it) return '<div class="slot empty"></div>';
        return `<div class="slot"><b>${it[0]}</b>${it[2] ? `<em>${it[2]}</em>` : ''}<span>×${it[1]}</span></div>`;
      }).join('');
      return `<div class="inv">${slots}</div><div class="weight"><span>짐 가방</span><span class="bar"><i style="width:58%"></i></span><span>7 / 12</span></div>`;
    },
    map() {
      return `<div class="mapv"><svg viewBox="0 0 660 320">
        <path class="ln" d="M60 230 L200 160 L350 180"/><path class="ln d" d="M350 180 L500 100 L620 170 M350 180 L500 250 L620 170"/>
        <circle class="pulse" cx="350" cy="180" r="16"/>
        <circle class="nd" cx="60" cy="230" r="14"/><circle class="nd" cx="200" cy="160" r="14"/><circle class="nd cur" cx="350" cy="180" r="16"/>
        <circle class="nd unk" cx="500" cy="100" r="14"/><circle class="nd unk" cx="500" cy="250" r="14"/><circle class="nd unk" cx="620" cy="170" r="14"/>
        <text x="60" y="266" text-anchor="middle">방 1 착륙지</text><text class="c" x="60" y="283" text-anchor="middle">저장 지점</text>
        <text x="200" y="138" text-anchor="middle">방 2 전투</text><text class="c" x="200" y="122" text-anchor="middle">정리됨</text>
        <text x="350" y="218" text-anchor="middle">방 3 전투 방</text><text class="c" x="350" y="235" text-anchor="middle">현재 위치</text>
        <text x="500" y="76" text-anchor="middle">방 4 ?</text><text x="500" y="286" text-anchor="middle">방 4 ?</text><text x="620" y="206" text-anchor="middle">방 5 ?</text>
      </svg></div>`;
    },
    log() {
      const L = [
        ['14:32', '방 3 진입', '굴두더지 4 확인. 전투 시작', 1], ['14:31', '네모필라', '은신 준비', 1],
        ['14:05', '방 2', '갈고리 짐승 2 처치', 0], ['13:58', '오팔', '체력 −4', 0],
        ['13:40', '방 2 진입', '전투 방', 0], ['13:12', '착륙지', '저장 완료', 0],
      ];
      return `<ul class="log">${L.map((l) => `<li class="${l[3] ? 'new' : ''}"><time>${l[0]}</time><em>${l[1]}</em><span>${l[2]}</span></li>`).join('')}</ul>`;
    },
    cfg() {
      return `<div class="opt"><span>화면 기울기</span><span class="seg"><span>끔</span><span class="on">보통</span><span>강하게</span></span></div>
        <div class="opt"><span>화면 흔들림</span><span class="seg"><span class="on">켜짐</span><span>꺼짐</span></span></div>
        <div class="opt"><span>효과음</span><span class="slider"><span class="bar"><i style="width:70%"></i><b style="left:70%"></b></span>70</span></div>
        <div class="opt"><span>배경음</span><span class="slider"><span class="bar"><i style="width:45%"></i><b style="left:45%"></b></span>45</span></div>
        <div class="opt"><span>자막 크기</span><span class="seg"><span>작게</span><span class="on">보통</span><span>크게</span></span></div>`;
    },
    save() {
      return `<div class="save"><p>저장은 수송선 착륙지에서만 됩니다.<br>지금 나가면 마지막 저장 지점부터 다시 시작합니다.</p>
        <div class="slotcard"><b>방 1 착륙지</b><span>감염 구역 · 심도 11 · 제12일</span><time>13:12</time></div>
        <div class="acts"><span>원정으로 돌아가기</span><span class="warn">타이틀로 나가기</span></div></div>`;
    },
  };

  /* ---------- 만들기 ---------- */
  const nav = $('#nav');
  MENU.forEach((m, i) => {
    const w = document.createElement('div');
    w.className = 'nv';
    w.innerHTML = `<button class="blk pb" data-i="${i}" data-panel="nav-${m.id}" tabindex="-1">
      <span class="sock"></span><span class="edge"></span>
      <span class="face">
        <span class="b-col"><span class="b-no">${m.no}</span><span class="b-ic"><svg viewBox="0 0 24 24">${ICON[m.id]}</svg></span></span>
        <span class="b-lb"><b>${m.ko}</b><small>${m.code}</small></span>
        <span class="b-win"><span class="wv">${m.wv}</span><span class="wc"><span>${m.wc}</span></span><span class="scan"></span></span>
        <span class="b-led"></span>
      </span><span class="wire"></span></button>`;
    nav.appendChild(w);
  });
  const blks = $$('.blk');

  const dg = $('#dgScale');
  for (let v = 0; v <= 32; v++) {
    const t = document.createElement('i');
    const long = v % 5 === 0;
    t.className = long ? 'l' : '';
    t.style.top = (v / 32) * 380 + 'px';
    t.style.width = long ? '14px' : '7px';
    dg.appendChild(t);
    if (long) { const s = document.createElement('span'); s.textContent = String(v).padStart(2, '0'); s.style.top = (v / 32) * 380 + 'px'; dg.appendChild(s); }
  }
  const ticks = $('#ticks');
  const NS = 'http://www.w3.org/2000/svg';
  for (let k = 0; k < 180; k++) {
    const a = (k / 180) * Math.PI * 2;
    const long = k % 10 === 0;
    const r1 = 404, r2 = long ? 388 : 397;
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 450 + Math.cos(a) * r1); l.setAttribute('y1', 450 + Math.sin(a) * r1);
    l.setAttribute('x2', 450 + Math.cos(a) * r2); l.setAttribute('y2', 450 + Math.sin(a) * r2);
    l.setAttribute('class', long ? 'tick l' : 'tick');
    ticks.appendChild(l);
  }

  /* ---------- 화면 맞춤 (좁은 창 = 전체 축소) ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
    stage._s = s;
  }
  addEventListener('resize', fit); fit();

  /* ---------- 강조색 ---------- */
  function setTheme(t, flick) {
    document.body.classList.remove('theme-k1', 'theme-k2', 'theme-k3');
    document.body.classList.add('theme-' + t);
    $$('#pad [data-theme]').forEach((b) => b.classList.toggle('on', b.dataset.theme === t));
    try { localStorage.setItem('lb009-theme', t); } catch (e) { /* file:// */ }
    if (flick && motion && isOpen) $('#L-holo').animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }, { opacity: .7 }, { opacity: 1 }], { duration: 280, easing: 'steps(4)' });
  }
  let isOpen = false, busy = false;
  let theme = Q.get('theme');
  if (!theme) { try { theme = localStorage.getItem('lb009-theme'); } catch (e) { /* */ } }
  if (!/^k[123]$/.test(theme || '')) theme = 'k1';
  setTheme(theme, false);
  if (Q.get('clean') === '1') document.body.classList.add('clean');
  if (STILL) document.body.classList.add('still');

  /* ---------- 화면 내용 ---------- */
  let active = Math.max(0, Math.min(5, num('sel', 0) | 0));
  function showScreen(i, animate) {
    const m = MENU[i];
    $('#scrNo').textContent = m.no;
    $('#scrTitle').textContent = m.ko;
    $('#scrCode').textContent = m.scode;
    const body = $('#scrBody');
    body.innerHTML = SCREENS[m.id]();
    if (animate && motion) {
      body.classList.remove('swap-in'); void body.offsetWidth; body.classList.add('swap-in');
      $('#pSweep').animate([{ top: '0px', opacity: 1 }, { top: '520px', opacity: .2 }], { duration: 360, easing: 'cubic-bezier(.4,0,.2,1)' });
    }
  }
  function setActive(i, animate) {
    active = i;
    blks.forEach((b, k) => b.classList.toggle('active', k === i));
    showScreen(i, animate);
  }
  setActive(active, false);

  /* ---------- 등장 / 닫힘 ----------
     ① 선 그리기 0~620ms: 모서리 꺾쇠가 먼저 켜지고 선이 모서리에서 가운데로 이어짐 (화면은 아래·뒤로 눕힌 자세)
     ② 떠오름 380~1080ms: 기울어진 제자리로 떠오르며 살짝 넘쳤다 되돌아옴, 바닥 투영 빛이 켜짐
     ③ 펼침 640~1150ms: 유리 면이 가운데 선에서 위아래로 펼쳐지고, 층들이 z 깊이로 벌어짐
     ④ 버튼 들어옴 900~1700ms: 키가 앞쪽에서 차례로 꽂혀 철컥, 글자 줄 단위 켜짐, 링 회전 진입      */
  const OUT = 'cubic-bezier(.16,1,.3,1)';
  const SNAP = 'cubic-bezier(.3,.6,.4,1)';
  const OPEN_END = 1700;
  const Z = { 'L-ring': 10, 'L-holo': 22, 'L-keys': 46 };
  function timeline() {
    const T = [];
    const add = (el, kf, delay, dur, easing) => T.push({ el, kf, delay, dur, easing: easing || 'linear' });
    add($('#bg'), [{ filter: 'blur(0px) brightness(1) saturate(1)', transform: 'scale(1)' }, { filter: 'blur(2.4px) brightness(.64) saturate(.8)', transform: 'scale(1.015)' }], 0, 460, OUT);
    add($('#shade'), [{ opacity: 0 }, { opacity: 1 }], 0, 460, 'ease-out');
    add($('#grain'), [{ opacity: 0 }, { opacity: 0.06 }], 100, 400, 'ease-out');
    // ① 선
    $$('#frame .bk').forEach((el, i) => add(el, [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: .4, offset: .5 }, { opacity: 1 }], 40 + i * 30, 220, 'steps(6, end)'));
    $$('#frame .edges .edge, #frame .edges-glow .edge').forEach((el) => add(el, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 160, 460, 'cubic-bezier(.5,0,.2,1)'));
    add($('#frame .marks'), [{ opacity: 0 }, { opacity: 1 }], 520, 160, 'steps(4, end)');
    add($('#frame .flabel'), [{ opacity: 0 }, { opacity: 1 }], 560, 200, 'steps(5, end)');
    add($('#flow'), [{ opacity: 0 }, { opacity: 0.9 }], 640, 300, 'ease-out');
    // ② 떠오름 (#rise: 아래·뒤로 눕힌 자세 → 제자리, 넘쳤다 되돌아옴)
    add($('#rise'), [
      { transform: 'translate3d(0, 120px, -260px) rotateX(24deg) scale(.9)', opacity: 0 },
      { transform: 'translate3d(0, 120px, -260px) rotateX(24deg) scale(.9)', opacity: 1, offset: .12 },
      { transform: 'translate3d(0, 92px, -200px) rotateX(19deg) scale(.92)', offset: .38 },
      { transform: 'translate3d(0, -10px, 12px) rotateX(-1.6deg) scale(1.005)', offset: .78 },
      { transform: 'translate3d(0, 3px, -2px) rotateX(.4deg) scale(1)', offset: .9 },
      { transform: 'none', opacity: 1 }], 0, 1080, 'cubic-bezier(.45,.05,.3,1)');
    add($('#floor'), [{ opacity: 0 }, { opacity: 1 }], 420, 700, 'ease-out');
    // ③ 펼침 (유리 면 + z 깊이)
    add($('#glass'), [
      { clipPath: 'inset(49.6% 0 49.6% 0 round 20px)', opacity: 0 }, { clipPath: 'inset(49.6% 0 49.6% 0 round 20px)', opacity: 1, offset: .2 },
      { clipPath: 'inset(0% 0 0% 0 round 20px)', opacity: .9, offset: .62 }, { opacity: .4, offset: .7 },
      { opacity: 1, offset: .78 }, { opacity: .7, offset: .86 }, { clipPath: 'inset(0% 0 0% 0 round 20px)', opacity: 1 }], 640, 520, 'linear');
    add($('#sweep'), [{ top: '375px', opacity: 0 }, { top: '375px', opacity: 1, offset: .1 }, { top: '0px', opacity: .8, offset: .5 }, { top: '750px', opacity: 0 }], 700, 560, 'cubic-bezier(.4,0,.2,1)');
    Object.entries(Z).forEach(([id, z]) => add($('#' + id), [{ translate: '0 0 0px' }, { translate: `0 0 ${z * 1.25}px`, offset: .7 }, { translate: `0 0 ${z}px` }], 760, 560, OUT));
    // ④ 내용·버튼
    add($('#ring'), [{ opacity: 0, transform: 'scale(.82) rotate(-40deg)' }, { opacity: 1, offset: .3 }, { opacity: 1, transform: 'scale(1) rotate(0deg)' }], 820, 880, OUT);
    add($('#depthGauge'), [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], 1100, 420, OUT);
    add($('#titlePlate'), [{ transform: 'translate3d(0,-40px,90px)', opacity: 0 }, { opacity: 1, offset: .3 }, { transform: 'translate3d(0,6px,-8px)', offset: .62 }, { transform: 'translate3d(0,-2px,2px)', offset: .82 }, { transform: 'none', opacity: 1 }], 900, 520, SNAP);
    $$('.nv').forEach((el, i) => add(el, [
      { transform: 'translate3d(120px,0,140px)', opacity: 0 }, { opacity: 1, offset: .28 },
      { transform: 'translate3d(-10px,0,-12px)', offset: .6 }, { transform: 'translate3d(3px,0,3px)', offset: .8 }, { transform: 'translate3d(-1px,0,0)', offset: .92 }, { transform: 'none', opacity: 1 }],
    960 + i * 60, 540, SNAP));
    add($('#closeBtn'), [{ transform: 'translate3d(0,60px,100px)', opacity: 0 }, { opacity: 1, offset: .3 }, { transform: 'translate3d(0,-6px,-6px)', offset: .62 }, { transform: 'none', opacity: 1 }], 1240, 460, SNAP);
    [$('#status'), $('.scr-head'), $('#scrBody'), $('.scr-foot'), $('#hints')].forEach((el, i) =>
      add(el, [{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)' }], 1000 + i * 70, 320, 'steps(8, end)'));
    add($('#panel'), [{ opacity: 0 }, { opacity: 1 }], 980, 200, 'steps(4, end)');
    return T;
  }
  let anims = [];
  const scene = $('#scene3d');
  function clearAnims() { anims.forEach((a) => a.cancel()); anims = []; }
  const KEEP = ['bg', 'shade', 'grain', 'floor'];

  function open(freezeAt) {
    if (isOpen && freezeAt == null) return;
    clearAnims();
    isOpen = true; busy = true;
    scene.classList.add('on'); $('#screen').setAttribute('aria-hidden', 'false');
    $('#openBtn').classList.add('hide'); $('#padMenu').classList.add('on'); $('#padMenu').textContent = '닫기';
    const fast = !motion && freezeAt == null;
    anims = timeline().map((t) => t.el.animate(t.kf, { delay: fast ? 0 : t.delay, duration: fast ? 160 : t.dur, easing: fast ? 'linear' : t.easing, fill: 'both' }));
    if (freezeAt != null) { anims.forEach((a) => { a.pause(); a.currentTime = freezeAt; }); busy = false; return; }
    Promise.all(anims.map((a) => a.finished)).then(() => {
      busy = false;
      anims.forEach((a) => { if (!KEEP.includes(a.effect.target.id)) a.cancel(); });
      anims = anims.filter((a) => a.playState !== 'idle');
      focusIdx = active; setHot(active, false);
      guardCheck();
    }).catch(() => {});
  }
  function close(freezeAt) {
    if (!isOpen && freezeAt == null) return;
    clearAnims();
    busy = true;
    $$('.blk').forEach((b) => b.classList.remove('pressed'));
    const T = timeline();
    const total = Math.max(...T.map((t) => t.delay + t.dur));
    const fast = !motion && freezeAt == null;
    anims = T.map((t) => t.el.animate(t.kf, {
      delay: fast ? 0 : (total - t.delay - t.dur) * 0.5, duration: fast ? 140 : t.dur * 0.6,
      easing: fast ? 'linear' : t.easing, direction: 'reverse', fill: 'both' }));
    if (freezeAt != null) { anims.forEach((a) => { a.pause(); a.currentTime = freezeAt; }); busy = false; return; }
    Promise.all(anims.map((a) => a.finished)).then(() => {
      isOpen = false; busy = false;
      scene.classList.remove('on'); $('#screen').setAttribute('aria-hidden', 'true');
      $('#openBtn').classList.remove('hide'); $('#padMenu').classList.remove('on'); $('#padMenu').textContent = '메뉴';
      clearAnims();
      blks.forEach((b) => b.classList.remove('hot', 'pressed'));
    }).catch(() => {});
  }
  const toggle = () => { if (busy) return; isOpen ? close() : open(); };

  /* ---------- 버튼 눌림·되튐 ---------- */
  let focusIdx = active;
  let lockState = false;
  function setHot(i, fromKey) {
    if (lockState) return;
    blks.forEach((b, k) => { if (k !== i) b.classList.remove('hot'); });
    const b = blks[i];
    if (!b) return;
    if (!b.classList.contains('hot')) b.classList.add('hot');
    else if (fromKey) { b.classList.remove('hot'); void b.offsetWidth; b.classList.add('hot'); }
    focusIdx = i;
  }
  let kick = 0; // 눌림이 떠 있는 화면 전체에 전달되는 미세한 밀림 (rAF에서 감쇠)
  function thunk() { if (motion) kick = 1; }
  function bindPress(el, onRelease) {
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      el.classList.add('pressed'); try { el.setPointerCapture(e.pointerId); } catch (_) { /* */ } thunk();
    });
    el.addEventListener('pointerup', (e) => {
      if (!el.classList.contains('pressed')) return;
      el.classList.remove('pressed');
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && onRelease) onRelease();
    });
    el.addEventListener('pointercancel', () => el.classList.remove('pressed'));
  }
  blks.forEach((b, i) => {
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setHot(i, false); });
    bindPress(b, () => { setHot(i, false); setActive(i, true); });
  });
  nav.addEventListener('pointerleave', () => setHot(active, false));
  bindPress($('#closeBtn'), () => { if (!busy) close(); });
  bindPress($('#titlePlate'));
  $('#openBtn').addEventListener('click', () => { if (!busy) open(); });

  function keyPress(i) {
    const b = blks[i];
    b.classList.add('pressed'); thunk();
    setTimeout(() => { b.classList.remove('pressed'); setActive(i, true); }, 130);
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); toggle(); return; }
    if (e.key === '1' || e.key === '2' || e.key === '3') { setTheme('k' + e.key, true); return; }
    if (!isOpen || busy) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHot((focusIdx + 1) % 6, true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHot((focusIdx + 5) % 6, true); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) keyPress(focusIdx); }
  });

  /* 구석 조작판 (터치) */
  $('#padMenu').addEventListener('click', toggle);
  $$('#pad [data-theme]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.theme, true)));
  const padMotion = $('#padMotion');
  const syncMotionBtn = () => padMotion.classList.toggle('on', motion);
  padMotion.addEventListener('click', () => { motion = !motion; syncMotionBtn(); });
  syncMotionBtn();

  /* ---------- 떠 있음 + 마우스 시차 ----------
     기본 자세는 #screen CSS (rotateY -12°, rotateX 5°, rotateZ -0.8°).
     #float 에 흔들림(위아래 ±5px, 회전 ±0.6°)과 마우스 기울기(Y ±4°, X ±2.5°)를 더한다.
     층마다 z 깊이(0/3/10/22/46px)가 달라 돌아갈 때 실제 시차가 생긴다.                  */
  const floatEl = $('#float'), floorEl = $('#floor'), bgEl = $('#bg');
  const tgt = { x: num('mx', 0), y: num('my', 0) }, cur = { x: tgt.x, y: tgt.y };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    tgt.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    tgt.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
  });
  document.addEventListener('pointerleave', () => { tgt.x = 0; tgt.y = 0; });
  const BOB = Q.has('bob') ? num('bob', 0) * 1e4 : null;
  function applyFloat(t) {
    const idle = motion ? 1 : 0;
    const tt = BOB != null ? BOB : t;
    const by = (Math.sin(tt * 0.00105) * 5) * (motion || BOB != null ? 1 : 0);
    const rx = Math.sin(tt * 0.00077 + 1.1) * 0.6 * (motion || BOB != null ? 1 : 0);
    const ry = Math.cos(tt * 0.00061) * 0.6 * (motion || BOB != null ? 1 : 0);
    const mx = (motion || Q.has('mx')) ? cur.x : 0, my = (motion || Q.has('my')) ? cur.y : 0;
    const k = kick; kick *= 0.86; if (kick < 0.01) kick = 0;
    const kz = -Math.sin((1 - k) * Math.PI) * 6 * (k > 0 ? 1 : 0);
    floatEl.style.transform = `translate3d(${(-mx * 10).toFixed(2)}px, ${(by - my * 6).toFixed(2)}px, ${kz.toFixed(2)}px) rotateY(${(mx * 4 + ry).toFixed(3)}deg) rotateX(${(-my * 2.5 + rx).toFixed(3)}deg)`;
    floorEl.style.transform = `translate(${(-mx * 8).toFixed(2)}px, 0) scaleX(${(1 - by * 0.004).toFixed(4)})`;
    floorEl.style.filter = `brightness(${(1 - by * 0.03).toFixed(3)})`;
    bgEl.style.translate = `${(mx * 7).toFixed(2)}px ${(my * 5).toFixed(2)}px`;
    void idle;
  }
  const grain = $('#grain'), gx = grain.getContext('2d');
  const gimg = gx.createImageData(960, 540);
  function drawGrain() {
    const d = gimg.data;
    for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    gx.putImageData(gimg, 0, 0);
  }
  drawGrain();
  let lastGrain = 0, frames = 0, fpsT = 0;
  window.__fps = 0;
  function loop(t) {
    cur.x += (tgt.x - cur.x) * 0.06; cur.y += (tgt.y - cur.y) * 0.06;
    applyFloat(t);
    if (motion && t - lastGrain > 90) { drawGrain(); lastGrain = t; }
    frames++; if (t - fpsT > 1000) { window.__fps = Math.round(frames * 1000 / (t - fpsT)); frames = 0; fpsT = t; }
    requestAnimationFrame(loop);
  }
  applyFloat(0);
  if (!STILL) requestAnimationFrame(loop);

  /* ---------- 인물 얼굴 가림 검사 (BG_combat_R45L 기준 얼굴 상자) ----------
     불투명 물리 키(data-panel)가 얼굴과 겹치면 HIT, 반투명 글자 판(data-glass)은 참고로 GLASS 표기  */
  const FACES = [
    { n: '토파즈', x: 440, y: 538, w: 82, h: 74 }, { n: '오팔', x: 408, y: 628, w: 84, h: 79 },
    { n: '네모필라', x: 623, y: 608, w: 69, h: 104 }, { n: '오이라', x: 833, y: 656, w: 79, h: 86 },
  ];
  function rectOf(p) {
    const s = stage._s || 1, o = stage.getBoundingClientRect(), r = p.getBoundingClientRect();
    return { x: (r.left - o.left) / s, y: (r.top - o.top) / s, w: r.width / s, h: r.height / s };
  }
  function hitList(sel) {
    const hits = [];
    $$(sel).forEach((p) => {
      const R = rectOf(p);
      FACES.forEach((f) => {
        const ix = Math.min(R.x + R.w, f.x + f.w) - Math.max(R.x, f.x), iy = Math.min(R.y + R.h, f.y + f.h) - Math.max(R.y, f.y);
        if (ix > 0 && iy > 0) hits.push(`${p.dataset.panel || p.dataset.glass}×${f.n}(${Math.round(ix)}x${Math.round(iy)})`);
      });
    });
    return hits;
  }
  function guardCheck() {
    const hard = hitList('[data-panel]'), soft = hitList('[data-glass]:not(#glass)'), glass = hitList('#glass');
    const g = rectOf($('#glass'));
    $('#check').textContent = (hard.length ? 'CHECK HIT ' + hard.join(', ') : 'CHECK OK')
      + ' | HOLO ' + (soft.length ? soft.join(', ') : 'none') + ' | GLASS ' + (glass.length ? glass.join(', ') : 'none')
      + ` | SCREEN ${Math.round(g.x)},${Math.round(g.y)} ${Math.round(g.w)}x${Math.round(g.h)}`
      + ' | KEYS ' + blks.map((b) => { const r = rectOf(b); return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`; }).join(';');
    if (Q.get('guard') === '1') FACES.forEach((f) => { const d = document.createElement('div'); d.className = 'guard'; Object.assign(d.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' }); stage.appendChild(d); });
  }

  /* ---------- 시작 ---------- */
  const start = () => {
    const hv = Q.has('hover') ? num('hover', -1) | 0 : -1;
    const pr = Q.has('press') ? num('press', -1) | 0 : -1;
    if (Q.get('closed') === '1') { guardCheck(); return; }
    if (Q.has('closeAt')) { open(OPEN_END); close(num('closeAt', 0)); return; }
    if (Q.has('freeze')) { open(num('freeze', 0)); guardCheck(); }
    else open();
    if (hv >= 0) { blks.forEach((b) => b.classList.remove('hot')); blks[hv].classList.add('hot'); }
    if (pr >= 0) blks[pr].classList.add('pressed');
    if (hv >= 0 || pr >= 0) { focusIdx = hv >= 0 ? hv : pr; lockState = true; }
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
})();
