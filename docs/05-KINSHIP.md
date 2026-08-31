# 05 · Kinship

**This is the moat.** It is the hardest thing in the product to build, the
hardest to copy, and the reason a Tamil family and a Bengali family can both use
the same app and both feel it was made for them.

---

## 1. Why this matters

English has one word for "uncle". Hindi has at least four. Telugu has five, and
which one you use encodes whether he is older or younger than your father.

Every competitor either uses English terms, or is Hindi-only. **Neither works for
India.** Getting this right is not localisation — it is the product.

---

## 2. Two kinship systems, structurally different

India does not have one kinship system. It has (at least) two, and they are not
variations of each other — they classify relatives differently.

### Indo-Aryan (Hindi, Bengali, Marathi, Gujarati, Punjabi, Odia)

**Differentiates by side and seniority.** Whose brother, and older or younger
than your parent.

| Relation                | Hindi         |
| ----------------------- | ------------- |
| Father, elder brother   | ताऊ · tāū     |
| Father, younger brother | चाचा · chāchā |
| Mother, brother         | मामा · māmā   |
| Father, sister          | बुआ · buā     |
| Mother, sister          | मौसी · mausī  |

Cousins are largely undifferentiated — all are "cousin brother" or
"cousin sister".

### Dravidian (Tamil, Telugu, Kannada, Malayalam)

**Differentiates by cross versus parallel** — a categorical distinction that
does not exist in Indo-Aryan at all.

- **Parallel** relatives (father, brother; mother, sister) are classed _with_
  your own parents and siblings. Your parallel cousins are your **brothers and
  sisters**, not cousins.
- **Cross** relatives (father, sister; mother, brother) are a different
  category. Your cross cousins are traditionally marriageable, and are named
  with a distinct set of terms.

This produces the striking symmetry that Dravidian speakers take for granted
and Indo-Aryan speakers find odd:

| Relation                | Telugu      | Tamil           |
| ----------------------- | ----------- | --------------- |
| Mother, brother         | మామ · māma  | மாமா · māmā     |
| Father, sister, husband | మామ · māma  | மாமா · māmā     |
| Father, sister          | అత్త · atta | அத்தை · aththai |
| Mother, brother, wife   | అత్త · atta | அத்தை · aththai |

**A system built on Hindi terms cannot represent this**, which is exactly why
Aangan cannot expand south without a rebuild. We build it correctly from the
start.

---

## 3. Path notation

Every relationship is a **path** from ego through primitive links.

| Symbol           | Link                                        |
| ---------------- | ------------------------------------------- |
| `F`              | father                                      |
| `M`              | mother                                      |
| `B`              | brother                                     |
| `Z`              | sister                                      |
| `S`              | son                                         |
| `D`              | daughter                                    |
| `H`              | husband                                     |
| `W`              | wife                                        |
| `e` / `y` prefix | elder / younger than the preceding relative |

Examples:

| Path   | Meaning                 | Hindi       | Telugu                | Tamil               |
| ------ | ----------------------- | ----------- | --------------------- | ------------------- |
| `FeB`  | father, elder brother   | ताऊ tāū     | పెద్దనాన్న peddananna | பெரியப்பா periyappa |
| `FyB`  | father, younger brother | चाचा chāchā | చిన్నాన్న chinnanna   | சித்தப்பா chithappa |
| `FyBW` | that man, wife          | चाची chāchī | పిన్ని pinni          | சித்தி chithi       |
| `MB`   | mother, brother         | मामा māmā   | మామ māma              | மாமா māmā           |
| `MBW`  | that man, wife          | मामी māmī   | అత్త atta             | அத்தை aththai       |
| `FZ`   | father, sister          | बुआ buā     | అత్త atta             | அத்தை aththai       |
| `MZ`   | mother, sister          | मौसी mausī  | పిన్ని / పెద్దమ్మ     | சித்தி / பெரியம்மா  |
| `FF`   | father, father          | दादा dādā   | తాత tāta              | தாத்தா thāththā     |
| `MF`   | mother, father          | नाना nānā   | తాత tāta              | தாத்தா thāththā     |

Note `FF` and `MF`: Hindi distinguishes the paternal from the maternal
grandfather; Telugu and Tamil do not. **The mapping is many-to-many in both
directions.** A term table keyed on English glosses would lose this.

---

## 4. The term database

A data file, not code. It ships with the app and is versioned independently so
a term correction does not require a release.

```jsonc
// shared/i18n/kinship/te.json
{
  "language": "te",
  "system": "dravidian",
  "terms": [
    {
      "path": "FyB",
      "term": "చిన్నాన్న",
      "roman": "chinnanna",
      "gloss_en": "father's younger brother",
      "vocative": "చిన్నాన్నా",
      "gender": "male",
    },
    {
      "path": "FyBW",
      "term": "పిన్ని",
      "roman": "pinni",
      "gloss_en": "father's younger brother's wife",
      "vocative": "పిన్నీ",
      "gender": "female",
    },
  ],
  "rules": [
    {
      "match": "F[BZ]?[SD]",
      "note": "parallel cousins are addressed as siblings",
      "rewrite": "sibling",
    },
  ],
}
```

Three layers, applied in order:

1. **Exact path match** — covers roughly 90% of everyday use with ~60 entries
   per language
2. **Rewrite rules** — regex over the path, for structural facts like Dravidian
   parallel-cousin merging
3. **Compositional fallback** — build a descriptive phrase from primitives when
   no term exists, e.g. "your mother, elder sister, son"

We never show a wrong term. If confidence is low we show the descriptive
fallback, which is always correct even when it is not idiomatic.

---

## 5. The resolution algorithm

```
resolve(ego, target, language):
  1. path = shortestPath(graph, ego, target)      # bidirectional BFS, cap 6 hops
  2. if none: return "related through marriage"   # or no relation
  3. path = annotate(path)                        # add e/y from birth dates
  4. path = canonicalise(path)                    # FBS -> FBS, collapse HZ/WB etc.
  5. for rule in language.rules:                  # Dravidian merges, etc.
       path = rule.apply(path)
  6. term = language.terms[path]
  7. return term ?? compose(path, language)       # descriptive fallback
```

**Complexity:** bidirectional BFS on a graph of a few hundred nodes is
sub-millisecond. The result is cached per `(ego, target, language)` and
invalidated when a relation edge changes.

**Where seniority is unknown** — a very common case, since many older relatives
have no recorded birth date — we ask once, inline, rather than guessing:
"Is Ramesh older or younger than your father?" One tap. The answer is stored on
the relation and never asked again.

---

## 6. Where kinship shows up

This is not a lookup buried in a settings screen. It is visible everywhere,
which is what makes the app feel like it was built for the user personally.

| Surface       | Example                             |
| ------------- | ----------------------------------- |
| Tithi cards   | "Sunita **Chāchī** turns 52 today"  |
| Photo tags    | "Tagged: **Māmā**, **Atta**, Priya" |
| Member sheet  | "Ramesh — your **Peddananna**"      |
| Notifications | "Your **Buā** left a voice note"    |
| Tree nodes    | The relation label under each name  |
| Search        | "Show me photos of my **Nāna**"     |
| Invitations   | "**Māmā** invited you to…"          |

**Every one of these strings is different for every viewer.** That is the point.
The same photo shows "Māmā" to one cousin and "Nāna" to another.

---

## 7. Coverage plan

| Wave | Languages                             | Terms each | Phase |
| ---- | ------------------------------------- | ---------- | ----- |
| 1    | English, Hindi, Telugu                | ~60        | P0    |
| 2    | Tamil, Bengali, Marathi               | ~60        | P1    |
| 3    | Kannada, Malayalam, Gujarati, Punjabi | ~60        | P4    |
| 4    | Odia, Assamese, Urdu, Konkani         | ~50        | P4    |
| 5    | Remaining scheduled languages         | ~40        | P5    |

**Sourcing.** Each language is drafted from published kinship literature, then
**verified by at least two native speakers from different regions** before it
ships. Regional variation within a language is real (Awadhi and Braj differ from
standard Hindi), so terms carry an optional `region` field and the app can
prefer a regional variant.

**This is a data-collection project, not a coding project.** Budget roughly
6 to 8 hours per language, most of it verification, not typing.

---

## 8. Testing

| Test                 | Asserts                                                     |
| -------------------- | ----------------------------------------------------------- |
| Path resolution      | 200 known `(path, language) -> term` pairs                  |
| Dravidian merging    | `FBS` resolves to a sibling term in `te`, `ta`, `kn`, `ml`  |
| Indo-Aryan seniority | `FeB` and `FyB` produce different terms in `hi`             |
| Symmetry             | `MB` and `FZH` produce the same term in Dravidian languages |
| Fallback             | An unknown path never throws and never returns empty        |
| Reciprocity          | If A is B, `Chāchā`, then B is A, `Bhatījā`                 |
| Coverage             | Every language file resolves all 60 core paths              |

---

## 9. Files

```
features/vriksha/model/kinship/
├── resolver.ts        # the algorithm in section 5
├── path.ts            # notation, canonicalisation, composition
├── rules.ts           # rewrite-rule engine
└── __tests__/

shared/i18n/kinship/
├── en.json
├── hi.json
├── te.json
├── ta.json
└── ...
```
