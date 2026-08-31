# 00 · Vision

## 1. The one-sentence version

> **Parivāraḥ Sarvasvam is a private social network for Indian families, where the
> family tree is not a feature — it is the social graph that makes everything
> else intelligent.**

---

## 2. The problem, stated honestly

Indian families are large, multi-generational, geographically scattered, and
multilingual. Today they coordinate on **WhatsApp**, which is excellent at
messaging and terrible at memory:

| What families need            | What WhatsApp does                           |
| ----------------------------- | -------------------------------------------- |
| Photos preserved for 30 years | Compressed to mush, lost when the phone dies |
| "Who is this person to me?"   | Nothing                                      |
| Grandparents' stories         | Voice notes buried in a scroll               |
| Knowing whose birthday it is  | Someone has to remember                      |
| A shared family history       | Group is deleted when the admin leaves       |
| Elders participating          | Typing-first UI they cannot use              |

Family tree apps solve the second problem and nothing else. They are
**archives** — you visit once, build a tree, and never return. Family social
apps solve the first problem and nothing else. They are **feeds** — pleasant,
forgettable, and empty by week three because nobody in a 25-person family posts
daily.

**Neither side has the other half. That gap is the product.**

---

## 3. The thesis

A kinship graph is a **richer social graph than a friend graph.** A friend graph
knows that A and B are connected. A kinship graph knows that A is B's
_father's younger brother's wife_ — and that in Telugu she is **పిన్ని (pinni)**
and in Hindi she is **चाची (chachi)**.

That difference is not academic. It is what lets the app do things nobody else
can:

- Know that today is someone's birthday **and what to call them**, per relative,
  per language
- Auto-share a wedding album with exactly the right branch of the family
- Observe **punya tithi** (death anniversaries) and resurface that person's
  photos and recorded voice
- Teach a child who everyone in an old photograph is
- Generate a reason to open the app on a Tuesday, forever, without a single
  user posting anything

> **The tree is the reason the feed is smart.
> The feed is the reason anyone opens the app on a Tuesday.**

Everyone else picked one. We are the only ones building both, and the graph
side is the harder half — which is exactly why it is defensible.

---

## 4. Who we are for

### Primary — **The Keeper** (35–55)

The person in every family who already keeps the photos, remembers the dates,
and makes the WhatsApp group. They install first, invite everyone, and do 70%
of the uploading. **The entire product is designed to make this person feel
powerful and appreciated.**

### Critical — **The Elder** (60–85)

Grandparents. They are the _content_ — the stories, the faces, the recipes, the
history. If they cannot use the app, the app has no soul.
**Design law: every core action must be completable with voice plus two taps,
at 20pt minimum text, in their own language.**

### Growth — **The Diaspora Child** (18–35)

Moved to another city or country. Guilty about distance. Wants to feel
connected and wants their children to know where they come from. They are the
ones who will pay.

### Passive — **The Rest** (all ages)

Will never post. Will look. Design so that lurking is still valuable and
lurkers still get pulled in one tap at a time (a voice birthday wish, a reaction,
a name tag).

---

## 5. What we are NOT building

Writing this down is as important as the feature list. Each of these was
considered and deliberately rejected.

| Not building                 | Why                                                                       |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Video**                    | Storage and bandwidth we cannot afford at ₹0. Photos + voice only         |
| Public profiles or discovery | This is private by construction. There is no "explore"                    |
| Chat / messaging             | We will never beat WhatsApp. We integrate with it instead                 |
| DNA testing                  | Capital-intensive, regulated, not our fight                               |
| Astrology / kundli matching  | iMeUsWe's angle. Dilutes the memory positioning                           |
| Under-18 accounts (v1)       | DPDP Act verifiable-parental-consent burden. Adults manage child profiles |
| AI-generated content         | "Demo garnish." Deferred entirely until the core works                    |
| iOS (v1)                     | Android + India first. Revisit at Phase 5                                 |
| Web app (v1)                 | Except public share links, which must work in a browser                   |

---

## 6. Why we win

Five advantages, in order of durability:

1. **Pan-Indian kinship database** — 22 scheduled languages, Dravidian _and_
   Indo-Aryan kinship systems, relation-path → term resolution. This takes years
   to build and is the hardest thing to copy. See [KINSHIP](05-KINSHIP.md).
2. **A real graph under a real feed** — adding a feed on top of a correct graph
   is far easier than retrofitting a correct graph under an existing feed.
   Our competitors are on the wrong side of that asymmetry.
3. **The occasion engine** — the graph manufactures a reason to open the app
   roughly weekly, forever, with zero user effort. See [ENGAGEMENT](06-ENGAGEMENT.md).
4. **Elder-first design** — voice everywhere, huge type, no typing required.
   Competitors treat this as an accessibility checkbox; for us it is the
   primary interaction model.
5. **Punya tithi and Indian ritual calendar** — nobody in the world does this.
   It is the emotional core of an Indian family's year.

---

## 7. The competitive picture (honest version)

Our previous pitch deck claimed "no direct competitor in the Indian heritage
space." **That is false and must never be repeated.** See [BUSINESS](12-BUSINESS.md)
for the full landscape. The short version:

| Competitor    | What they are                                   | Their weakness                      |
| ------------- | ----------------------------------------------- | ----------------------------------- |
| **Aangan**    | Hindi-first family social network, 3-level tree | Hindi belt only; toy tree; APK-only |
| VanshApp      | Vanshavali + purohit services, ₹499/yr          | Archive, not a social product       |
| iMeUsWe       | 1.6B records, astrology, DNA                    | Global generic; not India-native UX |
| Vamshavriksha | Hindu structures, gothram                       | Narrow; dated                       |
| Kutumb        | Reddit for Bharat, 5M downloads, $26M raised    | Communities, not families           |

**Aangan is the direct competitor.** They are ahead on the feed and behind on
everything structural. We are coming at the same destination from the harder,
more defensible side.

---

## 8. Success, defined

We refuse vanity metrics. These are the only numbers that matter, in order:

| Horizon | Metric                                      | Target                      |
| ------- | ------------------------------------------- | --------------------------- |
| Phase 2 | Real families using it (not us)             | **5 families, 12+ testers** |
| Phase 3 | D30 retention of the Keeper                 | **> 40%**                   |
| Phase 3 | Families where ≥1 elder posted              | **> 50%**                   |
| Phase 4 | Median weekly opens per active user         | **≥ 3**                     |
| Phase 4 | Voice stories recorded per family per month | **≥ 2**                     |
| Phase 5 | Families paying ₹499/yr                     | **100**                     |

**The single most important metric is elder participation.** If grandparents
do not use it, we have built another photo app.

---

## 9. Constraints we accept

| Constraint                        | Consequence                                                              |
| --------------------------------- | ------------------------------------------------------------------------ |
| Solo developer, 21–24 hrs/week    | Ruthless sequencing. No parallel workstreams                             |
| ₹0 recurring budget               | Free-tier-only infrastructure. See [ARCHITECTURE](02-ARCHITECTURE.md) §6 |
| One-time ~₹2,100 (Play Store $25) | The only sanctioned spend before revenue                                 |
| Android + India first             | No iOS-specific work enters the codebase                                 |
| 12-tester Play Store gate         | On the critical path. Testers = our own family                           |
