# Phase 5 · Revenue

|                |                                                            |
| -------------- | ---------------------------------------------------------- |
| **Objective**  | The first rupee, without breaking the growth loop          |
| **Window**     | March 2027 onward                                          |
| **Depends on** | [Phase 4 exit gate](phase-4-the-moat.md#phase-4-exit-gate) |
| **Unlocks**    | Scaling decisions — outside the scope of this document set |

---

## Why revenue is last, and why it stays this narrow

Nobody pays for an app they have not yet trusted with their family's memories.
Retention has to be proven — Phase 4's exit gate, 40%+ D30 — before charging
anyone makes sense to attempt. See
[00-VISION.md §8](../00-VISION.md#8-success-defined) and
[12-BUSINESS.md §4](../12-BUSINESS.md#4-pricing) for the full pricing
reasoning; this phase just builds what that pricing model requires.

**The free tier is never touched in this phase.** The tree, the feed, photos,
and voice stories stay free forever — they are the growth loop, and this
phase's entire job is to add revenue _around_ that loop, never _into_ it.
Per-seat pricing was already rejected in
[ADR](../12-BUSINESS.md#per-seat-is-rejected) for exactly this reason.

---

## Workstream 5.1 — Vasiyat, for real

Vasiyat has shipped flagged-off since Phase 1 because it stores plaintext
content behind a server-side `if` — see
[07-SECURITY-PRIVACY.md §4](../07-SECURITY-PRIVACY.md#4-s3--vasiyat). It does
not leave the flag until this is fixed.

1. [ ] Implement `features/vasiyat/model/crypto.ts` — real client-side
       AES-256-GCM: author generates a content key, encrypts client-side,
       wraps the key per recipient, server stores only ciphertext and wrapped
       keys and never sees plaintext
2. [ ] Write a known-answer test proving the server cannot decrypt — this is
       the test that [13-LESSONS.md L-0001](../13-LESSONS.md#l-0001--the-encryption-that-was-not-encryption)
       exists to make mandatory
3. [ ] Design the posthumous-release key-escrow flow (Shamir secret sharing
       across designated family members is the honest answer; this is
       genuinely hard — do not ship a shortcut here)
4. [ ] Remove the feature flag once the known-answer test passes and the
       escrow flow is reviewed

## Workstream 5.2 — One-time revenue ⭐

1. [ ] Print and photobook export — highest margin, and bought at the most
       emotional moment a family has about itself (a wedding, an anniversary)
2. [ ] Premium invitation templates for Nimantraṇa

## Workstream 5.3 — The subscription

1. [ ] Implement the ₹499/year Family plan: 25GB storage, GEDCOM export,
       Vasiyat access, premium templates, priority support — **one
       subscription covers the whole family**, never per-seat
2. [ ] Storage tiers above the free 2GB allowance
3. [ ] Payment integration (Razorpay or similar, for Indian cards and UPI)

## Workstream 5.4 — Platform evaluation

1. [ ] Evaluate iOS — only after the above prove the model works on Android;
       do not split effort earlier

---

## Phase 5 exit gate

- [ ] 100 families paying ₹499/year
- [ ] Infrastructure cost per family stays below ₹50/year — verify against
      the unit economics in
      [12-BUSINESS.md §4](../12-BUSINESS.md#unit-economics-at-499year)
- [ ] The free tier remains fully usable — full tree, unlimited members, feed,
      2GB photos, voice stories, occasions, invitations, kinship in every
      shipped language, no paywall

**₹49,900/year is not a business — it is proof the model works, which is the
only thing this phase needs to establish.** Beyond this gate is a scaling
question, not a building-the-first-version question, and it is out of scope
for this document set.
