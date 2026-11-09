/* Spanish Drill — vanilla JS, no dependencies.
   Data comes from data/verbs.js (window.VERB_DATA) and data/vocab.js (window.VOCAB_DATA). */
(() => {
  'use strict';

  const VERBS = window.VERB_DATA || [];
  const VOCAB = window.VOCAB_DATA || { verbs: [], words: [] };
  const BY_INF = Object.fromEntries(VERBS.map((v, i) => [v.inf, { ...v, rank: i + 1 }]));

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('sd:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sd:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  const TENSES = [
    { k: 'pres', es: 'Presente', en: 'Present' },
    { k: 'pret', es: 'Pretérito indefinido', en: 'Preterite (simple past)' },
    { k: 'impf', es: 'Pretérito imperfecto', en: 'Imperfect' },
    { k: 'fut', es: 'Futuro simple', en: 'Future' },
    { k: 'cond', es: 'Condicional', en: 'Conditional' },
    { k: 'perf', es: 'Pretérito perfecto', en: 'Present perfect' },
    { k: 'plus', es: 'Pluscuamperfecto', en: 'Past perfect' },
    { k: 'subj', es: 'Presente de subjuntivo', en: 'Present subjunctive' },
    { k: 'subjimpf', es: 'Imperfecto de subjuntivo', en: 'Imperfect subjunctive' },
    { k: 'imp', es: 'Imperativo afirmativo', en: 'Imperative (positive)' },
    { k: 'impneg', es: 'Imperativo negativo', en: 'Imperative (negative)' },
  ];
  const T = Object.fromEntries(TENSES.map((t) => [t.k, t]));
  const PERS = ['yo', 'tú', 'él / ella / usted', 'nosotros / -as', 'vosotros / -as', 'ellos / ellas / ustedes'];
  const IMP_PERS = ['tú', 'usted', 'nosotros', 'vosotros', 'ustedes'];
  const personsFor = (k) => (k === 'imp' || k === 'impneg' ? IMP_PERS : PERS);

  const TAG_INFO = {
    'regular': 'fully regular',
    'very irregular': 'very irregular — learn by heart',
    'e→ie': 'stem e → ie (boot)',
    'o→ue': 'stem o → ue (boot)',
    'u→ue': 'stem u → ue (jugar)',
    'e→i': 'stem e → i (boot)',
    'i→ie': 'stem i → ie',
    'yo -go': 'yo ends in -go',
    'yo -zco': 'yo ends in -zco',
    'g→j': 'g → j before o / a',
    '-uir → y': '-uir verbs add y',
    'accent í': 'í gets an accent',
    'accent ú': 'ú gets an accent',
    'spelling c/g/z': 'spelling change (qu / gu / c)',
    'strong preterite': 'strong preterite stem',
    'i→y preterite': 'i → y in preterite',
    '-ir 3rd-person change': '-ir change in él / ellos preterite',
    'irregular future': 'irregular future / conditional stem',
    'irregular participle': 'irregular participle',
    'short tú-imperative': 'short tú-imperative',
    'reflexive': 'reflexive (-se)',
    'other': 'other irregularity',
  };
  const tagHtml = (t) => `<span class="tag${t === 'regular' ? ' reg' : ''}" title="${esc(TAG_INFO[t] || t)}">${esc(t)}</span>`;

  /* ------------------------------------------------------------ cell helpers */
  // cell: "form" (regular) or [form, regularForm|"", ...alternatives]
  const cForm = (c) => (typeof c === 'string' ? c : c[0]);
  const cReg = (c) => (typeof c === 'string' ? null : c[1] || null);
  const cAlts = (c) => (typeof c === 'string' ? [] : c.slice(2));
  const cAccepted = (c) => [cForm(c), ...cAlts(c)];

  function stemLen(v, k) {
    if (k === 'fut' || k === 'cond') return v.inf.length;
    return v.inf.length - 2;
  }
  function boldEnding(word, sl, base) {
    if (word.length > sl && word.slice(0, sl) === base.slice(0, sl)) {
      return esc(word.slice(0, sl)) + '<b class="end">' + esc(word.slice(sl)) + '</b>';
    }
    return esc(word);
  }
  function markIrregular(f, reg) {
    let p = 0;
    while (p < f.length && p < reg.length && f[p] === reg[p]) p++;
    let s = 0;
    while (s < f.length - p && s < reg.length - p && f[f.length - 1 - s] === reg[reg.length - 1 - s]) s++;
    const mid = f.slice(p, f.length - s);
    const title = `Regular pattern would give: ${reg}`;
    if (!mid) return `<span class="irr-word irr-whole" title="${esc(title)}">${esc(f)}</span>`;
    return `<span class="irr-word" title="${esc(title)}">${esc(f.slice(0, p))}<span class="irr">${esc(mid)}</span>${esc(f.slice(f.length - s))}</span>`;
  }
  function renderCell(v, k, c) {
    const f = cForm(c);
    const reg = cReg(c);
    let html;
    if (reg) html = markIrregular(f, reg);
    else if (k === 'perf' || k === 'plus') {
      const sp = f.lastIndexOf(' ');
      html = esc(f.slice(0, sp + 1)) + boldEnding(f.slice(sp + 1), v.inf.length - 2, v.inf);
    } else {
      const base = v.inf.replace(/ír$/, 'ir');
      html = boldEnding(f, k === 'ger' || k === 'part' ? v.inf.length - 2 : stemLen(v, k), base);
    }
    if (k === 'impneg') html = '<span class="muted">no </span>' + html;
    const alts = cAlts(c);
    if (alts.length) html += `<span class="alt">also: ${alts.map(esc).join(', ')}</span>`;
    return html;
  }

  /* ------------------------------------------------------------ routing */
  const VIEWS = ['grammar', 'verbs', 'vocab', 'practice'];
  function showView(name) {
    $$('.view').forEach((s) => { s.hidden = s.dataset.view !== name; });
    $$('.tabs a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.tab === name));
    $$('.tabs a').forEach((a) => { if (a.dataset.tab === name) a.setAttribute('aria-current', 'page'); });
    if (name === 'practice') ensureDrill();
  }
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'grammar';
    if (VIEWS.includes(h)) { showView(h); window.scrollTo(0, 0); return; }
    const el = document.getElementById(h);
    if (el) {
      const view = el.closest('.view');
      if (view) showView(view.dataset.view);
      requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    } else showView('grammar');
  }
  window.addEventListener('hashchange', route);

  /* ------------------------------------------------------------ theme */
  const themeBtn = $('#themeToggle');
  const savedTheme = store.get('theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('theme', next);
  });

  /* ------------------------------------------------------------ grammar endings tables */
  function fillEndings() {
    const models = ['hablar', 'comer', 'vivir'].map((i) => BY_INF[i]).filter(Boolean);
    if (models.length < 3) return;
    $$('.endings[data-tense]').forEach((box) => {
      const k = box.dataset.tense;
      const pers = personsFor(k);
      const rows = pers.map((p, i) => `<tr><th>${esc(p)}</th>${models.map((m) => `<td>${renderCell(m, k, m.t[k][i])}</td>`).join('')}</tr>`).join('');
      box.innerHTML = `<table><caption>${esc(T[k].es)} <small>— ${esc(T[k].en)}</small></caption>
        <thead><tr><th></th>${models.map((m) => `<th>${m.inf}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
    });
  }

  /* ------------------------------------------------------------ verb list */
  const vState = { q: '', g: 'all', tag: 'all', sort: 'freq' };
  function initVerbs() {
    const tags = {};
    VERBS.forEach((v) => v.tags.forEach((t) => { tags[t] = (tags[t] || 0) + 1; }));
    const sel = $('#verbTag');
    sel.insertAdjacentHTML('beforeend', '<option value="irregular">Any irregular</option>');
    Object.keys(TAG_INFO).filter((t) => tags[t]).forEach((t) => {
      sel.insertAdjacentHTML('beforeend', `<option value="${esc(t)}">${esc(TAG_INFO[t])} (${tags[t]})</option>`);
    });
    $('#verbSearch').addEventListener('input', (e) => { vState.q = e.target.value; renderVerbs(); });
    sel.addEventListener('change', (e) => { vState.tag = e.target.value; renderVerbs(); });
    $('#verbSort').addEventListener('change', (e) => { vState.sort = e.target.value; renderVerbs(); });
    segInit($('#verbGroup'), (v) => { vState.g = v; renderVerbs(); });
    $('#verbList').addEventListener('click', (e) => {
      const b = e.target.closest('[data-inf]');
      if (b) openVerb(b.dataset.inf);
    });
    renderVerbs();
  }
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function renderVerbs() {
    const q = fold(vState.q.trim());
    let list = VERBS.map((v, i) => ({ ...v, rank: i + 1 })).filter((v) => {
      if (vState.g !== 'all' && v.g !== vState.g) return false;
      if (vState.tag === 'irregular' && v.tags.includes('regular')) return false;
      if (vState.tag !== 'all' && vState.tag !== 'irregular' && !v.tags.includes(vState.tag)) return false;
      if (q && !fold(v.inf).includes(q) && !fold(v.en).includes(q)) return false;
      return true;
    });
    if (vState.sort === 'az') list.sort((a, b) => a.inf.localeCompare(b.inf, 'es'));
    $('#verbCount').textContent = `${list.length} of ${VERBS.length} verbs`;
    $('#verbList').innerHTML = list.length
      ? list.map((v) => `<li><button type="button" class="verb-item" data-inf="${esc(v.inf)}">
          <span class="verb-top"><span class="verb-rank">#${v.rank}</span><span class="verb-inf">${esc(v.inf)}</span></span>
          <span class="verb-en">${esc(v.en)}</span>
          <span class="tags"><span class="tag grp">-${v.g}</span>${v.tags.map(tagHtml).join('')}</span></button></li>`).join('')
      : '<li class="empty">No verbs match.</li>';
  }

  /* ------------------------------------------------------------ verb dialog */
  const dlg = $('#verbDialog');
  let dlgVerb = null;
  function openVerb(inf) {
    const v = BY_INF[inf];
    if (!v) return;
    dlgVerb = inf;
    $('#vdTitle').textContent = v.inf;
    $('#vdMeaning').textContent = `#${v.rank} · -${v.g} · ${v.en}`;
    $('#vdTags').innerHTML = v.tags.map(tagHtml).join('');
    const blocks = TENSES.map((t) => {
      const pers = personsFor(t.k);
      const rows = pers.map((p, i) => `<tr><td class="p">${esc(p)}</td><td class="f">${renderCell(v, t.k, v.t[t.k][i])}</td></tr>`).join('');
      return `<section class="conj"><h4>${esc(t.es)}<small>${esc(t.en)}</small></h4><table>${rows}</table></section>`;
    });
    blocks.push(`<section class="conj nonfinite"><h4>Gerundio & Participio<small>-ing form · past participle</small></h4><table>
      <tr><td class="p">gerundio</td><td class="f">${renderCell(v, 'ger', v.t.ger)}</td></tr>
      <tr><td class="p">participio</td><td class="f">${renderCell(v, 'part', v.t.part)}</td></tr></table></section>`);
    $('#vdGrid').innerHTML = blocks.join('');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }
  $('#vdClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('#vdPractice').addEventListener('click', () => {
    dlg.close();
    drill.forced = dlgVerb;
    drill.started = false;
    if (location.hash === '#practice') ensureDrill(); else location.hash = '#practice';
  });

  /* ------------------------------------------------------------ segmented control */
  function segInit(el, onChange) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      $$('button', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onChange(b.dataset.v);
    });
  }

  /* ------------------------------------------------------------ vocabulary */
  const voc = { kind: 'verbs', q: '', group: 'topic', hide: false, shuffled: null };
  const ART = /^(el|la|los|las)\s+/i;
  const sortKey = (w) => fold(w.replace(ART, ''));
  function vocabBase(w) {
    let f = w.split(' ')[0];
    if (/(ar|er|ir|ír)se$/.test(f)) f = f.slice(0, -2);
    return f;
  }
  function initVocab() {
    $('#vcVerbs').textContent = `(${VOCAB.verbs.length})`;
    $('#vcWords').textContent = `(${VOCAB.words.length})`;
    segInit($('#vocabKind'), (v) => { voc.kind = v; voc.group = 'topic'; voc.shuffled = null; fillCats(); renderVocab(); });
    $('#vocabSearch').addEventListener('input', (e) => { voc.q = e.target.value; renderVocab(); });
    $('#vocabCat').addEventListener('change', (e) => { voc.group = e.target.value; voc.shuffled = null; renderVocab(); });
    $('#vocabHide').addEventListener('change', (e) => { voc.hide = e.target.checked; renderVocab(); });
    $('#vocabShuffle').addEventListener('click', () => {
      const arr = [...VOCAB[voc.kind]];
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      voc.shuffled = arr;
      renderVocab();
    });
    $('#vocabList').addEventListener('click', (e) => {
      const link = e.target.closest('[data-open]');
      if (link) { e.stopPropagation(); openVerb(link.dataset.open); return; }
      const card = e.target.closest('.vcard');
      if (card && voc.hide) card.classList.toggle('revealed');
    });
    fillCats();
    renderVocab();
  }
  function fillCats() {
    const cats = [...new Set(VOCAB[voc.kind].map((x) => x.cat))];
    $('#vocabCat').innerHTML = `<option value="topic">Grouped by topic</option><option value="az">Grouped A → Z</option>`
      + cats.map((c) => `<option value="cat:${esc(c)}">${esc(c)}</option>`).join('');
  }
  function renderVocab() {
    const q = fold(voc.q.trim());
    let items = (voc.shuffled || VOCAB[voc.kind]).filter((x) => !q || fold(x.w).includes(q) || fold(x.en).includes(q));
    let groups;
    if (voc.shuffled) {
      groups = [['Shuffled — press Shuffle again for a new order', items]];
    } else if (voc.group === 'az') {
      items = [...items].sort((a, b) => sortKey(a.w).localeCompare(sortKey(b.w), 'es'));
      const m = new Map();
      items.forEach((x) => { const L = sortKey(x.w)[0].toUpperCase(); if (!m.has(L)) m.set(L, []); m.get(L).push(x); });
      groups = [...m.entries()];
    } else {
      if (voc.group.startsWith('cat:')) { const c = voc.group.slice(4); items = items.filter((x) => x.cat === c); }
      const m = new Map();
      items.forEach((x) => { if (!m.has(x.cat)) m.set(x.cat, []); m.get(x.cat).push(x); });
      groups = [...m.entries()];
    }
    // A–Z jump bar
    const az = $('#vocabAZ');
    if (voc.group === 'az' && !voc.shuffled) {
      az.hidden = false;
      az.innerHTML = groups.map(([L]) => `<a href="#voc-${L}">${L}</a>`).join('');
    } else az.hidden = true;

    $('#vocabCount').textContent = `${items.length} ${voc.kind === 'verbs' ? 'verbs' : 'words'}`;
    const list = $('#vocabList');
    list.classList.toggle('hide-en', voc.hide);
    list.innerHTML = groups.map(([name, arr]) => `<section class="vocab-group" id="voc-${esc(name)}">
      <h3>${esc(name)} <small>${arr.length}</small></h3>
      <div class="vocab-grid">${arr.map(vcard).join('')}</div></section>`).join('') || '<p class="empty">Nothing found.</p>';
  }
  function vcard(x) {
    const m = x.w.match(ART);
    const word = m ? `<span class="muted">${esc(m[0])}</span>${esc(x.w.slice(m[0].length))}` : esc(x.w);
    let extra = '';
    if (voc.kind === 'verbs') {
      const base = vocabBase(x.w);
      const tags = (x.tags || []).filter((t) => t !== 'regular');
      extra = `<div class="tags">${tags.map(tagHtml).join('')}${BY_INF[base] ? `<button type="button" class="tag link" data-open="${esc(base)}">${esc(base)} → table</button>` : ''}</div>`;
    }
    return `<div class="vcard"><div class="es">${word}</div><div class="en">${esc(x.en)}</div>${x.ff ? '<div class="ff">⚠ false friend</div>' : ''}${extra}</div>`;
  }

  /* ------------------------------------------------------------ practice */
  // Verbs / tenses that make no sense to drill
  const EXCLUDE = {
    llover: TENSES.map((t) => t.k),
    haber: ['imp', 'impneg'],
    soler: ['fut', 'cond', 'imp', 'impneg', 'perf', 'plus'],
    poder: ['imp', 'impneg'],
    caber: ['imp', 'impneg'],
    doler: ['imp', 'impneg'],
    gustar: ['imp', 'impneg'],
    parecer: ['imp', 'impneg'],
  };
  const BASIC = ['pres', 'pret', 'impf', 'fut'];
  const settings = Object.assign({ tenses: BASIC, pool: 'all', mode: 'table', acc: 'strict' }, store.get('settings', {}));
  const stats = store.get('stats', {});
  const drill = { verb: null, tense: null, idx: [], checked: false, started: false, forced: null, right: 0, total: 0, streak: 0 };

  function saveSettings() { store.set('settings', settings); }

  function initPractice() {
    $('#tenseChecks').innerHTML = TENSES.map((t) => `<label class="check"><input type="checkbox" value="${t.k}" ${settings.tenses.includes(t.k) ? 'checked' : ''}> ${esc(t.es)}</label>`).join('');
    $('#tenseChecks').addEventListener('change', () => {
      settings.tenses = $$('#tenseChecks input:checked').map((i) => i.value);
      saveSettings();
    });
    const setTenses = (arr) => { $$('#tenseChecks input').forEach((i) => { i.checked = arr.includes(i.value); }); settings.tenses = arr; saveSettings(); nextDrill(); };
    $('#tAll').addEventListener('click', () => setTenses(TENSES.map((t) => t.k)));
    $('#tNone').addEventListener('click', () => setTenses([]));
    $('#tBasic').addEventListener('click', () => setTenses(BASIC));
    $('#poolSel').value = settings.pool;
    $('#poolSel').addEventListener('change', (e) => { settings.pool = e.target.value; saveSettings(); nextDrill(); });
    $$('input[name="mode"]').forEach((r) => { r.checked = r.value === settings.mode; r.addEventListener('change', () => { settings.mode = r.value; saveSettings(); nextDrill(); }); });
    $$('input[name="acc"]').forEach((r) => { r.checked = r.value === settings.acc; r.addEventListener('change', () => { settings.acc = r.value; saveSettings(); }); });

    $('#drillForm').addEventListener('submit', (e) => { e.preventDefault(); if (drill.checked) nextDrill(); else checkDrill(false); });
    $('#revealBtn').addEventListener('click', () => { if (!drill.checked) checkDrill(true); });
    $('#skipBtn').addEventListener('click', () => nextDrill());
    $('#openVerbBtn').addEventListener('click', () => drill.verb && openVerb(drill.verb.inf));
    $('#resetStats').addEventListener('click', () => {
      Object.keys(stats).forEach((k) => delete stats[k]);
      store.set('stats', stats); drill.right = drill.total = drill.streak = 0; renderStats(); renderScore();
    });

    // accent buttons insert into the last focused input
    let lastInput = null;
    $('#dRows').addEventListener('focusin', (e) => { if (e.target.tagName === 'INPUT') lastInput = e.target; });
    $$('.accents button').forEach((b) => {
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        const inp = lastInput || $('#dRows input');
        if (!inp || inp.readOnly) return;
        const s = inp.selectionStart ?? inp.value.length;
        const en = inp.selectionEnd ?? inp.value.length;
        inp.value = inp.value.slice(0, s) + b.dataset.ch + inp.value.slice(en);
        inp.focus();
        inp.setSelectionRange(s + 1, s + 1);
      });
    });
    renderStats();
    renderScore();
  }

  function pool() {
    let list = VERBS;
    if (settings.pool === 'irregular') list = VERBS.filter((v) => !v.tags.includes('regular'));
    if (settings.pool === 'regular') list = VERBS.filter((v) => v.tags.includes('regular'));
    if (settings.pool === 'top50') list = VERBS.slice(0, 50);
    if (settings.pool === 'top100') list = VERBS.slice(0, 100);
    return list;
  }
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function ensureDrill() { if (!drill.started) nextDrill(); }

  function nextDrill() {
    drill.started = true;
    const tenses = settings.tenses.length ? settings.tenses : BASIC;
    let v, t, guard = 0;
    do {
      t = rand(tenses);
      v = drill.forced ? BY_INF[drill.forced] : rand(pool());
      guard++;
    } while (v && ((EXCLUDE[v.inf] || []).includes(t) || (!drill.forced && drill.verb && v.inf === drill.verb.inf && guard < 5)) && guard < 50);
    drill.forced = null;
    if (!v) return;
    drill.verb = BY_INF[v.inf];
    drill.tense = t;
    const n = personsFor(t).length;
    drill.idx = settings.mode === 'single' ? [Math.floor(Math.random() * n)] : [...Array(n).keys()];
    drill.checked = false;
    renderDrill();
  }

  function renderDrill() {
    const v = drill.verb;
    const t = T[drill.tense];
    $('#dTense').textContent = `${t.es} · ${t.en}`;
    $('#dVerb').textContent = v.inf;
    $('#dMeaning').textContent = v.en;
    $('#dTags').innerHTML = '';
    $('#dResult').textContent = '';
    $('#checkBtn').textContent = 'Check';
    const pers = personsFor(drill.tense);
    $('#dRows').innerHTML = drill.idx.map((i) => `<div class="drow" data-i="${i}">
        <label for="in-${i}">${esc(pers[i])}</label>
        <div class="field">${drill.tense === 'impneg' ? '<span class="neg">no</span>' : ''}<input id="in-${i}" type="text" autocapitalize="off" autocorrect="off"></div>
        <div class="fb" aria-live="polite"></div></div>`).join('');
    const first = $('#dRows input');
    if (first && !matchMedia('(hover: none)').matches) first.focus();
    // Enter in a field jumps to the next empty one before checking
    $$('#dRows input').forEach((inp, i, all) => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !drill.checked && i < all.length - 1 && !all[i + 1].value) {
          e.preventDefault(); all[i + 1].focus();
        }
      });
    });
  }

  const PRON = /^(yo|t[uú]|[eé]l|ella|usted|ud\.?|nosotr[oa]s|vosotr[oa]s|ell[oa]s|ustedes|uds\.?)\s+/;
  function norm(s, tense) {
    s = s.toLowerCase().trim().replace(/\s+/g, ' ');
    s = s.replace(PRON, '');
    if (tense === 'impneg') s = s.replace(/^no\s+/, '');
    return s;
  }
  const noAcc = (s) => s.replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ');

  function checkDrill(reveal) {
    const v = drill.verb;
    const cells = v.t[drill.tense];
    let right = 0;
    $$('#dRows .drow').forEach((row) => {
      const i = +row.dataset.i;
      const inp = $('input', row);
      const fb = $('.fb', row);
      const accepted = cAccepted(cells[i]);
      const shown = cForm(cells[i]);
      const given = norm(inp.value, drill.tense);
      const prefix = drill.tense === 'impneg' ? 'no ' : '';
      row.classList.remove('ok', 'no', 'acc');
      let state;
      if (!reveal && accepted.includes(given)) state = 'ok';
      else if (!reveal && given && accepted.map(noAcc).includes(noAcc(given))) state = settings.acc === 'lenient' ? 'acc' : 'accno';
      else state = 'no';
      if (state === 'ok') { right++; fb.innerHTML = '<span class="sym">✓</span>Correct'; row.classList.add('ok'); }
      else if (state === 'acc') { right++; fb.innerHTML = `<span class="sym">⚠</span>Accent! <span class="answer">${esc(prefix + shown)}</span>`; row.classList.add('acc'); }
      else if (state === 'accno') { fb.innerHTML = `<span class="sym">✗</span>Only the accent is wrong: <span class="answer">${esc(prefix + shown)}</span>`; row.classList.add('no'); }
      else { fb.innerHTML = `<span class="sym">✗</span>${reveal ? 'Answer' : 'Correct'}: <span class="answer">${esc(prefix + shown)}</span>`; row.classList.add('no'); }
      inp.readOnly = true;
    });
    const n = drill.idx.length;
    drill.checked = true;
    drill.right += right;
    drill.total += n;
    drill.streak = right === n ? drill.streak + 1 : 0;
    const s = stats[drill.tense] || { r: 0, t: 0 };
    s.r += right; s.t += n; stats[drill.tense] = s;
    store.set('stats', stats);
    $('#dTags').innerHTML = v.tags.map(tagHtml).join('');
    $('#dResult').textContent = right === n
      ? (n > 1 ? `✓ Perfect — ${right}/${n}. Press Enter for the next verb.` : '✓ Correct! Press Enter for the next one.')
      : `${right}/${n} correct. Look at the marked forms, then press Enter to continue.`;
    $('#checkBtn').textContent = 'Next →';
    $('#checkBtn').focus();
    renderScore();
    renderStats();
  }

  function renderScore() {
    const pct = drill.total ? Math.round((100 * drill.right) / drill.total) : 0;
    $('#score').innerHTML = `<b>${drill.right}/${drill.total}</b>this session${drill.total ? ` · ${pct}%` : ''}<br>streak: ${drill.streak}`;
  }
  function renderStats() {
    const rows = TENSES.filter((t) => stats[t.k]).map((t) => {
      const s = stats[t.k];
      const pct = Math.round((100 * s.r) / s.t);
      return `<tr><td>${esc(t.es)}</td><td class="n">${s.r}/${s.t}</td><td class="n">${pct}%</td><td><span class="bar" style="width:${Math.max(4, pct * 0.8)}px"></span></td></tr>`;
    });
    $('#statsBody').innerHTML = rows.length
      ? `<table><thead><tr><th>Tense</th><th class="n">right</th><th class="n">%</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>`
      : '<p class="hint">No answers yet — your accuracy per tense will show up here.</p>';
  }

  /* ------------------------------------------------------------ boot */
  if (matchMedia('(max-width: 900px)').matches) $('#settings').open = false;
  fillEndings();
  initVerbs();
  initVocab();
  initPractice();
  route();
})();
