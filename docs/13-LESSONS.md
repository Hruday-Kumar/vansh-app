# 13 · Lessons

A running log of what went wrong and what we changed because of it.

**How to use this file.** Add an entry when something surprises you, breaks in
production, wastes more than two hours, or turns out to have been built on a
false assumption. Do not add an entry for an ordinary bug you fixed in ten
minutes.

**Entry format:**

```markdown
## L-000N · Short title

**Date:** YYYY-MM-DD · **Severity:** low | medium | high | critical
**What happened:** …
**Root cause:** …
**What we changed:** …
**Rule going forward:** …
```

The last line is the point. An entry without a rule is a diary, not a lesson.

---

## L-0001 · The encryption that was not encryption

**Date:** 2026-08-30 · **Severity:** critical (latent)

**What happened.** `src/services/encryption.ts` exported `encryptAES()`, which
returned `{ algorithm: 'AES-256-GCM' }` while internally calling `xorEncrypt()`
— a repeating-key XOR, trivially breakable. The pitch deck advertised
"AES-256-GCM" and "bank-level protection" on the strength of it.

**Root cause.** A placeholder written with a comment ("expo-crypto does not have
full AES support") that was never replaced, and whose function name and return
value both lied about what it did. Nobody caught it because `encryptAES` was
never actually called anywhere — so no test failed and no behaviour looked wrong.

**What we changed.** Deleted the file. Vasiyat is flagged off until real
client-side AES-256-GCM ships with a known-answer test.

**Rule going forward.**
**A function that names an algorithm must implement that algorithm.**
A placeholder must be named `notReallyEncrypted_DO_NOT_USE` or it must not exist.
Crypto ships only with a known-answer test. **No security claim reaches
marketing without a passing test behind it.**

---

## L-0002 · The database was open to the internet

**Date:** 2026-08-30 · **Severity:** critical

**What happened.** Firebase Realtime Database rules allowed unauthenticated
reads of `/trees`. From an ordinary machine, with no credentials:

```
GET .../trees.json?shallow=true                 -> {"vansh-a6w5-xax7":true}
GET .../trees/vansh-a6w5-xax7.json?shallow=true -> {"members":true,"relations":true,...}
```

Every tree ID was enumerable and every family, members and relations readable.
The app uses no Firebase Auth anywhere, so writes must have been equally open.

**Root cause.** Firebase was added for one narrow purpose (QR-triggered sync)
during prototyping, its default open rules were never tightened, and it was
never revisited because sync "worked".

**What we changed.** Rules locked to deny-all, key rotated, Firebase removed
entirely in favour of our own authenticated API.

**Rule going forward.**
**Any service that stores user data gets its access rules verified from an
unauthenticated machine before it holds anyone else, data.** "It works" is not
the same as "it is safe." Prototype infrastructure gets an expiry date the day
it is added.

---

## L-0003 · Three data planes that never met

**Date:** 2026-08-30 · **Severity:** high

**What happened.** The app grew three parallel storage systems: the tree in
AsyncStorage plus Firebase, content in MySQL via the backend, and invitations in
AsyncStorage with no API at all. Nothing reconciled them, so no feature could
combine the graph with the content — which is the entire product thesis.

**Root cause.** Each feature was built end-to-end with whatever storage was
convenient at the time, and no architectural decision was ever recorded about
where data lives.

**What we changed.** One data plane: SQLite locally, Postgres on the server, one
outbox-based sync path. See [ARCHITECTURE](02-ARCHITECTURE.md).

**Rule going forward.**
**Storage is an architectural decision, not a per-feature one.** A new feature
uses the existing data plane or it comes with an ADR explaining why not.
Offline-first is decided once, at the start — it cannot be bolted on later.

---

## L-0004 · BFS is not generation

**Date:** 2026-08-30 · **Severity:** medium

**What happened.** The tree layout assigned generations by BFS depth. On any
family with cousin marriage — common in India — a person is reachable by two
paths of different lengths, and BFS picks the shorter one, placing them a
generation too high. The tree then rendered visibly wrong, and the fix attempts
turned into a 773-line six-phase pipeline.

**Root cause.** The underlying model was wrong: a family was treated as a tree.
It is a directed acyclic graph, and in India it often contains genuine cycles.

**What we changed.** Union-node graph model plus a Sugiyama layered layout with
longest-path ranking. See [TREE-ALGORITHM](04-TREE-ALGORITHM.md).

**Rule going forward.**
**When an algorithm needs a fifth special case, the data model is wrong.** Stop
adding phases and re-examine the model. Also: **build the fixture set first** —
the eight golden families would have caught this in an afternoon.

---

## L-0005 · The demo data that looked real

**Date:** 2026-08-30 · **Severity:** medium

**What happened.** `app/(tabs)/smriti.tsx` merges demo content into real content:

```ts
const effectiveMemories = isDemoMode
  ? [...DEMO_MEMORIES, ...recentMemories]
  : recentMemories;
```

A user in demo mode cannot tell which memories are theirs. Screenshots taken for
the pitch deck showed fabricated families indistinguishable from real ones.

**Root cause.** Demo mode was built to make the app look good in a
demonstration, with no thought about what it looks like to an actual user.

**What we changed.** Demo content is separated, labelled with a persistent
"Sample family — not your data" banner, and clearable in one tap.

**Rule going forward.**
**Fake data must always be visibly fake.** If a screenshot of demo mode could be
mistaken for real usage, the labelling is insufficient.

---

## L-0006 · The name was taken, twice

**Date:** 2026-08-31 · **Severity:** low (caught in time)

**What happened.** Two candidate names were proposed and both were already in
use in India: **Kutumb** is a Tiger Global-funded social app with 5M downloads,
and **Ekatra** is a live Play Store app (`com.poojapro`). The second was caught
only _after_ it had been recommended and accepted.

**Root cause.** The name was chosen for meaning first and checked for
availability second.

**What we changed.** Settled on **Parivāraḥ Sarvasvam**, with Play Store, App
Store, domain and trademark-class verification as an explicit Phase 0 checklist
item before any branding spend.

**Then it happened a third time.** The short form proposed for the new name,
**Parivāra**, turned out to sit in the single most crowded corner of the Indian
Play Store — at least five "Parivar" apps, two of them doing family trees with
events and RSVP, and `parivar.app` already live. Caught before any branding
spend, but only because the check was finally run.

**What we changed.** The distinctive half of the name, **Sarvasvam**, becomes
the short form, the package and the domain. The full mark stays
परिवारः सर्वस्वम्.

**Rule going forward.**
**Check availability before recommending a name, not after.** Every obvious
Sanskrit and Hindi word for family, bond or generation is already an app —
assume a candidate is taken until verified clear. And when a name has a generic
half and a distinctive half, **the distinctive half is the one you can own.**

---

## L-0007 · Claiming there was no competitor

**Date:** 2026-08-30 · **Severity:** medium

**What happened.** The pitch deck claimed "No direct competitor in the Indian
heritage space." Five minutes of searching found six, including Aangan, which is
building substantially the same product.

**Root cause.** Competitive research was never done; the claim was an assumption
that went unchallenged because nothing forced it to be checked.

**What we changed.** The honest landscape is in [BUSINESS](12-BUSINESS.md)
section 2, and the deck is corrected in Phase 0.

**Rule going forward.**
**Never claim an absence you have not searched for.** And the honest version is
usually the stronger pitch: "we are on the right side of a structural asymmetry
against a named competitor" beats "we have no competitors," which only signals
that you have not looked.

---

## L-0008 · Waivers

Production-checklist items waived for a release are recorded here, with a reason
and an owner, so that a waiver is a visible decision rather than a quiet
omission.

| Date | Release | Item waived | Reason | Owner | Resolved |
| ---- | ------- | ----------- | ------ | ----- | -------- |
| —    | —       | —           | —      | —     | —        |

---

## Open questions

Things we do not know yet and will learn from real families. Each becomes a
lesson once answered.

| #   | Question                                                     | Will be answered in            |
| --- | ------------------------------------------------------------ | ------------------------------ |
| Q1  | Will elders actually record voice comments, or only listen?  | Phase 2                        |
| Q2  | Does the widget drive opens, or is it wallpaper?             | Phase 3                        |
| Q3  | Do families want one tree, or several branch trees?          | Phase 2                        |
| Q4  | Is punya tithi welcome, or does it feel intrusive?           | Phase 2 — **handle with care** |
| Q5  | Do people share into WhatsApp unprompted?                    | Phase 3                        |
| Q6  | Is ₹499/year acceptable, or is one-time-only the real model? | Phase 5                        |
| Q7  | Which language after the first six?                          | Phase 4, from install data     |

**Q4 is the one to watch.** Death anniversaries are our most distinctive feature
and our largest emotional risk. Ask before assuming, make it opt-in per person,
and never notify about a death anniversary without the family having set it up.
