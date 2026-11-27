/* UIDiorama HUD 001 — 전투 HUD 동작 (실제 전투 계산 없음: 고정 값 + 눌렀을 때 연출).
   수치 출처: generation.md 대응표. 효과음: window.LBSFX (js/sfx.js, 022 사본 — clack·release = 018 소리).
   주소 옵션: ?theme=k1|k2|k3  ?actor=topaz|opal|nemophila|oira  ?enemy=0~3  ?still=1(움직임 멈춤)  ?roll=1(결과 표시 고정) */
(function () {
  'use strict';
  const SFX = window.LBSFX || { play() {}, setMuted() {}, onMute() {}, unlock() {}, muted: true };
  const Q = new URLSearchParams(location.search);
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---------- 데이터 (generation.md 출처 표 참조) ---------- */
  // 얼굴: 기획 폴더 presentation/trailer_deck/002_PV/images/*_front.png (턴어라운드 정면 오려낸 것) 사본. cx·cy = 머리 중심, hw = 머리 폭 (원본 px)
  const CREW = [
    { id: 'topaz', name: '토파즈', face: { src: 'images/face_topaz_src.png', w: 356, h: 1000, cx: 178, cy: 92, hw: 132 },
      hp: 11, cur: 9, acc: 4, agi: 3, tgh: 3, save: 5, inv: 5, dd: 3, crit: 1, react: 2, move: 8,
      ranged: { n: '침해탄', r: 10, a: 2, s: 4 }, melee: { n: '칼날 스태프', a: 3, s: 4 },
      tac: [{ n: '차단막', i: '▣' }], skills: [{ n: '침해 사격', i: '◈' }, { n: '술식 붕괴', i: '╳' }, { n: '가속 술식', i: '»' }, { n: '방호 술식', i: '♦' }],
      gauge: 2, rtok: 1 },
    { id: 'opal', name: '오팔', face: { src: 'images/face_opal_src.png', w: 451, h: 1000, cx: 226, cy: 100, hw: 150 },
      hp: 8, cur: 8, acc: 5, agi: 4, tgh: 2, save: 6, inv: 4, dd: 2, crit: 2, react: 1, move: 8,
      ranged: { n: '굴절 광선', r: 16, a: 4, s: 5 }, melee: { n: '단검', a: 2, s: 3 },
      tac: [{ n: '마나 집중', i: '◉' }], skills: [{ n: '과부하 광선', i: '♨' }, { n: '분광 폭발', i: '※' }, { n: '환각 섬광', i: '☀' }],
      gauge: 3, rtok: 0 },
    { id: 'nemophila', name: '네모필라', face: { src: 'images/face_nemo_src.png', w: 372, h: 1000, cx: 186, cy: 112, hw: 150 },
      hp: 9, cur: 6, acc: 5, agi: 6, tgh: 2, save: 6, inv: 0, dd: 2, crit: 3, react: 2, move: 9,
      ranged: { n: '투척 단검', r: 6, a: 3, s: 3 }, melee: { n: '단검', a: 4, s: 3 },
      tac: [{ n: '은신', i: '♠' }, { n: '연막탄', i: '≈' }], skills: [{ n: '암습', i: '†' }, { n: '약점 찌르기', i: '‡' }, { n: '그림자 이탈', i: '↗' }, { n: '독날', i: '♣' }],
      gauge: 1, rtok: 1 },
    { id: 'oira', name: '오이라', face: { src: 'images/face_oira_src.png', w: 561, h: 1000, cx: 280, cy: 175, hw: 230 },
      hp: 4, cur: 4, acc: 2, agi: 3, tgh: 2, save: 6, inv: 0, dd: 1, crit: 1, react: 1, move: 6, noDeath: true,
      ranged: null, melee: { n: '맨손', a: 1, s: 1 },
      tac: [], skills: [], gauge: 0, rtok: 0 },
  ];
  // 갈고리 짐승 (엔진 기본 적). 위치 = 배경 그림 속 괴물 4마리 (평면 좌표). 거리·체력 손실·엄폐는 시안용 임의 값
  const FOE = { name: '갈고리 짐승', hp: 8, acc: 4, agi: 3, tgh: 3, save: 6, inv: 0, dd: 2, morale: 3, charge: 8,
    melee: { n: '갈고리', a: 3, s: 4 }, tags: ['생명체', '몬스터', '생체'], trait: '공포 유발' };
  const ENEMIES = [
    { k: 'A', x: 1006, y: 268, dist: 9, cur: 8, cover: false },
    { k: 'B', x: 1276, y: 196, dist: 14, cur: 8, cover: true },
    { k: 'C', x: 1262, y: 336, dist: 11, cur: 5, cover: false },
    { k: 'D', x: 1352, y: 486, dist: 8, cur: 8, cover: false },
  ];
  // 행동 순서: 민첩 높은 순 (네모필라 6 > 오팔 4 > 나머지 3). 민첩 3 동률의 순서는 미정 → 시안에서는 아군·적 번갈아 둠
  const ORDER = [
    { t: 'c', i: 2 }, { t: 'c', i: 1 }, { t: 'e', i: 0 }, { t: 'c', i: 0 }, { t: 'e', i: 1 }, { t: 'c', i: 3 }, { t: 'e', i: 2 }, { t: 'e', i: 3 },
  ];

  /* 공격 굴림 기준선: 명중 − 대상 민첩 → +3↑ 2+ / +1·+2 3+ / 0 4+ / −1·−2 5+ / −3↓ 6+ */
  const thresh = (d) => (d >= 3 ? 2 : d >= 1 ? 3 : d === 0 ? 4 : d >= -2 ? 5 : 6);
  const pct = (t) => Math.round(((7 - t) / 6) * 100);
  const sgn = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + -n : '0');

  let actor = Math.max(0, CREW.findIndex((c) => c.id === (Q.get('actor') || 'opal')));
  let target = Math.min(3, Math.max(0, +(Q.get('enemy') ?? 2)));
  let tok = null; // 현재 대원 토큰 { tac, act }
  let focus = 0, buttons = [];

  /* ---------- 얼굴 ---------- */
  function faceStyle(f, box) {
    const s = box / f.hw;
    return `background-image:url('${f.src}');background-size:${(f.w * s).toFixed(1)}px ${(f.h * s).toFixed(1)}px;background-position:${(box / 2 - f.cx * s).toFixed(1)}px ${(box / 2 - f.cy * s).toFixed(1)}px`;
  }
  const FOE_ICON = '<svg viewBox="0 0 24 24"><path d="M4 18c2-6 5-9 8-9s6 3 8 9"/><path d="M9 9c-1-3 0-5 3-6 3 1 4 3 3 6"/><path d="M6 18l-2 3M18 18l2 3"/></svg>';

  /* ---------- 행동 순서 띠 ---------- */
  function renderOrder() {
    const list = $('#orderList'); list.innerHTML = '';
    const nowIdx = ORDER.findIndex((o) => o.t === 'c' && o.i === actor);
    ORDER.forEach((o, k) => {
      const li = el('li', 'oc');
      if (o.t === 'c') {
        const c = CREW[o.i];
        li.innerHTML = `<div class="oc-face" style="${faceStyle(c.face, 34)}"></div><span class="oc-ag">${c.agi}</span><span class="oc-nm">${c.name}</span>`;
      } else {
        li.classList.add('foe');
        li.innerHTML = `<div class="oc-face">${FOE_ICON}</div><span class="oc-ag">${FOE.agi}</span><span class="oc-nm">짐승 ${ENEMIES[o.i].k}</span>`;
        if (o.i === target) li.classList.add('tgt');
      }
      if (k < nowIdx) li.classList.add('done');
      if (k === nowIdx) li.classList.add('now');
      li.title = '민첩 ' + (o.t === 'c' ? CREW[o.i].agi : FOE.agi);
      list.appendChild(li);
    });
  }

  /* ---------- 대원 카드 ---------- */
  const segs = (n, on, cls = '') => Array.from({ length: n }, (_, i) => `<i class="${i < on ? 'on' : ''} ${cls}"></i>`).join('');
  function coins(n, used, cls) { return Array.from({ length: n }, (_, i) => `<span class="coin ${cls} ${i < used ? 'used' : ''}"></span>`).join(''); }
  function renderCrew() {
    const box = $('#crew'); box.innerHTML = '';
    const nowIdx = ORDER.findIndex((o) => o.t === 'c' && o.i === actor);
    CREW.forEach((c, i) => {
      const k = ORDER.findIndex((o) => o.t === 'c' && o.i === i);
      const done = k < nowIdx, now = i === actor;
      const usedTac = now ? 1 - tok.tac : done ? 1 : 0, usedAct = now ? 3 - tok.act : done ? 2 : 0;
      const card = el('div', 'cr-card gp' + (now ? ' now' : ''));
      card.innerHTML = `<div class="scan"></div><span class="cr-no">${i + 1}</span>
        <div class="cr-top"><div class="cr-face" style="${faceStyle(c.face, 56)}"></div>
          <div class="cr-id"><b>${c.name}</b><span>명중 ${c.acc} · 민첩 ${c.agi}</span>${now ? '<span class="cr-now">▶ 행동 중</span>' : c.noDeath ? '<span>사망 없음</span>' : done ? '<span>차례 끝</span>' : '<span>대기</span>'}</div></div>
        <div class="cr-hp"><span>체력</span><div class="bar">${segs(c.hp, c.cur)}</div><em>${c.cur}/${c.hp}</em></div>
        <div class="cr-tg"><span>견고함</span><div class="pips">${segs(4, c.tgh)}</div><em>${c.tgh} · 장갑 ${c.save}+</em></div>
        <div class="cr-tk"><span class="coins">${coins(1, usedTac, 'tac')}</span><span class="sep"></span><span class="coins">${coins(3, usedAct, '')}</span><span class="sep"></span>
          <span class="rl">대응</span><span class="gauge">${segs(4, c.gauge)}</span><span class="coins">${coins(c.react, c.react - c.rtok, 'react')}</span></div>`;
      card.title = `${c.name} — 체력 ${c.cur}/${c.hp} · 견고함 ${c.tgh} · 장갑 ${c.save}+${c.inv ? ' · 보호막 ' + c.inv + '+' : ''} · 방어 수 ${c.dd} · 대응 게이지 ${c.gauge}/4 (토큰 ${c.rtok}/${c.react})`;
      card.addEventListener('click', () => { SFX.unlock(); setActor(i); });
      box.appendChild(card);
    });
    // 행동 묶음 머리의 토큰 (전술행동 → 행동 순서)
    $('#coinTac').innerHTML = coins(1, 1 - tok.tac, 'tac');
    $('#coinAct').innerHTML = coins(3, 3 - tok.act, '');
  }

  /* ---------- 현재 대원 상세 ---------- */
  function renderDetail() {
    const c = CREW[actor];
    $('#dtName').textContent = c.name;
    const rows = [
      ['원거리', c.ranged ? `${c.ranged.n} <b>${c.ranged.r}</b>m · 타수 <b>${c.ranged.a}</b> 위력 <b>${c.ranged.s}</b>` : '없음'],
      ['근접', `${c.melee.n} · 타수 <b>${c.melee.a}</b> 위력 <b>${c.melee.s}</b>`],
      ['이동량', `<b>${c.move}</b>m (남음 <b>${c.move}</b>m)`],
      ['방어', `장갑 <b>${c.save}</b>+${c.inv ? ` · 보호막 <b>${c.inv}</b>+` : ''} · 방어 수 <b>${c.dd}</b>`],
      ['치명 피해', `+<b>${c.crit}</b> · 대응 최대 <b>${c.react}</b>`],
    ];
    $('#dtRows').innerHTML = rows.map(([a, b]) => `<div class="dr"><span>${a}</span><span>${b}</span></div>`).join('');
  }

  /* ---------- 적 정보 판 + 지시선 ---------- */
  function weapon(c, kind) { return kind === 'melee' || !c.ranged ? { ...c.melee, melee: true } : c.ranged; }
  function renderEnemy() {
    const e = ENEMIES[target], c = CREW[actor];
    $('#enName').textContent = `${FOE.name} ${e.k}`;
    $('#enTags').innerHTML = FOE.tags.map((t) => `<span>${t}</span>`).join('') + `<span class="warn">${FOE.trait} — 피해를 주면 사기 −1</span>`;
    $('#enHpBar').innerHTML = segs(FOE.hp, e.cur);
    $('#enHp').textContent = `${e.cur}/${FOE.hp}`;
    const st = [['명중', FOE.acc], ['민첩', FOE.agi], ['견고함', FOE.tgh], ['장갑', FOE.save + '+'], ['방어 수', FOE.dd], ['사기', FOE.morale]];
    $('#enStats').innerHTML = st.map(([a, b]) => `<div class="st"><span>${a}</span><b>${b}</b></div>`).join('');
    $('#enWeak').innerHTML = `보호막 없음 · <b>[약점 노출]</b> 상태가 되면 방어 수 −1${e.cover ? ' · 지금 엄폐 중(방패 +1)' : ''}`;
    // 명중 예측 — 현재 대원의 원거리 무기(없으면 근접)
    const w = weapon(c, 'ranged'), d = c.acc - FOE.agi, t = thresh(d), dmg = Math.max(1, w.s - FOE.tgh);
    $('#ehWho').textContent = `${c.name} · ${w.n}`;
    $('#ehRange').textContent = w.melee ? `거리 ${e.dist}m / 근접` : `거리 ${e.dist}m / 사거리 ${w.r}m`;
    $('#ehTh').textContent = t + '+';
    $('#ehLine1').textContent = `명중 ${c.acc} − 민첩 ${FOE.agi} = ${sgn(d)}`;
    $('#ehLine2').textContent = `주사위 1개 성공 ${pct(t)}% · 타수 ${w.a}`;
    $('#ehLine3').textContent = `피해 위력 ${w.s} − 견고함 ${FOE.tgh} = ${dmg} · 치명 +${c.crit}`;
    $('#ehLine4').textContent = `방어 수 ${FOE.dd} · 장갑 ${FOE.save}+${e.cover ? ' · 엄폐 방패 +1' : ''}`;
    drawLeader();
    renderOrder();
  }
  function drawLeader() {
    const e = ENEMIES[target];
    const sx = 1488, sy = 330; // 적 정보 판 왼쪽 위 테두리
    const mx = e.x + 70 + (sy - e.y) * 0.25;
    const pts = `${sx},${sy} ${Math.max(mx, e.x + 50)},${sy} ${e.x + 34 * 0.72},${e.y - 34 * 0.72}`;
    $('#ldLine').setAttribute('points', pts);
    $('#ldDot').setAttribute('cx', sx); $('#ldDot').setAttribute('cy', sy);
    $('#reticle').setAttribute('transform', `translate(${e.x} ${e.y})`);
  }

  /* ---------- 미니맵 (022 미니맵 표현) ---------- */
  function renderMap() {
    $('#mm').innerHTML = `
      <path class="cor" d="M 64 74 H 104 M 192 74 H 228 M 148 46 V 18" />
      <path class="cor fog" d="M 148 102 V 132" />
      <g class="room"><rect x="16" y="52" width="48" height="44" /><text x="40" y="79" text-anchor="middle">B-1</text></g>
      <g class="room cur"><rect x="104" y="46" width="88" height="56" /></g>
      <g class="room"><rect x="228" y="56" width="50" height="36" /><text x="253" y="79" text-anchor="middle">B-3</text></g>
      <g class="room"><rect x="126" y="2" width="44" height="16" /></g>
      <g class="fog"><rect x="124" y="132" width="48" height="16" /></g>
      <circle class="ally" cx="122" cy="88" r="3" /><circle class="ally" cx="130" cy="92" r="3" /><circle class="ally" cx="138" cy="88" r="3" />
      <circle class="me" cx="126" cy="80" r="3.4" /><circle class="ring" cx="126" cy="80" r="3.4" />
      <circle class="foe" cx="160" cy="60" r="3" /><circle class="foe" cx="174" cy="56" r="3" /><circle class="foe" cx="172" cy="68" r="3" /><circle class="foe" cx="182" cy="80" r="3" />
      <text x="290" y="144" text-anchor="end" style="font-size:12px;fill-opacity:.8">아군 4 · 적 4</text>`;
  }

  /* ---------- 행동 버튼 ---------- */
  const HEX = 'M 23 0.5 H 69 L 91.5 40 L 69 79.5 H 23 L 0.5 40 Z';
  const TAC_KEYS = ['Q', 'W', 'E', 'R', 'T'], ACT_KEYS = ['A', 'S', 'D', 'F', 'G', 'H', 'J'];
  function hexBtn(b) {
    const w = el('div', 'hx' + (b.skill ? ' skill' : '') + (b.off ? ' off' : ''));
    w.tabIndex = -1;
    w.innerHTML = `<div class="hsh"></div><svg class="hso" viewBox="0 0 92 80"><path d="${HEX}"/></svg><div class="hed"></div>
      <div class="hfa"><span class="hk">${b.key}</span><span class="hi">${b.i}</span><span class="hn">${b.n}</span><span class="hc">${b.c}</span><span class="hled"></span></div>`;
    w.title = b.tip || b.n;
    return w;
  }
  function renderActs() {
    const c = CREW[actor];
    const tac = [
      { n: '이동', i: '➜', c: `이동량 ${c.move}m`, kind: 'move' },
      null,
      { n: '질주', i: '⇉', c: '전술 1', kind: 'tac' },
      { n: '응급치료', i: '＋', c: '전술 1', kind: 'tac' },
      ...c.tac.map((s) => ({ n: s.n, i: s.i, c: '전술 1', kind: 'tac', skill: true })),
    ];
    const act = [
      { n: '사격', i: '⊙', c: '행동 1', kind: 'atk', w: 'ranged', off: !c.ranged },
      { n: '근접', i: '⚔', c: '행동 1', kind: 'atk', w: 'melee' },
      { n: '차지', i: '⇗', c: '행동 1', kind: 'atk', w: 'melee' },
      null,
      ...c.skills.map((s) => ({ n: s.n, i: s.i, c: '행동 1', kind: 'atk', w: 'ranged', skill: true })),
    ];
    buttons = [];
    const fill = (row, arr, keys) => {
      row.innerHTML = ''; let k = 0;
      arr.forEach((b) => {
        if (!b) { row.appendChild(el('div', 'gap')); return; }
        b.key = keys[k++]; const h = hexBtn(b); b.el = h; row.appendChild(h); buttons.push(b);
        h.querySelector('.hfa').addEventListener('pointerenter', () => { if (!h.classList.contains('hot')) SFX.play('tick'); h.classList.add('hot'); });
        h.querySelector('.hfa').addEventListener('pointerleave', () => h.classList.remove('hot'));
        h.querySelector('.hfa').addEventListener('pointerdown', (e) => { e.preventDefault(); SFX.unlock(); setFocus(buttons.indexOf(b)); press(b); });
      });
    };
    fill($('#rowTac'), tac, TAC_KEYS);
    fill($('#rowAct'), act, ACT_KEYS);
    // 차례 종료
    const end = { n: '차례 종료', i: '', c: '', kind: 'end', key: '' };
    const ew = $('#endWrap'); ew.innerHTML = '';
    const h = el('div', 'hx');
    h.innerHTML = `<div class="hsh"></div><svg class="hso" viewBox="0 0 244 96"><path d="M 29 0.5 H 215 L 243.5 48 L 215 95.5 H 29 L 0.5 48 Z"/></svg><div class="hed"></div>
      <div class="hfa"><span class="hn">차례 종료</span><kbd>Space</kbd><span class="hled"></span></div>`;
    end.el = h; ew.appendChild(h);
    h.querySelector('.hfa').addEventListener('pointerenter', () => { SFX.play('tick'); h.classList.add('hot'); });
    h.querySelector('.hfa').addEventListener('pointerleave', () => h.classList.remove('hot'));
    h.querySelector('.hfa').addEventListener('pointerdown', (e) => { e.preventDefault(); SFX.unlock(); press(end); });
    buttons.end = end;
    focus = Math.min(focus, buttons.length - 1);
    setFocus(buttons.findIndex((b) => b.n === '사격' && !b.off) >= 0 && focus === 0 ? buttons.findIndex((b) => b.n === (c.ranged ? '사격' : '근접')) : focus, true);
  }
  function setFocus(i, silent) {
    if (i < 0 || i >= buttons.length) return;
    if (!silent && i !== focus) SFX.play('tick');
    buttons.forEach((b, k) => b.el.classList.toggle('focus', k === i));
    focus = i;
  }

  function press(b) {
    const h = b.el;
    h.classList.add('pressed'); SFX.play('clack');
    setTimeout(() => { h.classList.remove('pressed'); SFX.play('release'); act(b); }, 130);
  }
  function act(b) {
    if (b.off) { toast(`${b.n}: 쓸 수 있는 무기가 없음`); return; }
    if (b.kind === 'end') { nextActor(); return; }
    if (b.kind === 'move') { toast(`이동 — 이동량 ${CREW[actor].move}m 안에서 나누어 이동`); return; }
    const need = b.kind === 'tac' ? 'tac' : 'act';
    if (tok[need] <= 0) { toast(`${b.n}: ${need === 'tac' ? '전술행동' : '행동'} 토큰 없음`); return; }
    tok[need] -= 1; renderCrew();
    if (b.kind === 'atk') showRoll(b); else toast(`${b.n} — 전술행동 토큰 1 사용`);
  }

  /* ---------- 주사위·명중 결과 (고정 값 연출) ---------- */
  const ATK_DICE = [6, 4, 2, 5, 3, 1], CHAIN = [3], DEF_DICE = [6, 1, 4];
  let rollTimer = [];
  function showRoll(b) {
    rollTimer.forEach(clearTimeout); rollTimer = [];
    const c = CREW[actor], e = ENEMIES[target], w = weapon(c, b.w);
    const t = thresh(c.acc - FOE.agi);
    const atk = ATK_DICE.slice(0, w.a);
    const chain = CHAIN.slice(0, atk.filter((v) => v === 6).length); // 자연 6마다 1개 추가 (추가분은 연쇄 없음)
    const all = [...atk.map((v) => ({ v })), ...chain.map((v) => ({ v, chain: true }))];
    all.forEach((d) => { d.cls = d.v === 6 ? 'crit' : d.v !== 1 && d.v >= t ? 'ok' : 'miss'; });
    let crit = all.filter((d) => d.cls === 'crit').length, norm = all.filter((d) => d.cls === 'ok').length;
    const ndef = Math.max(0, FOE.dd);
    const def = DEF_DICE.slice(0, ndef).map((v) => ({ v, cls: v === 6 ? 'crit' : v !== 1 && v >= FOE.save ? 'ok' : 'miss' }));
    let cs = def.filter((d) => d.cls === 'crit').length, ns = def.filter((d) => d.cls === 'ok').length + (e.cover ? 1 : 0);
    // 상쇄 (적 방어 = 받는 피해가 가장 작아지게): 치명 방패 → 치명 공격, 일반 방패 2 → 치명 공격, 일반 방패 1 → 일반 공격
    let cancelTxt = [];
    while (cs > 0 && (crit > 0 || norm > 0)) { if (crit > 0) { crit--; cancelTxt.push('치명 방패 → 치명 공격'); } else { norm--; cancelTxt.push('치명 방패 → 일반 공격'); } cs--; }
    while (ns >= 2 && crit > 0) { crit--; ns -= 2; cancelTxt.push('일반 방패 2 → 치명 공격'); }
    while (ns > 0 && norm > 0) { norm--; ns--; cancelTxt.push('일반 방패 → 일반 공격'); }
    const per = Math.max(1, w.s - FOE.tgh), total = norm * per + crit * (per + c.crit);
    const left = Math.max(0, e.cur - total);
    const R = $('#roll');
    R.innerHTML = `<div class="rl-hd"><span>${c.name} · ${b.n}${b.skill ? ` (${w.n})` : ''} → ${FOE.name} ${e.k}</span><span>${t}+</span></div>
      <div class="rl-row" id="r1"><span>공격 굴림</span>${all.map((d) => `<i class="die ${d.cls} ${d.chain ? 'chain' : ''}">${d.v}</i>`).join('')}<em>${chain.length ? '6 → 연쇄 +' + chain.length : ''}</em></div>
      <div class="rl-row" id="r2"><span>방어 굴림</span>${def.map((d) => `<i class="die def ${d.cls}">${d.v}</i>`).join('')}${e.cover ? '<i class="die def ok">엄</i>' : ''}<em>장갑 ${FOE.save}+</em></div>
      <div class="rl-row" id="r3"><span>상쇄</span><em style="margin-left:0">${cancelTxt.join(' · ') || '지운 공격 없음'}</em></div>
      <div class="rl-dmg" id="r4"><b>${total}</b><span>피해 (일반 ${norm}×${per}${crit ? ` + 치명 ${crit}×${per + c.crit}` : ''}) · 체력 ${e.cur} → ${left}</span></div>
      <div class="rl-note">시안 연출 — 주사위 값은 고정</div>`;
    const x = Math.max(500, e.x - 700), y = Math.min(560, Math.max(300, e.y + 150));
    R.style.left = x + 'px'; R.style.top = y + 'px';
    R.classList.add('show');
    ['r1', 'r2', 'r3', 'r4'].forEach((id, k) => rollTimer.push(setTimeout(() => { $('#' + id).classList.add('in'); SFX.play('tick'); }, 180 + k * 380)));
    // 체력 막대에 잃을 칸 깜빡임
    const bar = $('#enHpBar').children;
    for (let i = left; i < e.cur; i++) bar[i] && bar[i].classList.add('ghost');
    if (!Q.get('roll')) rollTimer.push(setTimeout(() => { R.classList.remove('show'); renderEnemy(); }, 3800));
  }

  function toast(t) {
    let T = $('#toast'); if (!T) { T = el('div', 'gp', ''); T.id = 'toast'; $('#hud').appendChild(T); }
    T.textContent = t; T.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => T.classList.remove('show'), 1600);
  }

  /* ---------- 대원·적 전환 ---------- */
  function setActor(i, silent) {
    if (i === actor && tok) return;
    actor = i; tok = { tac: 1, act: 3 };
    if (!silent) SFX.play('swap');
    renderCrew(); renderDetail(); renderActs(); renderEnemy();
  }
  function nextActor() {
    const k = ORDER.findIndex((o) => o.t === 'c' && o.i === actor);
    const nx = ORDER.slice(k + 1).concat(ORDER.slice(0, k)).find((o) => o.t === 'c');
    setActor(nx.i);
  }
  function setTarget(i) { target = (i + 4) % 4; SFX.play('tick'); renderEnemy(); }

  /* ---------- 테마·소리 ---------- */
  function setTheme(k, sound) {
    document.body.classList.remove('theme-k1', 'theme-k2', 'theme-k3'); document.body.classList.add('theme-' + k);
    document.querySelectorAll('.pt').forEach((b) => b.classList.toggle('on', b.dataset.th === k));
    if (sound) SFX.play('swap');
  }
  function syncSound(m) { $('#sndTx').textContent = m ? '소리 끔' : '소리 켬'; }
  function padPress(btn, fn) {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); SFX.unlock(); btn.classList.add('pressed'); SFX.play('clack');
      setTimeout(() => { btn.classList.remove('pressed'); SFX.play('release'); fn(); }, 130);
    });
  }
  padPress($('#pbSound'), () => SFX.setMuted(!SFX.muted));
  padPress($('#pbMenu'), () => toast('메뉴 열기 — 메뉴 시안 022로 이어짐'));
  document.querySelectorAll('.pt').forEach((b) => padPress(b, () => setTheme(b.dataset.th, true)));
  SFX.onMute(syncSound); syncSound(SFX.muted);

  /* ---------- 키보드 ---------- */
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const code = e.code;
    if (e.shiftKey && /^Digit[123]$/.test(code)) { e.preventDefault(); setTheme('k' + code.slice(5), true); return; }
    if (!e.shiftKey && /^Digit[1-4]$/.test(code)) { setActor(+code.slice(5) - 1); return; }
    if (e.key === 'Tab') { e.preventDefault(); setTarget(target + (e.shiftKey ? -1 : 1)); return; }
    if (code === 'KeyM') { SFX.setMuted(!SFX.muted); return; }
    if (code === 'Escape') { toast('메뉴 열기 — 메뉴 시안 022로 이어짐'); SFX.play('open'); return; }
    if (code === 'Space') { e.preventDefault(); press(buttons.end); return; }
    if (code === 'Enter') { press(buttons[focus]); return; }
    const L = code.startsWith('Key') ? code.slice(3) : '';
    const hit = buttons.find((b) => b.key === L);
    if (hit) { setFocus(buttons.indexOf(hit), true); press(hit); return; }
    const nTac = buttons.filter((b) => b.kind !== 'atk').length;
    if (code === 'ArrowRight') setFocus(Math.min(buttons.length - 1, focus + 1));
    else if (code === 'ArrowLeft') setFocus(Math.max(0, focus - 1));
    else if (code === 'ArrowDown' && focus < nTac) setFocus(Math.min(buttons.length - 1, nTac + Math.min(focus, buttons.length - nTac - 1)));
    else if (code === 'ArrowUp' && focus >= nTac) setFocus(Math.min(nTac - 1, focus - nTac));
  });

  /* ---------- 마우스 기울기 (마우스 쪽이 앞으로) — 최대 좌우 3°, 상하 2° (022 메뉴: 7°·4°) ---------- */
  const TILT = { y: 3, x: 2 };
  let tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    const nx = Math.max(-1, Math.min(1, (e.clientX / innerWidth) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, (e.clientY / innerHeight) * 2 - 1));
    tgt = { y: -nx * TILT.y, x: ny * TILT.x };
  });
  const hud = $('#hud');
  function loop() {
    cur.x += (tgt.x - cur.x) * 0.08; cur.y += (tgt.y - cur.y) * 0.08;
    hud.style.setProperty('--tiltX', cur.x.toFixed(3) + 'deg'); hud.style.setProperty('--tiltY', cur.y.toFixed(3) + 'deg');
    window.__tilt = { x: +cur.x.toFixed(3), y: +cur.y.toFixed(3), maxX: TILT.x, maxY: TILT.y };
    requestAnimationFrame(loop);
  }

  /* ---------- 화면 맞춤 ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    const st = $('#stage');
    st.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
  }
  addEventListener('resize', fit);

  /* ---------- 시작 ---------- */
  if (Q.get('still')) document.body.classList.add('still');
  setTheme(/^k[123]$/.test(Q.get('theme') || '') ? Q.get('theme') : 'k1');
  renderMap();
  setActor(actor, true);
  fit(); loop();
  if (Q.get('roll')) setTimeout(() => press(buttons.find((b) => b.n === '사격') || buttons[0]), 300);
  window.__hud = { CREW, ENEMIES, setActor, setTarget, press: (n) => press(buttons.find((b) => b.n === n) || buttons.end), setTheme };
})();
