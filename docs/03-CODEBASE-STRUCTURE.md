# 03 · Codebase Restructure

The complete restructure. This document is the migration plan **and** the
permanent rule for where new code goes.

---

## 1. Why restructure

The current tree groups code by **file type** (`components/`, `services/`,
`hooks/`, `utils/`, `state/`) while also having a `features/` folder. The result
is that one feature is smeared across six directories:

> **Smriti today lives in:** `src/features/smriti/` (12 files),
> `src/state/stores.ts` (one slice of a 9-store monolith), `src/services/api.ts`,
> `src/hooks/use-api.ts`, `src/types/core.ts`, and `app/(tabs)/smriti.tsx`
> (931 lines of screen logic).

This is exactly the failure mode the [2026 architecture
guidance](https://www.applighter.com/blog/mobile-app-architecture) warns about.
Six problems follow from it:

| #   | Problem                             | Evidence                                                                   |
| --- | ----------------------------------- | -------------------------------------------------------------------------- |
| 1   | Features have no boundary           | Any file can import any other file                                         |
| 2   | Screens hold business logic         | `app/(tabs)/smriti.tsx` is 931 lines                                       |
| 3   | One state monolith                  | `src/state/stores.ts` holds nine stores                                    |
| 4   | Three data planes                   | AsyncStorage, Firebase, MySQL — see [ARCHITECTURE](02-ARCHITECTURE.md)     |
| 5   | Dead code ships                     | `*-old.tsx`, `debug_*.ts`, `mock-server.ts`                                |
| 6   | Domain logic touches infrastructure | `vriksha-store.ts` is 1,523 lines mixing graph maths, storage and UI state |

---

## 2. Target structure

```
sarvasvam/
├── app/                          # Expo Router — routes ONLY, no logic
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Pravaha — the feed
│   │   ├── vriksha.tsx
│   │   ├── smriti.tsx
│   │   ├── katha.tsx
│   │   └── more.tsx
│   ├── member/[id].tsx
│   ├── album/[id].tsx
│   ├── event/[id].tsx
│   ├── occasion/[id].tsx
│   ├── invite/[id].tsx
│   └── s/[token].tsx             # public share link
│
├── src/
│   ├── core/                     # zero React. Pure TypeScript.
│   │   ├── db/
│   │   │   ├── client.ts         # expo-sqlite handle, WAL, pragmas
│   │   │   ├── schema.ts         # Drizzle schema, mirrors Postgres
│   │   │   └── migrations/
│   │   ├── sync/
│   │   │   ├── outbox.ts         # enqueue, dequeue, poison handling
│   │   │   ├── push.ts
│   │   │   ├── pull.ts
│   │   │   ├── worker.ts         # scheduling, backoff
│   │   │   └── conflict.ts       # LWW rules
│   │   ├── api/
│   │   │   ├── client.ts         # fetch wrapper, auth header, retry
│   │   │   ├── endpoints.ts
│   │   │   └── errors.ts
│   │   ├── auth/
│   │   │   ├── google.ts
│   │   │   ├── session.ts
│   │   │   └── tokens.ts         # expo-secure-store
│   │   ├── media/
│   │   │   ├── pipeline.ts       # resize, WebP, thumbnail
│   │   │   ├── upload-queue.ts
│   │   │   └── audio.ts
│   │   ├── storage/
│   │   │   ├── kv.ts             # AsyncStorage wrapper
│   │   │   └── secure.ts
│   │   ├── logging/
│   │   │   ├── logger.ts
│   │   │   └── sentry.ts
│   │   ├── config/
│   │   │   ├── env.ts            # typed, validated env
│   │   │   └── flags.ts          # feature flags
│   │   └── types/
│   │       ├── entities.ts       # Member, Relation, Post, Asset ...
│   │       └── ids.ts            # branded ID types
│   │
│   ├── shared/                   # React allowed. No feature knowledge.
│   │   ├── ui/                   # the design system
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── text.tsx          # enforces the 20pt Elder Path minimum
│   │   │   ├── voice-button.tsx  # hold-to-record, used everywhere
│   │   │   ├── waveform.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── index.ts
│   │   ├── theme/
│   │   ├── i18n/
│   │   │   ├── index.ts          # i18next setup
│   │   │   └── locales/en/ hi/ te/ ...
│   │   ├── hooks/
│   │   └── utils/
│   │
│   └── features/                 # one folder per module
│       ├── pravaha/              # the feed
│       ├── vriksha/
│       │   ├── ui/
│       │   ├── model/
│       │   │   ├── graph.ts      # adjacency, traversal
│       │   │   ├── layout/       # Sugiyama pipeline
│       │   │   └── kinship/      # relation path -> term
│       │   ├── repo/
│       │   ├── hooks/
│       │   ├── store.ts
│       │   └── index.ts          # THE ONLY public surface
│       ├── smriti/
│       ├── katha/
│       ├── tithi/
│       ├── nimantrana/
│       ├── parampara/
│       ├── vasiyat/
│       ├── onboarding/
│       ├── settings/
│       └── search/
│
├── modules/
│   └── jharokha-widget/          # native Android widget + Expo config plugin
│
├── server/                       # renamed from backend/
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── config/
│       ├── db/
│       │   ├── schema.ts
│       │   ├── client.ts
│       │   └── migrations/
│       ├── middleware/
│       ├── modules/              # vertical slices
│       │   ├── auth/
│       │   ├── family/
│       │   ├── member/
│       │   ├── asset/
│       │   ├── feed/
│       │   ├── tithi/
│       │   ├── sync/
│       │   └── share/
│       └── lib/
│
├── docs/
├── scripts/
└── e2e/
```

---

## 3. Anatomy of a feature

Every feature folder has the same six parts. No exceptions.

```
features/<name>/
├── ui/            # React components. Presentational where possible.
├── hooks/         # React hooks. Bridges ui <-> model/repo.
├── model/         # PURE domain logic. No React, no imports from ui/.
├── repo/          # data access. Talks to core/db and core/api ONLY.
├── store.ts       # Zustand slice for this feature only
└── index.ts       # public surface — the ONLY thing other code may import
```

**The `index.ts` rule.** Nothing outside `features/x/` may import
`features/x/anything/deep.ts`. It may import only `features/x`. This is
enforced by ESLint, not by discipline.

**The `model/` rule.** Files in `model/` must be unit-testable with `node`
alone — no renderer, no native modules. If a model file imports from
`react-native`, that is a bug. This is what makes the tree algorithm and the
kinship resolver testable, which is what stops them regressing.

---

## 4. Import rules, enforced by ESLint

```js
// eslint.config.js
'import/no-restricted-paths': ['error', {
  zones: [
    // core imports nothing above it
    { target: './src/core',     from: './src/features' },
    { target: './src/core',     from: './src/shared'   },
    { target: './src/core',     from: './app'          },
    // shared knows nothing about features
    { target: './src/shared',   from: './src/features' },
    { target: './src/shared',   from: './app'          },
    // features never reach into each other
    { target: './src/features/vriksha',  from: './src/features/smriti' },
    { target: './src/features/smriti',   from: './src/features/vriksha' },
    // ... generated for every pair; see scripts/gen-eslint-zones.mjs
    // model stays pure
    { target: './src/features/*/model',  from: './src/features/*/ui' },
  ],
}]
```

Plus a hard ban on deep feature imports:

```js
'no-restricted-imports': ['error', {
  patterns: [
    { group: ['**/features/*/!(index)'], message: 'Import the feature barrel, not its internals.' },
    { group: ['react-native'], importNames: ['Text'], message: 'Use shared/ui/text — it enforces the Elder Path minimum size.' },
  ],
}]
```

---

## 5. Path aliases

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/core/*"],
      "@shared/*": ["src/shared/*"],
      "@features/*": ["src/features/*"],
      "@app/*": ["app/*"],
    },
  },
}
```

Relative imports beyond `./` and `../` inside the same folder are banned.
`../../../services/api` never appears again.

---

## 6. The migration map

Every file that exists today, and where it goes. `DELETE` means it does not
survive the restructure.

### 6.1 Routes

| From                       | To                        | Note                                              |
| -------------------------- | ------------------------- | ------------------------------------------------- |
| `app/_layout.tsx`          | `app/_layout.tsx`         | Slim down; providers move to a provider component |
| `app/login.tsx`            | `app/(auth)/sign-in.tsx`  | Rewrite for Google Sign-In                        |
| `app/(tabs)/index.tsx`     | `app/(tabs)/index.tsx`    | **Rewrite as the Pravaha feed**                   |
| `app/(tabs)/vriksha.tsx`   | `app/(tabs)/vriksha.tsx`  | Extract logic to the feature                      |
| `app/(tabs)/smriti.tsx`    | `app/(tabs)/smriti.tsx`   | **931 lines -> under 100**                        |
| `app/(tabs)/katha.tsx`     | `app/(tabs)/katha.tsx`    | Extract logic                                     |
| `app/(tabs)/explore.tsx`   | `app/(tabs)/more.tsx`     | Rename; becomes the overflow tab                  |
| `app/(tabs)/parampara.tsx` | `app/parampara/index.tsx` | Off the tab bar; 5 tabs is the maximum            |
| `app/(tabs)/vasiyat.tsx`   | `app/vasiyat/index.tsx`   | Off the tab bar                                   |
| `app/modal.tsx`            | DELETE                    | Unused scaffold                                   |

### 6.2 Vriksha — the tree

| From                                                  | To                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| `src/features/vriksha/vriksha-store.ts` (1,523 lines) | **split**: `model/graph.ts`, `repo/member-repo.ts`, `store.ts` |
| `src/features/vriksha/tree-layout.ts` (773 lines)     | **rewrite** as `model/layout/{rank,order,position,route}.ts`   |
| `src/features/vriksha/relationship-resolver.ts`       | `model/kinship/resolver.ts`                                    |
| `src/features/vriksha/enhanced-family-tree.tsx`       | `ui/tree-canvas.tsx` (Skia rewrite)                            |
| `src/features/vriksha/animated-member-node.tsx`       | `ui/member-node.tsx`                                           |
| `src/features/vriksha/animated-connection-lines.tsx`  | `ui/edges.tsx`                                                 |
| `src/features/vriksha/member-detail-sheet.tsx`        | `ui/member-sheet.tsx`                                          |
| `src/features/vriksha/quick-add-member.tsx`           | `ui/add-member.tsx`                                            |
| `src/features/vriksha/share-service.ts` (921 lines)   | `repo/share-repo.ts` + server-side share tokens                |
| `src/features/vriksha/share-tree-modal.tsx`           | `ui/share-sheet.tsx`                                           |
| `src/features/vriksha/import-tree-modal.tsx`          | `ui/import-sheet.tsx`                                          |
| `src/features/vriksha/join-request-flow.tsx`          | `ui/join-request.tsx`                                          |
| `src/features/vriksha/shared-tree-view.tsx`           | `ui/shared-tree-view.tsx`                                      |
| `src/features/vriksha/tree-sync-service.ts`           | **DELETE** — Firebase; replaced by `core/sync`                 |
| `src/features/vriksha/types.ts`                       | `core/types/entities.ts`                                       |
| `src/features/vriksha/*-old.tsx`                      | **DELETE**                                                     |
| `src/utils/family-tree-utils.ts`                      | `features/vriksha/model/graph.ts`                              |

### 6.3 Smriti, Katha and the rest

| From                                                | To                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `src/features/smriti/memory-*.tsx`                  | `features/smriti/ui/`                                            |
| `src/features/smriti/{mosaic,timeline}-gallery.tsx` | `features/smriti/ui/`                                            |
| `src/features/smriti/event-{album,list}.tsx`        | `features/smriti/ui/`                                            |
| `src/features/smriti/create-event-modal.tsx`        | `features/smriti/ui/create-event.tsx`                            |
| `src/features/smriti/upload-progress-overlay.tsx`   | `features/smriti/ui/`                                            |
| `src/features/smriti/demo-data.ts`                  | `features/onboarding/model/demo-family.ts`                       |
| `src/features/smriti/video-player.tsx`              | **DELETE** — no video                                            |
| `src/features/katha/katha-{recorder,player}.tsx`    | `features/katha/ui/`                                             |
| `src/features/katha/photo-story-recorder.tsx`       | `features/katha/ui/`                                             |
| `src/features/katha/transcription-panel.tsx`        | `features/katha/ui/` (behind a flag)                             |
| `src/features/katha/video-katha-recorder.tsx`       | **DELETE** — no video                                            |
| `src/features/nimantran/*`                          | `features/nimantrana/ui/` + a real `repo/`                       |
| `src/features/parampara/*`                          | `features/parampara/ui/`                                         |
| `src/features/vasiyat/*`                            | `features/vasiyat/ui/` (flagged off until encrypted)             |
| `src/features/onboarding/*`                         | `features/onboarding/ui/`                                        |
| `src/features/settings/*`                           | `features/settings/ui/`                                          |
| `src/features/search/global-search.tsx`             | `features/search/ui/` — **replace the mock results at line 159** |

### 6.4 Shared and core

| From                                      | To                                         | Note                                                       |
| ----------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `src/components/atoms/*`                  | `shared/ui/`                               | Drop the atoms/molecules split — it never paid off         |
| `src/components/molecules/*`              | `shared/ui/`                               |                                                            |
| `src/components/error-display.tsx`        | `shared/ui/error-display.tsx`              |                                                            |
| `src/theme/*`                             | `shared/theme/`                            | Raise base font to 20pt                                    |
| `src/i18n/*`                              | `shared/i18n/`                             | **Rewrite on i18next**                                     |
| `src/hooks/use-animations.ts`             | `shared/hooks/`                            |                                                            |
| `src/hooks/use-language.tsx`              | `shared/i18n/use-language.tsx`             |                                                            |
| `src/hooks/use-pull-to-refresh.ts`        | `shared/hooks/`                            |                                                            |
| `src/hooks/use-api.ts`                    | **DELETE**                                 | Replaced by TanStack Query in each `repo/`                 |
| `src/utils/{date,ids,validation}.ts`      | `shared/utils/`                            |                                                            |
| `src/utils/accessibility.tsx`             | `shared/utils/`                            |                                                            |
| `src/utils/lazy-loading.tsx`              | `shared/utils/`                            |                                                            |
| `src/utils/storage.ts`                    | `core/storage/kv.ts`                       |                                                            |
| `src/services/api.ts`                     | `core/api/client.ts` + per-feature `repo/` | Split                                                      |
| `src/services/offline-db.ts`              | `core/db/client.ts`                        | Rewrite on Drizzle                                         |
| `src/services/offline-db.web.ts`          | **DELETE**                                 | No web target in v1                                        |
| `src/services/sync.ts`                    | `core/sync/`                               | Rewrite as the outbox                                      |
| `src/services/background-sync.ts`         | `core/sync/worker.ts`                      |                                                            |
| `src/services/secure-storage.ts`          | `core/storage/secure.ts`                   |                                                            |
| `src/services/notifications.ts`           | `core/notifications/`                      |                                                            |
| `src/services/image-optimization.ts`      | `core/media/pipeline.ts`                   |                                                            |
| `src/services/transcription.ts`           | `features/katha/model/`                    | Behind a flag                                              |
| `src/services/deep-linking.ts`            | `core/links/`                              |                                                            |
| `src/services/{analytics,performance}.ts` | `core/logging/`                            |                                                            |
| `src/services/cache.ts`                   | **DELETE**                                 | TanStack Query owns caching                                |
| `src/services/search.ts`                  | `features/search/model/`                   |                                                            |
| `src/services/privacy.ts`                 | `core/privacy/`                            | DPDP export and erasure                                    |
| `src/services/biometrics.ts`              | `core/auth/biometrics.ts`                  |                                                            |
| `src/services/encryption.ts`              | **DELETE and rewrite**                     | XOR posing as AES — see [SECURITY](07-SECURITY-PRIVACY.md) |
| `src/state/stores.ts` (9 stores)          | **split** into `features/*/store.ts`       |                                                            |
| `src/types/{core,api,database,index}.ts`  | `core/types/entities.ts`                   |                                                            |
| `src/config/api.ts`                       | `core/config/env.ts`                       | Remove the hardcoded LAN IP                                |
| `src/config/firebase.ts`                  | **DELETE**                                 | Firebase is removed                                        |
| `src/navigation/*`                        | **DELETE**                                 | expo-router supersedes it                                  |

### 6.5 Server

| From                                         | To                                              |
| -------------------------------------------- | ----------------------------------------------- |
| `backend/`                                   | `server/`                                       |
| `backend/src/controllers/auth.controller.ts` | `server/src/modules/auth/auth.controller.ts`    |
| `backend/src/routes/auth.routes.ts`          | `server/src/modules/auth/auth.routes.ts`        |
| ... every controller and route pair          | ... into its `modules/<name>/` slice            |
| `backend/src/config/database.ts`             | `server/src/db/client.ts` (Postgres)            |
| `backend/sql/schema.sql` + `migrations/*`    | `server/src/db/migrations/` (Drizzle, Postgres) |
| `backend/src/services/gemini.service.ts`     | **DELETE**                                      |
| `backend/src/mock-server.ts`                 | **DELETE**                                      |
| `backend/src/services/{logger,sentry}.ts`    | `server/src/lib/`                               |
| `backend/src/middleware/*`                   | `server/src/middleware/`                        |

Each server module slice contains exactly:
`<name>.routes.ts` · `<name>.controller.ts` · `<name>.service.ts` ·
`<name>.repo.ts` · `<name>.schema.ts` (Zod) · `<name>.test.ts`

### 6.6 Repository root — delete on sight

| File                                                                  | Reason                                             |
| --------------------------------------------------------------------- | -------------------------------------------------- |
| `debug-layout.ts`, `debug-out.txt`, `logs.txt`                        | Working files                                      |
| `fix-backticks.js`                                                    | One-off script                                     |
| `scripts/apply-ego-centric-layout.js`                                 | One-off script; the work is now in `model/layout/` |
| `components/`, `hooks/`, `constants/` (root level)                    | Expo template leftovers, shadowed by `src/`        |
| `coverage/`                                                           | Build output — add to `.gitignore`                 |
| `SHARING_SYSTEM_CHANGES.md`                                           | Superseded by this doc set                         |
| `SRS.md`                                                              | Superseded — describes the old tree-only product   |
| `src/__tests__/debug_*.ts`, `reproduce_issue.ts`, `test_inversion.ts` | Ad-hoc scripts masquerading as tests               |

---

## 7. Execution order

The restructure is **not** one commit. It is nine, each independently
revertible, each leaving the app buildable. Run `npm run typecheck` and
`npm test` after every step; do not proceed on red.

| Step | Commit                                                                     | Risk   |
| ---- | -------------------------------------------------------------------------- | ------ |
| 1    | **Delete dead code.** Section 6.6 plus every `*-old.tsx`. Nothing else.    | None   |
| 2    | **Create empty structure** + path aliases + ESLint zones (warn, not error) | None   |
| 3    | **Move `core/`.** Services to `core/*`, mechanical moves, fix imports      | Low    |
| 4    | **Move `shared/`.** Components, theme, utils                               | Low    |
| 5    | **Split `state/stores.ts`** into `features/*/store.ts`                     | Medium |
| 6    | **Move features**, one per commit, largest last (vriksha)                  | Medium |
| 7    | **Thin the routes.** Pull logic out of `app/(tabs)/*.tsx`                  | Medium |
| 8    | **Rename `backend/` to `server/`**, slice into modules                     | Low    |
| 9    | **Flip ESLint zones to `error`.** CI now enforces the boundaries           | None   |

> **Rule for this work: no behaviour changes.** The restructure moves code and
> nothing else. Rewrites — Postgres, sync, the tree algorithm, i18next — are
> separate commits that land _after_ step 9, on a clean structure. Mixing a move
> with a rewrite makes a bad diff impossible to review and impossible to revert.

---

## 8. Definition of done

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm test` green
- [ ] `npx eslint .` clean with import zones set to `error`
- [ ] No file over 400 lines (was: 1,523)
- [ ] No route file over 100 lines (was: 931)
- [ ] No file in `features/*/model/` imports `react` or `react-native`
- [ ] `npx depcheck` and `npx knip` report no unused dependencies or exports
- [ ] Release APK builds and the app runs end to end
- [ ] `git grep -i "vansh"` returns only CHANGELOG history entries
- [ ] `git grep -i firebase` returns nothing
