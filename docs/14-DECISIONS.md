# 14 · Decisions

Index of Architecture Decision Records in `docs/adr/`.

An ADR is written for any decision that would be **expensive to reverse**. Five
sentences is enough — the point is that in six months you remember _why_, not
that the document is thorough. Format is in [SDLC](08-SDLC.md) section 9.

| #                                        | Decision                                | Date       | Status   |
| ---------------------------------------- | --------------------------------------- | ---------- | -------- |
| [0001](adr/0001-postgres-over-mysql.md)  | Postgres over MySQL                     | 2026-08-31 | Accepted |
| [0002](adr/0002-remove-firebase.md)      | Remove Firebase entirely                | 2026-08-31 | Accepted |
| [0003](adr/0003-lww-not-crdt.md)         | Last-write-wins, not CRDTs              | 2026-08-31 | Accepted |
| [0004](adr/0004-union-nodes.md)          | Union nodes for marriages               | 2026-08-31 | Accepted |
| [0005](adr/0005-no-video.md)             | No video, photos and voice only         | 2026-08-31 | Accepted |
| [0006](adr/0006-feed-first.md)           | The app opens on the feed, not the tree | 2026-08-31 | Accepted |
| [0007](adr/0007-oracle-neon-r2.md)       | Oracle plus Neon plus R2, not Supabase  | 2026-08-31 | Accepted |
| [0008](adr/0008-google-signin-only.md)   | Google Sign-In only, no phone OTP       | 2026-08-31 | Accepted |
| [0009](adr/0009-no-under-18-accounts.md) | No under-18 accounts in v1              | 2026-08-31 | Accepted |
| [0010](adr/0010-feature-boundaries.md)   | Enforced feature-module boundaries      | 2026-08-31 | Accepted |

---

## Decisions already made, summarised

For quick reference. The ADR files carry the reasoning.

| Area                 | Decision                                                           |
| -------------------- | ------------------------------------------------------------------ |
| **Name**             | Parivāraḥ Sarvasvam · short form Sarvasvam · `app.sarvasvam`       |
| **Platform**         | Android and India first. No iOS work in the codebase until Phase 5 |
| **Media**            | Photos and voice only. **No video**                                |
| **Auth**             | Google Sign-In only. No SMS OTP — it costs money                   |
| **Children**         | No under-18 accounts. Adults manage child profiles                 |
| **Database**         | Postgres, migrating off MySQL                                      |
| **Sync**             | Offline-first, outbox, last-write-wins per field                   |
| **Realtime**         | Foreground polling. No WebSockets, no Firebase                     |
| **Tree**             | Union-node graph, Sugiyama layout, ego-centric rendering           |
| **Home screen**      | The feed, with the tree as a first-class tab                       |
| **Languages**        | All 22 scheduled languages, in five waves                          |
| **Kinship**          | Pan-Indian term database — the moat                                |
| **AI / Gemini**      | Deferred entirely. Removed from the codebase                       |
| **Vasiyat**          | Kept, flagged off until real client-side encryption                |
| **Demo data**        | Kept, always visibly labelled                                      |
| **GEDCOM**           | Import and export, Phase 4                                         |
| **Pricing**          | Free forever, plus ₹499/year family, plus one-time prints          |
| **Per-seat pricing** | **Rejected** — it taxes the growth loop                            |
| **Streaks**          | **Rejected** — collective milestones instead                       |
| **Hosting**          | Oracle Always Free, Neon, Cloudflare R2                            |
| **Supabase**         | **Rejected** — the free tier pauses after 7 days                   |
| **Play Store**       | 12 family testers, 14 days. **Never buy testers**                  |
