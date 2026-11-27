/* UIDiorama 011 — EndfieldHUD 배치 + 포터블 콘솔 실루엣 (010 도구·구조 바탕)
   주소 옵션 (렌더·캡처용):
     ?theme=k1|k2|k3   내부 강조색          ?clean=1   구석 조작판 숨김
     ?still=1          쉬는 움직임·시차 끔 (정지 캡처)
     ?freeze=ms        여는 동작을 ms 지점에 멈춤     ?closeAt=ms  닫는 동작을 ms 지점에 멈춤
     ?closed=1         닫힌 상태로 시작
     ?sel=i  ?hover=i  ?press=i   버튼 상태 강제 (0~3 왼쪽 큰 버튼, 4~11 오른쪽 아이콘, 12 대원 카드, 13 돌아가기)
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
  const NS = 'http://www.w3.org/2000/svg';
  const f1 = (v) => (+v).toFixed(1);

  /* ---------- 평면 기준 (1640×860) ----------
     원 중심 (820,430), 주 링 반지름 360. 실루엣 위 직선 y 96, 아래 직선 y 764 → 링 위아래가 26px씩 잘림.
     왼쪽 큰 버튼: 중심 (1300,430) 동심원 반지름 1040~1260 사이를 4칸으로 자른 휜 판 (원 쪽으로 오목).
     오른쪽 아이콘: 중심 (340,430) 반지름 1040 호를 따라 행마다 들쭉날쭉한 2열.                      */
  const C = { x: 820, y: 430, r: 360 };
  const TOP = 96, BOT = 764;
  const SIL = 'M160 96 L1480 96 C1580 96 1626 150 1630 250 L1636 640 C1640 780 1580 852 1470 852 C1380 852 1330 820 1290 780 '
    + 'C1268 760 1250 764 1220 764 L420 764 C390 764 372 760 350 780 C310 820 260 852 170 852 C60 852 0 780 4 640 L10 250 C14 150 60 96 160 96 Z';
  const LA = { cx: 1300, cy: 430, r1: 1040, r2: 1260 };
  const RA = { cx: 340, cy: 430, r: 1040 };

  /* ---------- 아이콘 (SVG 직접, 24 격자) ---------- */
  const ICON = {
    squad: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.6c2.9.2 5.5 2.3 5.5 5.4"/>',
    inv: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M9 12h6"/>',
    map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v14l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v14M15 6.5v14"/>',
    log: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3"/><path d="M9 11h6M9 14.5h6M9 18h3.5"/>',
    quest: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    codex: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/><path d="M6.5 8h2.5M15 8h2.5"/>',
    cfg: '<path d="M4 7h9M18 7h2M4 17h3M11 17h9"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
    sound: '<path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    keys: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.2" r=".9"/><circle cx="17.8" cy="13.6" r=".9"/>',
    alert: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 1.5h-15z"/><path d="M10 21h4"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><rect x="8" y="13" width="8" height="5"/>',
    exit: '<path d="M13 4h6v16h-6"/><path d="M9.5 8l-4 4 4 4M5.5 12H16"/>',
  };
  const LEFT = [
    { id: 'squad', no: '01', ko: '원정대', sub: '대원 4/4', code: 'SQUAD' },
    { id: 'inv', no: '02', ko: '인벤토리', sub: '짐 7/12', code: 'INVENTORY' },
    { id: 'map', no: '03', ko: '지도', sub: '심도 11 · 방 3/5', code: 'MAP' },
    { id: 'log', no: '04', ko: '기록', sub: '새 기록 2', code: 'LOG' },
  ];
  const RIGHT = [
    { id: 'quest', ko: '의뢰', code: 'REQUEST' }, { id: 'codex', ko: '도감', code: 'CODEX' },
    { id: 'cfg', ko: '설정', code: 'CONFIG' }, { id: 'sound', ko: '소리', code: 'SOUND' },
    { id: 'keys', ko: '조작', code: 'CONTROLS' }, { id: 'alert', ko: '알림', code: 'NOTICE', badge: 3 },
    { id: 'save', ko: '저장', code: 'SAVE' }, { id: 'exit', ko: '나가기', code: 'EXIT' },
  ];
  const MENU = LEFT.concat(RIGHT.map((m, k) => Object.assign({ no: String(5 + k).padStart(2, '0') }, m)));
  const SQUAD = [
    { n: '토파즈', k: '토', r: '약화·강화 술사', hp: 9, max: 11, acc: 4, agi: 3, tgh: 3, id: 'KG-07-01' },
    { n: '오팔', k: '오', r: '주 공격 술사', hp: 4, max: 8, acc: 5, agi: 4, tgh: 2, id: 'KG-07-02' },
    { n: '네모필라', k: '네', r: '은신·치명', hp: 9, max: 9, acc: 5, agi: 6, tgh: 2, id: 'KG-07-03' },
    { n: '오이라', k: '이', r: '동행', hp: 4, max: 4, acc: 2, agi: 3, tgh: 2, id: 'KG-07-04' },
  ];
  const ITEMS = [['치료 앰플', 2], ['응급 처치 키트', 1], ['수류탄', 3], ['탄약 묶음', 4], ['유물 파편', 1],
    ['야영 키트', 1], ['고용주의 짐', 1, '의뢰'], ['옛 과자 봉지', 2], ['', 0]];

  const SCREENS = {
    map() {
      const strata = [70, 150, 235, 320].map((y, i) => `<path class="strata" d="M40 ${y} C140 ${y - 14 + i * 4} 260 ${y + 16} 360 ${y - 6} S470 ${y + 8} 492 ${y}"/>`).join('');
      const dg = [9, 10, 11, 12, 13].map((d, i) => { const y = 40 + i * 78; return `<line class="dg" x1="34" y1="${y}" x2="46" y2="${y}"/><text class="dk" x="6" y="${y + 5}">${d}</text>`; }).join('');
      return `<div class="mapv"><svg viewBox="0 0 492 400">${strata}
        <line class="dg" x1="40" y1="20" x2="40" y2="370"/>${dg}<path class="dg-cur" d="M48 196 l10 -7 v14 z"/><text class="c" x="4" y="392">심도</text>
        <path class="ln" d="M110 90 L210 150 L300 214"/><path class="ln d" d="M300 214 L400 150 L452 270 M300 214 L380 300 L452 270"/>
        <circle class="pulse" cx="300" cy="214" r="15"/>
        <circle class="nd" cx="110" cy="90" r="13"/><circle class="nd" cx="210" cy="150" r="13"/><circle class="nd cur" cx="300" cy="214" r="15"/>
        <circle class="nd unk" cx="400" cy="150" r="13"/><circle class="nd unk" cx="380" cy="300" r="13"/><circle class="nd unk" cx="452" cy="270" r="13"/>
        <text x="110" y="64" text-anchor="middle">방 1 착륙지</text><text class="c" x="148" y="116">저장 지점</text>
        <text x="200" y="185" text-anchor="middle">방 2</text><text class="c" x="200" y="203" text-anchor="middle">정리됨</text>
        <text x="300" y="252" text-anchor="middle">방 3 전투 방</text><text class="c" x="300" y="270" text-anchor="middle">현재 위치</text>
        <text x="400" y="124" text-anchor="middle">방 4 ?</text><text x="372" y="336" text-anchor="middle">방 4 ?</text><text x="452" y="246" text-anchor="end">방 5 ?</text>
      </svg></div>`;
    },
    squad() {
      const rows = SQUAD.map((m) => {
        const low = m.hp / m.max <= 0.5;
        const cells = Array.from({ length: m.max }, (_, i) => `<i class="${i < m.hp ? (low ? 'on low' : 'on') : ''}"></i>`).join('');
        return `<div class="sq-row"><div class="sq-who"><span class="port">${m.k}</span><div><div class="sq-name">${m.n}</div><div class="sq-role">${m.r}</div></div></div>
          <div class="hp"><span class="hp-cells">${cells}</span><b>${m.hp}/${m.max}</b></div>
          <div class="st">${m.acc}</div><div class="st">${m.agi}</div><div class="st">${m.tgh}</div></div>`;
      }).join('');
      return `<div class="squad"><div class="sq-row hdr"><span>대원</span><span>체력</span><span>명중</span><span>민첩</span><span>견고함</span></div>${rows}</div>`;
    },
    inv() {
      const slots = ITEMS.map((it) => (it[0] ? `<div class="slot"><b>${it[0]}</b>${it[2] ? `<em>${it[2]}</em>` : ''}<span>×${it[1]}</span></div>` : '<div class="slot" style="border-style:dashed;opacity:.4"></div>')).join('');
      return `<div class="inv">${slots}</div><div class="weight"><span>짐 가방</span><span class="bar"><i style="width:58%"></i></span><span>7 / 12</span></div>`;
    },
    log() {
      const L = [['14:32', '방 3 진입', '굴두더지 4 확인. 전투 시작', 1], ['14:31', '네모필라', '은신 준비', 1],
        ['14:05', '방 2', '갈고리 짐승 2 처치', 0], ['13:58', '오팔', '체력 −4', 0], ['13:12', '착륙지', '저장 완료', 0]];
      return `<ul class="list">${L.map((l) => `<li class="${l[3] ? 'new' : ''}"><time>${l[0]}</time><span>${l[1]}<em>${l[2]}</em></span></li>`).join('')}</ul>`;
    },
    quest() {
      const L = [['진행', '고용주의 짐 운반', '심도 12 회수 지점까지 · 보상 3금', 1], ['진행', '굴두더지 굴 조사', '방 4 확인 필요', 0], ['완료', '착륙지 확보', '보상 받음', 0]];
      return `<ul class="list">${L.map((l) => `<li class="${l[3] ? 'new' : ''}"><span class="k">${l[0]}</span><span>${l[1]}<em>${l[2]}</em></span></li>`).join('')}</ul>`;
    },
    codex() {
      const L = [['굴두더지', '땅굴 · 무리'], ['갈고리 짐승', '근접 · 빠름'], ['감염 덩굴', '지형'], ['?', '미발견'], ['?', '미발견'], ['?', '미발견']];
      return `<div class="codex">${L.map((l) => `<div class="${l[0] === '?' ? 'unk' : ''}"><b>${l[0]}</b><span>${l[1]}</span></div>`).join('')}</div>`;
    },
    cfg() {
      return `<div class="opt"><span>화면 기울기</span><span class="seg"><span>끔</span><span class="on">보통</span><span>강하게</span></span></div>
        <div class="opt"><span>화면 흔들림</span><span class="seg"><span class="on">켜짐</span><span>꺼짐</span></span></div>
        <div class="opt"><span>자막 크기</span><span class="seg"><span>작게</span><span class="on">보통</span><span>크게</span></span></div>
        <div class="opt"><span>강조색</span><span class="seg"><span class="on">푸른색</span><span>노랑</span><span>호박색</span></span></div>`;
    },
    sound() {
      const s = (k, v) => `<div class="opt"><span>${k}</span><span class="slider"><span class="bar"><i style="width:${v}%"></i><b style="left:${v}%"></b></span>${v}</span></div>`;
      return s('전체', 80) + s('효과음', 70) + s('배경음', 45) + s('대사', 90);
    },
    keys() {
      const L = [['<span class="kc">Esc</span>', '메뉴 열기·닫기'], ['<span class="kc">↑</span><span class="kc">↓</span><span class="kc">←</span><span class="kc">→</span>', '버튼 이동'],
        ['<span class="kc">Enter</span>', '선택'], ['<span class="kc">1</span><span class="kc">2</span><span class="kc">3</span>', '강조색 바꾸기'], ['터치', '버튼 누르기']];
      return `<ul class="list keys">${L.map((l) => `<li><span>${l[0]}</span><span>${l[1]}</span></li>`).join('')}</ul>`;
    },
    alert() {
      const L = [['새 기록', '방 3 전투 기록 2건', 1], ['의뢰', '고용주의 짐 운반 갱신', 1], ['대원', '오팔 체력 절반 이하', 1]];
      return `<ul class="list">${L.map((l) => `<li class="${l[2] ? 'new' : ''}"><span class="k">${l[0]}</span><span>${l[1]}</span></li>`).join('')}</ul>`;
    },
    save() {
      return `<div class="save"><p>저장은 수송선 착륙지에서만 됩니다.</p>
        <div class="slotcard"><b>방 1 착륙지</b><span>감염 구역 · 심도 11 · 제12일</span><time>13:12</time></div>
        <div class="acts"><span>마지막 저장 보기</span></div></div>`;
    },
    exit() {
      return `<div class="save"><p>지금 나가면 마지막 저장 지점<br>(방 1 착륙지, 13:12)부터 다시 시작합니다.</p>
        <div class="acts" style="margin-top:22px"><span>원정으로 돌아가기</span><span class="warn">타이틀로 나가기</span></div></div>`;
    },
  };

  /* ---------- 모양 ---------- */
  const xo = (y) => LA.cx - Math.sqrt(LA.r2 * LA.r2 - (y - LA.cy) ** 2);
  const xi = (y) => LA.cx - Math.sqrt(LA.r1 * LA.r1 - (y - LA.cy) ** 2);
  const rx = (y) => RA.cx + Math.sqrt(RA.r * RA.r - (y - RA.cy) ** 2);
  /* 왼쪽 휜 판: 바깥 위 모서리 16px 깎음, 안쪽 아래 8px 깎음. 반환 = 평면 상자 + 지역 좌표 path */
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
  const BH = 92, BG = 12, BY0 = 124;
  LEFT.forEach((m, k) => { const yt = BY0 + k * (BH + BG); KEYS.push(Object.assign({ kind: 'big', menu: k }, sector(yt, yt + BH))); });
  const SW = 108, SH = 98, SG = 12, SY0 = 236;
  RIGHT.forEach((m, k) => {
    const row = k >> 1, col = k & 1, yt = SY0 + row * (SH + SG);
    const x0 = rx(yt + SH / 2) + 4;
    KEYS.push({ kind: 'sq', menu: 4 + k, x: x0 + col * (SW + SG), y: yt, w: SW, h: SH, d: rectPath(SW, SH, 14, 6) });
  });
  KEYS.push({ kind: 'card', x: 26, y: 584, w: 164, h: 150, d: rectPathL(164, 150, 18, 8) }); // 오른쪽 끝이 오팔 얼굴(화면 x 408)에 닿지 않게 폭 164
  KEYS.push({ kind: 'closek', x: 1384, y: 712, w: 200, h: 56, d: rectPath(200, 56, 12, 6) });
  const CARD = KEYS.length - 2, CLOSE = KEYS.length - 1;

  const holder = { big: $('#leftKeys'), card: $('#leftKeys'), sq: $('#rightKeys'), closek: $('#rightKeys') };
  let cardIdx = 0;
  function cardHTML() {
    const m = SQUAD[cardIdx];
    return `<div class="c-top"><span class="c-port">${m.k}</span><div><div class="c-nm">${m.n}</div><div class="c-role">${m.r}</div></div></div>
      <div class="c-hp"><span>체력</span><b>${m.hp}</b><small>/ ${m.max}</small></div><div class="c-id">${m.id}</div><div class="c-nav">${cardIdx + 1}/4 ▸</div>`;
  }
  KEYS.forEach((K, i) => {
    const w = document.createElement('div');
    w.className = 'kw';
    Object.assign(w.style, { left: f1(K.x) + 'px', top: f1(K.y) + 'px', width: f1(K.w) + 'px', height: f1(K.h + 10) + 'px' });
    let inner = '';
    if (K.kind === 'big') {
      const m = MENU[K.menu];
      const ledX = K.w - (xi(K.y + K.h / 2) - xi(K.y + K.h)) - 22; // 안쪽 휜 가장자리 가까이
      inner = `<span class="k-no" style="left:${f1(xo(K.y + 9) - K.x + 22)}px">${m.no}</span><span class="k-ic"><svg viewBox="0 0 24 24">${ICON[m.id]}</svg></span>
        <span class="k-tx"><b class="k-nm">${m.ko}</b><small class="k-sub">${m.sub}</small></span><i class="k-led" style="left:${f1(Math.max(0, ledX))}px"></i>`;
    } else if (K.kind === 'sq') {
      const m = MENU[K.menu];
      inner = `<span class="k-ic"><svg viewBox="0 0 24 24">${ICON[m.id]}</svg></span><b class="k-nm">${m.ko}</b>${m.badge ? `<span class="k-badge">${m.badge}</span>` : ''}<i class="k-led"></i>`;
    } else if (K.kind === 'card') inner = cardHTML();
    else inner = '<b>돌아가기</b><kbd>Esc</kbd>';
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

  /* ---------- 링·호·눈금·계기·전선 ---------- */
  const ringSvg = $('#ring');
  const mk = (parent, tag, attrs) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); parent.appendChild(e); return e; };
  const arcD = (r, a0, a1, cx = C.x, cy = C.y) => {
    const p = (a) => [cx + Math.cos(a * Math.PI / 180) * r, cy + Math.sin(a * Math.PI / 180) * r];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${f1(x0)} ${f1(y0)} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
  };
  const oa = $('#outerArcs');
  mk(oa, 'path', { class: 'arc big', d: arcD(700, 140, 220) }); mk(oa, 'path', { class: 'arc big', d: arcD(700, -40, 40) });
  mk(oa, 'path', { class: 'arc', d: arcD(470, 150, 210) }); mk(oa, 'path', { class: 'arc', d: arcD(470, -30, 30) });
  mk(oa, 'path', { class: 'arc d', d: arcD(520, 120, 240) }); mk(oa, 'path', { class: 'arc d', d: arcD(520, -60, 60) });
  mk(oa, 'path', { class: 'arc thick', d: arcD(470, 196, 204) }); mk(oa, 'path', { class: 'arc thick', d: arcD(470, -24, -16) });
  mk(oa, 'path', { class: 'arc', d: arcD(600, 60, 120) }); mk(oa, 'path', { class: 'arc', d: arcD(600, 240, 300) });
  // 원 안 격자 (지도 바탕)
  const grid = $('#discGrid');
  for (let k = -6; k <= 6; k++) { mk(grid, 'line', { class: 'grid', x1: C.x + k * 56, y1: 60, x2: C.x + k * 56, y2: 800 }); mk(grid, 'line', { class: 'grid', x1: 440, y1: C.y + k * 56, x2: 1200, y2: C.y + k * 56 }); }
  // 바깥 눈금 (r 400~412, 위아래는 실루엣에 크게 잘림)
  const ticks = $('#ticks');
  for (let k = 0; k < 180; k++) {
    const a = (k / 180) * Math.PI * 2, long = k % 10 === 0;
    const r1 = 414, r2 = long ? 398 : 406;
    mk(ticks, 'line', { class: long ? 'tick l' : 'tick', x1: f1(C.x + Math.cos(a) * r1), y1: f1(C.y + Math.sin(a) * r1), x2: f1(C.x + Math.cos(a) * r2), y2: f1(C.y + Math.sin(a) * r2) });
  }
  $('#codePath').setAttribute('d', `M${C.x - 386} ${C.y} a386 386 0 1 1 772 0 a386 386 0 1 1 -772 0`);
  // 링 표식: 노란 삼각, 십자
  const marks = $('#ringMarks');
  [[-62, 386], [118, 386], [205, 430]].forEach(([a, r]) => {
    const t = a * Math.PI / 180, x = C.x + Math.cos(t) * r, y = C.y + Math.sin(t) * r;
    mk(marks, 'path', { class: 'tri', d: `M${f1(x)} ${f1(y)} l-7 -12 h14 z`, transform: `rotate(${a + 90} ${f1(x)} ${f1(y)})` });
  });
  [[560, 130], [1110, 760], [1220, 470], [430, 300], [1080, 108]].forEach(([x, y]) => mk(marks, 'path', { class: 'cross', d: `M${x - 6} ${y}h12M${x} ${y - 6}v12` }));
  // 심도 계기 (링 오른쪽 호): 9~13, 현재 11
  const ro = $('#readouts');
  const GA0 = -34, GA1 = 34, GR = 372;
  mk(ro, 'path', { class: 'arc', d: arcD(GR, GA0, GA1) });
  [9, 10, 11, 12, 13].forEach((d, i) => {
    const a = (GA0 + (GA1 - GA0) * i / 4) * Math.PI / 180;
    mk(ro, 'line', { class: 'gauge-t', x1: f1(C.x + Math.cos(a) * (GR - 10)), y1: f1(C.y + Math.sin(a) * (GR - 10)), x2: f1(C.x + Math.cos(a) * GR), y2: f1(C.y + Math.sin(a) * GR) });
    const t = mk(ro, 'text', { class: 'gauge-lb', x: f1(C.x + Math.cos(a) * (GR - 30)), y: f1(C.y + Math.sin(a) * (GR - 30) + 5), 'text-anchor': 'middle' }); t.textContent = d;
  });
  const ga = 0 * Math.PI / 180;
  mk(ro, 'path', { class: 'gauge-cur', d: `M${f1(C.x + GR + 4)} ${C.y} l14 -9 v18 z` });
  const gk = mk(ro, 'text', { class: 'gauge-k', x: C.x + GR - 56, y: C.y - 150, 'text-anchor': 'end' }); gk.textContent = '심도 계기';
  // 왼쪽 호: 감염도
  mk(ro, 'path', { class: 'arc', d: arcD(GR, 160, 200) });
  mk(ro, 'path', { class: 'acc-arc', 'stroke-width': 4, d: arcD(GR, 185.2, 200) });
  const ik = mk(ro, 'text', { class: 'gauge-k', x: C.x - GR + 22, y: C.y + 150 }); ik.textContent = '감염도 37%';
  void ga;
  // 버튼 ↔ 링 전선
  const wires = [];
  KEYS.forEach((K, i) => {
    if (K.kind !== 'big' && !(K.kind === 'sq' && (K.menu - 4) % 2 === 0)) return;
    let x0, y0, x1, y1;
    if (K.kind === 'big') { y0 = K.cy; x0 = xi(y0) + 6; const a = Math.asin((y0 - C.y) / 420); x1 = C.x - Math.cos(a) * 420; y1 = C.y + Math.sin(a) * 420; }
    else { y0 = K.cy; x0 = K.x - 6; const a = Math.asin((y0 - C.y) / 420); x1 = C.x + Math.cos(a) * 420; y1 = C.y + Math.sin(a) * 420; }
    const mxp = (x0 + x1) / 2;
    const p = mk(ringSvg, 'path', { class: 'wire', d: `M${f1(x0)} ${f1(y0)} H${f1(mxp)} L${f1(x1)} ${f1(y1)}` });
    const n = mk(ringSvg, 'circle', { class: 'wnode', cx: f1(x1), cy: f1(y1), r: 3 });
    wires.push({ i, p, n, row: K.kind === 'sq' ? (K.menu - 4) >> 1 : -1 });
  });

  /* ---------- 실루엣: 윤곽선·마스크·잘린 자리 표시 ---------- */
  $('#silLine').setAttribute('d', SIL); $('#silGlow').setAttribute('d', SIL);
  const silSvg = $('#sil');
  // 손잡이/화면 경계: 버튼 판을 따라 휜 아주 옅은 점선 2줄
  mk(silSvg, 'path', { class: 'sep', d: `M${f1(LA.cx - Math.sqrt(1022 ** 2 - (110 - 430) ** 2))} 110 A1022 1022 0 0 0 ${f1(LA.cx - Math.sqrt(1022 ** 2 - (750 - 430) ** 2))} 750` });
  mk(silSvg, 'path', { class: 'sep', d: `M${f1(RA.cx + Math.sqrt(1022 ** 2 - (110 - 430) ** 2))} 110 A1022 1022 0 0 1 ${f1(RA.cx + Math.sqrt(1022 ** 2 - (750 - 430) ** 2))} 750` });
  // 링이 잘린 자리: 현(chord) 구간을 조금 밝게 + 양 끝 짧은 표식
  const half = Math.sqrt(C.r * C.r - (C.y - TOP) ** 2);
  [TOP, BOT].forEach((y, k) => {
    mk(silSvg, 'path', { class: 'cut-seg', d: `M${f1(C.x - half)} ${y} H${f1(C.x + half)}` });
    [-1, 1].forEach((s) => mk(silSvg, 'path', { class: 'cut', d: `M${f1(C.x + s * half)} ${y + (k ? -9 : 9)} V${y}` }));
  });
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
    try { localStorage.setItem('lb011-theme', t); } catch (e) { /* file:// */ }
    if (flick && motion && isOpen) $('#L-holo').animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }, { opacity: .7 }, { opacity: 1 }], { duration: 280, easing: 'steps(4)' });
  }
  let theme = Q.get('theme');
  if (!theme) { try { theme = localStorage.getItem('lb011-theme'); } catch (e) { /* */ } }
  if (!/^k[123]$/.test(theme || '')) theme = 'k1';
  setTheme(theme, false);
  if (Q.get('clean') === '1') document.body.classList.add('clean');
  if (STILL) document.body.classList.add('still');

  /* ---------- 화면 내용 + 선택 ---------- */
  let active = Math.max(0, Math.min(11, Q.has('sel') && num('sel', 2) < 12 ? num('sel', 2) | 0 : 2));
  function showScreen(mi, animate) {
    const m = MENU[mi];
    $('#scrNo').textContent = m.no; $('#scrTitle').textContent = m.ko; $('#scrCode').textContent = m.code;
    const body = $('#scrBody');
    body.innerHTML = SCREENS[m.id]();
    if (animate && motion) {
      body.classList.remove('swap-in'); void body.offsetWidth; body.classList.add('swap-in');
      $('#pSweep').animate([{ top: '0px', opacity: 1 }, { top: '500px', opacity: .2 }], { duration: 360, easing: 'cubic-bezier(.4,0,.2,1)' });
    }
  }
  function setActive(mi, animate) {
    active = mi;
    KEYS.forEach((K) => K.el.classList.toggle('active', K.menu === mi));
    wires.forEach((w) => {
      const K = KEYS[w.i];
      const on = K.menu === mi || (w.row >= 0 && (mi - 4) >> 1 === w.row && mi >= 4);
      w.p.classList.toggle('on', on); w.n.classList.toggle('on', on);
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
     ① 실루엣 윤곽 0~760ms (위 가운데서 양옆으로 그려짐) ② 떠오름 0~1000ms ③ 유리 채움 520~980ms
     ④ 원: 링이 돌며 커짐 + 잘린 자리 표시 760~1500ms ⑤ 버튼: 왼쪽 판 위→아래, 오른쪽 묶음 위→아래 1100~1950ms */
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
    $$('#sil .sep').forEach((el) => add(el, [{ opacity: 0 }, { opacity: 1 }], 700, 260, 'steps(4, end)'));
    add($('#rise'), [
      { transform: 'translate3d(0, 110px, -240px) rotateX(22deg) scale(.92)', opacity: 0 },
      { transform: 'translate3d(0, 110px, -240px) rotateX(22deg) scale(.92)', opacity: 1, offset: .12 },
      { transform: 'translate3d(0, -8px, 10px) rotateX(-1.4deg) scale(1.004)', offset: .78 },
      { transform: 'translate3d(0, 2px, -2px) rotateX(.3deg) scale(1)', offset: .9 },
      { transform: 'none', opacity: 1 }], 0, 1000, 'cubic-bezier(.45,.05,.3,1)');
    add($('#floor'), [{ opacity: 0 }, { opacity: 1 }], 420, 700, 'ease-out');
    add($('#glass'), [{ clipPath: 'inset(0 50% 0 50%)', opacity: 0 }, { clipPath: 'inset(0 50% 0 50%)', opacity: 1, offset: .1 },
      { clipPath: 'inset(0 0% 0 0%)', opacity: .85, offset: .7 }, { opacity: .45, offset: .78 }, { opacity: 1, offset: .86 }, { clipPath: 'inset(0 0% 0 0%)', opacity: 1 }], 520, 460, 'linear');
    add($('#sweep'), [{ top: '430px', opacity: 0 }, { top: '430px', opacity: 1, offset: .1 }, { top: '96px', opacity: .8, offset: .5 }, { top: '764px', opacity: 0 }], 620, 560, 'cubic-bezier(.4,0,.2,1)');
    Object.entries(Z).forEach(([id, z]) => add($('#' + id), [{ translate: '0 0 0px' }, { translate: `0 0 ${z * 1.25}px`, offset: .7 }, { translate: `0 0 ${z}px` }], 700, 560, OUT));
    add(ringSvg, [{ opacity: 0, transform: 'scale(.78) rotate(-36deg)', transformOrigin: '820px 430px' }, { opacity: 1, offset: .3 }, { opacity: 1, transform: 'scale(1) rotate(0deg)', transformOrigin: '820px 430px' }], 760, 740, OUT);
    $$('#sil .cut, #sil .cut-seg').forEach((el, k) => add(el, [{ opacity: 0 }, { opacity: 1, offset: .4 }, { opacity: .2, offset: .6 }, { opacity: 1 }], 1240 + k * 30, 220, 'steps(5, end)'));
    [$('#title'), $('#status'), $('#clock'), $('.scr-head'), $('#scrBody'), $('#scrPill'), $('#hints')].forEach((el, i) =>
      add(el, [{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)' }], 1000 + i * 60, 320, 'steps(8, end)'));
    const ORDER = [0, 1, 2, 3, CARD, 4, 5, 6, 7, 8, 9, 10, 11, CLOSE];
    ORDER.forEach((i, k) => {
      const left = i < 4 || i === CARD;
      const kk = left ? k : k - 5;
      add(KEYS[i].wrap, [
        { transform: `translate3d(${left ? -40 : 40}px,-18px,150px) scale(1.12)`, opacity: 0 }, { opacity: 1, offset: .28 },
        { transform: 'translate3d(0,4px,-12px) scale(.98)', offset: .6 }, { transform: 'translate3d(0,-1px,4px) scale(1.006)', offset: .8 }, { transform: 'none', opacity: 1 }],
      (left ? 1100 : 1180) + kk * (left ? 80 : 45), 480, SNAP);
    });
    wires.forEach((w, k) => [w.p, w.n].forEach((el) => add(el, [{ opacity: 0 }, { opacity: 1, offset: .5 }, { opacity: .3, offset: .7 }, { opacity: 1 }], 1500 + k * 30, 200, 'steps(5, end)')));
    return T;
  }
  $('#silLine').setAttribute('pathLength', '1'); $('#silGlow').setAttribute('pathLength', '1');
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

  /* ---------- 떠 있음 + 마우스 시차 ----------
     기본 자세 #screen CSS (rotateY 7°, rotateX 4°). #float 에 흔들림(위아래 ±5px, 회전 ±0.6°)과 마우스 기울기(Y ±4°, X ±2.5°)를 더한다. */
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
    floatEl.style.transform = `translate3d(${(-mx * 10).toFixed(2)}px, ${(by - my * 6).toFixed(2)}px, ${kz.toFixed(2)}px) rotateY(${(mx * 4 + ry).toFixed(3)}deg) rotateX(${(-my * 2.5 + rxx).toFixed(3)}deg)`;
    floorEl.style.transform = `translate(${(-mx * 8).toFixed(2)}px, 0) scaleX(${(1 - by * 0.004).toFixed(4)})`;
    floorEl.style.filter = `brightness(${(1 - by * 0.03).toFixed(3)})`;
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

  /* ---------- 검사: 인물 얼굴 가림 / 글자 넘침 / 위치 ----------
     불투명 물리 버튼 면(.kface)이 얼굴과 겹치면 HIT. 반투명 글자(HOLO)·유리(GLASS)는 참고 수치. */
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
  /* 글자 넘침: 각 버튼 면 안 글자 상자의 네 모서리가 실제 모양(path) 안 4px 여백 안에 있는지 (변환 전 레이아웃 좌표) */
  const cv = document.createElement('canvas').getContext('2d');
  function overflowCheck() {
    const bad = [];
    KEYS.forEach((K, i) => {
      const face = K.el.querySelector('.kface');
      const P = new Path2D(K.d);
      cv.lineWidth = 8;
      const inside = (x, y) => cv.isPointInPath(P, x, y) && !cv.isPointInStroke(P, x, y);
      const fr = face.getBoundingClientRect();
      const sc = fr.width / face.offsetWidth; // 3D 변환 영향 제거용 근사 대신 offset 좌표 사용
      void sc;
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
    // 원 안 화면: 내용이 본문 칸(492×400)을 넘는지
    const body = $('#scrBody');
    if (body.scrollHeight > body.offsetHeight + 1 || body.scrollWidth > body.offsetWidth + 1) bad.push(`screen:${MENU[active].id}(${body.scrollWidth}x${body.scrollHeight})`);
    return bad.length ? bad.join(',') : 'none';
  }
  function guardCheck() {
    const hard = hitList('.kface'), soft = hitList('[data-glass]:not(#glass)'), glass = hitList('#glass');
    const g = rectOf($('#glass'));
    const ringR = rectOf($('#disc'));
    $('#check').textContent = (hard.length ? 'CHECK HIT ' + hard.join(', ') : 'CHECK OK')
      + ' | HOLO ' + (soft.length ? soft.join(', ') : 'none') + ' | GLASS ' + (glass.length ? glass.join(', ') : 'none')
      + ` | SCREEN ${Math.round(g.x)},${Math.round(g.y)} ${Math.round(g.w)}x${Math.round(g.h)} center ${Math.round(g.x + g.w / 2)},${Math.round(g.y + g.h / 2)}`
      + ` | DISC ${Math.round(ringR.x)},${Math.round(ringR.y)},${Math.round(ringR.w)},${Math.round(ringR.h)}`
      + ' | KEYS ' + kb.map((b) => { const r = rectOf(b.querySelector('.kface')); return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`; }).join(';')
      + ' | OVERFLOW ' + overflowCheck();
    if (Q.get('guard') === '1') FACES.forEach((f) => { const d = document.createElement('div'); d.className = 'guard'; Object.assign(d.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' }); stage.appendChild(d); });
  }
  window.__overflowAll = () => { const out = []; for (let m = 0; m < MENU.length; m++) { setActive(m, false); out.push(MENU[m].id + ':' + overflowCheck()); } return out.join(' | '); };

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
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
})();
