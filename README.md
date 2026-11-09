# Spanish Drill

Static website to refresh Spanish verb conjugation — **Spanish → English**.

A switch in the top bar flips the whole site to the reverse direction: **Aprender inglés** — explanations in Spanish,
200 English verbs (principal parts + 13 tenses), the vocabulary shown English → Spanish and an English verb trainer.

- **How it works** — -ar / -er / -ir endings for 11 tenses, irregular patterns and memory tricks
- **200 Verbs** — the most common verbs with full conjugation tables; irregular parts are marked (bold = ending, wavy underline + `*` = irregular)
- **Vocabulary** — 376 intermediate verbs + 396 words, by topic or A–Z, with a "hide English" self-test mode
- **Practice** — random verb + tense from the 200, type the forms, get checked (strict or lenient accents), stats saved in the browser

No framework, no build step: plain HTML, CSS and JavaScript.

## Structure

```
index.html            all four sections (tabs via #hash)
assets/css/style.css  styles (light + dark mode)
assets/js/app.js      rendering, filters, practice logic
data/verbs.js         200 verbs, generated
data/vocab.js         vocabulary, generated
data/en_verbs.js      200 English verbs, generated
scripts/              data generator + editable word lists
```

## Run locally

Just open `index.html` in a browser — or `npx serve .`

## Deploy on Vercel

Import the repo in Vercel → Framework preset **Other** → no build command, output directory `.` (root). Done.

## Editing the word lists

Edit the text files in `scripts/source/` (`infinitive|English`, `# Category` lines for groups), then regenerate:

```bash
pip install verbecc
python3 scripts/build_data.py
```

English verbs: edit `scripts/source/en_verbs.txt` (`base|Spanish|past|participle|ing`, empty = regular) and run `python3 scripts/build_en.py` (no dependencies).

Conjugations are generated with [verbecc](https://github.com/bretttolbert/verbecc) and use RAE 2010 spelling (*rio, hui*); old spellings are accepted in practice.
