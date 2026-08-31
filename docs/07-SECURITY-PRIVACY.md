# 07 · Security & Privacy

We are asking Indian families to hand us their photographs, their voices, their
dates of birth, and the structure of their household. That is among the most
sensitive datasets a consumer app can hold.

---

## 1. Open findings — fix before anyone real uses this

| #      | Severity    | Finding                                                                                                   | Phase |
| ------ | ----------- | --------------------------------------------------------------------------------------------------------- | ----- |
| **S1** | 🔴 Critical | **Firebase Realtime DB is publicly readable.** Any tree can be enumerated and read without authentication | P0    |
| **S2** | 🔴 Critical | **`encryption.ts` declares AES-256-GCM but performs XOR.** Dead code today, but it is a loaded gun        | P0    |
| **S3** | 🟠 High     | **Vasiyat content is stored plaintext**; the "lock" is a server-side `if`                                 | P2    |
| **S4** | 🟠 High     | **Firebase credentials are committed to the repo** (`src/config/firebase.ts`)                             | P0    |
| **S5** | 🟡 Medium   | **Share codes are compressed, not encrypted.** Anyone with a forwarded code reads the whole tree          | P1    |
| **S6** | 🟡 Medium   | No DPDP consent, export or erasure flow exists                                                            | P1    |
| **S7** | 🟡 Medium   | The pitch deck claims "AES-256-GCM" and "bank-level protection" — **false**                               | P0    |

---

## 2. S1 — Firebase (the urgent one)

**Verified from an unauthenticated machine:**

```
GET .../.json?shallow=true                        -> {"error":"Permission denied"}
GET .../trees.json?shallow=true                   -> {"vansh-a6w5-xax7":true}
GET .../trees/vansh-a6w5-xax7.json?shallow=true   -> {"members":true,"metadata":true,"relations":true}
```

Anyone can **enumerate every tree ID and read every family, members and
relations.** Since the app uses no Firebase Auth anywhere in the codebase,
writes into `/trees/*` must be equally open or sync could not function.

**No live harm today** — only our own test tree exists. That will stop being
true the moment a real family joins.

**Fix (Phase 0, in order):**

1. **Immediately:** set RTDB rules to `{"rules":{".read":false,".write":false}}`
2. Rotate the Firebase API key and restrict it by package name and SHA-1
3. Delete `src/config/firebase.ts` and remove `firebase` from `package.json`
4. Replace tree sync with `core/sync` against our own API
   ([ARCHITECTURE](02-ARCHITECTURE.md) section 4)
5. Delete the Firebase project once migration is verified
6. Scrub the key from git history with `git filter-repo`

---

## 3. S2 — The encryption that is not encryption

```ts
// src/services/encryption.ts
export async function encryptAES(plaintext: string, key: string) {
  const ivBytes = await Crypto.getRandomBytesAsync(16);
  const iv = bytesToBase64(ivBytes);
  // For now, use XOR as fallback since expo-crypto does not have full AES
  const ciphertext = xorEncrypt(plaintext, key + iv);
  return { ciphertext, iv, algorithm: "AES-256-GCM", version: 1 };
}
```

It returns `algorithm: 'AES-256-GCM'` while performing a repeating-key XOR,
which is trivially breakable. `encryptAES`, `decryptAES` and `hashPIN` are
**never called anywhere** — verified by grep — so nothing is currently at risk.

**It is deleted, not fixed.** The danger is that a future contributor (or a
future us) sees a function called `encryptAES` and trusts it.

**Replacement:** `react-native-quick-crypto` or `expo-crypto` with a real
AES-256-GCM implementation, keys in `expo-secure-store` (Android Keystore),
and a unit test that asserts a known plaintext and key produce a known
ciphertext. **A function that names an algorithm must implement that
algorithm.** This becomes a review rule.

---

## 4. S3 — Vasiyat

Time-locked messages are a promise: _nobody, including us, can read this until
the date arrives._ Today the content sits in plaintext in the database and the
lock is a server-side conditional. Any database access, any backup, any bug in
that conditional breaks the promise.

**Required design before Vasiyat ships:**

```
1. Author generates a random content key CK
2. Content is encrypted client-side with AES-256-GCM under CK
3. CK is encrypted to each recipient, public key
4. The server stores only: ciphertext, wrapped keys, unlock date
5. The client releases the wrapped key only after the unlock date
6. The server can NEVER decrypt. This is verifiable by reading the schema.
```

Key escrow for a deceased author is a genuinely hard problem (Shamir secret
sharing across family members is the honest answer, and it is complex).
**Until it is solved, Vasiyat stays behind a feature flag and out of the store
listing.** Shipping a broken promise about a dying person, last words is worse
than not shipping the feature.

---

## 5. Threat model

| Threat                            | Mitigation                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Stranger enumerates families      | Family IDs are UUIDv7; every query scoped by JWT; no public listing                        |
| Leaked share link                 | Tokens expire (default 7 days), are revocable, and are scoped read-only by default         |
| Estranged relative retains access | Steward can revoke membership; content access ends immediately                             |
| Stolen device                     | Optional biometric lock; tokens in Android Keystore; remote sign-out                       |
| Our server is compromised         | Photos in R2 under unguessable keys; Vasiyat opaque; minimal PII                           |
| Scraping                          | Rate limits per IP and per user; no bulk export endpoint except your own data              |
| Insider (us)                      | Production DB access logged; no PII in application logs                                    |
| Photos of children                | Uploaded only by an adult family member; never public; no face recognition sent off-device |

---

## 6. DPDP Act 2023 compliance

India, Digital Personal Data Protection Act 2023, with the DPDP Rules notified
**13 November 2025**. We are a Data Fiduciary. Penalties reach ₹250 crore.

**The critical differences from GDPR**, which catch people out:

| DPDP                                                           | Consequence for us                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| **No "legitimate interest" basis**                             | Consent or a statutory ground only. Nothing else                  |
| **A child is anyone under 18**                                 | Not 13, not 16                                                    |
| **Verifiable parental consent required for children**          | And **no behavioural tracking or targeted ads to children, ever** |
| Consent notice must be available in the 8th Schedule languages | Aligns with our language plan anyway                              |
| Breach notification to the Board and affected users            | Needs a written procedure before launch                           |

### Our posture

| Requirement                                       | Implementation                                                                           | Phase |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----- |
| Consent notice at sign-up, in the chosen language | Onboarding screen; versioned; consent recorded with timestamp                            | P1    |
| Purpose limitation                                | Enumerated in the notice; no secondary use                                               | P1    |
| **No under-18 accounts in v1**                    | Adults manage child profiles on the tree. Sidesteps verifiable parental consent entirely | P0    |
| **No behavioural advertising, ever**              | Also a product principle, not just compliance                                            | P0    |
| Right to access                                   | `GET /v1/me/export.zip` — photos, stories, profile, JSON                                 | P1    |
| Right to correction                               | Edit anything about yourself; suggest edits for others                                   | P1    |
| Right to erasure                                  | Delete account: 30-day grace, then hard delete of personal data                          | P1    |
| Grievance officer                                 | Named, with an email, in the app and the privacy policy                                  | P1    |
| Breach procedure                                  | Written runbook: detect, contain, notify Board, notify users                             | P1    |
| Data retention                                    | Deleted content purged from R2 after 30 days                                             | P1    |

### The hard question: erasure versus the family tree

When someone erases their account, what happens to the tree they built?

**Our answer:** a person, _account_ is erased — email, auth, uploads, device
tokens. Their _node in the family graph_ becomes an unclaimed member, and their
contributions are re-attributed to "a family member". Photos they uploaded are
deleted unless another member has saved them to an album, which they are told at
deletion time.

This is defensible under DPDP: the graph node about a _person_ is that person,
personal data and is erased on request, but the family, shared record of _who
is related to whom_ is not solely theirs to delete. **We surface this trade-off
in the deletion flow in plain language rather than burying it.**

---

## 7. Living-person privacy

Genealogy apps leak living people, dates of birth. We do not.

| Rule                                          | Detail                                                          |
| --------------------------------------------- | --------------------------------------------------------------- |
| Living people, DOB is never in a share export | Only month and day, and only to family members                  |
| "Don, t list me" flag                         | Any adult can hide themselves from every shared export and link |
| Contact details are never shared              | Phone and email are visible to the steward only                 |
| Deceased people get fuller records            | Where the historical value is, and no living-person risk        |
| Children are never in a public link           | Ever                                                            |

---

## 8. Application security baseline

| Control           | Implementation                                                            |
| ----------------- | ------------------------------------------------------------------------- |
| Transport         | TLS 1.3 only, HSTS, via Caddy                                             |
| Auth              | Google Sign-In; server verifies the ID token against Google, JWKS         |
| Tokens            | 15-minute access, 30-day refresh, rotating, revocable                     |
| Token storage     | `expo-secure-store`, Android Keystore-backed                              |
| Authorisation     | **`family_id` from the JWT, never from the request body**                 |
| Input validation  | Zod schema on every endpoint; reject unknown keys                         |
| SQL               | Parameterised via Drizzle. No string concatenation, ever                  |
| Rate limits       | 100 req/min per user; 10/min on auth; 20/hour on share creation           |
| Upload validation | Magic-byte sniffing, not the file extension; 25 MB cap; EXIF GPS stripped |
| Headers           | helmet, CSP on the share web view                                         |
| Secrets           | Environment only. `.env` in `.gitignore`. Never in the repo               |
| Dependencies      | `npm audit` in CI; Dependabot on                                          |
| Logging           | Never log tokens, emails, phone numbers or R2 keys                        |
| Error responses   | Generic to the client; detail to Sentry only                              |

---

## 9. The honesty rule

**S7 is a security finding.** The pitch deck claims "AES-256-GCM" and
"bank-level protection" for a product that ships XOR-in-name-only and an open
database.

> **We never claim a security property we have not implemented and tested.**

Every security claim in marketing, the store listing, or the privacy policy must
map to a line in this document and a passing test. This rule is checked as part
of the [PRODUCTION-CHECKLIST](10-PRODUCTION-CHECKLIST.md), and the deck is
corrected in Phase 0.

---

## 10. Pre-launch security gate

- [ ] Firebase project deleted; no `firebase` dependency remains
- [ ] `git log -p | grep -i "apiKey"` finds nothing
- [ ] `encryption.ts` deleted or replaced with a tested implementation
- [ ] Every endpoint scopes by `family_id` from the JWT — verified by test
- [ ] A user in family A cannot read family B — automated test
- [ ] Share tokens expire and can be revoked — automated test
- [ ] `npm audit` reports no high or critical issues
- [ ] Consent notice ships in en, hi and te
- [ ] Data export returns a complete, readable archive
- [ ] Account deletion removes personal data within 30 days — manually verified
- [ ] Privacy policy published, with a named grievance officer
- [ ] Breach runbook written
- [ ] Every marketing security claim maps to a passing test
