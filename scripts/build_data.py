#!/usr/bin/env python3
"""
Builds data/verbs.js and data/vocab.js from the text files in scripts/source/.

Only needed when you edit the word lists — the generated files are committed,
so the website itself has no build step.

    pip install verbecc
    python3 scripts/build_data.py
"""
import json
import re
from pathlib import Path

from verbecc import CompleteConjugator

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "source"
OUT = ROOT / "data"

cg = CompleteConjugator(lang="es")

PERSONS = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"]
IMP_PERSONS = ["tú", "usted", "nosotros", "vosotros", "ustedes"]

# key: (mood, tense, persons)
TENSES = {
    "pres":     ("indicativo", "presente", PERSONS),
    "pret":     ("indicativo", "pretérito-perfecto-simple", PERSONS),
    "impf":     ("indicativo", "pretérito-imperfecto", PERSONS),
    "fut":      ("indicativo", "futuro", PERSONS),
    "cond":     ("condicional", "presente", PERSONS),
    "perf":     ("indicativo", "pretérito-perfecto-compuesto", PERSONS),
    "plus":     ("indicativo", "pretérito-pluscuamperfecto", PERSONS),
    "subj":     ("subjuntivo", "presente", PERSONS),
    "subjimpf": ("subjuntivo", "pretérito-imperfecto-1", PERSONS),
    "imp":      ("imperativo", "afirmativo", IMP_PERSONS),
    "impneg":   ("imperativo", "negativo", IMP_PERSONS),
}

# Regular endings (used to detect + highlight irregular forms)
SAME = lambda d: {**d, "ir": d["er"]} if "ir" not in d else d
END = {
    "pres": {"ar": "o as a amos áis an", "er": "o es e emos éis en", "ir": "o es e imos ís en"},
    "pret": SAME({"ar": "é aste ó amos asteis aron", "er": "í iste ió imos isteis ieron"}),
    "impf": SAME({"ar": "aba abas aba ábamos abais aban", "er": "ía ías ía íamos íais ían"}),
    "subj": SAME({"ar": "e es e emos éis en", "er": "a as a amos áis an"}),
    "subjimpf": SAME({"ar": "ara aras ara áramos arais aran", "er": "iera ieras iera iéramos ierais ieran"}),
    "imp": {"ar": "a e emos ad en", "er": "e a amos ed an", "ir": "e a amos id an"},
    "impneg": SAME({"ar": "es e emos éis en", "er": "as a amos áis an"}),
}
END = {t: {g: e.split() for g, e in d.items()} for t, d in END.items()}
FUT = "é ás á emos éis án".split()
COND = "ía ías ía íamos íais ían".split()
HABER_PRES = "he has ha hemos habéis han".split()
HABER_IMPF = "había habías había habíamos habíais habían".split()

# RAE 2010: one-syllable forms lose the written accent (old spelling still accepted)
MONOSYLLABLE = {"rió": "rio", "frió": "frio", "huí": "hui", "huís": "huis",
                "riáis": "riais", "friáis": "friais", "rié": "rie"}
# Participle fixes / accepted alternatives
PART_FIX = {"elegir": ("elegido", []), "imprimir": ("impreso", ["imprimido"]),
            "freír": ("frito", ["freído"]), "proveer": ("provisto", ["proveído"])}


def group_of(inf):
    g = inf[-2:].replace("í", "i")
    return g


def regular_forms(inf, tense):
    g = group_of(inf)
    stem = inf[:-2]
    base = stem + g  # oír -> oir
    if tense == "fut":
        return [base + e for e in FUT]
    if tense == "cond":
        return [base + e for e in COND]
    part = stem + ("ado" if g == "ar" else "ido")
    if tense == "perf":
        return [h + " " + part for h in HABER_PRES]
    if tense == "plus":
        return [h + " " + part for h in HABER_IMPF]
    return [stem + e for e in END[tense][g]]


def strip_form(s, tense):
    s = s.strip()
    if tense == "impneg" and s.startswith("no "):
        s = s[3:]
    elif tense not in ("imp",):
        parts = s.split(" ", 1)
        if len(parts) == 2 and parts[0] in ("yo", "tú", "él", "nosotros", "vosotros", "ellos", "usted", "ustedes"):
            s = parts[1]
    return s


def fix_mono(form):
    words = form.split(" ")
    words[-1] = MONOSYLLABLE.get(words[-1], words[-1])
    return " ".join(words)


def cell(forms, regular):
    """string if regular, else [form, regular, alt1, alt2...]"""
    main = forms[0]
    alts = [f for f in forms[1:] if f != main]
    if main == regular and not alts:
        return main
    return [main, "" if main == regular else regular, *alts]


MODELS = {"ar": "hablar", "er": "comer", "ir": "vivir"}


def raw_conjugation(inf):
    """verbecc crashes on a few regular verbs (e.g. pasar) — fall back to the regular model verb."""
    try:
        return json.loads(cg.conjugate(inf).to_json())
    except Exception:
        g = group_of(inf)
        model = MODELS[g]
        ms, vs = model[:-2], inf[:-2]
        data = json.loads(cg.conjugate(model).to_json())
        for mood in data["moods"].values():
            for rows in mood.values():
                for r in rows:
                    r["c"] = [re.sub(r"\b" + ms, vs, c) for c in r["c"]]
        print(f"  (fallback: {inf} conjugated like regular {model})")
        return data


def conjugate(inf):
    data = raw_conjugation(inf)
    moods = data["moods"]
    predicted = data.get("verb", {}).get("predicted", False)
    out = {}
    for key, (mood, tense, persons) in TENSES.items():
        rows = {r.get("pr"): r["c"] for r in moods[mood][tense] if r.get("pr")}
        reg = regular_forms(inf, key)
        cells = []
        for i, p in enumerate(persons):
            raw = [strip_form(c, key) for c in rows[p]]
            forms = []
            for f in raw:
                fixed = fix_mono(f)
                forms.append(fixed)
                if fixed != f:
                    forms.append(f)  # keep old spelling as accepted alternative
            if key == "subjimpf":  # accept -se forms as alternatives
                se = {r.get("pr"): r["c"] for r in moods["subjuntivo"]["pretérito-imperfecto-2"] if r.get("pr")}
                forms += [fix_mono(strip_form(c, key)) for c in se[p]]
            if key in ("perf", "plus") and inf in PART_FIX:
                good, alts = PART_FIX[inf]
                aux = forms[0].split(" ")[0]
                forms = [aux + " " + good] + [aux + " " + a for a in alts]
            cells.append(cell(forms, reg[i]))
        out[key] = cells
    g = group_of(inf)
    stem = inf[:-2]
    ger = moods["gerundio"]["gerundio"][0]["c"][0]
    out["ger"] = cell([ger], stem + ("ando" if g == "ar" else "iendo"))
    part = moods["participo"]["participo"][0]["c"][0]
    alts = []
    if inf in PART_FIX:
        part, alts = PART_FIX[inf]
    out["part"] = cell([part, *alts], stem + ("ado" if g == "ar" else "ido"))
    return out, predicted


def is_irr(c):
    return isinstance(c, list) and c[1] != ""


def form_of(c):
    return c if isinstance(c, str) else c[0]


STEM_PATTERNS = [("e", "ie", "e→ie"), ("o", "ue", "o→ue"), ("u", "ue", "u→ue"),
                 ("e", "i", "e→i"), ("i", "ie", "i→ie"), ("o", "hue", "o→ue"),
                 ("e", "í", "e→i"), ("i", "í", "accent í"), ("u", "ú", "accent ú")]


def stem_change(inf, t):
    g = group_of(inf)
    stem = inf[:-2]
    act = form_of(t["pres"][2])
    end = END["pres"][g][2]
    if not act.endswith(end):
        return None
    act_stem = act[: len(act) - len(end)]
    for a, b, tag in STEM_PATTERNS:
        idx = stem.rfind(a)
        if idx >= 0 and stem[:idx] + b + stem[idx + 1:] == act_stem:
            return tag
    return None


def tags_for(inf, t):
    tags = []
    if inf in ("ser", "estar", "ir", "haber", "dar", "ver", "saber"):
        tags.append("very irregular")
    sc = stem_change(inf, t)
    if sc:
        tags.append(sc)
    yo = form_of(t["pres"][0])
    if is_irr(t["pres"][0]):
        if yo.endswith("go") and not (inf[:-2] + "o").endswith("go"):
            tags.append("yo -go")
        elif yo.endswith("zco"):
            tags.append("yo -zco")
        elif yo.endswith("jo") and inf[-3:] in ("ger", "gir"):
            tags.append("g→j")
    if inf.endswith("uir") and "y" in form_of(t["pres"][2]):
        tags.append("-uir → y")
    pret_yo, pret_el = t["pret"][0], t["pret"][2]
    if is_irr(pret_yo):
        f = form_of(pret_yo)
        if inf[-3:] in ("car", "gar", "zar") and f[-3:] in ("qué", "gué") or f.endswith("cé"):
            tags.append("spelling c/g/z")
        elif not f.endswith(("é", "í", "i")):
            tags.append("strong preterite")
    if is_irr(pret_el) and form_of(pret_el).endswith("yó") and not inf.endswith("uir"):
        tags.append("i→y preterite")
    if (is_irr(pret_el) and group_of(inf) == "ir" and form_of(pret_el).endswith(("ió", "io"))
            and "strong preterite" not in tags):
        tags.append("-ir 3rd-person change")
    if is_irr(t["fut"][0]):
        tags.append("irregular future")
    if is_irr(t["part"]):
        f = form_of(t["part"])
        if not f.endswith("ído"):
            tags.append("irregular participle")
    if is_irr(t["imp"][0]) and "very irregular" not in tags:
        f = form_of(t["imp"][0])
        # short tú-imperatives: di, haz, ve, pon, sal, sé, ten, ven
        if len(f) <= len(inf) - 1 and not f.endswith(("a", "e")):
            tags.append("short tú-imperative")
    any_irr = any(is_irr(c) for k, v in t.items() for c in (v if isinstance(v, list) and k not in ("ger", "part") else [v]))
    if not any_irr:
        tags.insert(0, "regular")
    elif not tags:
        tags.append("other")
    return tags


def read_list(name):
    cat = "General"
    items = []
    for line in (SRC / name).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            if line.startswith("# ") and "|" not in line and "format" not in line and "—" not in line:
                cat = line[2:].strip()
            continue
        w, en = [x.strip() for x in line.split("|", 1)]
        items.append({"w": w, "en": en, "cat": cat})
    return items


def base_verb(phrase):
    first = phrase.split(" ")[0]
    if first.endswith("se") and len(first) > 4 and first[-4:-2] in ("ar", "er", "ir", "ír"):
        return first[:-2], True
    return first, False


def main():
    OUT.mkdir(exist_ok=True)
    # ---- core verbs
    core = read_list("core_verbs.txt")
    seen, verbs, predicted = set(), [], []
    for it in core:
        if it["w"] in seen:
            continue
        seen.add(it["w"])
        t, pred = conjugate(it["w"])
        if pred:
            predicted.append(it["w"])
        verbs.append({"inf": it["w"], "en": it["en"], "g": group_of(it["w"]), "tags": tags_for(it["w"], t), "t": t})
    verbs = verbs[:200]
    (OUT / "verbs.js").write_text(
        "// Generated by scripts/build_data.py — 200 core verbs with full conjugations.\n"
        "// Cell format: \"form\" (regular) or [form, regularForm, ...acceptedAlternatives]\n"
        "window.VERB_DATA = " + json.dumps(verbs, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8")

    # ---- vocab verbs (excluding the 200 core verbs)
    core_set = {v["inf"] for v in verbs}
    vv, seen_v = [], set()
    for it in read_list("vocab_verbs.txt"):
        if it["w"] in core_set or it["w"] in seen_v:
            continue
        seen_v.add(it["w"])
        base, refl = base_verb(it["w"])
        tags = []
        try:
            t, pred = conjugate(base)
            tags = [x for x in tags_for(base, t) if x not in ("other",)]
            tags = [x for x in tags if x in ("regular", "e→ie", "o→ue", "u→ue", "e→i", "i→ie", "yo -go", "yo -zco",
                                             "g→j", "-uir → y", "strong preterite", "irregular future",
                                             "irregular participle", "very irregular", "accent í", "accent ú")]
        except Exception as e:  # noqa
            print("could not conjugate", base, e)
        if refl:
            tags.insert(0, "reflexive")
        vv.append({"w": it["w"], "en": it["en"], "cat": it["cat"], "g": group_of(base), "tags": tags})

    words, seen_w = [], set()
    for it in read_list("vocab_words.txt"):
        if it["w"] in seen_w:
            continue
        seen_w.add(it["w"])
        ff = it["en"].startswith("!")
        words.append({"w": it["w"], "en": it["en"].lstrip("!"), "cat": it["cat"], **({"ff": 1} if ff else {})})

    (OUT / "vocab.js").write_text(
        "// Generated by scripts/build_data.py — vocabulary verbs + words (Spanish → English).\n"
        "window.VOCAB_DATA = " + json.dumps({"verbs": vv, "words": words}, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8")

    print(f"core verbs: {len(verbs)} | vocab verbs: {len(vv)} | words: {len(words)}")
    if predicted:
        print("ML-predicted (check manually):", ", ".join(predicted))


if __name__ == "__main__":
    main()
