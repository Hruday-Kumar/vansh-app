# Runbook

Operational procedures. Filled in as Phase 0 provisions each piece; nothing here
is guesswork — a section is written only after the procedure has been run once.

---

## 1. Environments

| Env        | API                         | Database                        | Objects        |
| ---------- | --------------------------- | ------------------------------- | -------------- |
| Local      | `http://localhost:3000`     | local Postgres or a Neon branch | R2 dev bucket  |
| Production | `https://api.sarvasvam.app` | Neon main                       | R2 prod bucket |

**There is no staging.** With one developer, a Neon branch plus a local server is
the correct amount of environment.

---

## 2. Deploy — _to be written in Phase 0.5_

```
# target: a single command
npm run deploy
```

Must cover: build, upload, migrate, PM2 reload, health check, and automatic
rollback on a failed health check.

---

## 3. Rollback — _to be written in Phase 0.5_

**Rollback must be tested, not assumed.** An untested rollback is not a rollback.

---

## 4. Database

- [ ] Nightly automated backup
- [ ] **Restore tested at least once before launch** — a backup that has never
      been restored is a guess
- [ ] Migrations are reversible and run against a copy first

---

## 5. Incidents

1. Acknowledge — post in the family tester group if users are affected
2. Contain — roll back, or disable the feature flag
3. Diagnose — Sentry, then server logs
4. Fix forward
5. **Write the [LESSONS](13-LESSONS.md) entry**

**If personal data was exposed:** follow the DPDP breach procedure —
notify the Data Protection Board and every affected user.

---

## 6. Rotating a secret — _to be written in Phase 0.5_

Covering: JWT signing key, Google OAuth client, R2 credentials, database URL.

---

## 7. Free-tier watch

| Resource       | Limit        | Alert at | Action                                   |
| -------------- | ------------ | -------- | ---------------------------------------- |
| Neon storage   | 0.5 GB       | 0.4 GB   | Paid tier, or self-host on the Oracle VM |
| R2 storage     | 10 GB        | 8 GB     | Per-family quota, or paid tiers          |
| GitHub Actions | 2,000 min/mo | 1,600    | Trim the CI matrix                       |
| Sentry events  | 5k/mo        | 4k       | Sample non-error events                  |

## 8. If the Oracle VM is reclaimed

Documented fallback: Hetzner CX22 at roughly ₹400/month. The deploy procedure in
section 2 must work unchanged against it — that is the point of keeping deploy
to one command.
