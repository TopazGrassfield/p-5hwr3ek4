/* UIDiorama 013 — 012 구조(가운데 화면 + 좌우 버튼 구역) + 011 버튼 디자인 + 복잡한 콘솔 실루엣
   011 js/menu.js 를 복사해 고침 (012 화면 내용·6개 메뉴 반영). 원본 011·012는 읽기만 함.
   주소 옵션 (렌더·캡처용):
     ?theme=k1|k2|k3   강조색                ?clean=1   구석 조작판 숨김
     ?still=1          쉬는 움직임·시차 끔 (정지 캡처)
     ?freeze=ms        여는 동작을 ms 지점에 멈춤     ?closeAt=ms  닫는 동작을 ms 지점에 멈춤
     ?closed=1         닫힌 상태로 시작
     ?sel=m            선택 메뉴(0~9)      ?hover=i  ?press=i   버튼 상태 강제 (0~3 왼쪽 큰 버튼, 4~9 오른쪽 아이콘, 10 대원 카드, 11 돌아가기)
     ?mx=-1..1&my=-1..1  마우스 위치 흉내 (−1 = 왼쪽/위 끝)    ?bob=0..1  떠 있음 흔들림 위상 흉내
     ?guard=1          인물 얼굴 상자 표시                                                   */
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
  const NS = 'http://www.w3.org/2000/svg';
  const f1 = (v) => (+v).toFixed(1);

  /* ---------- 평면 기준 (1640×860) ----------
     왼쪽 구역 0~420 / 가운데 화면 420~1220 / 오른쪽 구역 1220~1640. 중심 (820,430).
     왼쪽 큰 버튼: 중심 (1200,430) 동심원 반지름 880~1100 사이를 4칸으로 자른 휜 판 (화면 쪽으로 오목 = 화면을 감쌈).
     오른쪽 아이콘: 왼쪽 판 안쪽 호를 거울로 뒤집은 호(중심 (440,430) 반지름 880)를 따라 행마다 들쭉날쭉한 2열. */
  const C = { x: 820, y: 430 };
  const SIL = 'M150 40 L560 40 L586 22 L1054 22 L1080 40 L1490 40 C1590 40 1630 100 1632 200 L1636 600 C1640 760 1590 852 1480 852 '
    + 'C1400 852 1350 822 1312 786 C1292 770 1272 768 1240 768 L1080 768 L1064 780 L576 780 L560 768 L400 768 '
    + 'C368 768 348 770 328 786 C290 822 240 852 160 852 C50 852 0 760 4 600 L8 200 C10 100 50 40 150 40 Z';
  const LA = { cx: 1200, cy: 430, r1: 880, r2: 1100 };
  const RA = { cx: 440, cy: 430, r: 880 };

  /* ---------- 아이콘 (SVG 직접, 24 격자) ---------- */
  const ICON = {
    squad: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.6c2.9.2 5.5 2.3 5.5 5.4"/>',
    inv: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M9 12h6"/>',
    map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v14l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v14M15 6.5v14"/>',
    log: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3"/><path d="M9 11h6M9 14.5h6M9 18h3.5"/>',
    quest: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    codex: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/><path d="M6.5 8h2.5M15 8h2.5"/>',
    alert: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 1.5h-15z"/><path d="M10 21h4"/>',
    keys: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.2" r=".9"/><circle cx="17.8" cy="13.6" r=".9"/>',
    cfg: '<path d="M4 7h9M18 7h2M4 17h3M11 17h9"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><path d="M14 15h-6M10.5 12.5L8 15l2.5 2.5"/>',
  };
  /* 012의 6개 메뉴(원정대·인벤토리·지도·기록·설정·저장·나가기) + 011의 아이콘 4개(의뢰·도감·알림·조작) */
  const MENU = [
    { id: 'squad', ko: '원정대', sub: '대원 4/4', code: 'SQUAD · 대원 4' },
    { id: 'inv', ko: '인벤토리', sub: '짐 7/12', code: 'INVENTORY · 7/12' },
    { id: 'map', ko: '지도', sub: '방 3/5', code: 'MAP · 심도 11' },
    { id: 'log', ko: '기록', sub: '새 기록 2', code: 'LOG · 18건' },
    { id: 'quest', ko: '의뢰', code: 'REQUEST · 2건' },
    { id: 'codex', ko: '도감', code: 'CODEX · 3/6' },
    { id: 'alert', ko: '알림', code: 'NOTICE', badge: 3 },
    { id: 'keys', ko: '조작', code: 'CONTROLS' },
    { id: 'cfg', ko: '설정', code: 'CONFIG' },
    { id: 'save', ko: '저장·나가기', code: 'SAVE · 착륙지' },
  ].map((m, i) => Object.assign({ no: String(i + 1).padStart(2, '0') }, m));
  const SQUAD = [
    { n: '토파즈', k: '토', r: '약화·강화 술사', hp: 9, max: 11, acc: 4, agi: 3, tgh: 3, id: 'KG-07-01' },
    { n: '오팔', k: '오', r: '주 공격 술사', hp: 4, max: 8, acc: 5, agi: 4, tgh: 2, id: 'KG-07-02' },
    { n: '네모필라', k: '네', r: '은신·치명', hp: 9, max: 9, acc: 5, agi: 6, tgh: 2, id: 'KG-07-03' },
    { n: '오이라', k: '이', r: '동행', hp: 4, max: 4, acc: 2, agi: 3, tgh: 2, id: 'KG-07-04' },
  ];
  const ITEMS = [
    ['치료 앰플', 2], ['응급 처치 키트', 1], ['수류탄', 3], ['탄약 묶음', 4], ['유물 파편', 1],
    ['야영 키트', 1], ['지형 안정화 장치 +1', 1], ['옛 과자 봉지', 2], ['고용주의 짐', 1, '의뢰'],
  ];

  /* 화면 내용: 012 그대로(원정대·인벤토리·지도·기록·설정·저장) + 011(의뢰·도감·알림·조작)을 넓은 화면에 맞춤 */
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
      const slots = Array.from({ length: 12 }, (_, i) => {
        const it = ITEMS[i];
        if (!it) return '<div class="slot empty"></div>';
        return `<div class="slot"><b>${it[0]}</b>${it[2] ? `<em>${it[2]}</em>` : ''}<span>×${it[1]}</span></div>`;
      }).join('');
      return `<div class="inv">${slots}</div><div class="weight"><span>짐 가방</span><span class="bar"><i style="width:58%"></i></span><span>7 / 12</span></div>`;
    },
    map() {
      return `<div class="mapv"><svg viewBox="0 0 660 340">
        <path class="ln" d="M60 230 L200 160 L350 180"/><path class="ln d" d="M350 180 L500 100 L620 170 M350 180 L500 250 L620 170"/>
        <circle class="pulse" cx="350" cy="180" r="16"/>
        <circle class="nd" cx="60" cy="230" r="14"/><circle class="nd" cx="200" cy="160" r="14"/><circle class="nd cur" cx="350" cy="180" r="16"/>
        <circle class="nd unk" cx="500" cy="100" r="14"/><circle class="nd unk" cx="500" cy="250" r="14"/><circle class="nd unk" cx="620" cy="170" r="14"/>
        <text x="60" y="268" text-anchor="middle">방 1 착륙지</text><text class="c" x="60" y="288" text-anchor="middle">저장 지점</text>
        <text x="200" y="136" text-anchor="middle">방 2 전투</text><text class="c" x="200" y="116" text-anchor="middle">정리됨</text>
        <text x="350" y="220" text-anchor="middle">방 3 전투 방</text><text class="c" x="350" y="240" text-anchor="middle">현재 위치</text>
        <text x="500" y="74" text-anchor="middle">방 4 ?</text><text x="500" y="288" text-anchor="middle">방 4 ?</text><text x="620" y="208" text-anchor="middle">방 5 ?</text>
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
    quest() {
      const L = [['진행', '고용주의 짐 운반', '심도 12 회수 지점까지 · 보상 3금', 1], ['진행', '굴두더지 굴 조사', '방 4 확인 필요', 0], ['완료', '착륙지 확보', '보상 받음', 0]];
      return `<ul class="list">${L.map((l) => `<li class="${l[3] ? 'new' : ''}"><span class="k">${l[0]}</span><span>${l[1]}<em>${l[2]}</em></span></li>`).join('')}</ul>`;
    },
    codex() {
      const L = [['굴두더지', '땅굴 · 무리'], ['갈고리 짐승', '근접 · 빠름'], ['감염 덩굴', '지형'], ['?', '미발견'], ['?', '미발견'], ['?', '미발견']];
      return `<div class="codex">${L.map((l) => `<div class="${l[0] === '?' ? 'unk' : ''}"><b>${l[0]}</b><span>${l[1]}</span></div>`).join('')}</div>`;
    },
    alert() {
      const L = [['새 기록', '방 3 전투 기록 2건', 1], ['의뢰', '고용주의 짐 운반 갱신', 1], ['대원', '오팔 체력 절반 이하', 1]];
      return `<ul class="list">${L.map((l) => `<li class="${l[2] ? 'new' : ''}"><span class="k">${l[0]}</span><span>${l[1]}</span></li>`).join('')}</ul>`;
    },
    keys() {
      const L = [['<span class="kc">Esc</span>', '메뉴 열기·닫기'], ['<span class="kc">↑</span><span class="kc">↓</span><span class="kc">←</span><span class="kc">→</span>', '버튼 이동'],
        ['<span class="kc">Enter</span>', '선택'], ['<span class="kc">1</span><span class="kc">2</span><span class="kc">3</span>', '강조색 바꾸기'], ['터치', '버튼 누르기']];
      return `<ul class="list keys">${L.map((l) => `<li><span>${l[0]}</span><span>${l[1]}</span></li>`).join('')}</ul>`;
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

  /* ---------- 버튼 모양 (011과 같은 방식) ---------- */
  const xo = (y) => LA.cx - Math.sqrt(LA.r2 * LA.r2 - (y - LA.cy) ** 2);
  const xi = (y) => LA.cx - Math.sqrt(LA.r1 * LA.r1 - (y - LA.cy) ** 2);
  const rx = (y) => RA.cx + Math.sqrt(RA.r * RA.r - (y - RA.cy) ** 2);
  function sector(yt, yb) {
    const ox = Math.min(xo(yt), xo(yb), (yt < LA.cy && yb > LA.cy) ? xo(LA.cy) : 1e9);
    const mx = Math.max(xi(yt), xi(yb));
    const L = (x, y) => `${f1(x - ox)} ${f1(y - yt)}`;
    const c = 16, c2 = 8;
    const d = `M${L(xi(yt), yt)} L${L(xo(yt) + c, yt)} L${L(xo(yt + c), yt + c)} A${LA.r2} ${LA.r2} 0 0 0 ${L(xo(yb), yb)} `
      + `L${L(xi(yb) - c2, yb)} L${L(xi(yb - c2), yb - c2)} A${LA.r1} ${LA.r1} 0 0 1 ${L(xi(yt), yt)} Z`;
    return { x: ox, y: yt, w: mx - ox, h: yb - yt, d };
  }
  const rectPath = (w, h, c1, c2) => `M0 0 L${w - c1} 0 L${w} ${c1} L${w} ${h} L${c2} ${h} L0 ${h - c2} Z`;
  const rectPathL = (w, h, c1, c2) => `M${c1} 0 L${w} 0 L${w} ${h - c2} L${w - c2} ${h} L0 ${h} L0 ${c1} Z`;

  /* ---------- 버튼 목록 (평면 좌표) ---------- */
  const KEYS = [];
  const BH = 90, BG = 12, BY0 = 100;
  for (let k = 0; k < 4; k++) { const yt = BY0 + k * (BH + BG); KEYS.push(Object.assign({ kind: 'big', menu: k }, sector(yt, yt + BH))); }
  /* 오른쪽: 납작 육각(위아래 평평) 벌집. 010의 육각 그리기를 가져옴.
       열0   열1   열2
       04          06      ← 위 줄 3칸이 W자로 엇갈림 (위가 넓음)
             05
       07          09
             08
             11            ← 돌아가기 육각 하나로 아래가 좁아짐 (손잡이 쪽으로 모임)
     열 간격 DX = (H+g)·cos30°, 가운데 열은 반 칸 아래. */
  function rhex(w, h, r, ox = 0, oy = 0) {
    const V = [[0.25 * w, 0], [0.75 * w, 0], [w, h / 2], [0.75 * w, h], [0.25 * w, h], [0, h / 2]].map((p) => [p[0] + ox, p[1] + oy]);
    let d = '';
    V.forEach((p, i) => {
      const a = V[(i + 5) % 6], b = V[(i + 1) % 6];
      const ua = [a[0] - p[0], a[1] - p[1]], ub = [b[0] - p[0], b[1] - p[1]];
      const la = Math.hypot(...ua), lb = Math.hypot(...ub);
      const p1 = [p[0] + ua[0] / la * r, p[1] + ua[1] / la * r], p2 = [p[0] + ub[0] / lb * r, p[1] + ub[1] / lb * r];
      d += `${i ? 'L' : 'M'}${f1(p1[0])} ${f1(p1[1])} Q${f1(p[0])} ${f1(p[1])} ${f1(p2[0])} ${f1(p2[1])} `;
    });
    return d + 'Z';
  }
  const HX = { W: 112, H: 97, g: 10, x0: 1312, y0: 212, r: 10 };
  const HDY = HX.H + HX.g, HDX = HDY * Math.sqrt(3) / 2;
  const hcen = (c, rr) => ({ x: HX.x0 + HX.W / 2 + c * HDX, y: HX.y0 + HX.H / 2 + rr * HDY });
  const HPOS = [{ c: 0, rr: 0 }, { c: 1, rr: 0.5 }, { c: 2, rr: 0 }, { c: 0, rr: 1 }, { c: 1, rr: 1.5 }, { c: 2, rr: 1 }];
  const HEXD = rhex(HX.W, HX.H, HX.r);
  HPOS.forEach((p, k) => {
    const c = hcen(p.c, p.rr);
    KEYS.push({ kind: 'sq', hex: p, menu: 4 + k, x: c.x - HX.W / 2, y: c.y - HX.H / 2, w: HX.W, h: HX.H, d: HEXD });
  });
  KEYS.push({ kind: 'card', x: 16, y: 556, w: 132, h: 150, d: rectPathL(132, 150, 16, 8) }); // 폭 132: 마우스 오른쪽 위 끝(판이 오른쪽으로 기울 때)에도 오팔 얼굴에 닿지 않게
  { const c = hcen(1, 2.5); KEYS.push({ kind: 'closek', hex: { c: 1, rr: 2.5 }, x: c.x - HX.W / 2, y: c.y - HX.H / 2, w: HX.W, h: HX.H, d: HEXD }); }
  const CARD = KEYS.length - 2, CLOSE = KEYS.length - 1;

  const holder = { big: $('#leftKeys'), card: $('#leftKeys'), sq: $('#rightKeys'), closek: $('#rightKeys') };
  let cardIdx = Math.max(0, Math.min(3, num('card', 0) | 0)); // ?card=0~3 카드 대원 (넘침 검사용)
  function cardHTML() {
    const m = SQUAD[cardIdx];
    return `<div class="c-top"><span class="c-port">${m.k}</span><div class="c-nm">${m.n}</div></div><div class="c-role">${m.r}</div>
      <div class="c-hp"><span>체력</span><b>${m.hp}</b><small>/ ${m.max}</small></div><div class="c-id">${m.id}</div><div class="c-nav">${cardIdx + 1}/4 ▸</div>`;
  }
  KEYS.forEach((K, i) => {
    const w = document.createElement('div');
    w.className = 'kw';
    Object.assign(w.style, { left: f1(K.x) + 'px', top: f1(K.y) + 'px', width: f1(K.w) + 'px', height: f1(K.h + 10) + 'px' });
    let inner = '';
    if (K.kind === 'big') {
      const m = MENU[K.menu];
      const ledX = K.w - (xi(K.y + K.h / 2) - xi(K.y + K.h)) - 22;
      inner = `<span class="k-no" style="left:${f1(xo(K.y + 9) - K.x + 22)}px">${m.no}</span><span class="k-ic"><svg viewBox="0 0 24 24">${ICON[m.id]}</svg></span>
        <span class="k-tx"><b class="k-nm">${m.ko}</b><small class="k-sub">${m.sub}</small></span><i class="k-led" style="left:${f1(Math.max(0, ledX))}px"></i>`;
    } else if (K.kind === 'sq') {
      const m = MENU[K.menu];
      inner = `<span class="k-no">${m.no}</span><span class="k-ic"><svg viewBox="0 0 24 24">${ICON[m.id]}</svg></span><b class="k-nm">${m.ko}</b>${m.badge ? `<span class="k-badge">${m.badge}</span>` : ''}<i class="k-led"></i>`;
    } else if (K.kind === 'card') inner = cardHTML();
    else inner = '<span class="k-ic"><svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6"/></svg></span><b>돌아가기</b><kbd>Esc</kbd>';
    const sx = (K.w + 10) / K.w, sy = (K.h + 12) / K.h;
    w.innerHTML = `<button class="kb ${K.kind}" data-i="${i}" data-panel="key-${K.kind}-${i}" tabindex="-1" aria-label="${K.menu != null ? MENU[K.menu].ko : (K.kind === 'card' ? '대원 카드' : '돌아가기')}" style="width:${f1(K.w)}px;height:${f1(K.h + 10)}px">
      <span class="kshadow" style="height:${f1(K.h)}px"><i></i></span>
      <svg class="ksock" style="height:${f1(K.h)}px;top:5px" viewBox="0 0 ${f1(K.w)} ${f1(K.h)}"><path vector-effect="non-scaling-stroke" transform="translate(${f1(K.w / 2)} ${f1(K.h / 2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${f1(-K.w / 2)} ${f1(-K.h / 2)})" d="${K.d}"/></svg>
      <span class="kedge" style="height:${f1(K.h)}px"></span>
      <span class="kface" style="height:${f1(K.h)}px"><svg class="kline" viewBox="0 0 ${f1(K.w)} ${f1(K.h)}"><path class="hi" d="${K.d}" transform="translate(1 1) scale(${((K.w - 2) / K.w).toFixed(4)} ${((K.h - 2) / K.h).toFixed(4)})"/></svg>${inner}</span></button>`;
    const b = w.querySelector('.kb');
    [b.querySelector('.kshadow i'), b.querySelector('.kedge'), b.querySelector('.kface')].forEach((el) => { el.style.clipPath = `path("${K.d}")`; });
    holder[K.kind].appendChild(w);
    K.el = b; K.wrap = w; K.cx = K.x + K.w / 2; K.cy = K.y + K.h / 2;
  });
  const kb = KEYS.map((K) => K.el);

  /* ---------- 링(화면 뒤, 옅게)·전선 ---------- */
  const ringSvg = $('#ring');
  const mk = (parent, tag, attrs, text) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); if (text) e.textContent = text; parent.appendChild(e); return e; };
  const arcD = (r, a0, a1, cx = C.x, cy = C.y) => {
    const p = (a) => [cx + Math.cos(a * Math.PI / 180) * r, cy + Math.sin(a * Math.PI / 180) * r];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${f1(x0)} ${f1(y0)} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
  };
  const ticks = $('#ticks');
  for (let k = 0; k < 180; k++) {
    const a = (k / 180) * Math.PI * 2, long = k % 10 === 0;
    const r1 = 330, r2 = long ? 316 : 324;
    mk(ticks, 'line', { class: long ? 'tick l' : 'tick', x1: f1(C.x + Math.cos(a) * r1), y1: f1(C.y + Math.sin(a) * r1), x2: f1(C.x + Math.cos(a) * r2), y2: f1(C.y + Math.sin(a) * r2) });
  }
  $('#codePath').setAttribute('d', `M${C.x - 346} ${C.y} a346 346 0 1 1 692 0 a346 346 0 1 1 -692 0`);
  // 버튼 → 화면 가장자리 전선 (왼쪽 큰 버튼 4 + 오른쪽 안쪽 열 육각 2)
  const wires = [];
  const hrow = (mi) => (mi >= 4 && mi <= 9 ? (HPOS[mi - 4].rr < 1 ? 0 : 1) : -1);
  KEYS.forEach((K, i) => {
    if (K.kind !== 'big' && !(K.kind === 'sq' && K.hex.c === 0)) return;
    const y0 = K.cy;
    const x0 = K.kind === 'big' ? xi(y0) + 4 : K.x - 4;
    const x1 = K.kind === 'big' ? 432 : 1208;
    const y1 = 190 + (K.kind === 'big' ? K.menu : hrow(K.menu) * 2 + 4) * 52;
    const xm = (x0 + x1) / 2;
    const p = mk(ringSvg, 'path', { class: 'wire', d: `M${f1(x0)} ${f1(y0)} H${f1(xm)} L${f1(x1 + (K.kind === 'big' ? -10 : 10))} ${f1(y1)} H${f1(x1)}` });
    const n = mk(ringSvg, 'circle', { class: 'wnode', cx: f1(x1), cy: f1(y1), r: 3 });
    wires.push({ i, p, n, row: K.kind === 'sq' ? hrow(K.menu) : -1 });
  });
  // 벌집 바탕: 빈 자리 장식 육각(실선·점선) + 세 육각이 만나는 꼭짓점 노드 → 벌집 결을 완성
  [{ c: 0, rr: 2, s: 0.5 }, { c: 2, rr: 2, s: 0.5 }, { c: 0, rr: 2.75, s: 0.3, dim: 1 }, { c: 2, rr: 2.75, s: 0.3, dim: 1 }, { c: 1, rr: 3.3, s: 0.26, dim: 1 }].forEach((d) => {
    const c = hcen(d.c, d.rr), w = HX.W * d.s, h = HX.H * d.s;
    mk(ringSvg, 'path', { class: 'hdecor' + (d.dim ? ' dim' : ''), d: rhex(w, h, 4, c.x - w / 2, c.y - h / 2) });
  });
  [[0, 1, 3], [1, 2, 5], [1, 3, 4], [1, 4, 5]].forEach((t) => {
    const P = t.map((k) => hcen(HPOS[k].c, HPOS[k].rr));
    mk(ringSvg, 'circle', { class: 'hnode', cx: f1((P[0].x + P[1].x + P[2].x) / 3), cy: f1((P[0].y + P[1].y + P[2].y) / 3 + 5), r: 2.6 });
  });

  /* ---------- 콘솔 실루엣: 3단계 선 (far 먼 선 / mid 중간 선 / near 가까운 짧은 강조) ----------
     모두 옅은 푸른 발광선. 채움 없음. 장식은 바깥 테두리 쪽에만. 왼쪽을 그리고 거울로 오른쪽을 만듦 (글자·왼/오 전용 요소는 따로). */
  $('#silLine').setAttribute('d', SIL); $('#silGlow').setAttribute('d', SIL);
  const far = $('#decoFar'), mid = $('#decoMid'), near = $('#decoNear'), edge = $('#scrEdge');
  const MIRROR = 'matrix(-1 0 0 1 1640 0)';
  const side = (parent) => { const gL = mk(parent, 'g', {}); const gR = mk(parent, 'g', { transform: MIRROR }); return (tag, attrs) => { mk(gL, tag, attrs); mk(gR, tag, attrs); }; };
  const F = side(far), M = side(mid), N = side(near);
  // [먼 선·중간 선] 바깥 큰 호 여러 겹 (EndfieldHUD의 바깥 호) — 윤곽 바깥 좌우에 붙여 화면을 가리지 않음
  [[832, 160, 200, 'mid'], [852, 157, 203, 'far d'], [876, 165, 195, 'far'], [900, 170, 190, 'mid d'], [816, 171, 177, 'near'], [816, 183, 189, 'near']].forEach(([r, a0, a1, c]) => {
    mk(far, 'path', { class: c, d: arcD(r, a0, a1) }); mk(far, 'path', { class: c, d: arcD(r, 180 - a1, 180 - a0) });
  });
  // 바깥 호 위 짧은 눈금
  for (let a = 162; a <= 198; a += 3) {
    const L = a % 9 === 0 ? 12 : 6;
    [a, 180 - a].forEach((aa) => { const c = Math.cos(aa * Math.PI / 180), s = Math.sin(aa * Math.PI / 180);
      mk(far, 'path', { class: 'mid', d: `M${f1(C.x + c * 832)} ${f1(C.y + s * 832)} L${f1(C.x + c * (832 + L))} ${f1(C.y + s * (832 + L))}` }); });
  }
  // [먼 선] 윤곽 바깥 9px 끊긴 그림자 선 + 위·아래 긴 점선
  mk(far, 'path', { class: 'far d', d: SIL, transform: 'translate(820 430) scale(1.012 1.022) translate(-820 -430)' });
  mk(far, 'path', { class: 'far d', d: 'M430 8 H1210' });
  mk(far, 'path', { class: 'far', d: 'M600 798 H1040' });
  // [중간 선] 윤곽 안쪽 끊어졌다 이어지는 선
  mk(mid, 'path', { class: 'mid brk', d: SIL, transform: 'translate(820 430) scale(.985 .972) translate(-820 -430)' });
  // [중간 선] 어깨 버튼 L/R (위쪽 모서리)
  M('path', { class: 'mid', d: 'M86 46 C94 22 122 8 162 8 H352 C378 8 394 18 402 36' });
  F('path', { class: 'far', d: 'M120 30 H340' });
  N('path', { class: 'near', d: 'M162 8 H210' });
  // [중간 선] 위쪽 모서리 꺾인 브래킷 + 옆 레일
  M('path', { class: 'mid', d: 'M22 168 V128 L54 96 H98' });
  M('path', { class: 'mid d', d: 'M20 226 V548' });
  for (let y = 236; y <= 540; y += 26) M('path', { class: 'mid', d: `M20 ${y} h${(y - 236) % 104 === 0 ? 14 : 7}` });
  N('path', { class: 'near', d: 'M20 300 V352' });
  N('circle', { class: 'dot', cx: 22, cy: 176, r: 2.4 });
  N('circle', { class: 'dot', cx: 104, cy: 96, r: 2.4 });
  // [중간 선] 손잡이 아래 둥근 곡선 두 겹 + 손잡이 끝 홈
  M('path', { class: 'mid', d: 'M36 640 C40 776 92 832 166 834 C230 836 276 812 312 776' });
  F('path', { class: 'far d', d: 'M58 640 C64 758 104 812 166 814 C220 816 258 796 288 766' });
  N('path', { class: 'near', d: 'M132 846 H200' });
  M('path', { class: 'mid', d: 'M6 610 h22 M6 622 h16 M6 634 h22' });
  // [먼 선] 화면 옆 구역 경계: 버튼 판을 따른 휜 점선 (3분할 경계)
  const sepX = (y, r) => LA.cx - Math.sqrt(r * r - (y - LA.cy) ** 2);
  mk(mid, 'path', { class: 'sep', d: `M${f1(sepX(84, 860))} 84 A860 860 0 0 0 ${f1(sepX(740, 860))} 740` });
  mk(mid, 'path', { class: 'sep', d: `M${f1(1640 - sepX(84, 860))} 84 A860 860 0 0 1 ${f1(1640 - sepX(740, 860))} 740` });
  // [가까운 선] 위 가운데 홈·통풍구
  for (let x = 766; x <= 874; x += 12) mk(near, 'path', { class: 'mid', d: `M${x} 26 v8` });
  mk(near, 'path', { class: 'near', d: 'M740 30 H756 M884 30 H900' });
  mk(near, 'circle', { class: 'dot', cx: 612, cy: 31, r: 2.2 }); mk(near, 'circle', { class: 'dot', cx: 1028, cy: 31, r: 2.2 });
  // [가까운 선] 아래 가운데 홈
  mk(near, 'path', { class: 'mid d', d: 'M610 772 H1030' });
  mk(near, 'path', { class: 'near', d: 'M800 772 H840' });
  // 왼쪽 손잡이 아래: 방향 패드 윤곽 (누를 수 없는 표시) / 오른쪽 손잡이 아래: 아날로그 스틱 윤곽 + 버튼 점 4개
  mk(far, 'path', { class: 'mid', d: 'M226 734 h18 v-18 h18 v18 h18 v18 h-18 v18 h-18 v-18 h-18 z', transform: 'translate(0 18)' });
  mk(far, 'circle', { class: 'mid', cx: 1446, cy: 724, r: 38 }); mk(far, 'circle', { class: 'far d', cx: 1446, cy: 724, r: 26 });
  mk(far, 'circle', { class: 'far', cx: 1446, cy: 724, r: 50 });
  [[1540, 690], [1564, 714], [1540, 738], [1516, 714]].forEach(([x, y]) => mk(far, 'circle', { class: 'mid', cx: x, cy: y, r: 9 }));
  // [가까운 선] 강조 점 (K2/K3에서 강조색)
  mk(near, 'circle', { class: 'dot acc', cx: 98, cy: 96, r: 3 }); mk(near, 'circle', { class: 'dot acc', cx: 1542, cy: 96, r: 3 });
  mk(near, 'path', { class: 'acc', d: 'M560 40 L586 22' }); mk(near, 'path', { class: 'acc', d: 'M1054 22 L1080 40' });
  // 글자 (거울 안 함): 어깨 버튼 표시, 모델명
  mk(near, 'text', { x: 132, y: 30 }, 'L'); mk(near, 'text', { x: 1500, y: 30 }, 'R');
  mk(near, 'text', { class: 'lbl', x: 820, y: 818, 'text-anchor': 'middle' }, '관리기구 휴대 단말 · KG-07');
  // 화면 테두리 (012의 화면 구역선 + 모서리 꺾쇠) + 옆 눈금
  mk(edge, 'rect', { class: 'bezel', x: 420, y: 34, width: 800, height: 716, rx: 10 });
  [['M420 70 V44 A10 10 0 0 1 430 34 H462'], ['M1178 34 H1210 A10 10 0 0 1 1220 44 V70'], ['M1220 714 V740 A10 10 0 0 1 1210 750 H1178'], ['M462 750 H430 A10 10 0 0 1 420 740 V714']]
    .forEach(([d]) => mk(edge, 'path', { class: 'bk', d }));
  for (let y = 180; y <= 660; y += 40) { mk(edge, 'path', { class: 'mid', d: `M420 ${y} h${y % 120 === 60 ? 10 : 5}` }); mk(edge, 'path', { class: 'mid', d: `M1220 ${y} h-${y % 120 === 60 ? 10 : 5}` }); }

  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="860" viewBox="0 0 1640 860"><filter id="b" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="6"/></filter><path d="${SIL}" fill="#fff" filter="url(#b)"/></svg>`;
  const maskUrl = `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}")`;
  ['#glass', '#L-ring'].forEach((s) => { const e = $(s); e.style.webkitMaskImage = maskUrl; e.style.maskImage = maskUrl; });

  /* ---------- 화면 맞춤 ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
    stage._s = s;
  }
  addEventListener('resize', fit); fit();

  /* ---------- 강조색 ---------- */
  let isOpen = false, busy = false;
  function setTheme(t, flick) {
    document.body.classList.remove('theme-k1', 'theme-k2', 'theme-k3');
    document.body.classList.add('theme-' + t);
    $$('#pad [data-theme]').forEach((b) => b.classList.toggle('on', b.dataset.theme === t));
    try { localStorage.setItem('lb013-theme', t); } catch (e) { /* file:// */ }
    if (flick && motion && isOpen) $('#L-holo').animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }, { opacity: .7 }, { opacity: 1 }], { duration: 280, easing: 'steps(4)' });
  }
  let theme = Q.get('theme');
  if (!theme) { try { theme = localStorage.getItem('lb013-theme'); } catch (e) { /* */ } }
  if (!/^k[123]$/.test(theme || '')) theme = 'k1';
  setTheme(theme, false);
  if (Q.get('clean') === '1') document.body.classList.add('clean');
  if (STILL) document.body.classList.add('still');

  /* ---------- 화면 내용 + 선택 ---------- */
  let active = Math.max(0, Math.min(MENU.length - 1, num('sel', 0) | 0));
  function showScreen(mi, animate) {
    const m = MENU[mi];
    $('#scrNo').textContent = m.no; $('#scrTitle').textContent = m.ko; $('#scrCode').textContent = m.code;
    const body = $('#scrBody');
    body.innerHTML = SCREENS[m.id]();
    if (animate && motion) {
      body.classList.remove('swap-in'); void body.offsetWidth; body.classList.add('swap-in');
      $('#pSweep').animate([{ top: '0px', opacity: 1 }, { top: '520px', opacity: .2 }], { duration: 360, easing: 'cubic-bezier(.4,0,.2,1)' });
    }
  }
  function setActive(mi, animate) {
    active = mi;
    KEYS.forEach((K) => K.el.classList.toggle('active', K.menu === mi));
    wires.forEach((w) => {
      const K = KEYS[w.i];
      const on = K.menu === mi || (w.row >= 0 && hrow(mi) === w.row);
      w.p.classList.toggle('on', on); w.n.classList.toggle('on', on);
    });
    // 선택 육각의 이웃 육각을 바깥으로 6px 밀어냄 (010 방식)
    const A = KEYS.find((K) => K.hex && K.menu === mi);
    KEYS.forEach((K) => {
      let px = 0, py = 0;
      if (A && K.hex && K !== A) {
        const dx = K.cx - A.cx, dy = K.cy - A.cy, L = Math.hypot(dx, dy);
        if (L < HDY * 1.2) { px = dx / L * 6; py = dy / L * 6; }
      }
      K.el.style.setProperty('--px', f1(px) + 'px'); K.el.style.setProperty('--py', f1(py) + 'px');
    });
    showScreen(mi, animate);
  }
  setActive(active, false);

  /* 방향키 이웃: 누른 방향 ±63° 안에서 (거리 ÷ 방향 일치도)가 가장 작은 버튼. 왼쪽 판 ↔ 오른쪽 묶음도 ←→로 건너감 */
  function neighbor(i, key) {
    const v = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[key];
    let best = i, bs = 1e9;
    KEYS.forEach((K, k) => {
      if (k === i) return;
      const dx = K.cx - KEYS[i].cx, dy = K.cy - KEYS[i].cy, L = Math.hypot(dx, dy);
      const cos = (dx * v[0] + dy * v[1]) / L;
      if (cos < 0.45) return;
      const s = L / (cos * cos);
      if (s < bs - 0.5) { bs = s; best = k; }
    });
    return best;
  }

  /* ---------- 등장 / 닫힘 ----------
     ① 실루엣 윤곽 0~760ms → 먼 선·중간 선·가까운 선 차례로 깜빡이며 켜짐 ② 떠오름 0~1000ms ③ 유리 채움 520~980ms
     ④ 화면 테두리·글자 900~1400ms ⑤ 버튼: 왼쪽 판 위→아래, 오른쪽 묶음 위→아래 1100~1950ms */
  const OUT = 'cubic-bezier(.16,1,.3,1)';
  const SNAP = 'cubic-bezier(.3,.6,.4,1)';
  const OPEN_END = 1950;
  const Z = { 'L-ring': 10, 'L-holo': 22, 'L-keys': 40 };
  function timeline() {
    const T = [];
    const add = (el, kf, delay, dur, easing) => T.push({ el, kf, delay, dur, easing: easing || 'linear' });
    add($('#bg'), [{ filter: 'blur(0px) brightness(1) saturate(1)', transform: 'scale(1)' }, { filter: 'blur(2.4px) brightness(.66) saturate(.8)', transform: 'scale(1.015)' }], 0, 460, OUT);
    add($('#shade'), [{ opacity: 0 }, { opacity: 1 }], 0, 460, 'ease-out');
    add($('#grain'), [{ opacity: 0 }, { opacity: 0.06 }], 100, 400, 'ease-out');
    [$('#silLine'), $('#silGlow')].forEach((el) => add(el, [{ strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }], 60, 700, 'cubic-bezier(.5,0,.2,1)'));
    [[far, 420], [mid, 560], [near, 700], [edge, 860]].forEach(([el, d]) => add(el, [{ opacity: 0 }, { opacity: 1, offset: .4 }, { opacity: .3, offset: .6 }, { opacity: 1 }], d, 300, 'steps(5, end)'));
    add($('#rise'), [
      { transform: 'translate3d(0, 110px, -240px) rotateX(22deg) scale(.92)', opacity: 0 },
      { transform: 'translate3d(0, 110px, -240px) rotateX(22deg) scale(.92)', opacity: 1, offset: .12 },
      { transform: 'translate3d(0, -8px, 10px) rotateX(-1.4deg) scale(1.004)', offset: .78 },
      { transform: 'translate3d(0, 2px, -2px) rotateX(.3deg) scale(1)', offset: .9 },
      { transform: 'none', opacity: 1 }], 0, 1000, 'cubic-bezier(.45,.05,.3,1)');
    add($('#floor'), [{ opacity: 0 }, { opacity: 1 }], 420, 700, 'ease-out');
    add($('#glass'), [{ clipPath: 'inset(0 50% 0 50%)', opacity: 0 }, { clipPath: 'inset(0 50% 0 50%)', opacity: 1, offset: .1 },
      { clipPath: 'inset(0 0% 0 0%)', opacity: .85, offset: .7 }, { opacity: .45, offset: .78 }, { opacity: 1, offset: .86 }, { clipPath: 'inset(0 0% 0 0%)', opacity: 1 }], 520, 460, 'linear');
    add($('#sweep'), [{ top: '430px', opacity: 0 }, { top: '430px', opacity: 1, offset: .1 }, { top: '40px', opacity: .8, offset: .5 }, { top: '780px', opacity: 0 }], 620, 560, 'cubic-bezier(.4,0,.2,1)');
    Object.entries(Z).forEach(([id, z]) => add($('#' + id), [{ translate: '0 0 0px' }, { translate: `0 0 ${z * 1.25}px`, offset: .7 }, { translate: `0 0 ${z}px` }], 700, 560, OUT));
    add(ringSvg, [{ opacity: 0, transform: 'scale(.8) rotate(-30deg)', transformOrigin: '820px 430px' }, { opacity: 1, offset: .3 }, { opacity: 1, transform: 'scale(1) rotate(0deg)', transformOrigin: '820px 430px' }], 820, 680, OUT);
    [$('#title'), $('#status'), $('#panel'), $('#hints'), $('#clock'), $('#tagL'), $('#tagR')].forEach((el, i) =>
      add(el, [{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)' }], 960 + i * 60, 320, 'steps(8, end)'));
    const ORDER = [0, 1, 2, 3, CARD, 4, 5, 6, 7, 8, 9, CLOSE];
    ORDER.forEach((i, k) => {
      const left = i < 4 || i === CARD;
      const kk = left ? k : k - 5;
      add(KEYS[i].wrap, [
        { transform: `translate3d(${left ? -40 : 40}px,-18px,150px) scale(1.12)`, opacity: 0 }, { opacity: 1, offset: .28 },
        { transform: 'translate3d(0,4px,-12px) scale(.98)', offset: .6 }, { transform: 'translate3d(0,-1px,4px) scale(1.006)', offset: .8 }, { transform: 'none', opacity: 1 }],
      (left ? 1100 : 1180) + kk * (left ? 80 : 50), 480, SNAP);
    });
    wires.forEach((w, k) => [w.p, w.n].forEach((el) => add(el, [{ opacity: 0 }, { opacity: 1, offset: .5 }, { opacity: .3, offset: .7 }, { opacity: 1 }], 1500 + k * 30, 200, 'steps(5, end)')));
    $$('#ring .hdecor, #ring .hnode').forEach((el, k) => add(el, [{ opacity: 0 }, { opacity: 1, offset: .5 }, { opacity: .3, offset: .7 }, { opacity: 1 }], 1560 + k * 40, 200, 'steps(5, end)'));
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
      setHot(focusIdx);
      guardCheck();
    }).catch(() => {});
  }
  function close(freezeAt) {
    if (!isOpen && freezeAt == null) return;
    clearAnims();
    busy = true;
    kb.forEach((b) => b.classList.remove('pressed'));
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
      kb.forEach((b) => b.classList.remove('hot', 'pressed'));
    }).catch(() => {});
  }
  const toggle = () => { if (busy) return; isOpen ? close() : open(); };

  /* ---------- 눌림·되튐 ---------- */
  let focusIdx = active;
  let lockState = false;
  function setHot(i) {
    if (lockState) return;
    kb.forEach((b, k) => b.classList.toggle('hot', k === i));
    focusIdx = i;
  }
  let kick = 0;
  function thunk() { if (motion) kick = 1; }
  function activate(i) {
    const K = KEYS[i];
    if (K.menu != null) setActive(K.menu, true);
    else if (K.kind === 'card') { cardIdx = (cardIdx + 1) % SQUAD.length; K.el.querySelector('.kface').innerHTML = K.el.querySelector('.kface').innerHTML.replace(/<div class="c-top">[\s\S]*$/, '') + cardHTML(); }
    else if (!busy) close();
  }
  function bindPress(el, onRelease, hitEl) {
    hitEl.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      el.classList.add('pressed'); try { hitEl.setPointerCapture(e.pointerId); } catch (_) { /* */ } thunk();
    });
    hitEl.addEventListener('pointerup', (e) => {
      if (!el.classList.contains('pressed')) return;
      el.classList.remove('pressed');
      const r = hitEl.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) onRelease();
    });
    hitEl.addEventListener('pointercancel', () => el.classList.remove('pressed'));
  }
  kb.forEach((b, i) => {
    const face = b.querySelector('.kface');
    face.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setHot(i); });
    bindPress(b, () => { setHot(i); activate(i); }, face);
  });
  $('#openBtn').addEventListener('click', () => { if (!busy) open(); });

  function keyPress(i) {
    const b = kb[i];
    b.classList.add('pressed'); thunk();
    setTimeout(() => { b.classList.remove('pressed'); activate(i); }, 130);
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); toggle(); return; }
    if (e.key === '1' || e.key === '2' || e.key === '3') { setTheme('k' + e.key, true); return; }
    if (!isOpen || busy) return;
    if (/^Arrow/.test(e.key)) { e.preventDefault(); setHot(neighbor(focusIdx, e.key)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) keyPress(focusIdx); }
  });

  $('#padMenu').addEventListener('click', toggle);
  $$('#pad [data-theme]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.theme, true)));
  const padMotion = $('#padMotion');
  const syncMotionBtn = () => padMotion.classList.toggle('on', motion);
  padMotion.addEventListener('click', () => { motion = !motion; syncMotionBtn(); });
  syncMotionBtn();

  /* ---------- 떠 있음 + 마우스 시차 (013에서 방향 고침) ----------
     CSS 회전 부호: rotateY(+θ) = 오른쪽 가장자리가 뒤로·왼쪽이 앞으로 / rotateX(+θ) = 아래 가장자리가 앞으로.
     011·012는 rotateY(+mx·4°) 라서 마우스 쪽이 뒤로 물러났음.
     013: 마우스 쪽이 앞으로 → rotateY(−mx·7°), rotateX(+my·4°). 판 전체는 마우스 쪽으로 8px 따라오고, 배경은 반대로 9px (깊이감).
     층(유리 0 → 버튼 40px)은 #float 회전을 함께 받으므로 앞층일수록 마우스 쪽으로 더 크게 다가옴. */
  const TY = 7, TX = 4;
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
    const on = motion || BOB != null ? 1 : 0;
    const tt = BOB != null ? BOB : t;
    const by = Math.sin(tt * 0.00105) * 5 * on;
    const rxx = Math.sin(tt * 0.00077 + 1.1) * 0.6 * on;
    const ry = Math.cos(tt * 0.00061) * 0.6 * on;
    const mx = (motion || Q.has('mx')) ? cur.x : 0, my = (motion || Q.has('my')) ? cur.y : 0;
    const k = kick; kick *= 0.86; if (kick < 0.01) kick = 0;
    const kz = -Math.sin((1 - k) * Math.PI) * 6 * (k > 0 ? 1 : 0);
    floatEl.style.transform = `translate3d(${(mx * 4).toFixed(2)}px, ${(by + my * 4).toFixed(2)}px, ${kz.toFixed(2)}px) rotateY(${(-mx * TY + ry).toFixed(3)}deg) rotateX(${(my * TX + rxx).toFixed(3)}deg)`;
    floorEl.style.transform = `translate(${(mx * 4).toFixed(2)}px, 0) scaleX(${(1 - by * 0.004).toFixed(4)})`;
    floorEl.style.filter = `brightness(${(1 - by * 0.03).toFixed(3)})`;
    bgEl.style.translate = `${(-mx * 9).toFixed(2)}px ${(-my * 6).toFixed(2)}px`;
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

  /* ---------- 검사: 인물 얼굴 가림 / 글자 넘침 / 위치 / 기울기 ---------- */
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
        if (ix > 0 && iy > 0) hits.push(`${p.dataset.glass || (p.closest('[data-panel]') || p).dataset.panel || p.id}×${f.n}(${Math.round(ix)}x${Math.round(iy)})`);
      });
    });
    return hits;
  }
  const cv = document.createElement('canvas').getContext('2d');
  function overflowCheck() {
    const bad = [];
    KEYS.forEach((K, i) => {
      const face = K.el.querySelector('.kface');
      const P = new Path2D(K.d);
      cv.lineWidth = 8;
      const inside = (x, y) => cv.isPointInPath(P, x, y) && !cv.isPointInStroke(P, x, y);
      $$('b, small, span, kbd, div.c-id, div.c-nav', face).forEach((el) => {
        if (el.closest('svg')) return;
        let x = 0, y = 0, n = el;
        while (n && n !== face) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        const w = el.offsetWidth, h = el.offsetHeight;
        if (!w || !h) return;
        const tooWide = el.scrollWidth > w + 1;
        if (tooWide || ![[x, y], [x + w, y], [x, y + h], [x + w, y + h]].every((p) => inside(p[0], p[1]))) bad.push(`${i}:${el.className || el.tagName}`);
      });
    });
    const body = $('#scrBody');
    if (body.scrollHeight > body.offsetHeight + 1 || body.scrollWidth > body.offsetWidth + 1) bad.push(`screen:${MENU[active].id}(${body.scrollWidth}x${body.scrollHeight}/${body.offsetWidth}x${body.offsetHeight})`);
    // 화면 위 홀로그램 줄(제목·상태·안내·시계·구역 이름)이 칸을 넘는지
    ['#title', '#status', '#hints', '#clock', '#tagL', '#tagR', '.scr-head', '.scr-foot'].forEach((s) => { const e = $(s); if (e.scrollWidth > e.clientWidth + 1) bad.push(`holo:${s}(${e.scrollWidth}>${e.clientWidth})`); });
    return bad.length ? bad.join(',') : 'none';
  }
  function tilt() {
    const c = (id) => { const r = rectOf($(id)); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
    const tl = c('#pTL'), bl = c('#pBL'), tr = c('#pTR'), br = c('#pBR');
    return `TILT L ${(bl.y - tl.y).toFixed(1)} R ${(br.y - tr.y).toFixed(1)} TL ${tl.x.toFixed(0)},${tl.y.toFixed(0)} BL ${bl.x.toFixed(0)},${bl.y.toFixed(0)} TR ${tr.x.toFixed(0)},${tr.y.toFixed(0)} BR ${br.x.toFixed(0)},${br.y.toFixed(0)}`;
  }
  function guardCheck() {
    const hard = hitList('.kface'), soft = hitList('[data-glass]:not(#glass)');
    const g = rectOf($('#panel'));
    $('#check').textContent = (hard.length ? 'CHECK HIT ' + hard.join(', ') : 'CHECK OK')
      + ' | HOLO ' + (soft.length ? soft.join(', ') : 'none')
      + ` | PANEL ${Math.round(g.x)},${Math.round(g.y)} ${Math.round(g.w)}x${Math.round(g.h)} center ${Math.round(g.x + g.w / 2)},${Math.round(g.y + g.h / 2)}`
      + ' | ' + tilt()
      + ' | KEYS ' + kb.map((b) => { const r = rectOf(b.querySelector('.kface')); return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`; }).join(';')
      + ' | OVERFLOW ' + overflowCheck();
    if (Q.get('guard') === '1') FACES.forEach((f) => { const d = document.createElement('div'); d.className = 'guard'; Object.assign(d.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' }); stage.appendChild(d); });
  }
  window.__overflowAll = () => { const out = []; for (let m = 0; m < MENU.length; m++) { setActive(m, false); out.push(MENU[m].id + ':' + overflowCheck()); } setActive(active, false); return out.join(' | '); };

  /* ---------- 시작 ---------- */
  const start = () => {
    const hv = Q.has('hover') ? num('hover', -1) | 0 : -1;
    const pr = Q.has('press') ? num('press', -1) | 0 : -1;
    focusIdx = KEYS.findIndex((K) => K.menu === active);
    if (Q.get('closed') === '1') { guardCheck(); return; }
    if (Q.has('closeAt')) { open(OPEN_END); close(num('closeAt', 0)); return; }
    if (Q.has('freeze')) { open(num('freeze', 0)); guardCheck(); }
    else open();
    if (hv >= 0) { kb.forEach((b) => b.classList.remove('hot')); kb[hv].classList.add('hot'); }
    if (pr >= 0) kb[pr].classList.add('pressed');
    if (hv >= 0 || pr >= 0) { focusIdx = hv >= 0 ? hv : pr; lockState = true; }
    if (Q.has('freeze')) guardCheck();
    if (Q.get('allcheck') === '1') $('#check').textContent += ' | ALL ' + window.__overflowAll();
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
})();
