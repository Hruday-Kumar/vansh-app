# 12 · Business

Market, competitors, pricing, go-to-market. Written to be honest rather than
flattering, because the previous version of this material was neither.

---

## 1. The market

| Figure                   | Value                | Source note                                    |
| ------------------------ | -------------------- | ---------------------------------------------- |
| Indian smartphone users  | ~750M                | The addressable device base                    |
| Households in India      | ~300M                | Our real unit is the household, not the person |
| Indian OTT subscriptions | 216.5M               | The closest proxy for paid-app willingness     |
| **Indian OTT ARPU**      | **~$7.30 per year**  | The number that must anchor pricing            |
| Genealogy market, India  | Small and fragmented | No dominant player                             |

**The ARPU number is the discipline.** Indian consumers pay roughly ₹600 a year
for Netflix-class entertainment. Any family-app price above that is fantasy.

---

## 2. Competitors — the honest landscape

> The previous pitch deck claimed **"No direct competitor in the Indian heritage
> space."** That is false, and repeating it in front of anyone who spends five
> minutes on the Play Store destroys credibility on the spot. It is corrected in
> Phase 0.

| Competitor              | What they are                                                                                                                                               | Price              | Weakness                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| **Aangan** (aangan.app) | **The direct competitor.** Hindi-first family social network; voice control; 3-level tree; RSVP events with photos; traditions and kuldevi; the "Dadi Test" | —                  | Hindi belt only; toy tree; ~100 families; APK-only, not on Play Store     |
| VanshApp (Jaipur)       | Vanshavali plus purohit services; GEDCOM export; 2FA; multi-tree                                                                                            | ₹69–99/mo, ₹499/yr | An archive, not a social product. No reason to return                     |
| iMeUsWe                 | 1.6B records; astrology and kundli; DNA via MapMyGenome                                                                                                     | Free plus upsell   | Global-generic UX; not India-native in feel                               |
| Vamshavriksha           | Hindu structures, gothram, nakshatra                                                                                                                        | Freemium           | Narrow, dated                                                             |
| Family Root             | "India, first family tree app"                                                                                                                              | Free               | Thin                                                                      |
| **My Parivar**          | **A second direct competitor.** Family tree plus event updates — weddings, birthdays, reunions, anniversaries — with RSVP                                   | Free               | Tree-plus-events, but no feed, no voice, no kinship terms                 |
| Mahaparivar             | Family tree maker; **8 Indian languages** incl. Telugu, Tamil, Kannada, Marathi, Urdu                                                                       | Free               | A tree maker, not a social product. Languages, but no kinship-term system |
| Parivar Setu            | Family tree plus samaj/community; English and Gujarati                                                                                                      | Free               | Community-org focused                                                     |
| Kutumb                  | Reddit/Discord for Bharat; 5M downloads; **$26M from Tiger Global**                                                                                         | Free               | Communities, not families. Adjacent, not competing                        |

### The competitive read

**Aangan and we are converging on the same destination from opposite sides.**

They built a feed and a fake tree. We built a real tree and no feed.
**Adding a feed on top of a correct graph is far easier than retrofitting a
correct graph under an existing feed.** We are on the right side of that
asymmetry, and it is the single most important strategic fact in this document.

Their structural weaknesses, in order of how hard they are to fix:

1. **Hindi-first.** A Tamil or Bengali family cannot use them. That is most of
   India, and fixing it means rebuilding their kinship model — see
   [KINSHIP](05-KINSHIP.md) section 2 for why a Hindi-shaped system cannot
   represent Dravidian kinship.
2. **A 3-level tree.** Everything in our occasion engine is impossible on it.
3. **No Play Store presence.** APK-only caps them at technical users.

### A correction to an earlier assumption

**"All Indian languages" is not by itself a differentiator.** Mahaparivar
already ships eight. What nobody has is a **kinship-term system** — resolving a
relation path to the right word for the right viewer, and handling Dravidian
cross/parallel structure. Translating the UI is table stakes; knowing that she
is your _Chāchī_ in Hindi and your _Pinni_ in Telugu is the moat. See
[KINSHIP](05-KINSHIP.md). Every claim about language must be stated this way.

---

## 3. Positioning

> **For Indian families who are scattered across cities and generations,
> Parivāraḥ Sarvasvam is a private family network where the family tree makes
> every photo, story and occasion personal — unlike WhatsApp, which forgets, and
> unlike family tree apps, which nobody opens twice.**

| Against          | Our line                                                             |
| ---------------- | -------------------------------------------------------------------- |
| WhatsApp         | "WhatsApp forgets. We remember."                                     |
| Family tree apps | "A tree you visit once is a museum. This is where the family lives." |
| Aangan           | "Every Indian language, and a tree that actually knows who is who."  |
| Google Photos    | "Photos of your family, that know your family."                      |

---

## 4. Pricing

### The reasoning

- India OTT ARPU is **~~$7.30/year (~~₹600)**
- VanshApp anchors the category at **₹499/year**
- The old deck proposed ₹199/month = ₹2,388/year — **4.8× VanshApp**, and
  roughly 4× the OTT anchor. It would have sold nothing.

### Per-seat is rejected

Charging per family member taxes the only growth loop we have. Every invited
relative is both retention and acquisition; making the Keeper pay more for each
one is charging them for doing our marketing.

### The model

| Tier              | Price         | Contents                                                                                                                    |
| ----------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Free, forever** | ₹0            | Full tree, unlimited members, feed, 2 GB photos, voice stories, occasions, invitations, kinship in every language           |
| **Family**        | **₹499/year** | 25 GB, GEDCOM export, Vasiyat, premium invitation templates, priority support. **One subscription covers the whole family** |
| **One-time**      | ₹499–2,499    | Photobooks, printed family trees, printed invitations                                                                       |

**Principles:**

1. **The tree is free forever.** It is the growth loop. Paywalling it is suicide.
2. **One family, one subscription.** The Keeper pays. Everyone benefits.
3. **Storage is the honest upsell** — it is our actual marginal cost.
4. **One-time revenue matters more than it looks.** A printed family tree for a
   wedding is a ₹2,000 purchase with real margin and no recurring commitment,
   and it is bought at exactly the moment a family is most emotional about
   itself.

### Unit economics at ₹499/year

| Item                            | Cost per family per year |
| ------------------------------- | ------------------------ |
| Storage (~200 photos at 350 KB) | ~₹15                     |
| Compute (amortised free tier)   | ~₹0                      |
| Bandwidth (R2 zero egress)      | ₹0                       |
| Play Store fee (15% under $1M)  | ₹75                      |
| **Total**                       | **~₹90**                 |
| **Gross margin**                | **~82%**                 |

The economics work at small scale, which is the only scale that matters until
Phase 5.

---

## 5. Go-to-market

**Budget: ₹0.** Every channel below is free or a by-product of the product.

### 5.1 The primary loop — WhatsApp

```
Keeper installs
      |
      v
Builds the tree, uploads photos
      |
      v
Shares an album / recap / invitation card into the family WhatsApp group
      |
      v
Relatives tap the link -> see real content -> install
      |
      v
They become Keepers of their own branch
```

**This is the entire acquisition strategy for Phases 2 and 3.** It is why the
share cards in [PRODUCT](01-PRODUCT.md) section 11.5 are a P1 feature and not a
nice-to-have. Every share must look beautiful in a WhatsApp preview, because
that preview _is_ the advertisement.

### 5.2 Wedding season

Indian wedding season (November to February, and April to June) is the single
highest-intent moment for a family app:

- Digital invitations with RSVP — the entry drug
- A post-wedding shared album across both families
- A printed family tree as a wedding gift — revenue _and_ a viral artefact

**Phase 3 launch in mid-December is deliberately placed inside wedding season.**

### 5.3 Other channels, in order of expected return

| Channel                           | Effort | Note                                                |
| --------------------------------- | ------ | --------------------------------------------------- |
| Family WhatsApp groups            | Free   | The loop above                                      |
| Wedding-season timing             | Free   | Seasonal intent                                     |
| Regional-language ASO             | Low    | Listings in hi/te/ta beat English listings in India |
| Diaspora communities              | Medium | High willingness to pay; guilt about distance       |
| Genealogy and heritage forums     | Low    | Small but high-intent                               |
| Temple and community associations | Medium | Trusted distribution to elders                      |
| Paid ads                          | —      | **Not until unit economics are proven**             |

### 5.4 The metric that governs GTM

**Shares into WhatsApp per family per month (target ≥ 4).** If that number is
healthy, growth compounds. If it is not, no amount of any other channel will
save it, and the fix is in the product, not the marketing.

---

## 6. Risks

| Risk                                    | Likelihood | Impact    | Mitigation                                                             |
| --------------------------------------- | ---------- | --------- | ---------------------------------------------------------------------- |
| Aangan adds real multi-language kinship | Low        | High      | It is a rebuild for them; we have a head start and it compounds        |
| A funded player enters (Kutumb pivots)  | Low        | High      | Our defence is depth in kinship and elder UX, not capital              |
| Oracle reclaims the free VM             | Medium     | High      | Hetzner fallback documented; deploy is one command                     |
| Free tiers shrink                       | Medium     | Medium    | Storage triggers in [ARCHITECTURE](02-ARCHITECTURE.md) section 6       |
| Play Store account issue                | Low        | Fatal     | Follow the rules exactly. **Never buy testers**                        |
| Elders will not adopt it                | Medium     | **Fatal** | The Elder Path is a P0 design law; tested with real elders in Phase 2  |
| Nobody pays                             | Medium     | Medium    | Free tier stays useful; one-time print revenue is the hedge            |
| Solo-developer burnout                  | **High**   | **Fatal** | Every 4th week is consolidation. Phases have exit gates, not deadlines |

**The two fatal risks are elder adoption and burnout.** Both are addressed
structurally rather than with optimism: the Elder Path is a gate on every PR,
and consolidation weeks are in the calendar, not aspirational.

---

## 7. The pitch deck — what to fix

`docs/ppt/build_vansh_pitch_deck.py`, corrected in Phase 0:

| Slide    | Current                                             | Correction                                                |
| -------- | --------------------------------------------------- | --------------------------------------------------------- |
| Title    | "Vansh"                                             | **Parivāraḥ Sarvasvam**                                   |
| 9        | "AES-256-GCM", "bank-level protection"              | Delete. It is XOR. See [SECURITY](07-SECURITY-PRIVACY.md) |
| 13       | "No direct competitor in the Indian heritage space" | Replace with the honest table in section 2                |
| 14       | ₹199/mo Legacy, ₹499/mo Heritage                    | Free forever, plus ₹499/**year**                          |
| Product  | Tree-first                                          | Feed-first, with the graph as the engine                  |
| Traction | Implied usage                                       | State plainly: pre-launch, N testers                      |

**A deck that overstates security and denies competitors fails the first
question any informed person asks.** The honest version is also the more
compelling one — "we are on the right side of a structural asymmetry against a
named competitor" is a better story than "we have no competitors."

---

## 8. What success looks like

| Horizon | Milestone                                                     |
| ------- | ------------------------------------------------------------- |
| Phase 2 | 5 families, one grandparent posting                           |
| Phase 3 | 25 families, the WhatsApp loop verified                       |
| Phase 4 | 200 families, 10 languages, D30 above 40%                     |
| Phase 5 | 100 paying families — ₹49,900/year, and proof the model works |
| Year 2  | 5,000 families, ₹10L/year, the first hire                     |

**₹49,900 is not a business.** It is proof that the model works, which is the
only thing Phase 5 needs to establish. Everything after that is a scaling
question, and scaling questions are pleasant problems to have.
