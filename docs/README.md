# परिवारः सर्वस्वम् · Parivāraḥ Sarvasvam

> **Family is everything.**
> A social platform for Indian families — built on a real kinship graph.

This directory is the single source of truth for what we are building, how we
are building it, and how we will sell it. Code follows these documents. When
code and documents disagree, the document is updated in the same commit.

---

## The document set

| #   | Document                                           | Answers                                                                       |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| 00  | [VISION](00-VISION.md)                             | What is this, who is it for, why will it win                                  |
| 01  | [PRODUCT](01-PRODUCT.md)                           | Every feature, specified                                                      |
| 02  | [ARCHITECTURE](02-ARCHITECTURE.md)                 | How the system is built                                                       |
| 03  | [CODEBASE-STRUCTURE](03-CODEBASE-STRUCTURE.md)     | The restructure — target tree, exact moves                                    |
| 04  | [TREE-ALGORITHM](04-TREE-ALGORITHM.md)             | Layout, rendering, GEDCOM                                                     |
| 05  | [KINSHIP](05-KINSHIP.md)                           | Pan-Indian kinship model — our moat                                           |
| 06  | [ENGAGEMENT](06-ENGAGEMENT.md)                     | Why anyone opens this on a Tuesday                                            |
| 07  | [SECURITY-PRIVACY](07-SECURITY-PRIVACY.md)         | Threats, DPDP Act, crypto                                                     |
| 08  | [SDLC](08-SDLC.md)                                 | How we work, day to day                                                       |
| 09  | [ROADMAP](09-ROADMAP.md)                           | Phases 0–5 overview and dependency map — start at [phases/](phases/) to build |
| 10  | [PRODUCTION-CHECKLIST](10-PRODUCTION-CHECKLIST.md) | The gate before public launch                                                 |
| 11  | [FILE-MANIFEST](11-FILE-MANIFEST.md)               | Every file that must exist                                                    |
| 12  | [BUSINESS](12-BUSINESS.md)                         | Market, competitors, pricing, GTM                                             |
| 13  | [LESSONS](13-LESSONS.md)                           | What went wrong and what we learned                                           |
| 14  | [DECISIONS](14-DECISIONS.md)                       | Architecture Decision Records index                                           |
| —   | [phases/](phases/)                                 | The six phase files — what to actually build, in order                        |
| —   | [RUNBOOK](RUNBOOK.md)                              | Deploy, rollback, restore, rotate, incidents                                  |
| —   | [adr/](adr/)                                       | The decision records themselves                                               |

---

## Naming

| Context                      | Value                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| Full name / tagline mark     | **परिवारः सर्वस्वम् · Parivāraḥ Sarvasvam**                 |
| Play Store title (≤30 chars) | `Sarvasvam — Family is Everything`                          |
| Spoken / short form          | **Sarvasvam**                                               |
| Android package              | `app.sarvasvam`                                             |
| Domain target                | `sarvasvam.app`                                             |
| Legacy name                  | Vansh (deprecated — do not use in new code, copy or assets) |

**Why the short form is Sarvasvam, not Parivāra.** "Parivar" is one of the most
crowded names on the Indian Play Store — [Parivar Setu](https://play.google.com/store/apps/details?id=com.parivarsetu&hl=en_IN),
[My Parivar](https://play.google.com/store/apps/details?id=com.my.parivar&hl=en_IN),
[Parivar Family & Community](https://play.google.com/store/apps/details?id=com.softices.parivar&hl=en_IN),
[Mahaparivar](https://play.google.com/store/apps/details?id=com.mukunds.parivar),
[Parivaar](https://play.google.com/store/apps/details?id=me.umng.parivaar&hl=en_IN) —
and `parivar.app` is already a family-and-community product. **Parivāra** is the
generic half of the name and is legally weak; **Sarvasvam** is the distinctive
half and is what we can actually own. The full mark stays परिवारः सर्वस्वम्.

**Before spending money on branding**, verify: Play Store, App Store, the
`sarvasvam.app` domain, and Indian trademark classes 9 (software) and 42 (SaaS).
Tracked as a Phase 0 checklist item in [ROADMAP](09-ROADMAP.md).

---

## Reading order for a new contributor

1. [VISION](00-VISION.md) — 10 minutes, gives you the "why"
2. [PRODUCT](01-PRODUCT.md) §3 — the feature you are about to touch
3. [ARCHITECTURE](02-ARCHITECTURE.md) §2 — the data model
4. [CODEBASE-STRUCTURE](03-CODEBASE-STRUCTURE.md) — where your file goes
5. [SDLC](08-SDLC.md) — how to open a PR that gets merged

---

## Status

| Field         | Value               |
| ------------- | ------------------- |
| Phase         | 0 — Foundation      |
| Last reviewed | 2026-08-31          |
| Owner         | Hruday Kumar (solo) |
| Capacity      | 21–24 hrs/week      |
