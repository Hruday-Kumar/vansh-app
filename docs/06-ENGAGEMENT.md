# 06 · Engagement

Why anyone opens this app on a Tuesday.

---

## 1. The problem nobody talks about

> **In a family of 25 people, most days nobody posts anything.**

That is the family-app killer, and it is why Marco Polo, Cocoon, and a dozen
family apps plateaued. Instagram works because thousands of strangers post
hourly. Your family posts at Diwali and at weddings. An empty feed on day 3 is
an uninstall on day 4.

The research is blunt about why habit loops fail here: a behaviour becomes a
habit only when it [attaches to an existing habit](https://medium.com/design-bootcamp/what-designers-get-wrong-about-habit-loops-and-how-to-fix-it-6fd47be714d2)
in the user, day, and every reminder [competes with feeds and badges](https://userewardly.app/blog/why-most-habit-trackers-fail)
for the same attention.

**Conclusion: the app cannot wait for humans to create reasons to open it.
The app must manufacture them.**

---

## 2. The five layers

### Layer 1 — The graph generates occasions ⭐⭐

The whole ballgame, and the thing only we can build because only we have a real
kinship graph.

A 30-person family has a birthday roughly **every 12 days**. Add wedding
anniversaries, punya tithis and festivals and there is a real occasion **almost
every week, permanently, without a single user doing anything.**

```
🎂  Today is Sunita Chāchī, 52nd birthday
    (your father, younger brother, wife)

    [ 🎙  Hold to record a wish ]

    Ravi, Meera and 4 others have already sent voice wishes
```

Chāchī wakes up to **twelve voice notes from twelve relatives.** That is a
genuinely moving experience, it costs us nothing to generate, and it happens
every week forever.

- VanshApp cannot do it — no feed
- Aangan cannot do it properly — a 3-level tree does not know she is your Chāchī
- WhatsApp cannot do it — no graph

**Punya tithi deserves special attention.** Death anniversaries are observed
seriously in Indian families and _no app in the world handles them_. On the day,
the app resurfaces that person, photos and their recorded voice. It is not a
feature; it is the reason the product exists.

### Layer 2 — On this day

The highest-engagement mechanic in the history of photo apps, and free to build
once assets are date-indexed.

It requires history, so **bulk-import of old photos is a core onboarding step.**
The app is far more valuable at hour one if it starts with 200 photos than with
zero. This is the single biggest lever on week-1 retention.

### Layer 3 — The Jharokhā widget ⭐

[Locket reached 80M downloads](https://whatastartup.substack.com/p/he-built-an-app-for-his-girlfriend-and-ended-up-having-80-million-total-downloads)
on one mechanic: a friend, latest photo on your home screen. Photos arrive
unannounced, so every unlock carries the possibility of something new.

That is engagement **without an app open**, and then curiosity drives the open.
**No Indian family app has a widget.** Highest engagement-per-hour feature
available to us. See [PRODUCT](01-PRODUCT.md) section 7.

### Layer 4 — The weekly prompt

Sunday morning, one question to the whole family, answerable by voice in 20
seconds:

> _What is one thing Dādājī used to say?_
> _Post a photo of your childhood home._
> _Who taught you to cook, and what?_

This is **structural content generation**. It manufactures the oral history we
exist to preserve, instead of hoping someone volunteers it.

Research points to [mid-week as the real drop-off risk](https://appstorys.com/blog-Streaks-Milestones-Habit-Gamification)
— Wednesday, not Friday, is now the peak streak-break day. So: prompt on Sunday,
gentle nudge on Wednesday.

### Layer 5 — The WhatsApp bridge ⭐

**We will not beat WhatsApp. We feed it instead.**

Every album, recap, invitation and occasion generates a beautiful shareable card
plus a link, designed to be dropped into the family WhatsApp group. The link
previews correctly and works for relatives who do not have the app.

Each share is simultaneously **retention** (people come back through it) and
**acquisition** (people install through it). With a zero marketing budget,
**this is the entire growth engine.** It is designed in from day one.

---

## 3. Where we deliberately break from the research

Apps combining streaks and milestones see
[40 to 60 percent higher DAU](https://appstorys.com/blog-Streaks-Milestones-Habit-Gamification)
than either alone. We are not going to use streaks anyway.

**Individual streaks are wrong for a family app.** Guilt-tripping someone for
not opening an app about their family is emotionally ugly and will make people
delete it. A checkmark is also an insufficient reward — the payoff has to be
meaningful.

**We use collective milestones instead:**

> _Your family has preserved 100 memories and 40 voice stories._

Shared pride, no shame. Nobody is singled out. The metric belongs to the family,
which is also the thing we want people to feel ownership of.

---

## 4. Notification discipline

**Hard limit: one batched notification per user per day.** No exceptions, no
growth-hack overrides.

| Rule                                      | Example                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| Always specific, never generic            | ✅ "Your Buā left a voice note on your wedding photo"    |
|                                           | ❌ "You have new activity" · ❌ "Come back to Sarvasvam" |
| Always name the person and the relation   | Uses the kinship resolver, per recipient, per language   |
| Batched into one daily digest             | Sent at a per-user learned time, default 9am local       |
| Occasions are the only same-day exception | A birthday notified the next day is worthless            |
| Every category individually switchable    | In Settings, not buried                                  |

**A push that does not name a person is a bug.**

---

## 5. The onboarding path

Week-1 retention is decided in the first 10 minutes. The order is deliberate:

| Step | Action                                | Why                                               |
| ---- | ------------------------------------- | ------------------------------------------------- |
| 1    | Sign in with Google                   | One tap, no OTP, no cost                          |
| 2    | Choose language, with voice narration | Elder Path from the first screen                  |
| 3    | "Who are you?" — name and photo       | Creates ego, the anchor for everything            |
| 4    | Add parents, then siblings            | Three taps gets a usable graph                    |
| 5    | **Import photos from the device**     | Seeds "on this day"; the biggest retention lever  |
| 6    | **Record one voice story**            | The first act of preservation; the emotional hook |
| 7    | Invite the family via WhatsApp        | The growth loop, at peak motivation               |

Step 5 is skippable but strongly encouraged. Step 6 is where people decide
this app is different from a photo folder.

---

## 6. The retention model

| Horizon  | Mechanic                                    | Target                           |
| -------- | ------------------------------------------- | -------------------------------- |
| Day 0    | Onboarding, first story recorded            | 60% complete step 6              |
| Day 1–7  | Family joins, first album                   | 3+ members joined                |
| Week 2–4 | First Tithi occasion fires                  | 40% D30 for the Keeper           |
| Month 2+ | Widget, on-this-day, weekly prompt          | 3+ opens per week                |
| Month 6+ | Punya tithi, festivals, accumulated history | The archive is now irreplaceable |

**The long game:** switching cost rises with every photo, story and tagged face.
After a year, a family, archive cannot be moved. That is the real retention
mechanism — everything above is what gets them to year one.

---

## 7. Metrics we actually watch

| Metric                                    | Why                                        | Target |
| ----------------------------------------- | ------------------------------------------ | ------ |
| **Families with an elder who posted**     | The one metric that says the product works | > 50%  |
| Voice stories per family per month        | Our differentiated content                 | ≥ 2    |
| Occasions with 3+ voice wishes            | Layer 1 is working                         | > 60%  |
| Shares into WhatsApp per family per month | The growth loop is turning                 | ≥ 4    |
| Widget installs per active user           | Layer 3 is working                         | > 30%  |
| D30 retention, Keeper persona             | The account that carries the family        | > 40%  |
| Median opens per week                     | Habit formed                               | ≥ 3    |

**Vanity metrics we ignore:** total downloads, registered users, screen time,
session length. A family app that maximises session length is doing something
wrong.

---

## 8. What we are not doing, and why

| Rejected                 | Reason                                                    |
| ------------------------ | --------------------------------------------------------- |
| Individual streaks       | Guilt is the wrong emotion for family                     |
| Badges and points        | Cheapens a product about memory and loss                  |
| Algorithmic feed ranking | Families are small; chronology is correct and trustworthy |
| "X viewed your photo"    | Surveillance dynamics inside a family are toxic           |
| Engagement-bait push     | Breaks the one-per-day rule and burns trust               |
| Public leaderboards      | There is no competition between families                  |

---

**Sources:**
[Locket, 80M downloads](https://whatastartup.substack.com/p/he-built-an-app-for-his-girlfriend-and-ended-up-having-80-million-total-downloads) ·
[Streaks and milestones data](https://appstorys.com/blog-Streaks-Milestones-Habit-Gamification) ·
[Habit loop design](https://medium.com/design-bootcamp/what-designers-get-wrong-about-habit-loops-and-how-to-fix-it-6fd47be714d2) ·
[Why habit apps fail](https://userewardly.app/blog/why-most-habit-trackers-fail) ·
[Marco Polo and family dynamics](https://www.deseret.com/business/2024/07/19/marco-polo-app-connection-families/) ·
[Mobile app engagement 2026](https://userpilot.com/blog/mobile-app-engagement/)
