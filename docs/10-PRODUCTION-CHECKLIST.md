# 10 · Production Readiness Checklist

The gate before public launch. Run it end to end before **every** production
release, not just the first.

**Rule: an unchecked box blocks the release.** If a box cannot be checked, it is
either fixed or explicitly waived in writing in [LESSONS](13-LESSONS.md) with a
reason and an owner.

---

## 1. Security 🔴

- [ ] Firebase project deleted; no `firebase` dependency in `package.json`
- [ ] `git log -p | grep -iE "apiKey|secret|password|token"` finds no live secret
- [ ] No XOR, ROT13 or homemade cipher anywhere
- [ ] Every crypto function implements the algorithm its name claims
- [ ] TLS 1.3 only; HSTS enabled
- [ ] Google ID tokens verified server-side against JWKS
- [ ] Access tokens expire in 15 minutes; refresh tokens rotate
- [ ] Tokens stored in `expo-secure-store`, never AsyncStorage
- [ ] **Every endpoint derives `family_id` from the JWT, never the request body**
- [ ] **Automated test: a user in family A cannot read family B**
- [ ] Zod validation on every endpoint; unknown keys rejected
- [ ] All SQL parameterised — no string concatenation
- [ ] Rate limits: 100/min per user, 10/min auth, 20/hour share creation
- [ ] Uploads validated by magic bytes, not extension; 25 MB cap
- [ ] EXIF GPS stripped from every uploaded photo
- [ ] Share tokens expire and are revocable — tested
- [ ] `npm audit` reports zero high or critical
- [ ] Secrets in environment variables only; `.env` git-ignored
- [ ] No token, email, phone or R2 key appears in any log

## 2. Privacy and DPDP 🔴

- [ ] Consent notice at sign-up, in the selected language
- [ ] Consent recorded with a version and timestamp
- [ ] Purpose limitation stated; no secondary use
- [ ] No under-18 accounts
- [ ] No behavioural advertising or third-party ad SDK
- [ ] Data export returns a complete, readable archive
- [ ] Account deletion works; personal data purged within 30 days
- [ ] Erasure-versus-tree trade-off explained in plain language in the flow
- [ ] Living people, DOB excluded from share exports
- [ ] "Don, t list me" flag honoured in every export and share link
- [ ] Children never appear in a public link
- [ ] Privacy policy published; grievance officer named with an email
- [ ] Breach runbook written and reachable
- [ ] Play Data Safety form matches what the app actually does

## 3. Reliability

- [ ] Crash-free sessions above 99.5% in the last 7 days of testing
- [ ] Sentry on client and server, with release tagging and source maps
- [ ] Error boundaries around every screen — no white screen of death
- [ ] Every network call handles offline, timeout, 4xx and 5xx distinctly
- [ ] **No silent failures.** Every swallowed error is either surfaced or logged
- [ ] Poisoned sync ops surface to the user; they are never dropped silently
- [ ] Database migrations are reversible and tested on a copy
- [ ] Automated nightly Postgres backup; **restore tested at least once**
- [ ] `/health` endpoint plus uptime monitoring with alerting
- [ ] PM2 restarts the server on crash; systemd restarts PM2 on reboot
- [ ] Graceful degradation when R2 is unreachable

## 4. Performance

Measured on a ₹12,000-class Android phone (4 GB RAM), not an emulator.

- [ ] Cold start to interactive feed under 1.5 s
- [ ] Tree layout, 200 members, under 400 ms
- [ ] Tree pan and zoom at a sustained 60 fps
- [ ] Feed scroll with no dropped frames
- [ ] APK under 40 MB
- [ ] Memory with the tree open, under 250 MB
- [ ] API p95 under 300 ms
- [ ] Sync pull of 1,000 changes under 2 s on 4G
- [ ] 50-photo upload does not block the UI and survives an app kill
- [ ] No memory leak across 30 minutes of navigation

## 5. Data integrity

- [ ] Two devices editing the same member converge, with no lost field
- [ ] Offline edits queue and replay in order
- [ ] Retried sync ops are idempotent — no duplicate rows
- [ ] Deleting a member tombstones it; a 30-day restore works
- [ ] Deleting a member does not orphan its relations
- [ ] The tree survives a cousin-marriage cycle without hanging
- [ ] GEDCOM export re-imports losslessly
- [ ] No entity data is written to AsyncStorage anywhere

## 6. Accessibility — the Elder Path

- [ ] Base body text 20pt; scales to 200% without clipping
- [ ] All tap targets 48×48 dp minimum
- [ ] Contrast meets WCAG AA (4.5:1)
- [ ] Every core action is completable by voice plus two taps
- [ ] No core action requires typing
- [ ] Every icon is paired with a text label
- [ ] TalkBack reads every screen sensibly
- [ ] Onboarding is voice-narrated in the chosen language
- [ ] Tested by an actual person over 60 who did not build it

## 7. Internationalisation

- [ ] No hardcoded user-facing string anywhere
- [ ] `en`, `hi`, `te` complete; CI fails on any missing key
- [ ] Noto Sans Indic fonts bundled; no tofu boxes
- [ ] Dates, numbers and plurals localised
- [ ] Kinship terms resolve correctly in every shipped language
- [ ] Long translations do not break any layout
- [ ] Language is switchable in-app and survives a restart

## 8. Store readiness

- [ ] `app.json` and `package.json` versions match; `versionCode` incremented
- [ ] Package is `app.sarvasvam`; no "vansh" string anywhere user-visible
- [ ] Signed release AAB builds reproducibly
- [ ] Upload key backed up **off-machine** — losing it means losing the app
- [ ] ProGuard/R8 enabled; the release build verified after minification
- [ ] Listing, screenshots and description in en, hi and te
- [ ] Feature graphic and icon at all required sizes
- [ ] 12 testers opted in for 14 continuous days
- [ ] Content rating completed
- [ ] Target SDK meets the current Play requirement
- [ ] Permissions justified; nothing requested that is not used

## 9. Operations

- [ ] `docs/RUNBOOK.md` covers deploy, rollback, restore and rotate
- [ ] Deploy is a single documented command
- [ ] Rollback tested — not assumed
- [ ] Expo OTA channel configured for JS-only hotfixes
- [ ] Staged rollout plan: 10% for 48 h, 50%, 100%
- [ ] Neon and R2 usage alerts before the free tier is exhausted
- [ ] Oracle VM reclaim risk understood; the Hetzner fallback is documented
- [ ] Domain auto-renew is on
- [ ] A support email exists and is monitored

## 10. Honesty

The rule that produced this section: the pitch deck claimed AES-256-GCM for
software that shipped XOR.

- [ ] **Every security claim in marketing maps to a passing test**
- [ ] No competitor claim is false — "no direct competitor" is deleted
- [ ] Screenshots show real functionality, not mockups
- [ ] Demo data is labelled "Sample family" wherever it appears
- [ ] Feature list matches what actually ships; nothing flagged-off is advertised
- [ ] Pricing in the app matches pricing on the site

---

## Sign-off

```
Release:     v____________       Date: __________

Sections 1-10 complete:          [ ]
Waivers recorded in LESSONS.md:  [ ]
Staged rollout started at 10%:   [ ]

Signed: ______________________
```
