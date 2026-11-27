/* UIDiorama 008 — 홀로그램 메뉴 동작
   주소 옵션 (렌더·캡처용):
     ?theme=m1|m2|m3   시안 색        ?clean=1   시안 전환 막대 숨김
     ?still=1          쉬는 움직임·시차 끔 (정지 캡처)
     ?freeze=ms        여는 동작을 ms 지점에 멈춤     ?closeAt=ms  닫는 동작을 ms 지점에 멈춤
     ?closed=1         닫힌 상태로 시작
     ?sel=i  ?hover=i  ?press=i   메뉴 블록 상태 강제 (0부터)
     ?mx=-1..1&my=-1..1  마우스 위치 흉내 (기울기 확인)
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
    { id: 'squad', no: '01', ko: '원정대', code: 'SQUAD', wv: '4/4', wc: '대원', scode: 'SQUAD // 대원 4 · 다운 0' },
    { id: 'inv', no: '02', ko: '인벤토리', code: 'INVENTORY', wv: '7/12', wc: '짐 무게', scode: 'INVENTORY // 짐 가방 7/12' },
    { id: 'map', no: '03', ko: '지도', code: 'MAP', wv: '3/5', wc: '현재 방', scode: 'MAP // 감염 구역 · 심도 11' },
    { id: 'log', no: '04', ko: '기록', code: 'LOG', wv: '18', wc: '새 기록 2', scode: 'LOG // 원정 기록 18건' },
    { id: 'cfg', no: '05', ko: '설정', code: 'CONFIG', wv: 'SYS', wc: '화면·소리', scode: 'CONFIG // 단말 설정' },
    { id: 'save', no: '06', ko: '저장·나가기', code: 'SAVE / EXIT', wv: '13:12', wc: '마지막 저장', scode: 'SAVE // 착륙지 저장만 가능' },
  ];
  const AX = [26, 12, 3, 0, 8, 22]; // 링을 따라 휘는 배치
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
      return `<div class="mapv"><svg viewBox="0 0 660 300">
        <path class="ln" d="M60 220 L200 150 L350 170"/><path class="ln d" d="M350 170 L500 90 L620 160 M350 170 L500 240 L620 160"/>
        <circle class="pulse" cx="350" cy="170" r="16"/>
        <circle class="nd" cx="60" cy="220" r="14"/><circle class="nd" cx="200" cy="150" r="14"/><circle class="nd cur" cx="350" cy="170" r="16"/>
        <circle class="nd unk" cx="500" cy="90" r="14"/><circle class="nd unk" cx="500" cy="240" r="14"/><circle class="nd unk" cx="620" cy="160" r="14"/>
        <text x="60" y="256" text-anchor="middle">방 1 착륙지</text><text class="c" x="60" y="272" text-anchor="middle">저장 지점</text>
        <text x="200" y="128" text-anchor="middle">방 2 전투</text><text class="c" x="200" y="114" text-anchor="middle">정리됨</text>
        <text x="350" y="208" text-anchor="middle">방 3 전투 방</text><text class="c" x="350" y="224" text-anchor="middle">현재 위치</text>
        <text x="500" y="66" text-anchor="middle">방 4 ?</text><text x="500" y="276" text-anchor="middle">방 4 ?</text><text x="620" y="196" text-anchor="middle">방 5 ?</text>
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
      return `<div class="opt"><span>형광색</span><span class="seg"><span class="on">앰버</span><span>초록</span></span></div>
        <div class="opt"><span>화면 흔들림</span><span class="seg"><span class="on">켜짐</span><span>꺼짐</span></span></div>
        <div class="opt"><span>효과음</span><span class="slider"><span class="bar"><i style="width:70%"></i><b style="left:70%"></b></span>70</span></div>
        <div class="opt"><span>배경음</span><span class="slider"><span class="bar"><i style="width:45%"></i><b style="left:45%"></b></span>45</span></div>
        <div class="opt"><span>자막 크기</span><span class="seg"><span>작게</span><span class="on">보통</span><span>크게</span></span></div>`;
    },
    save() {
      return `<div class="save"><p>저장은 수송선 착륙지에서만 됩니다. 지금 나가면 마지막 저장 지점부터 다시 시작합니다.</p>
        <div class="slotcard"><b>방 1 착륙지</b><span>감염 구역 · 심도 11 · 제12일</span><time>13:12</time></div>
        <div class="acts"><span>원정으로 돌아가기</span><span class="warn">타이틀로 나가기</span></div></div>`;
    },
  };

  /* ---------- 만들기 ---------- */
  const nav = $('#nav');
  const navInner = document.createElement('div');
  navInner.id = 'navInner';
  nav.appendChild(navInner);
  MENU.forEach((m, i) => {
    const w = document.createElement('div');
    w.className = 'nv';
    w.innerHTML = `<button class="blk pb" data-i="${i}" data-panel="nav-${m.id}" style="--ax:${AX[i]}px" tabindex="-1">
      <span class="face">
        <span class="b-col"><span class="b-no">${m.no}</span><span class="b-ic"><svg viewBox="0 0 24 24">${ICON[m.id]}</svg></span></span>
        <span class="b-lb"><b>${m.ko}</b><small>${m.code}</small></span>
        <span class="b-win"><span class="wv">${m.wv}</span><span class="wc"><span>${m.wc}</span></span><span class="scan"></span></span>
        <span class="b-led"></span>
      </span><span class="wire"></span></button>`;
    navInner.appendChild(w);
  });
  const blks = $$('.blk');

  const side = $('#side');
  const sideInner = document.createElement('div');
  sideInner.id = 'sideInner';
  $$('.sblk', side).forEach((s, i) => { s.style.marginRight = [18, 6, 0, 10][i] + 'px'; sideInner.appendChild(s); });
  side.appendChild(sideInner);

  // 심도 눈금
  const dg = $('#dgScale');
  for (let v = 0; v <= 32; v++) {
    const t = document.createElement('i');
    const long = v % 5 === 0;
    t.className = long ? 'l' : '';
    t.style.top = (v / 32) * 400 + 'px';
    t.style.width = long ? '16px' : '8px';
    dg.appendChild(t);
    if (long) { const s = document.createElement('span'); s.textContent = String(v).padStart(2, '0'); s.style.top = (v / 32) * 400 + 'px'; dg.appendChild(s); }
  }
  // 링 눈금
  const ticks = $('#ticks');
  const NS = 'http://www.w3.org/2000/svg';
  for (let k = 0; k < 180; k++) {
    const a = (k / 180) * Math.PI * 2;
    const long = k % 10 === 0;
    const r1 = 404, r2 = long ? 390 : 398;
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 450 + Math.cos(a) * r1); l.setAttribute('y1', 450 + Math.sin(a) * r1);
    l.setAttribute('x2', 450 + Math.cos(a) * r2); l.setAttribute('y2', 450 + Math.sin(a) * r2);
    l.setAttribute('class', long ? 'tick l' : 'tick');
    ticks.appendChild(l);
  }

  /* ---------- 화면 맞춤 ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
    stage._s = s;
  }
  addEventListener('resize', fit); fit();

  /* ---------- 시안 색 ---------- */
  function setTheme(t, flick) {
    document.body.classList.remove('theme-m1', 'theme-m2', 'theme-m3');
    document.body.classList.add('theme-' + t);
    $$('#tweaks [data-theme]').forEach((b) => b.classList.toggle('on', b.dataset.theme === t));
    try { localStorage.setItem('lb008-theme', t); } catch (e) { /* file:// */ }
    if (flick && motion) $('#screen').animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }, { opacity: .7 }, { opacity: 1 }], { duration: 280, easing: 'steps(4)' });
  }
  let theme = Q.get('theme');
  if (!theme) { try { theme = localStorage.getItem('lb008-theme'); } catch (e) { /* */ } }
  setTheme(theme || 'm1', false);
  if (Q.get('clean') === '1') document.body.classList.add('clean');
  if (STILL) document.body.classList.add('still');
  $$('#tweaks [data-theme]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.theme, true)));
  const twMotion = $('#twMotion');
  const syncMotionBtn = () => twMotion.classList.toggle('on', motion);
  twMotion.addEventListener('click', () => { motion = !motion; syncMotionBtn(); });
  syncMotionBtn();

  /* ---------- 홀로그램 화면 내용 ---------- */
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
      $('#sweep').animate([{ top: '0px', opacity: 1 }, { top: '454px', opacity: .2 }], { duration: 360, easing: 'cubic-bezier(.4,0,.2,1)' });
    }
  }
  function setActive(i, animate) {
    active = i;
    blks.forEach((b, k) => b.classList.toggle('active', k === i));
    showScreen(i, animate);
  }
  setActive(active, false);

  /* ---------- 등장 / 닫힘 (Web Animations, 시간 지점 멈춤 가능) ---------- */
  const OUT = 'cubic-bezier(.16,1,.3,1)';
  function timeline() {
    const T = [];
    const add = (el, kf, delay, dur, easing) => T.push({ el, kf, delay, dur, easing: easing || 'linear' });
    add($('#bg'), [{ filter: 'blur(0px) brightness(1) saturate(1)', transform: 'scale(1)' }, { filter: 'blur(3.2px) brightness(.58) saturate(.72)', transform: 'scale(1.018)' }], 0, 420, OUT);
    add($('#shade'), [{ opacity: 0 }, { opacity: 1 }], 0, 420, 'ease-out');
    add($('#grain'), [{ opacity: 0 }, { opacity: 0.07 }], 100, 400, 'ease-out');
    add($('#ring'), [{ opacity: 0, transform: 'scale(.86) rotate(-32deg)' }, { opacity: 1, offset: .35 }, { opacity: 1, transform: 'scale(1) rotate(0deg)' }], 140, 900, OUT);
    add($('#depthGauge'), [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], 620, 420, OUT);
    add($('#titlePlate'), [{ transform: 'translateY(-150px)', opacity: 0 }, { opacity: 1, offset: .3 }, { transform: 'translateY(9px)', offset: .62 }, { transform: 'translateY(-2px)', offset: .82 }, { transform: 'none', opacity: 1 }], 60, 560, 'cubic-bezier(.3,.6,.4,1)');
    $$('.nv').forEach((el, i) => add(el, [
      { transform: 'translateX(-260px)', opacity: 0 }, { opacity: 1, offset: .28 },
      { transform: 'translateX(16px)', offset: .6 }, { transform: 'translateX(-4px)', offset: .8 }, { transform: 'translateX(1px)', offset: .92 }, { transform: 'none', opacity: 1 }],
    170 + i * 62, 580, 'cubic-bezier(.3,.6,.4,1)'));
    $$('.sblk').forEach((el, i) => add(el, [
      { transform: 'translateX(240px)', opacity: 0 }, { opacity: 1, offset: .28 },
      { transform: 'translateX(-14px)', offset: .6 }, { transform: 'translateX(4px)', offset: .8 }, { transform: 'none', opacity: 1 }],
    300 + i * 62, 560, 'cubic-bezier(.3,.6,.4,1)'));
    add($('#bottomBar'), [{ transform: 'translateY(120px)', opacity: 0 }, { opacity: 1, offset: .3 }, { transform: 'translateY(-8px)', offset: .62 }, { transform: 'translateY(2px)', offset: .82 }, { transform: 'none', opacity: 1 }], 380, 540, 'cubic-bezier(.3,.6,.4,1)');
    add($('#closeBtn'), [{ transform: 'translateY(120px)', opacity: 0 }, { opacity: 1, offset: .3 }, { transform: 'translateY(-8px)', offset: .62 }, { transform: 'none', opacity: 1 }], 460, 520, 'cubic-bezier(.3,.6,.4,1)');
    // 홀로그램 화면: 가는 선 → 펼침 → 깜빡임
    add($('#screen'), [
      { opacity: 0, transform: 'scale(.35, .004)' }, { opacity: 1, transform: 'scale(1, .004)', offset: .32 },
      { opacity: .9, transform: 'scale(1, 1.03)', offset: .58 }, { opacity: .35, transform: 'scale(1, 1)', offset: .66 },
      { opacity: 1, offset: .72 }, { opacity: .6, offset: .8 }, { opacity: 1, transform: 'scale(1, 1)' }], 440, 620, 'linear');
    [$('.scr-head'), $('#scrBody'), $('.scr-foot')].forEach((el, i) =>
      add(el, [{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)' }], 860 + i * 70, 320, 'steps(8, end)'));
    add($('#sweep'), [{ top: '0px', opacity: 0 }, { opacity: 1, offset: .1 }, { top: '454px', opacity: .15 }], 820, 460, 'cubic-bezier(.4,0,.2,1)');
    return T;
  }
  const OPEN_END = 1400;
  let anims = [];
  let isOpen = false, busy = false;
  const menuEl = $('#menu');

  function clearAnims() { anims.forEach((a) => a.cancel()); anims = []; }

  function open(freezeAt) {
    if (isOpen && freezeAt == null) return;
    clearAnims();
    isOpen = true; busy = true;
    menuEl.classList.add('on'); menuEl.setAttribute('aria-hidden', 'false');
    $('#openBtn').classList.add('hide');
    const fast = !motion && freezeAt == null;
    anims = timeline().map((t) => t.el.animate(t.kf, { delay: fast ? 0 : t.delay, duration: fast ? 160 : t.dur, easing: fast ? 'linear' : t.easing, fill: 'both' }));
    if (freezeAt != null) { anims.forEach((a) => { a.pause(); a.currentTime = freezeAt; }); busy = false; return; }
    Promise.all(anims.map((a) => a.finished)).then(() => {
      busy = false;
      // 끝 상태를 남겨 두는 것만 유지 (배경 흐림·그늘)
      anims.forEach((a) => { if (!['bg', 'shade', 'grain'].includes(a.effect.target.id)) a.cancel(); });
      anims = anims.filter((a) => a.playState !== 'idle');
      focusIdx = active; setHot(active, false);
      guardCheck();
    }).catch(() => {});
  }

  function close(freezeAt) {
    if (!isOpen && freezeAt == null) return;
    clearAnims();
    busy = true;
    const T = timeline();
    const total = Math.max(...T.map((t) => t.delay + t.dur));
    const fast = !motion && freezeAt == null;
    anims = T.map((t) => t.el.animate(t.kf, {
      delay: fast ? 0 : (total - t.delay - t.dur) * 0.45, duration: fast ? 140 : t.dur * 0.62,
      easing: fast ? 'linear' : t.easing, direction: 'reverse', fill: 'both' }));
    if (freezeAt != null) { anims.forEach((a) => { a.pause(); a.currentTime = freezeAt; }); busy = false; return; }
    Promise.all(anims.map((a) => a.finished)).then(() => {
      isOpen = false; busy = false;
      menuEl.classList.remove('on'); menuEl.setAttribute('aria-hidden', 'true');
      $('#openBtn').classList.remove('hide');
      clearAnims();
      blks.forEach((b) => b.classList.remove('hot', 'pressed'));
    }).catch(() => {});
  }
  const toggle = () => { if (busy) return; isOpen ? close() : open(); };

  /* ---------- 버튼 눌림·되튐 ---------- */
  let focusIdx = active;
  function setHot(i, fromKey) {
    blks.forEach((b, k) => { if (k !== i) b.classList.remove('hot'); });
    const b = blks[i];
    if (!b) return;
    if (!b.classList.contains('hot')) { b.classList.add('hot'); }
    else if (fromKey) { b.classList.remove('hot'); void b.offsetWidth; b.classList.add('hot'); }
    focusIdx = i;
  }
  function thunk() { // 눌림이 판 전체에 전달되는 미세한 떨림
    if (!motion) return;
    $('#L-front').animate([{ translate: '0 0' }, { translate: '0 2px' }, { translate: '0 0' }], { duration: 160, easing: 'ease-out', composite: 'add' });
    $('#L-screen').animate([{ translate: '0 0' }, { translate: '0 1px' }, { translate: '0 0' }], { duration: 200, delay: 30, easing: 'ease-out', composite: 'add' });
  }
  function bindPress(el, onRelease) {
    el.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; el.classList.add('pressed'); el.setPointerCapture(e.pointerId); thunk(); });
    el.addEventListener('pointerup', (e) => {
      if (!el.classList.contains('pressed')) return;
      el.classList.remove('pressed');
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && onRelease) onRelease();
    });
    el.addEventListener('pointercancel', () => el.classList.remove('pressed'));
  }
  blks.forEach((b, i) => {
    b.addEventListener('pointerenter', () => setHot(i, false));
    bindPress(b, () => setActive(i, true));
  });
  $('#nav').addEventListener('pointerleave', () => setHot(active, false));
  $$('.sblk').forEach((s) => bindPress(s));
  bindPress($('#closeBtn'), () => { if (!busy) close(); });
  bindPress($('#openBtn'), () => { if (!busy) open(); });
  bindPress($('#titlePlate'));

  function keyPress(i) {
    const b = blks[i];
    b.classList.add('pressed'); thunk();
    setTimeout(() => { b.classList.remove('pressed'); setActive(i, true); }, 120);
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); toggle(); return; }
    if (e.key === '1' || e.key === '2' || e.key === '3') { setTheme('m' + e.key, true); return; }
    if (!isOpen || busy) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHot((focusIdx + 1) % 6, true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHot((focusIdx + 5) % 6, true); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) keyPress(focusIdx); }
  });

  /* ---------- 살아 있는 움직임: 시차 + 떠 있음 + 노이즈 ---------- */
  const layers = $$('.layer').map((el) => ({ el, d: parseFloat(el.dataset.depth) }));
  const tgt = { x: num('mx', 0), y: num('my', 0) }, cur = { x: tgt.x, y: tgt.y };
  addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    tgt.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    tgt.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
  });
  document.addEventListener('pointerleave', () => { tgt.x = 0; tgt.y = 0; });
  const bgEl = $('#bg');
  function applyLayers(t) {
    const idle = motion ? 1 : 0;
    const mx = (motion || Q.has('mx')) ? cur.x : 0, my = (motion || Q.has('my')) ? cur.y : 0;
    layers.forEach(({ el, d }, k) => {
      const ix = Math.sin(t * 0.00041 + k * 1.7) * 2.4 * d * idle;
      const iy = Math.cos(t * 0.00033 + k * 2.3) * 1.8 * d * idle;
      const tx = -mx * d * 18 + ix, ty = -my * d * 11 + iy;
      el.style.transform = `perspective(1900px) translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotateX(${(-my * d * 1.6).toFixed(3)}deg) rotateY(${(mx * d * 2.4).toFixed(3)}deg)`;
    });
    bgEl.style.translate = `${(mx * 7).toFixed(2)}px ${(my * 5).toFixed(2)}px`;
  }
  const grain = $('#grain'), gx = grain.getContext('2d');
  const gimg = gx.createImageData(960, 540);
  function drawGrain() {
    const d = gimg.data;
    for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    gx.putImageData(gimg, 0, 0);
  }
  drawGrain();
  let lastGrain = 0;
  function loop(t) {
    cur.x += (tgt.x - cur.x) * 0.06; cur.y += (tgt.y - cur.y) * 0.06;
    applyLayers(t);
    if (motion && t - lastGrain > 90) { drawGrain(); lastGrain = t; }
    requestAnimationFrame(loop);
  }
  applyLayers(0);
  if (!STILL) requestAnimationFrame(loop);

  /* ---------- 인물 얼굴 가림 검사 (BG_combat_R45L 기준 얼굴 상자 + 여유 12px) ---------- */
  const FACES = [
    { n: '토파즈', x: 440, y: 538, w: 82, h: 74 }, { n: '오팔', x: 408, y: 628, w: 84, h: 79 },
    { n: '네모필라', x: 623, y: 608, w: 69, h: 104 }, { n: '오이라', x: 833, y: 656, w: 79, h: 86 },
  ];
  function guardCheck() {
    const s = stage._s || 1, o = stage.getBoundingClientRect();
    const hits = [];
    $$('[data-panel]').forEach((p) => {
      const r = p.getBoundingClientRect();
      const R = { x: (r.left - o.left) / s, y: (r.top - o.top) / s, w: r.width / s, h: r.height / s };
      FACES.forEach((f) => {
        const ix = Math.min(R.x + R.w, f.x + f.w) - Math.max(R.x, f.x), iy = Math.min(R.y + R.h, f.y + f.h) - Math.max(R.y, f.y);
        if (ix > 0 && iy > 0) hits.push(`${p.dataset.panel}×${f.n}(${Math.round(ix)}x${Math.round(iy)})`);
      });
    });
    const out = $('#check');
    out.textContent = hits.length ? 'CHECK HIT ' + hits.join(', ') : 'CHECK OK';
    if (Q.get('guard') === '1') FACES.forEach((f) => { const g = document.createElement('div'); g.className = 'guard'; Object.assign(g.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' }); stage.appendChild(g); });
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
    if (hv >= 0 || pr >= 0) { focusIdx = hv >= 0 ? hv : pr; Q.set('lockState', '1'); }
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  // 상태 강제 시 open 끝의 setHot이 덮어쓰지 않게
  const _setHot = setHot;
  setHot = function (i, k) { if (Q.get('lockState') === '1') return; _setHot(i, k); };
})();
