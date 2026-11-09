/* Spanish Drill — vanilla JS, no dependencies.
   Two learning directions, switched in the top bar:
     learn-es : learn Spanish  (UI + explanations in English)   data: VERB_DATA, VOCAB_DATA
     learn-en : learn English  (UI + explanations in Spanish)   data: EN_VERB_DATA, VOCAB_DATA (reversed) */
(() => {
  'use strict';

  const VERBS = window.VERB_DATA || [];
  const EN_VERBS = window.EN_VERB_DATA || [];
  const VOCAB = window.VOCAB_DATA || { verbs: [], words: [] };
  const BY_INF = Object.fromEntries(VERBS.map((v, i) => [v.inf, { ...v, rank: i + 1 }]));
  const EN_BY = Object.fromEntries(EN_VERBS.map((v, i) => [v.b, { ...v, rank: i + 1 }]));

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('sd:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sd:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  let MODE = store.get('mode', 'learn-es') === 'learn-en' ? 'learn-en' : 'learn-es';
  const isEN = () => MODE === 'learn-en';

  /* ============================================================ UI texts [learn-es (English UI), learn-en (Spanish UI)] */
  const I18N = {
    tabGrammar: ['How it works', 'Cómo funciona'],
    tabVerbs: ['200 Verbs', '200 verbos'],
    tabVocab: ['Vocabulary', 'Vocabulario'],
    tabPractice: ['Practice', 'Práctica'],
    verbsH: ['200 core verbs', 'Los 200 verbos más usados'],
    verbsLead: ['The most used verbs in everyday Spanish, in rough frequency order. Click a verb for its full conjugation.',
      'Los verbos más usados del inglés, aproximadamente por frecuencia, con pasado y participio. Haz clic en un verbo para ver todos los tiempos.'],
    verbsSearch: ['Search Spanish or English…', 'Buscar en inglés o español…'],
    byFreq: ['By frequency', 'Por frecuencia'],
    allPatterns: ['All patterns', 'Todos los patrones'],
    anyIrregular: ['Any irregular', 'Todos los irregulares'],
    vocabH: ['Vocabulary', 'Vocabulario'],
    vocabLead: ['Everyday verbs and words at a simple-to-intermediate level — beyond the basics. Turn on <i>Hide English</i> to quiz yourself: tap a card to reveal.',
      'Verbos y palabras del día a día, de nivel básico a intermedio. Activa <i>Ocultar español</i> para ponerte a prueba: toca una tarjeta para ver la traducción.'],
    verbs: ['Verbs', 'Verbos'],
    words: ['Words', 'Palabras'],
    search: ['Search…', 'Buscar…'],
    hideMeaning: ['Hide English', 'Ocultar español'],
    shuffle: ['Shuffle', 'Mezclar'],
    byTopic: ['Grouped by topic', 'Agrupado por tema'],
    byAZ: ['Grouped A → Z', 'Agrupado de la A a la Z'],
    shuffled: ['Shuffled — press Shuffle again for a new order', 'Mezclado — pulsa Mezclar otra vez para otro orden'],
    nothing: ['Nothing found.', 'No se ha encontrado nada.'],
    falseFriend: ['⚠ false friend', '⚠ falso amigo'],
    tapReveal: ['tap to reveal', 'toca para ver'],
    table: ['table', 'tabla'],
    practiceH: ['Verb checker', 'Entrenador de verbos'],
    practiceLead: ['You get a random verb from the 200 and a tense — type the forms, press <kbd>Enter</kbd> to check, <kbd>Enter</kbd> again for the next verb.',
      'Recibes un verbo al azar de los 200 y un tiempo — escribe las formas, pulsa <kbd>Enter</kbd> para comprobar y otra vez <kbd>Enter</kbd> para el siguiente.'],
    settings: ['Settings', 'Ajustes'],
    tenses: ['Tenses', 'Tiempos'],
    all: ['all', 'todos'],
    none: ['none', 'ninguno'],
    basics: ['basics', 'básicos'],
    poolAll: ['All 200 verbs', 'Los 200 verbos'],
    poolIrr: ['Only irregular verbs', 'Solo irregulares'],
    poolReg: ['Only regular verbs', 'Solo regulares'],
    mode: ['Mode', 'Modo'],
    modeTable: ['Full table (all persons)', 'Tabla completa (todas las formas)'],
    modeSingle: ['Quick (one random person)', 'Rápido (una forma al azar)'],
    savedHint: ['Settings and stats are saved in this browser.', 'Los ajustes y las estadísticas se guardan en este navegador.'],
    check: ['Check', 'Comprobar'],
    next: ['Next →', 'Siguiente →'],
    reveal: ['Show answer', 'Ver respuesta'],
    skip: ['Skip', 'Saltar'],
    fullTable: ['Full table', 'Tabla completa'],
    stats: ['Your stats', 'Tus estadísticas'],
    reset: ['reset', 'reiniciar'],
    practiceVerb: ['Practice this verb', 'Practicar este verbo'],
    dlgLegend: ['<span><b class="end">bold</b> = regular ending</span><span><span class="irr">underlined</span>* = irregular (hover/tap for the regular pattern)</span>',
      '<span><b class="end">negrita</b> = terminación regular</span><span><span class="irr">subrayado</span>* = forma irregular</span>'],
    footer: ['Spanish → English · conjugations generated with <a href="https://github.com/bretttolbert/verbecc">verbecc</a> · RAE 2010 spelling (<i>rio, hui, guion</i>)',
      'Inglés → español · ortografía americana y británica aceptada (<i>traveled / travelled, learned / learnt</i>)'],
    // JS-only strings
    of: ['of', 'de'],
    verbsWord: ['verbs', 'verbos'],
    wordsWord: ['words', 'palabras'],
    noVerbs: ['No verbs match.', 'Ningún verbo coincide.'],
    session: ['this session', 'esta sesión'],
    streak: ['streak', 'racha'],
    correct: ['Correct', 'Correcto'],
    answer: ['Answer', 'Respuesta'],
    accentWarn: ['Accent!', '¡Acento!'],
    accentOnly: ['Only the accent is wrong:', 'Solo falla el acento:'],
    perfect: ['✓ Perfect — {r}/{n}. Press Enter for the next verb.', '✓ ¡Perfecto! — {r}/{n}. Pulsa Enter para el siguiente.'],
    perfect1: ['✓ Correct! Press Enter for the next one.', '✓ ¡Correcto! Pulsa Enter para el siguiente.'],
    partly: ['{r}/{n} correct. Look at the marked forms, then press Enter to continue.', '{r}/{n} correctas. Mira las formas marcadas y pulsa Enter para seguir.'],
    noStats: ['No answers yet — your accuracy per tense will show up here.', 'Todavía no hay respuestas — aquí verás tu acierto por tiempo.'],
    tense: ['Tense', 'Tiempo'],
    right: ['right', 'bien'],
    gerPart: ['Gerundio & Participio', 'Gerundio y participio'],
    gerPartSub: ['-ing form · past participle', 'gerundio · participio'],
    principalParts: ['Principal parts', 'Formas principales'],
    principalSub: ['', 'base · 3ª persona · pasado · participio · -ing'],
  };
  const t = (k, vars) => {
    let s = (I18N[k] || [k, k])[isEN() ? 1 : 0];
    if (vars) Object.entries(vars).forEach(([a, b]) => { s = s.replace('{' + a + '}', b); });
    return s;
  };
  function applyI18n() {
    $$('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    document.documentElement.dataset.mode = MODE;
    document.documentElement.lang = isEN() ? 'es' : 'en';
    document.title = isEN() ? 'English Drill — Verbos, vocabulario y práctica' : 'Spanish Drill — Verbs, Vocabulary & Practice';
    $('#brandMark').textContent = isEN() ? 'W' : 'ñ';
    $('#brandName').textContent = isEN() ? 'English Drill' : 'Spanish Drill';
    $$('#langSwitch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === MODE)));
  }

  /* ============================================================ Spanish conjugation (learn-es) */
  const TENSES_ES = [
    { k: 'pres', a: 'Presente', b: 'Present' },
    { k: 'pret', a: 'Pretérito indefinido', b: 'Preterite (simple past)' },
    { k: 'impf', a: 'Pretérito imperfecto', b: 'Imperfect' },
    { k: 'fut', a: 'Futuro simple', b: 'Future' },
    { k: 'cond', a: 'Condicional', b: 'Conditional' },
    { k: 'perf', a: 'Pretérito perfecto', b: 'Present perfect' },
    { k: 'plus', a: 'Pluscuamperfecto', b: 'Past perfect' },
    { k: 'subj', a: 'Presente de subjuntivo', b: 'Present subjunctive' },
    { k: 'subjimpf', a: 'Imperfecto de subjuntivo', b: 'Imperfect subjunctive' },
    { k: 'imp', a: 'Imperativo afirmativo', b: 'Imperative (positive)' },
    { k: 'impneg', a: 'Imperativo negativo', b: 'Imperative (negative)' },
  ];
  const PERS = ['yo', 'tú', 'él / ella / usted', 'nosotros / -as', 'vosotros / -as', 'ellos / ellas / ustedes'];
  const IMP_PERS = ['tú', 'usted', 'nosotros', 'vosotros', 'ustedes'];
  const personsFor = (k) => (k === 'imp' || k === 'impneg' ? IMP_PERS : PERS);

  const TAG_INFO = {
    'regular': 'fully regular', 'very irregular': 'very irregular — learn by heart',
    'e→ie': 'stem e → ie (boot)', 'o→ue': 'stem o → ue (boot)', 'u→ue': 'stem u → ue (jugar)', 'e→i': 'stem e → i (boot)', 'i→ie': 'stem i → ie',
    'yo -go': 'yo ends in -go', 'yo -zco': 'yo ends in -zco', 'g→j': 'g → j before o / a', '-uir → y': '-uir verbs add y',
    'accent í': 'í gets an accent', 'accent ú': 'ú gets an accent', 'spelling c/g/z': 'spelling change (qu / gu / c)',
    'strong preterite': 'strong preterite stem', 'i→y preterite': 'i → y in preterite', '-ir 3rd-person change': '-ir change in él / ellos preterite',
    'irregular future': 'irregular future / conditional stem', 'irregular participle': 'irregular participle',
    'short tú-imperative': 'short tú-imperative', 'reflexive': 'reflexive (-se)', 'other': 'other irregularity',
  };
  const TAG_INFO_EN = {
    'regular': ['regular', 'regular (-ed)'], 'irregular': ['irregular', 'irregular'],
    'A-A-A': ['A-A-A', 'A-A-A · los tres iguales (cut cut cut)'], 'A-B-B': ['A-B-B', 'A-B-B · pasado = participio (buy bought bought)'],
    'A-B-A': ['A-B-A', 'A-B-A · participio = base (come came come)'], 'A-B-C': ['A-B-C', 'A-B-C · los tres distintos (go went gone)'],
    'double consonant': ['consonante doble', 'consonante doble (stop → stopped)'], 'y → ied': ['y → ied', 'y → ied (study → studied)'],
    'UK / US': ['UK / US', 'dos formas UK / US (learnt / learned)'],
  };
  const tagHtml = (tg) => {
    if (isEN()) {
      const [label, title] = TAG_INFO_EN[tg] || [tg, tg];
      return `<span class="tag${tg === 'regular' ? ' reg' : ''}" title="${esc(title)}">${esc(label)}</span>`;
    }
    return `<span class="tag${tg === 'regular' ? ' reg' : ''}" title="${esc(TAG_INFO[tg] || tg)}">${esc(tg)}</span>`;
  };

  // cell: "form" (regular) or [form, regularForm|"", ...alternatives]
  const cForm = (c) => (typeof c === 'string' ? c : c[0]);
  const cReg = (c) => (typeof c === 'string' ? null : c[1] || null);
  const cAlts = (c) => (typeof c === 'string' ? [] : c.slice(2));
  const cAccepted = (c) => [cForm(c), ...cAlts(c)];

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
      const sl = (k === 'fut' || k === 'cond') ? v.inf.length : v.inf.length - 2;
      html = boldEnding(f, sl, base);
    }
    if (k === 'impneg') html = '<span class="muted">no </span>' + html;
    const alts = cAlts(c);
    if (alts.length) html += `<span class="alt">also: ${alts.map(esc).join(', ')}</span>`;
    return html;
  }

  /* ============================================================ English conjugation (learn-en) */
  const TENSES_EN = [
    { k: 'parts', a: 'Formas principales', b: 'pasado · participio · -s · -ing' },
    { k: 'ps', a: 'Present simple', b: 'Presente simple' },
    { k: 'psn', a: 'Present simple — negative', b: 'Presente simple (negativo)' },
    { k: 'pc', a: 'Present continuous', b: 'Presente continuo' },
    { k: 'pas', a: 'Past simple', b: 'Pasado simple' },
    { k: 'pasn', a: 'Past simple — negative', b: 'Pasado simple (negativo)' },
    { k: 'pac', a: 'Past continuous', b: 'Pasado continuo' },
    { k: 'pp', a: 'Present perfect', b: 'Presente perfecto (he hecho)' },
    { k: 'ppc', a: 'Present perfect continuous', b: 'Llevo … haciendo' },
    { k: 'pap', a: 'Past perfect', b: 'Pluscuamperfecto (había hecho)' },
    { k: 'fut', a: 'Future — will', b: 'Futuro con will' },
    { k: 'gt', a: 'Future — going to', b: 'Futuro con going to' },
    { k: 'cond', a: 'Conditional — would', b: 'Condicional (haría)' },
    { k: 'condp', a: 'Conditional perfect', b: 'Condicional compuesto (habría hecho)' },
  ];
  const EN_PERS = ['I', 'you', 'he / she / it', 'we', 'they'];
  const BE_PRES = ['am', 'are', 'is', 'are', 'are'];
  const BE_PAST = ['was', 'were', 'was', 'were', 'were'];
  const HAVE = ['have', 'have', 'has', 'have', 'have'];
  const CONTR = { will: "'ll", would: "'d", have: "'ve", has: "'s", had: "'d", am: "'m", are: "'re", is: "'s" };
  const VOW = 'aeiou';
  const regPast = (b) => (b.endsWith('e') ? b + 'd' : b.endsWith('y') && !VOW.includes(b[b.length - 2]) ? b.slice(0, -1) + 'ied' : b + 'ed');
  const looksRegular = (v, f) => f === regPast(v.b) || (f.endsWith('ed') && f.startsWith(v.b.replace(/e$/, '')));

  function enMain(v, form, kind) {
    let irr = false;
    if (kind === 'past' || kind === 'pp') irr = !looksRegular(v, form);
    if (kind === 'be') irr = true;
    if (kind === 's3' && (form === 'has' || form === 'is')) irr = true;
    if (irr) return `<span class="irr-word"><span class="irr">${esc(form)}</span></span>`;
    let p = 0;
    while (p < form.length && p < v.b.length && form[p] === v.b[p]) p++;
    if (p >= form.length) return esc(form);
    return esc(form.slice(0, p)) + '<b class="end">' + esc(form.slice(p)) + '</b>';
  }
  const withContr = (forms) => {
    const out = [...forms];
    forms.forEach((f) => {
      const [w, ...rest] = f.split(' ');
      if (CONTR[w] && rest.length) out.push(CONTR[w] + ' ' + rest.join(' '));
    });
    return out;
  };
  /** one cell of an English tense: {html, accepted[], shown} */
  function enCell(v, k, i) {
    const be = v.b === 'be';
    const one = (aux, forms, kind, contr = true) => {
      const pre = aux ? esc(aux) + ' ' : '';
      const accepted = forms.map((f) => (aux ? aux + ' ' : '') + f);
      return { html: pre + enMain(v, forms[0], kind), accepted: contr ? withContr(accepted) : accepted, shown: accepted[0] };
    };
    switch (k) {
      case 'ps': return be ? one('', [BE_PRES[i]], 'be') : one('', [i === 2 ? v.s3 : v.b], i === 2 ? 's3' : 'base');
      case 'psn': {
        if (be) {
          const full = BE_PRES[i] + ' not';
          const short = i === 0 ? null : BE_PRES[i] + "n't";
          return { html: `${enMain(v, BE_PRES[i], 'be')} not`, accepted: [full, short].filter(Boolean), shown: short || full };
        }
        const aux = i === 2 ? 'does' : 'do';
        return { html: `${aux}n't ${esc(v.b)}`, accepted: [`${aux}n't ${v.b}`, `${aux} not ${v.b}`], shown: `${aux}n't ${v.b}` };
      }
      case 'pc': return one(BE_PRES[i], v.ing, 'ing');
      case 'pas': return be ? one('', [BE_PAST[i]], 'be') : one('', v.past, 'past');
      case 'pasn': {
        if (be) return { html: `${enMain(v, BE_PAST[i], 'be')}n't`, accepted: [BE_PAST[i] + "n't", BE_PAST[i] + ' not'], shown: BE_PAST[i] + "n't" };
        return { html: `didn't ${esc(v.b)}`, accepted: [`didn't ${v.b}`, `did not ${v.b}`], shown: `didn't ${v.b}` };
      }
      case 'pac': return one(BE_PAST[i], v.ing, 'ing');
      case 'pp': return one(HAVE[i], v.pp, 'pp');
      case 'ppc': return one(HAVE[i] + ' been', v.ing, 'ing');
      case 'pap': return one('had', v.pp, 'pp');
      case 'fut': return one('will', [v.b], 'base');
      case 'gt': return one(BE_PRES[i] + ' going to', [v.b], 'base');
      case 'cond': return one('would', [v.b], 'base');
      case 'condp': return one('would have', v.pp, 'pp');
      default: return { html: '', accepted: [], shown: '' };
    }
  }
  /** principal parts as drill rows / table cells */
  function enParts(v) {
    const be = v.b === 'be';
    return [
      { label: 'he / she / it', accepted: [v.s3], shown: v.s3, html: enMain(v, v.s3, 's3') },
      { label: 'past simple', accepted: be ? ['was / were', 'was/were', 'was, were', 'was', 'were'] : v.past, shown: be ? 'was / were' : v.past[0],
        html: be ? enMain(v, 'was / were', 'be') : enMain(v, v.past[0], 'past') + (v.past[1] ? ` <span class="alt">/ ${esc(v.past[1])}</span>` : '') },
      { label: 'past participle', accepted: v.pp, shown: v.pp[0], html: enMain(v, v.pp[0], be ? 'be' : 'pp') + (v.pp[1] ? ` <span class="alt">/ ${esc(v.pp[1])}</span>` : '') },
      { label: '-ing', accepted: v.ing, shown: v.ing[0], html: enMain(v, v.ing[0], 'ing') + (v.ing[1] ? ` <span class="alt">/ ${esc(v.ing[1])}</span>` : '') },
    ];
  }

  /* ============================================================ routing */
  const VIEWS = ['grammar', 'verbs', 'vocab', 'practice'];
  function showView(name) {
    $$('.view').forEach((s) => { s.hidden = s.dataset.view !== name; });
    $$('.tabs a').forEach((a) => { if (a.dataset.tab === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
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

  /* ============================================================ theme */
  const savedTheme = store.get('theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $('#themeToggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('theme', next);
  });

  /* ============================================================ grammar tables */
  function fillGrammarTables() {
    const models = ['hablar', 'comer', 'vivir'].map((i) => BY_INF[i]).filter(Boolean);
    if (models.length === 3) {
      $$('.endings[data-tense]:not(.en-table)').forEach((box) => {
        const k = box.dataset.tense;
        const T = TENSES_ES.find((x) => x.k === k);
        const rows = personsFor(k).map((p, i) => `<tr><th>${esc(p)}</th>${models.map((m) => `<td>${renderCell(m, k, m.t[k][i])}</td>`).join('')}</tr>`).join('');
        box.innerHTML = `<table><caption>${esc(T.a)} <small>— ${esc(T.b)}</small></caption>
          <thead><tr><th></th>${models.map((m) => `<th>${m.inf}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
      });
    }
    $$('.en-table').forEach((box) => {
      const k = box.dataset.tense;
      const T = TENSES_EN.find((x) => x.k === k);
      const vs = box.dataset.verbs.split(',').map((b) => EN_BY[b]).filter(Boolean);
      const rows = EN_PERS.map((p, i) => `<tr><th>${esc(p)}</th>${vs.map((v) => `<td>${enCell(v, k, i).html}</td>`).join('')}</tr>`).join('');
      box.innerHTML = `<table><caption>${esc(T.a)} <small>— ${esc(T.b)}</small></caption>
        <thead><tr><th></th>${vs.map((v) => `<th>${v.b}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    $$('.en-parts').forEach((box) => {
      const vs = box.dataset.verbs.split(',').map((b) => EN_BY[b]).filter(Boolean);
      const rows = vs.map((v) => `<tr><th>${esc(v.es.split(/[;,]/)[0])}</th><td><b>${esc(v.b)}</b></td>${enParts(v).map((c) => `<td>${c.html}</td>`).join('')}</tr>`).join('');
      box.innerHTML = `<table><thead><tr><th></th><th>base</th><th>he / she / it</th><th>past</th><th>participle</th><th>-ing</th></tr></thead><tbody>${rows}</tbody></table>`;
    });
  }

  /* ============================================================ segmented control */
  function segInit(el, onChange) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      $$('button', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onChange(b.dataset.v);
    });
  }

  /* ============================================================ verb list */
  const vState = { q: '', g: 'all', tag: 'all', sort: 'freq' };
  function verbItems() {
    if (isEN()) {
      return EN_VERBS.map((v, i) => ({ key: v.b, head: v.b, sub: v.es, rank: i + 1, tags: v.tags, grp: v.irr ? 'irr' : 'reg',
        extra: v.b === 'be' ? 'was / were · been' : `${v.past[0]} · ${v.pp[0]}` }));
    }
    return VERBS.map((v, i) => ({ key: v.inf, head: v.inf, sub: v.en, rank: i + 1, tags: v.tags, grp: v.g, gLabel: '-' + v.g }));
  }
  function setupVerbFilters() {
    const groups = isEN() ? [['all', 'Todos'], ['reg', 'Regulares'], ['irr', 'Irregulares']] : [['all', 'All'], ['ar', '-ar'], ['er', '-er'], ['ir', '-ir']];
    $('#verbGroup').innerHTML = groups.map(([v, l], i) => `<button type="button" data-v="${v}" aria-pressed="${i === 0}">${l}</button>`).join('');
    vState.g = 'all';
    vState.tag = 'all';
    const counts = {};
    verbItems().forEach((v) => v.tags.forEach((tg) => { counts[tg] = (counts[tg] || 0) + 1; }));
    const info = isEN() ? Object.fromEntries(Object.entries(TAG_INFO_EN).map(([k, [, title]]) => [k, title])) : TAG_INFO;
    const sel = $('#verbTag');
    sel.innerHTML = `<option value="all">${esc(t('allPatterns'))}</option>` + (isEN() ? '' : `<option value="irregular">${esc(t('anyIrregular'))}</option>`)
      + Object.keys(info).filter((k) => counts[k]).map((k) => `<option value="${esc(k)}">${esc(info[k])} (${counts[k]})</option>`).join('');
  }
  function initVerbs() {
    $('#verbSearch').addEventListener('input', (e) => { vState.q = e.target.value; renderVerbs(); });
    $('#verbTag').addEventListener('change', (e) => { vState.tag = e.target.value; renderVerbs(); });
    $('#verbSort').addEventListener('change', (e) => { vState.sort = e.target.value; renderVerbs(); });
    segInit($('#verbGroup'), (v) => { vState.g = v; renderVerbs(); });
    $('#verbList').addEventListener('click', (e) => {
      const b = e.target.closest('[data-key]');
      if (b) openVerb(b.dataset.key);
    });
  }
  function renderVerbs() {
    const q = fold(vState.q.trim());
    const all = verbItems();
    const list = all.filter((v) => {
      if (vState.g !== 'all' && v.grp !== vState.g) return false;
      if (vState.tag === 'irregular' && v.tags.includes('regular')) return false;
      if (vState.tag !== 'all' && vState.tag !== 'irregular' && !v.tags.includes(vState.tag)) return false;
      if (q && !fold(v.head).includes(q) && !fold(v.sub).includes(q) && !(v.extra && fold(v.extra).includes(q))) return false;
      return true;
    });
    if (vState.sort === 'az') list.sort((a, b) => a.head.localeCompare(b.head, isEN() ? 'en' : 'es'));
    $('#verbCount').textContent = `${list.length} ${t('of')} ${all.length} ${t('verbsWord')}`;
    $('#verbList').innerHTML = list.length
      ? list.map((v) => `<li><button type="button" class="verb-item" data-key="${esc(v.key)}">
          <span class="verb-top"><span class="verb-rank">#${v.rank}</span><span class="verb-inf">${esc(v.head)}</span>${v.extra ? `<span class="verb-parts">${esc(v.extra)}</span>` : ''}</span>
          <span class="verb-en">${esc(v.sub)}</span>
          <span class="tags">${v.gLabel ? `<span class="tag grp">${v.gLabel}</span>` : ''}${v.tags.map(tagHtml).join('')}</span></button></li>`).join('')
      : `<li class="empty">${esc(t('noVerbs'))}</li>`;
  }

  /* ============================================================ verb dialog */
  const dlg = $('#verbDialog');
  let dlgVerb = null;
  function openVerb(key) {
    let blocks = [];
    if (isEN()) {
      const v = EN_BY[key];
      if (!v) return;
      $('#vdTitle').textContent = 'to ' + v.b;
      $('#vdMeaning').textContent = `#${v.rank} · ${v.es}`;
      $('#vdTags').innerHTML = v.tags.map(tagHtml).join('');
      const parts = enParts(v);
      blocks.push(`<section class="conj nonfinite"><h4>${esc(t('principalParts'))}<small>${esc(t('principalSub'))}</small></h4><table>
        <tr><td class="p">base</td><td class="f"><b>${esc(v.b)}</b></td></tr>
        ${parts.map((c) => `<tr><td class="p">${esc(c.label)}</td><td class="f">${c.html}</td></tr>`).join('')}</table></section>`);
      TENSES_EN.filter((x) => x.k !== 'parts').forEach((T) => {
        const rows = EN_PERS.map((p, i) => `<tr><td class="p">${esc(p)}</td><td class="f">${enCell(v, T.k, i).html}</td></tr>`).join('');
        blocks.push(`<section class="conj"><h4>${esc(T.a)}<small>${esc(T.b)}</small></h4><table>${rows}</table></section>`);
      });
    } else {
      const v = BY_INF[key];
      if (!v) return;
      $('#vdTitle').textContent = v.inf;
      $('#vdMeaning').textContent = `#${v.rank} · -${v.g} · ${v.en}`;
      $('#vdTags').innerHTML = v.tags.map(tagHtml).join('');
      blocks = TENSES_ES.map((T) => {
        const rows = personsFor(T.k).map((p, i) => `<tr><td class="p">${esc(p)}</td><td class="f">${renderCell(v, T.k, v.t[T.k][i])}</td></tr>`).join('');
        return `<section class="conj"><h4>${esc(T.a)}<small>${esc(T.b)}</small></h4><table>${rows}</table></section>`;
      });
      blocks.push(`<section class="conj nonfinite"><h4>${esc(t('gerPart'))}<small>${esc(t('gerPartSub'))}</small></h4><table>
        <tr><td class="p">gerundio</td><td class="f">${renderCell(v, 'ger', v.t.ger)}</td></tr>
        <tr><td class="p">participio</td><td class="f">${renderCell(v, 'part', v.t.part)}</td></tr></table></section>`);
    }
    dlgVerb = key;
    $('#vdGrid').innerHTML = blocks.join('');
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  }
  $('#vdClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('#vdPractice').addEventListener('click', () => {
    dlg.close();
    drill.forced = dlgVerb;
    drill.started = false;
    if (location.hash === '#practice') ensureDrill(); else location.hash = '#practice';
  });

  /* ============================================================ vocabulary */
  const CAT_ES = {
    'Communication & social life': 'Comunicación y vida social', 'Work, study & organisation': 'Trabajo, estudios y organización',
    'Everyday life & home': 'Vida diaria y casa', 'Feelings & attitudes': 'Sentimientos y actitudes', 'Thinking & judging': 'Pensar y valorar',
    'Change, cause & effect': 'Cambio, causa y efecto', 'Movement & travel': 'Movimiento y viajes', 'Money & business': 'Dinero y negocios',
    'Tech & media': 'Tecnología y medios', 'Conflict & problems': 'Conflictos y problemas', 'Body & health': 'Cuerpo y salud',
    'Connectors & useful phrases': 'Conectores y expresiones', 'Feelings & character': 'Sentimientos y carácter', 'Describing things': 'Describir cosas',
    'Money & paperwork': 'Dinero y trámites', 'Home & daily life': 'Casa y vida diaria', 'Work & study': 'Trabajo y estudios', 'Tech': 'Tecnología',
    'Health & body': 'Salud y cuerpo', 'City & travel': 'Ciudad y viajes', 'Society & world': 'Sociedad y mundo', 'Abstract & useful nouns': 'Sustantivos útiles',
  };
  const catName = (c) => (isEN() ? CAT_ES[c] || c : c);
  const voc = { kind: 'verbs', q: '', group: 'topic', hide: false, shuffled: null };
  const ART_ES = /^(el|la|los|las)\s+/i;
  const ART_EN = /^(to|the|a|an)\s+/i;
  const headOf = (x) => (isEN() ? x.en : x.w);
  const subOf = (x) => (isEN() ? x.w : x.en);
  const sortKey = (x) => fold(isEN() ? x.en.replace(ART_EN, '') : x.w.replace(ART_ES, ''));
  function vocabBaseES(w) {
    let f = w.split(' ')[0];
    if (/(ar|er|ir|ír)se$/.test(f)) f = f.slice(0, -2);
    return f;
  }
  function vocabBaseEN(en) {
    return en.split(/[,;(]/)[0].trim().replace(/^to\s+/i, '').split(' ')[0].toLowerCase();
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
  }
  function fillCats() {
    const cats = [...new Set(VOCAB[voc.kind].map((x) => x.cat))];
    $('#vocabCat').innerHTML = `<option value="topic">${esc(t('byTopic'))}</option><option value="az">${esc(t('byAZ'))}</option>`
      + cats.map((c) => `<option value="cat:${esc(c)}">${esc(catName(c))}</option>`).join('');
    $('#vocabCat').value = voc.group;
  }
  function renderVocab() {
    const q = fold(voc.q.trim());
    let items = (voc.shuffled || VOCAB[voc.kind]).filter((x) => !q || fold(x.w).includes(q) || fold(x.en).includes(q));
    let groups;
    if (voc.shuffled) {
      groups = [[t('shuffled'), items]];
    } else if (voc.group === 'az') {
      items = [...items].sort((a, b) => sortKey(a).localeCompare(sortKey(b), isEN() ? 'en' : 'es'));
      const m = new Map();
      items.forEach((x) => { const L = (sortKey(x)[0] || '#').toUpperCase(); if (!m.has(L)) m.set(L, []); m.get(L).push(x); });
      groups = [...m.entries()];
    } else {
      if (voc.group.startsWith('cat:')) { const c = voc.group.slice(4); items = items.filter((x) => x.cat === c); }
      const m = new Map();
      items.forEach((x) => { const c = catName(x.cat); if (!m.has(c)) m.set(c, []); m.get(c).push(x); });
      groups = [...m.entries()];
    }
    const az = $('#vocabAZ');
    if (voc.group === 'az' && !voc.shuffled) {
      az.hidden = false;
      az.innerHTML = groups.map(([L]) => `<a href="#voc-${L}">${L}</a>`).join('');
    } else az.hidden = true;

    $('#vocabCount').textContent = `${items.length} ${voc.kind === 'verbs' ? t('verbsWord') : t('wordsWord')}`;
    const list = $('#vocabList');
    list.classList.toggle('hide-en', voc.hide);
    list.dataset.tap = t('tapReveal');
    list.innerHTML = groups.map(([name, arr]) => `<section class="vocab-group" id="voc-${esc(name)}">
      <h3>${esc(name)} <small>${arr.length}</small></h3>
      <div class="vocab-grid">${arr.map(vcard).join('')}</div></section>`).join('') || `<p class="empty">${esc(t('nothing'))}</p>`;
  }
  function vcard(x) {
    const head = headOf(x);
    const sub = subOf(x);
    const m = isEN() ? null : head.match(ART_ES);
    const word = m ? `<span class="muted">${esc(m[0])}</span>${esc(head.slice(m[0].length))}` : esc(head);
    let extra = '';
    if (voc.kind === 'verbs') {
      if (isEN()) {
        const base = vocabBaseEN(x.en);
        if (EN_BY[base]) extra = `<div class="tags"><button type="button" class="tag link" data-open="${esc(base)}">${esc(base)} → ${esc(t('table'))}</button></div>`;
      } else {
        const base = vocabBaseES(x.w);
        const tags = (x.tags || []).filter((tg) => tg !== 'regular');
        extra = `<div class="tags">${tags.map(tagHtml).join('')}${BY_INF[base] ? `<button type="button" class="tag link" data-open="${esc(base)}">${esc(base)} → ${esc(t('table'))}</button>` : ''}</div>`;
      }
    }
    return `<div class="vcard"><div class="es">${word}</div><div class="en">${esc(sub)}</div>${x.ff ? `<div class="ff">${esc(t('falseFriend'))}</div>` : ''}${extra}</div>`;
  }

  /* ============================================================ practice */
  const EXCLUDE_ES = {
    llover: TENSES_ES.map((x) => x.k), haber: ['imp', 'impneg'], soler: ['fut', 'cond', 'imp', 'impneg', 'perf', 'plus'],
    poder: ['imp', 'impneg'], caber: ['imp', 'impneg'], doler: ['imp', 'impneg'], gustar: ['imp', 'impneg'], parecer: ['imp', 'impneg'],
  };
  const EXCLUDE_EN = { be: ['ppc'] };
  const BASIC = { 'learn-es': ['pres', 'pret', 'impf', 'fut'], 'learn-en': ['parts', 'ps', 'pas', 'pp'] };
  const tensesNow = () => (isEN() ? TENSES_EN : TENSES_ES);
  const statsKey = () => (isEN() ? 'stats-en' : 'stats');
  const settingsKey = () => (isEN() ? 'settings-en' : 'settings');
  let settings, stats;
  const drill = { item: null, checked: false, started: false, forced: null, right: 0, total: 0, streak: 0, lastKey: null };

  function loadPracticeState() {
    settings = Object.assign({ tenses: BASIC[MODE], pool: 'all', mode: 'table', acc: 'strict' }, store.get(settingsKey(), {}));
    const valid = tensesNow().map((x) => x.k);
    settings.tenses = settings.tenses.filter((k) => valid.includes(k));
    stats = store.get(statsKey(), {});
    drill.right = drill.total = drill.streak = 0;
    drill.started = false;
    drill.item = null;
  }
  const saveSettings = () => store.set(settingsKey(), settings);

  function renderTenseChecks() {
    $('#tenseChecks').innerHTML = tensesNow().map((x) => `<label class="check"><input type="checkbox" value="${x.k}" ${settings.tenses.includes(x.k) ? 'checked' : ''}> ${esc(x.a)}</label>`).join('');
    $('#poolSel').value = settings.pool;
    $$('input[name="mode"]').forEach((r) => { r.checked = r.value === settings.mode; });
    $$('input[name="acc"]').forEach((r) => { r.checked = r.value === settings.acc; });
  }

  function initPractice() {
    $('#tenseChecks').addEventListener('change', () => {
      settings.tenses = $$('#tenseChecks input:checked').map((i) => i.value);
      saveSettings();
    });
    const setTenses = (arr) => { $$('#tenseChecks input').forEach((i) => { i.checked = arr.includes(i.value); }); settings.tenses = arr; saveSettings(); nextDrill(); };
    $('#tAll').addEventListener('click', () => setTenses(tensesNow().map((x) => x.k)));
    $('#tNone').addEventListener('click', () => setTenses([]));
    $('#tBasic').addEventListener('click', () => setTenses(BASIC[MODE]));
    $('#poolSel').addEventListener('change', (e) => { settings.pool = e.target.value; saveSettings(); nextDrill(); });
    $$('input[name="mode"]').forEach((r) => r.addEventListener('change', () => { settings.mode = r.value; saveSettings(); nextDrill(); }));
    $$('input[name="acc"]').forEach((r) => r.addEventListener('change', () => { settings.acc = r.value; saveSettings(); }));

    $('#drillForm').addEventListener('submit', (e) => { e.preventDefault(); if (drill.checked) nextDrill(); else checkDrill(false); });
    $('#revealBtn').addEventListener('click', () => { if (!drill.checked) checkDrill(true); });
    $('#skipBtn').addEventListener('click', () => nextDrill());
    $('#openVerbBtn').addEventListener('click', () => drill.item && openVerb(drill.item.key));
    $('#resetStats').addEventListener('click', () => {
      stats = {};
      store.set(statsKey(), stats); drill.right = drill.total = drill.streak = 0; renderStats(); renderScore();
    });

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
  }

  function pool() {
    const list = isEN() ? EN_VERBS.map((v) => ({ key: v.b, regular: !v.irr })) : VERBS.map((v) => ({ key: v.inf, regular: v.tags.includes('regular') }));
    if (settings.pool === 'irregular') return list.filter((v) => !v.regular);
    if (settings.pool === 'regular') return list.filter((v) => v.regular);
    if (settings.pool === 'top50') return list.slice(0, 50);
    if (settings.pool === 'top100') return list.slice(0, 100);
    return list;
  }

  /** builds a generic drill item: {key, head, meaning, tense, sub, tags, rows:[{label, accepted, shown, prefix}]} */
  function buildItem(key, k) {
    if (isEN()) {
      const v = EN_BY[key];
      const T = TENSES_EN.find((x) => x.k === k);
      const rows = k === 'parts'
        ? enParts(v).map((c) => ({ label: c.label, accepted: c.accepted, shown: c.shown }))
        : EN_PERS.map((p, i) => { const c = enCell(v, k, i); return { label: p, accepted: c.accepted, shown: c.shown }; });
      return { key, head: 'to ' + v.b, meaning: v.es, tense: T.a, sub: T.b, tags: v.tags, rows };
    }
    const v = BY_INF[key];
    const T = TENSES_ES.find((x) => x.k === k);
    const rows = personsFor(k).map((p, i) => ({ label: p, accepted: cAccepted(v.t[k][i]), shown: cForm(v.t[k][i]), prefix: k === 'impneg' ? 'no' : '' }));
    return { key, head: v.inf, meaning: v.en, tense: T.a, sub: T.b, tags: v.tags, rows };
  }

  function ensureDrill() { if (!drill.started) nextDrill(); }

  function nextDrill() {
    drill.started = true;
    const tenses = settings.tenses.length ? settings.tenses : BASIC[MODE];
    const excl = isEN() ? EXCLUDE_EN : EXCLUDE_ES;
    const list = pool();
    let key, k, guard = 0;
    do {
      k = rand(tenses);
      key = drill.forced && (isEN() ? EN_BY[drill.forced] : BY_INF[drill.forced]) ? drill.forced : rand(list).key;
      guard++;
    } while (((excl[key] || []).includes(k) || (!drill.forced && key === drill.lastKey && guard < 5)) && guard < 50);
    drill.forced = null;
    drill.lastKey = key;
    const item = buildItem(key, k);
    if (settings.mode === 'single') {
      const i = Math.floor(Math.random() * item.rows.length);
      item.rows = [item.rows[i]];
    }
    drill.item = item;
    drill.checked = false;
    renderDrill();
  }

  function renderDrill() {
    const it = drill.item;
    $('#dTense').textContent = `${it.tense} · ${it.sub}`;
    $('#dVerb').textContent = it.head;
    $('#dMeaning').textContent = it.meaning;
    $('#dTags').innerHTML = '';
    $('#dResult').textContent = '';
    $('#checkBtn').textContent = t('check');
    $('#dRows').innerHTML = it.rows.map((r, i) => `<div class="drow" data-i="${i}">
        <label for="in-${i}">${esc(r.label)}</label>
        <div class="field">${r.prefix ? `<span class="neg">${esc(r.prefix)}</span>` : ''}<input id="in-${i}" type="text" autocapitalize="off" autocorrect="off" autocomplete="off"></div>
        <div class="fb" aria-live="polite"></div></div>`).join('');
    const first = $('#dRows input');
    if (first && !matchMedia('(hover: none)').matches) first.focus();
    $$('#dRows input').forEach((inp, i, all) => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !drill.checked && i < all.length - 1 && !all[i + 1].value) { e.preventDefault(); all[i + 1].focus(); }
      });
    });
  }

  const PRON_ES = /^(yo|t[uú]|[eé]l|ella|usted|ud\.?|nosotr[oa]s|vosotr[oa]s|ell[oa]s|ustedes|uds\.?)\s+/;
  const PRON_EN = /^(i|you|he|she|it|we|they)\s+/;
  function norm(s, row) {
    s = s.toLowerCase().replace(/[’`´]/g, "'").trim().replace(/\s+/g, ' ');
    if (isEN()) return s.replace(PRON_EN, '');
    s = s.replace(PRON_ES, '');
    if (row.prefix) s = s.replace(/^no\s+/, '');
    return s;
  }
  const noAcc = (s) => s.replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ');

  function checkDrill(reveal) {
    const it = drill.item;
    let right = 0;
    $$('#dRows .drow').forEach((rowEl) => {
      const row = it.rows[+rowEl.dataset.i];
      const inp = $('input', rowEl);
      const fb = $('.fb', rowEl);
      const accepted = row.accepted.map((a) => a.toLowerCase());
      const given = norm(inp.value, row);
      const shown = (row.prefix ? row.prefix + ' ' : '') + row.shown;
      rowEl.classList.remove('ok', 'no', 'acc');
      let state;
      if (!reveal && accepted.includes(given)) state = 'ok';
      else if (!reveal && !isEN() && given && accepted.map(noAcc).includes(noAcc(given))) state = settings.acc === 'lenient' ? 'acc' : 'accno';
      else state = 'no';
      if (state === 'ok') { right++; fb.innerHTML = `<span class="sym">✓</span>${esc(t('correct'))}`; rowEl.classList.add('ok'); }
      else if (state === 'acc') { right++; fb.innerHTML = `<span class="sym">⚠</span>${esc(t('accentWarn'))} <span class="answer">${esc(shown)}</span>`; rowEl.classList.add('acc'); }
      else if (state === 'accno') { fb.innerHTML = `<span class="sym">✗</span>${esc(t('accentOnly'))} <span class="answer">${esc(shown)}</span>`; rowEl.classList.add('no'); }
      else { fb.innerHTML = `<span class="sym">✗</span>${esc(reveal ? t('answer') : t('correct'))}: <span class="answer">${esc(shown)}</span>`; rowEl.classList.add('no'); }
      inp.readOnly = true;
    });
    const n = it.rows.length;
    drill.checked = true;
    drill.right += right;
    drill.total += n;
    drill.streak = right === n ? drill.streak + 1 : 0;
    const tk = (isEN() ? TENSES_EN : TENSES_ES).find((x) => x.a === it.tense).k;
    const s = stats[tk] || { r: 0, t: 0 };
    s.r += right; s.t += n; stats[tk] = s;
    store.set(statsKey(), stats);
    $('#dTags').innerHTML = it.tags.map(tagHtml).join('');
    $('#dResult').textContent = right === n ? (n > 1 ? t('perfect', { r: right, n }) : t('perfect1')) : t('partly', { r: right, n });
    $('#checkBtn').textContent = t('next');
    $('#checkBtn').focus();
    renderScore();
    renderStats();
  }

  function renderScore() {
    const pct = drill.total ? Math.round((100 * drill.right) / drill.total) : 0;
    $('#score').innerHTML = `<b>${drill.right}/${drill.total}</b>${esc(t('session'))}${drill.total ? ` · ${pct}%` : ''}<br>${esc(t('streak'))}: ${drill.streak}`;
  }
  function renderStats() {
    const rows = tensesNow().filter((x) => stats[x.k]).map((x) => {
      const s = stats[x.k];
      const pct = Math.round((100 * s.r) / s.t);
      return `<tr><td>${esc(x.a)}</td><td class="n">${s.r}/${s.t}</td><td class="n">${pct}%</td><td><span class="bar" style="width:${Math.max(4, pct * 0.8)}px"></span></td></tr>`;
    });
    $('#statsBody').innerHTML = rows.length
      ? `<table><thead><tr><th>${esc(t('tense'))}</th><th class="n">${esc(t('right'))}</th><th class="n">%</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>`
      : `<p class="hint">${esc(t('noStats'))}</p>`;
  }

  /* ============================================================ mode switch */
  function applyMode() {
    applyI18n();
    setupVerbFilters();
    renderVerbs();
    voc.group = 'topic';
    voc.shuffled = null;
    fillCats();
    renderVocab();
    loadPracticeState();
    renderTenseChecks();
    renderStats();
    renderScore();
    if (!$('#view-practice').hidden) nextDrill();
  }
  $('#langSwitch').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-mode]');
    if (!b || b.dataset.mode === MODE) return;
    MODE = b.dataset.mode;
    store.set('mode', MODE);
    if (dlg.open) dlg.close();
    applyMode();
    // stay on the same tab; jump back to the top of grammar if we were inside a section
    const h = location.hash.slice(1);
    if (!VIEWS.includes(h) && h) location.hash = '#grammar';
    window.scrollTo(0, 0);
  });

  /* ============================================================ boot */
  if (matchMedia('(max-width: 900px)').matches) $('#settings').open = false;
  fillGrammarTables();
  initVerbs();
  initVocab();
  initPractice();
  applyMode();
  route();
})();
