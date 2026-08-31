# 01 · Product Specification

Every feature we build, specified. Each has an owner module, a priority phase,
and an explicit definition of done.

**Priority key:** `P0` ship-blocking · `P1` launch · `P2` post-launch · `P3` later

---

## 1. Module map

The app is nine modules. Sanskrit names are the internal and user-facing names;
the English gloss is what appears in non-Indic locales.

| Module         | Devanagari | Meaning    | Role                                                    |
| -------------- | ---------- | ---------- | ------------------------------------------------------- |
| **Pravāha**    | प्रवाह     | flow       | The feed — the home screen                              |
| **Vṛkṣa**      | वृक्ष      | tree       | The kinship graph                                       |
| **Smṛti**      | स्मृति     | memory     | Photos & albums                                         |
| **Kathā**      | कथा        | story      | Voice stories & oral history                            |
| **Tithi**      | तिथि       | occasion   | The occasion engine (birthdays, punya tithi, festivals) |
| **Nimantraṇa** | निमन्त्रण  | invitation | Digital event invitations                               |
| **Paramparā**  | परम्परा    | tradition  | Recipes, rituals, customs                               |
| **Vasīyat**    | वसीयत      | bequest    | Time-locked messages to the future                      |
| **Jharokhā**   | झरोखा      | window     | Home-screen widget                                      |

---

## 2. The home screen — Pravāha (P0)

**The most important screen in the app.** It opens here, not on the tree.

```
┌────────────────────────────────────────┐
│  परिवारः          🔍   🔔(3)   👤      │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 🎂  आज · TODAY                    │  │
│  │                                  │  │
│  │  Sunita Chāchī turns 52          │  │
│  │  your father's younger           │  │
│  │  brother's wife                  │  │
│  │                                  │  │
│  │  ╭────────────────────────────╮  │  │
│  │  │  🎙  Hold to record a wish  │  │  │
│  │  ╰────────────────────────────╯  │  │
│  │                                  │  │
│  │  🔊 Ravi, Meera +4 already sent  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 📸  6 YEARS AGO TODAY             │  │
│  │  [photo]  Anjali's mundan         │  │
│  │  Ranchi · 14 photos               │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Priya added 23 photos to         │  │
│  │  "Diwali 2026"          2h ago    │  │
│  │  [▦▦▦▦]                           │  │
│  │  ❤ 12   🎙 3 voice notes          │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│  🏠     🌳     📸     🎙     ⋯          │
│ Home   Tree  Photos Stories More       │
└────────────────────────────────────────┘
```

### Card types, in priority order

| Card                                             | Source                    | Frequency                 |
| ------------------------------------------------ | ------------------------- | ------------------------- |
| **Today** — birthday / anniversary / punya tithi | Tithi engine (from graph) | ~weekly, guaranteed       |
| **On this day**                                  | Smriti, date-indexed      | Daily once history exists |
| **New album**                                    | Smriti                    | On upload                 |
| **New voice story**                              | Katha                     | On record                 |
| **Tree change**                                  | Vriksha                   | On member add             |
| **Invitation**                                   | Nimantrana                | On send                   |
| **Weekly prompt**                                | Tithi engine              | Sunday                    |
| **Family milestone**                             | Aggregate                 | On threshold              |

### Rules

- **The feed is never empty.** If there is no user content, Tithi and On-this-day
  fill it. If a family is brand new, seed with onboarding prompts. An empty
  feed is a P0 bug, not an edge case.
- Reverse-chronological with a **pinned Today card** at the top. No algorithmic
  ranking in v1 — families are small enough that chronology is correct, and
  trust matters more than engagement optimisation.
- Every card is **actionable in one tap** — react, voice-comment, or open.

**Done when:** the feed renders 8 card types, is never empty, supports
pull-to-refresh and infinite scroll, is offline-cached, and cold-opens in
under 1.5s on a ₹12,000 Android phone.

---

## 3. Vṛkṣa — the kinship graph (P0)

The MVP. It must never break. See [TREE-ALGORITHM](04-TREE-ALGORITHM.md) for the
rewrite and [KINSHIP](05-KINSHIP.md) for the term system.

### 3.1 Capabilities

| #      | Capability                                                         | Priority |
| ------ | ------------------------------------------------------------------ | -------- |
| 3.1.1  | Add member (name, photo, DOB, gender, alive/deceased)              | P0       |
| 3.1.2  | Relationships: parent, spouse, child, sibling                      | P0       |
| 3.1.3  | **Ego-centric view** — the tree renders relative to _you_          | P0       |
| 3.1.4  | **Relationship resolver** — tap two people, get "she is your Māmī" | P0       |
| 3.1.5  | Sugiyama layered layout, no edge crossings                         | P0       |
| 3.1.6  | Pinch-zoom, pan, tap-to-focus, smooth at 200 members               | P0       |
| 3.1.7  | Member detail sheet — photos, stories, relations                   | P0       |
| 3.1.8  | Search within the tree                                             | P1       |
| 3.1.9  | QR and link sharing with read or write scope                       | P1       |
| 3.1.10 | Join request and steward approval flow                             | P1       |
| 3.1.11 | Suggested edits for existing people                                | P1       |
| 3.1.12 | Duplicate detection and merge queue                                | P2       |
| 3.1.13 | GEDCOM 7 import and export                                         | P2       |
| 3.1.14 | Multiple marriages, adoption, step-relations                       | P2       |
| 3.1.15 | Gotra, kula and native-place fields                                | P2       |

### 3.2 Ownership model — "one tree, one steward, full history"

| Rule                          | Detail                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| One canonical tree per family | Identified by `family_id`, not per-user copies                         |
| One **steward**               | Transferable; approves joins and merges                                |
| Open adds                     | Any member may add a _new_ person                                      |
| Guarded edits                 | Editing an _existing_ person creates a suggestion the steward approves |
| Full attribution              | Every change records who, when and what — visible to all               |
| Never hard-delete             | Tombstone with a 30-day restore window                                 |
| Living-person privacy         | DOB and contact hidden from non-approved viewers                       |
| "Don't list me"               | Any adult may hide themselves from shared exports                      |

### 3.3 Explicit non-goals

Full GEDCOM-7 conformance, source citations, research logs, DNA matching.
We are not Ancestry.

**Done when:** a 200-member tree renders with zero edge crossings in under
400 ms, the resolver answers correctly for all 3-hop relations in Hindi and
Telugu, and two devices editing simultaneously converge without data loss.

---

## 4. Smṛti — photos and albums (P0)

### 4.1 Capabilities

| #      | Capability                                             | Priority |
| ------ | ------------------------------------------------------ | -------- |
| 4.1.1  | Upload photos (multi-select, background, resumable)    | P0       |
| 4.1.2  | **Event albums** — photos grouped by family event      | P0       |
| 4.1.3  | **Tag people from the tree** — with the relation shown | P0       |
| 4.1.4  | **Voice comments on photos** ⭐                        | P0       |
| 4.1.5  | Text comments and reactions                            | P0       |
| 4.1.6  | Timeline gallery (by date)                             | P1       |
| 4.1.7  | Mosaic gallery                                         | P1       |
| 4.1.8  | **Relation-aware sharing** — "share with Dad's side"   | P1       |
| 4.1.9  | Bulk import from the device gallery at onboarding      | P1       |
| 4.1.10 | "On this day" resurfacing                              | P1       |
| 4.1.11 | Face grouping (on-device, no cloud AI)                 | P3       |
| 4.1.12 | Print / photobook export                               | P3       |

### 4.2 Voice comments — the signature feature ⭐

A grandmother cannot type a comment. She can hold a button and talk.

```
[ photo of a 1978 wedding ]

🎙 Dādī · 0:34                    ▶
   "यह तुम्हारे दादाजी की शादी है…"

🎙 Māmā · 0:12                    ▶

❤  Priya, Ravi and 8 others
```

This single feature converts the largest passive segment (elders) into
contributors, and it produces the **oral history that is the entire point of
the product.** No competitor has it.

### 4.3 Media policy — device-first

| Rule                  | Value                                           |
| --------------------- | ----------------------------------------------- |
| Original              | Stays on the device. Never uploaded             |
| Uploaded display copy | 1600px longest edge, WebP q80, ~350 KB          |
| Thumbnail             | 300px WebP, ~20 KB                              |
| Voice                 | Opus / AAC 32 kbps mono, ~240 KB per minute     |
| **No video**          | Rejected — bandwidth and storage we cannot fund |
| Budget                | 10 GB R2 ≈ 30,000 photos ≈ ~150 families        |

**Done when:** 50 photos upload in the background over 3G without blocking the
UI, survive an app kill, resume on reconnect, and appear on other members'
devices within 60s of them opening the app.

---

## 5. Kathā — voice stories (P0)

Oral history is our differentiated content type, and India's most natural
input method.

| #   | Capability                                               | Priority |
| --- | -------------------------------------------------------- | -------- |
| 5.1 | Record a voice story, up to 10 minutes, with waveform UI | P0       |
| 5.2 | Attach to a person, an event or a photo                  | P0       |
| 5.3 | Playback with scrub, speed control and background audio  | P0       |
| 5.4 | **Photo-story** — narrate over a slideshow of photos     | P1       |
| 5.5 | Prompted stories ("How did you meet Dādājī?")            | P1       |
| 5.6 | Transcription (on-device or cheap Indic ASR)             | P3       |
| 5.7 | Translation of transcripts                               | P3       |

**Video Katha is cut.** `video-katha-recorder.tsx` and `video-player.tsx` are
deleted in Phase 0.

**Done when:** a 5-minute story records, uploads and plays back on another
device with no quality complaint on a ₹12,000 phone.

---

## 6. Tithi — the occasion engine (P0) ⭐⭐

**The highest-leverage module in the product.** It generates a reason to open the
app roughly weekly, forever, with zero user effort. See
[ENGAGEMENT](06-ENGAGEMENT.md).

| #   | Capability                                           | Priority |
| --- | ---------------------------------------------------- | -------- |
| 6.1 | Derive birthdays from the graph                      | P0       |
| 6.2 | Derive wedding anniversaries                         | P0       |
| 6.3 | **Punya tithi** — death anniversaries ⭐             | P1       |
| 6.4 | One-tap **voice wish** collection                    | P0       |
| 6.5 | Aggregate wishes into a card delivered to the person | P0       |
| 6.6 | Correct kinship term per viewer, per language        | P1       |
| 6.7 | Indian festival calendar mapped to the family        | P2       |
| 6.8 | Weekly prompt (Sunday)                               | P2       |
| 6.9 | Lunar tithi dates as well as Gregorian               | P3       |

### Why this works

A 30-person family has a birthday roughly **every 12 days.** Add anniversaries,
punya tithis and festivals, and there is a real occasion **almost every week —
permanently.** This is content the app manufactures from structure, and it is
impossible without a correct kinship graph.

**Punya tithi has no competitor anywhere in the world.** Death anniversaries are
observed seriously in Indian families. On the day, the app resurfaces that
person's photos and their recorded voice. It is the most emotionally powerful
thing we can build, and the clearest statement of what this product is for.

**Done when:** the engine produces the correct occasion set for a 30-member
family across a full year, with correct kinship terms in Hindi and Telugu, and
delivers exactly one batched notification per user per day.

---

## 7. Jharokhā — home-screen widget (P1) ⭐

[Locket reached 80M downloads](https://whatastartup.substack.com/p/he-built-an-app-for-his-girlfriend-and-ended-up-having-80-million-total-downloads)
on this one mechanic: a friend's photo on your home screen, seen at every unlock.

**No Indian family app has a widget.** It is the highest engagement-per-hour
feature available to us.

| Size | Content                                    |
| ---- | ------------------------------------------ |
| 2×2  | Latest family photo, tap to open           |
| 4×2  | Today's occasion plus a one-tap voice wish |
| 4×4  | Four-photo mosaic plus the occasion strip  |

Requires an Expo config plugin and a native Android `AppWidgetProvider`.
Budget: ~15 hours.

---

## 8. Nimantraṇa — invitations (P1)

| #   | Capability                                            | Priority     |
| --- | ----------------------------------------------------- | ------------ |
| 8.1 | Create an invitation: photo, text, date, venue        | P1           |
| 8.2 | 15 ceremony types (wedding, mundan, griha pravesh, …) | P1           |
| 8.3 | Select recipients **from the tree**                   | P1           |
| 8.4 | RSVP with a headcount                                 | P1           |
| 8.5 | Reminders one week and one day before                 | P1           |
| 8.6 | **Shareable link for relatives without the app** ⭐   | P1           |
| 8.7 | Post-event album auto-created and linked              | P2           |
| 8.8 | Premium designed templates                            | P3 (revenue) |

**Currently AsyncStorage-only with zero API.** Phase 1 gives it a real backend.

---

## 9. Paramparā — traditions and recipes (P2)

| #   | Capability                                           | Priority |
| --- | ---------------------------------------------------- | -------- |
| 9.1 | Create a tradition or recipe with steps and photos   | P2       |
| 9.2 | **Voice narration by the person who makes it** ⭐    | P2       |
| 9.3 | Attribute it to a family member                      | P2       |
| 9.4 | Categories: recipe, ritual, festival, custom, remedy | P2       |
| 9.5 | Link to the festival calendar                        | P3       |

"Dādī's rasam, narrated by Dādī" is a thing a family will keep for 50 years.

---

## 10. Vasīyat — time-locked messages (P2)

Genuinely unique. **Nobody has this.** Also our largest liability if done badly.

| #    | Capability                                                  | Priority |
| ---- | ----------------------------------------------------------- | -------- |
| 10.1 | Write or record a message to a specific person              | P2       |
| 10.2 | Unlock condition: a date, or an age the recipient reaches   | P2       |
| 10.3 | **True client-side encryption** — the server cannot read it | P2       |
| 10.4 | Recipient notified on unlock                                | P2       |
| 10.5 | Steward-verified posthumous release                         | P3       |

> ⚠️ **Blocking constraint.** Today, Vasiyat content is stored **plaintext** in the
> database and the "lock" is a server-side `if` statement. Ship this only with
> real client-side encryption. Until then it stays behind a flag and out of the
> store listing. See [SECURITY-PRIVACY](07-SECURITY-PRIVACY.md) §4.

---

## 11. Cross-cutting requirements

### 11.1 The Elder Path (P0) — a design law, not a feature

> **Every core action must be completable with voice input and at most two taps,
> at 20pt minimum body text, in the user's own language.**

| Requirement        | Spec                                          |
| ------------------ | --------------------------------------------- |
| Minimum body text  | 20pt default; honours OS font scaling to 200% |
| Minimum tap target | 48×48 dp                                      |
| Contrast           | WCAG AA, 4.5:1                                |
| Voice input        | On every comment, wish, story and prompt      |
| Typing             | Never required for any core action            |
| Onboarding         | Fully voice-narrated in the chosen language   |
| Icons              | Always paired with a text label               |

Every PR that touches UI is checked against this list.

### 11.2 Languages (P0 → P5)

All 22 scheduled languages, ordered by family reach:

| Wave | Languages                             | Phase       |
| ---- | ------------------------------------- | ----------- |
| 1    | English, Hindi, Telugu                | P0 (exists) |
| 2    | Tamil, Bengali, Marathi               | P1          |
| 3    | Kannada, Malayalam, Gujarati, Punjabi | P4          |
| 4    | Odia, Assamese, Urdu, Konkani         | P4          |
| 5    | Remaining scheduled languages         | P5          |

Migrate `i18n-js` → **i18next + react-i18next**, with lazy-loaded namespaces,
Noto Sans Indic fonts, and a CI check that fails the build on a missing key.

### 11.3 Offline-first (P0)

The app is fully usable with no network. Reads come from the local database;
writes go to a local outbox and sync opportunistically. See
[ARCHITECTURE](02-ARCHITECTURE.md) §4.

### 11.4 Demo mode (P0)

Sample family data is retained but **explicitly labelled**: a persistent
"Sample family — not your data" banner and a one-tap clear. It is never mixed
silently into real content, which is what happens today in
`app/(tabs)/smriti.tsx`.

### 11.5 WhatsApp bridge (P1) ⭐

Every album, recap, invitation and occasion produces a **beautiful shareable card
plus a public link**, designed to be dropped into the family WhatsApp group.
The link previews correctly and works without the app installed.

With a ₹0 marketing budget, **this is the entire growth engine.** Every share is
simultaneously retention and acquisition. It is designed in from day one, never
bolted on later.

---

## 12. Feature × phase matrix

| Feature                    | P0  | P1  | P2  | P3  |
| -------------------------- | :-: | :-: | :-: | :-: |
| Pravāha feed               |  ●  |     |     |     |
| Vriksha core and resolver  |  ●  |     |     |     |
| Tree share and join        |     |  ●  |     |     |
| Smriti upload and albums   |  ●  |     |     |     |
| Voice comments             |  ●  |     |     |     |
| Katha voice stories        |  ●  |     |     |     |
| Tithi birthdays and wishes |  ●  |     |     |     |
| Punya tithi                |     |  ●  |     |     |
| Elder Path                 |  ●  |     |     |     |
| Offline-first              |  ●  |     |     |     |
| Demo mode labelling        |  ●  |     |     |     |
| Google Sign-In             |  ●  |     |     |     |
| Jharokha widget            |     |  ●  |     |     |
| On this day                |     |  ●  |     |     |
| WhatsApp share cards       |     |  ●  |     |     |
| Nimantrana backend         |     |  ●  |     |     |
| Languages wave 2           |     |  ●  |     |     |
| Parampara                  |     |     |  ●  |     |
| Vasiyat (encrypted)        |     |     |  ●  |     |
| GEDCOM                     |     |     |  ●  |     |
| Duplicate merge            |     |     |  ●  |     |
| Festival calendar          |     |     |  ●  |     |
| Transcription              |     |     |     |  ●  |
| Face grouping              |     |     |     |  ●  |
| Prints and photobooks      |     |     |     |  ●  |
