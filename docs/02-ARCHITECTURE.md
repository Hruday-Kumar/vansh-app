# 02 · Architecture

How the system is built. This document is binding: code that contradicts it is
a bug, or this document must change first.

---

## 1. The problem we are fixing

Today the app has **three parallel, unreconciled data planes**:

| Plane | Storage                              | Used by                |
| ----- | ------------------------------------ | ---------------------- |
| A     | AsyncStorage + Firebase Realtime DB  | Vriksha (tree)         |
| B     | MySQL via the Express backend        | Smriti, Katha, Vasiyat |
| C     | AsyncStorage only, **no API at all** | Nimantrana             |

Nothing reconciles them. The tree does not know the backend exists; the backend
does not know the tree exists; invitations exist only on one phone. **Every
feature in [PRODUCT](01-PRODUCT.md) that makes this product special requires
the graph and the content to live in the same system.**

Phase 0 collapses all three into one.

---

## 2. Target topology

```
+-------------------------------------------------------+
|  ANDROID APP  (Expo SDK 54, RN 0.81, New Architecture) |
|                                                       |
|   UI  ->  feature modules  ->  repositories           |
|                                  |                    |
|                  +---------------+--------------+     |
|                  v                              v     |
|          SQLite (source of truth)        Outbox queue |
|          expo-sqlite, WAL                (pending ops)|
+------------------------+------------------------------+
                         |  HTTPS / JSON, JWT
                         v
+-------------------------------------------------------+
|  API  .  Node 22 + Express 5 + TypeScript             |
|  Oracle Cloud Always Free ARM VM (Ampere A1)          |
|  Caddy (auto-TLS) -> PM2 -> app :3000                 |
+----------+----------------------------+---------------+
           v                            v
+--------------------+      +--------------------------+
|  Neon Postgres 17  |      |  Cloudflare R2           |
|  free tier, 0.5 GB |      |  10 GB, ZERO egress fee  |
|  source of record  |      |  photos + voice          |
+--------------------+      +--------------------------+
           |
           v
+-------------------------------------------------------+
|  Expo Push / FCM  .  Sentry (free)  .  GitHub Actions |
+-------------------------------------------------------+
```

**Firebase Realtime Database is removed entirely.** See
[SECURITY-PRIVACY](07-SECURITY-PRIVACY.md) section 2 for why this is urgent.

---

## 3. Data model (Postgres 17)

Migrating MySQL to Postgres. Design principles: UUIDv7 primary keys generated on
the **client** (so offline writes have stable IDs), `updated_at` on everything
for last-write-wins, soft deletes everywhere, and `family_id` on every row as
the tenancy boundary.

### 3.1 Core tables

```sql
-- Identity ------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  google_sub      TEXT UNIQUE NOT NULL,     -- Google Sign-In subject
  email           TEXT,
  display_name    TEXT NOT NULL,
  photo_url       TEXT,
  locale          TEXT NOT NULL DEFAULT 'en',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Tenancy -------------------------------------------------------------
CREATE TABLE families (
  id              UUID PRIMARY KEY,
  name            TEXT NOT NULL,
  steward_user_id UUID NOT NULL REFERENCES users(id),
  native_place    TEXT,
  gotra           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE family_memberships (
  family_id       UUID NOT NULL REFERENCES families(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  member_id       UUID,                     -- which tree node IS this user
  role            TEXT NOT NULL,            -- steward | editor | viewer
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (family_id, user_id)
);

-- The kinship graph ---------------------------------------------------
CREATE TABLE members (
  id              UUID PRIMARY KEY,
  family_id       UUID NOT NULL REFERENCES families(id),
  given_name      TEXT NOT NULL,
  family_name     TEXT,
  gender          TEXT,                     -- male | female | other | unknown
  birth_date      DATE,
  birth_date_prec TEXT DEFAULT 'exact',     -- exact | year | approx | unknown
  death_date      DATE,
  is_living       BOOLEAN NOT NULL DEFAULT true,
  photo_asset_id  UUID,
  native_place    TEXT,
  gotra           TEXT,
  hide_from_share BOOLEAN NOT NULL DEFAULT false,   -- "don't list me"
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ               -- tombstone, 30-day restore
);

-- Only two edge types. Everything else is derived. See TREE-ALGORITHM.
CREATE TABLE relations (
  id              UUID PRIMARY KEY,
  family_id       UUID NOT NULL REFERENCES families(id),
  kind            TEXT NOT NULL,            -- parent_child | spouse
  from_member_id  UUID NOT NULL REFERENCES members(id),
  to_member_id    UUID NOT NULL REFERENCES members(id),
  subtype         TEXT,                     -- biological|adopted|step|married
  start_date      DATE,                     -- marriage date
  end_date        DATE,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Content -------------------------------------------------------------
CREATE TABLE events (            -- an occasion an album hangs off
  id              UUID PRIMARY KEY,
  family_id       UUID NOT NULL REFERENCES families(id),
  title           TEXT NOT NULL,
  event_type      TEXT,                     -- wedding|mundan|festival|trip
  event_date      DATE,
  location        TEXT,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE assets (            -- every photo and audio file
  id              UUID PRIMARY KEY,
  family_id       UUID NOT NULL REFERENCES families(id),
  kind            TEXT NOT NULL,            -- photo | audio
  r2_key          TEXT NOT NULL,
  thumb_r2_key    TEXT,
  mime_type       TEXT NOT NULL,
  bytes           BIGINT NOT NULL,
  width           INT,
  height          INT,
  duration_ms     INT,                      -- audio
  captured_at     TIMESTAMPTZ,              -- EXIF original date
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE posts (             -- unified feed item
  id              UUID PRIMARY KEY,
  family_id       UUID NOT NULL REFERENCES families(id),
  post_type       TEXT NOT NULL,            -- album|story|tree_change|milestone
  event_id        UUID REFERENCES events(id),
  title           TEXT,
  body            TEXT,
  author_user_id  UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE post_assets (
  post_id         UUID NOT NULL REFERENCES posts(id),
  asset_id        UUID NOT NULL REFERENCES assets(id),
  position        INT NOT NULL,
  PRIMARY KEY (post_id, asset_id)
);

CREATE TABLE tags (              -- who is in this photo
  asset_id        UUID NOT NULL REFERENCES assets(id),
  member_id       UUID NOT NULL REFERENCES members(id),
  bbox            JSONB,                    -- optional face box
  tagged_by       UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (asset_id, member_id)
);

CREATE TABLE comments (          -- text OR voice
  id              UUID PRIMARY KEY,
  family_id       UUID NOT NULL REFERENCES families(id),
  target_type     TEXT NOT NULL,            -- post | asset | member
  target_id       UUID NOT NULL,
  body            TEXT,                     -- null when voice
  audio_asset_id  UUID REFERENCES assets(id),
  author_user_id  UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE reactions (
  target_type     TEXT NOT NULL,
  target_id       UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES users(id),
  emoji           TEXT NOT NULL DEFAULT 'heart',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (target_type, target_id, user_id)
);

-- Sync ----------------------------------------------------------------
CREATE TABLE change_log (        -- what the client pulls
  seq             BIGSERIAL PRIMARY KEY,
  family_id       UUID NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  op              TEXT NOT NULL,            -- upsert | delete
  payload         JSONB NOT NULL,
  actor_user_id   UUID NOT NULL,
  server_time     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON change_log (family_id, seq);
```

### 3.2 Required indexes

```sql
CREATE INDEX ON members  (family_id) WHERE deleted_at IS NULL;
CREATE INDEX ON relations(family_id, from_member_id);
CREATE INDEX ON relations(family_id, to_member_id);
CREATE INDEX ON posts    (family_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ON assets   (family_id, captured_at);         -- "on this day"
CREATE INDEX ON members  (family_id, (EXTRACT(MONTH FROM birth_date)),
                                     (EXTRACT(DAY   FROM birth_date)));
CREATE INDEX ON comments (target_type, target_id);
```

The last members index is what makes "whose birthday is today" a single fast
query instead of a table scan. It is the engine behind Tithi.

---

## 4. Offline-first sync

The [2026 consensus](https://tiwariashuism.medium.com/offline-first-android-architecture-the-complete-engineering-guide-be78c102c59d)
is that an offline-first app reads and writes a **local store by default** and
treats the server as a replication target, not the source of truth for every
interaction. Reconciliation rules must be _designed_, not discovered in
production. Ours:

### 4.1 The outbox pattern

```
User action
    |
    v
+--------------------------------------+
| ONE SQLite transaction:              |
|   1. apply the change locally        |
|   2. append an op to `outbox`        |
+--------------------------------------+
    |                        UI updates immediately
    v
Sync worker (on connectivity / foreground / 15-min task)
    |
    +- PUSH  outbox ops -> POST /sync/push   (idempotent, keyed by op_id)
    |        on 2xx: delete from outbox
    |        on 4xx: mark poisoned, surface to user, never retry blindly
    |        on 5xx/offline: exponential backoff, cap 5 min
    |
    +- PULL  GET /sync/pull?since=<last_seq>
             apply change_log entries, advance cursor
```

**Non-negotiable rules:**

| Rule                                                | Why                                                             |
| --------------------------------------------------- | --------------------------------------------------------------- |
| Client generates UUIDv7 IDs                         | Offline writes need stable identity before the server sees them |
| Every push op carries `op_id`                       | The server dedupes; retries are safe                            |
| Local write and outbox append share one transaction | Otherwise a crash loses one or the other                        |
| Pull is cursor-based on `change_log.seq`            | No "fetch everything" ever                                      |
| Poisoned ops are surfaced, never silently dropped   | Silent data loss is the worst possible bug here                 |

### 4.2 Conflict resolution

**Last-write-wins per field, using the server timestamp.** Not CRDTs. LWW
correctly handles the overwhelming majority of what this app does, and CRDTs
would cost weeks for cases that barely occur.

| Conflict                                    | Resolution                                                  |
| ------------------------------------------- | ----------------------------------------------------------- |
| Two edits to different fields of one member | Merge - both apply                                          |
| Two edits to the same field                 | Server timestamp wins                                       |
| Delete vs edit                              | Delete wins (tombstone), edit recoverable from `change_log` |
| **Two people add the same person**          | **LWW cannot solve this.** Duplicate-merge queue            |

The duplicate-merge queue is the one place we accept a human in the loop, and it
is the only conflict class LWW genuinely cannot resolve. Detection heuristics:
same given name plus the same parent edge, or the same name and a birth year
within two.

---

## 5. Media pipeline

```
Pick photo
   |
   +- original NEVER leaves the device
   |
   +- resize 1600px long edge, WebP q80  (~350 KB)  --+
   +- thumbnail 300px WebP               (~20 KB)   --+
                                                      v
                       POST /assets/presign  ->  presigned R2 PUT
                                                      |
                       direct client -> R2 upload     |  (bypasses our VM)
                                                      |
                       POST /assets/commit  <---------+
```

Uploads are queued in the outbox like any other op and survive an app kill.
R2 charges **zero egress**, which is the entire reason it is chosen over S3 —
a family app is read-heavy, and egress would otherwise be the bill that kills us.

---

## 6. Infrastructure — the zero-cost stack

| Concern        | Choice                                     | Free tier                   | Risk                                    |
| -------------- | ------------------------------------------ | --------------------------- | --------------------------------------- |
| Compute        | **Oracle Cloud Always Free** Ampere A1 ARM | 2 OCPU / 12 GB              | Capacity errors at signup; idle reclaim |
| Database       | **Neon Postgres**                          | 0.5 GB, always-on           | Fills at ~1,000 families                |
| Object storage | **Cloudflare R2**                          | 10 GB, **zero egress ever** | ~150 families of photos                 |
| Auth           | **Google Sign-In**                         | Free                        | Excludes non-Google users               |
| Push           | **Expo Push / FCM**                        | Free                        | —                                       |
| Errors         | **Sentry**                                 | 5k events/mo                | —                                       |
| CI             | **GitHub Actions**                         | 2,000 min/mo                | —                                       |
| Builds         | **Local Gradle**                           | Free                        | Avoids EAS build quota                  |
| TLS + domain   | Caddy plus a `.app` domain                 | ~1,200 INR/yr               | The only recurring cost                 |

**Supabase was evaluated and rejected**: its free tier pauses the entire project
— including Auth and the API — after 7 days of inactivity. For a family app
where a household might not open it for a fortnight, that is fatal.

**Scaling triggers**, documented now so they are not a surprise later:

| Signal              | Action                                                |
| ------------------- | ----------------------------------------------------- |
| Neon over 0.4 GB    | Paid tier, or self-host Postgres on the Oracle VM     |
| R2 over 8 GB        | Per-family storage quota, or paid tiers               |
| Oracle VM reclaimed | Hetzner CX22 (~400 INR/mo) fallback, ready in advance |

---

## 7. Client architecture

The [2026 guidance](https://www.applighter.com/blog/mobile-app-architecture) is
blunt: a React Native project gets messy when code is grouped by **file type**
too early, so that features span many folders and clarity is lost. The fix is
**feature modules plus a shared layer**, with domain logic that does not depend
on React Native, Expo APIs or navigation — because when domain logic sits close
to infrastructure, every tool decision becomes a rewrite.

We adopt exactly that. Four layers, with a strict dependency direction:

```
  app/            Expo Router routes — thin, no logic
    |  may import v
  features/       one folder per module (vriksha, smriti, tithi ...)
    |             ui/  hooks/  model/  repo/
    |  may import v
  shared/         design system, i18n, utils, primitives
    |  may import v
  core/           db, sync, api client, storage, types
                  <- imports NOTHING above it
```

**Enforced by ESLint `import/no-restricted-paths`.** A `features/smriti` file
importing from `features/vriksha` fails CI. Cross-feature communication goes
through `core/` or an explicit public `index.ts` barrel.

| Layer        | Rule                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| `core/`      | Zero React. Pure TypeScript. Unit-testable with no renderer              |
| `shared/`    | React allowed. No feature knowledge. No API calls                        |
| `features/*` | Owns its state, queries and UI. Public surface is `index.ts` only        |
| `app/`       | Routing and layout only. Over 100 lines means logic belongs in a feature |

State: **Zustand** for client and UI state, **TanStack Query** for server state
over the repository layer. The nine-store `src/state/stores.ts` monolith is
split per feature — see [CODEBASE-STRUCTURE](03-CODEBASE-STRUCTURE.md).

---

## 8. API design

REST, JSON, JWT bearer. Versioned under `/v1`.

| Group     | Endpoints                                                            |
| --------- | -------------------------------------------------------------------- |
| Auth      | `POST /v1/auth/google`, `/refresh`, `/logout`                        |
| Sync      | `POST /v1/sync/push`, `GET /v1/sync/pull?since=`                     |
| Family    | `GET/POST /v1/families`, `POST /v1/families/:id/join`, `.../approve` |
| Members   | `GET/POST/PATCH /v1/families/:id/members`                            |
| Relations | `GET/POST/DELETE /v1/families/:id/relations`                         |
| Assets    | `POST /v1/assets/presign`, `POST /v1/assets/commit`                  |
| Feed      | `GET /v1/families/:id/feed?cursor=`                                  |
| Posts     | `GET/POST/PATCH /v1/posts`                                           |
| Comments  | `POST /v1/comments`, `DELETE /v1/comments/:id`                       |
| Tithi     | `GET /v1/families/:id/occasions?from=&to=`                           |
| Share     | `POST /v1/share`, `GET /v1/s/:token` (public, no auth)               |
| Export    | `GET /v1/families/:id/export.ged`, `GET /v1/me/export.zip`           |

**Every mutating endpoint accepts an `op_id`** and is idempotent.
**Every endpoint scopes by `family_id` taken from the JWT**, never from the
request body — that is the tenancy boundary, and the most likely place to
introduce a data leak.

---

## 9. Performance budgets

Enforced in CI where measurable; otherwise checked at each phase gate.

| Metric                         | Budget                      | Measured on           |
| ------------------------------ | --------------------------- | --------------------- |
| Cold start to interactive feed | under 1.5 s                 | Redmi-class, 4 GB RAM |
| Tree layout, 200 members       | under 400 ms                | Same                  |
| Tree pan and zoom              | 60 fps sustained            | Same                  |
| Feed scroll                    | no dropped frames at 60 fps | Same                  |
| APK size                       | under 40 MB                 | Release build         |
| Memory, tree open              | under 250 MB                | Same                  |
| API p95                        | under 300 ms                | Oracle VM             |
| Sync pull, 1,000 changes       | under 2 s                   | 4G                    |

---

## 10. Technology decisions

| Area           | Choice                | Rejected                | Why                                             |
| -------------- | --------------------- | ----------------------- | ----------------------------------------------- |
| Framework      | Expo SDK 54, New Arch | Bare RN                 | OTA updates, config plugins, one-command submit |
| Routing        | expo-router           | React Navigation direct | Already in use; deep links come free            |
| Local DB       | expo-sqlite + Drizzle | WatermelonDB, Realm     | SQL we control; typed; no native fork           |
| Server state   | TanStack Query        | Hand-rolled hooks       | Caching, retries, invalidation solved           |
| Client state   | Zustand               | Redux                   | Already in use; minimal ceremony                |
| Backend        | Express 5 + TS        | Fastify, NestJS         | Already in use; migration is not repaid         |
| DB             | Postgres 17 (Neon)    | MySQL, Supabase         | Recursive CTEs; Supabase pauses                 |
| ORM (server)   | Drizzle               | Prisma                  | The Prisma engine binary is heavy on free ARM   |
| Storage        | Cloudflare R2         | S3, Firebase Storage    | Zero egress                                     |
| i18n           | i18next               | i18n-js                 | Namespaces, lazy loading, ICU plurals           |
| Graph layout   | Sugiyama (custom)     | d3-hierarchy, elkjs     | Family graphs are not trees                     |
| Tree rendering | react-native-skia     | SVG, plain Views        | 200 nodes at 60 fps needs a canvas              |
| Realtime       | Foreground polling    | WebSockets, Firebase    | A family feed is not sub-second                 |

---

## 11. What gets deleted in Phase 0

| Removed                                                            | Reason                                 |
| ------------------------------------------------------------------ | -------------------------------------- |
| Firebase Realtime DB, `src/config/firebase.ts`                     | Publicly readable; replaced by the API |
| MySQL (`mysql2`)                                                   | Replaced by Postgres                   |
| `src/services/encryption.ts` (XOR posing as AES)                   | Dangerous. Replaced by real crypto     |
| `backend/src/services/gemini.service.ts`                           | Deferred AI; returns stub text today   |
| `backend/src/mock-server.ts`                                       | Superseded by the real server          |
| `*-old.tsx` files                                                  | Dead code                              |
| `video-katha-recorder.tsx`, `video-player.tsx`                     | Video is cut from scope                |
| `debug-layout.ts`, `debug-out.txt`, `logs.txt`, `fix-backticks.js` | Committed by accident                  |
| `src/__tests__/debug_*.ts`, `reproduce_issue.ts`                   | Ad-hoc scripts, not tests              |

---

**Sources:**
[Mobile App Architecture 2026](https://www.applighter.com/blog/mobile-app-architecture) ·
[Offline-First Android Architecture](https://tiwariashuism.medium.com/offline-first-android-architecture-the-complete-engineering-guide-be78c102c59d) ·
[Offline-First: Sync, Conflicts and Security](https://thetechtower.com/offline-first-app-architecture/) ·
[React Native Best Practices 2026](https://www.applighter.com/blog/react-native-best-practices)
