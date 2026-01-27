# Software Requirements Specification (SRS)
## Vansh (वंश) — Family Heritage Preservation App

**Document ID:** VANSH-SRS

**Version:** 1.0

**Date:** 2026-01-09

**Status:** Draft (based on current repository implementation)

---

## 0. Document Control

### 0.1 Intended audience
- Product/Project stakeholders
- Mobile (Expo/React Native) engineers
- Backend (Node.js/Express) engineers
- QA/Test engineers
- UX/Design reviewers

### 0.2 Revision history
- v1.0 (2026-01-09): Initial SRS created from current codebase and schema.

### 0.3 References
- Project overview and feature list: [README.md](README.md)
- Backend SQL schema: [backend/sql/schema.sql](backend/sql/schema.sql)
- Backend routes: [backend/src/routes](backend/src/routes)
- Frontend API client: [src/services/api.ts](src/services/api.ts)
- Frontend API types: [src/types/api.ts](src/types/api.ts)

### 0.4 Definitions, acronyms, and abbreviations
- **Vansh:** The application (mobile client + backend) for preserving family heritage.
- **Family:** A logical tenant/group of members.
- **Member:** A person in a family tree.
- **User:** An authenticated account associated (optionally) to a member.
- **Smriti (Memories):** Media items (photo/video/audio/document) stored for the family.
- **Katha (Stories):** Voice recordings and associated metadata/transcripts.
- **Vriksha (Family Tree):** Relationship graph between members.
- **Parampara (Traditions):** Traditions/recipes/ritual documentation.
- **Vasiyat (Wisdom Vault):** Time-locked messages to recipients.
- **Time River:** Chronological feed view of heritage content.
- **API:** HTTP/JSON backend interface.
- **JWT:** JSON Web Token used for authentication.

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional and non-functional requirements for the Vansh application. It covers the system’s behavior as delivered by:
- a cross-platform mobile client (Expo/React Native)
- a Node.js/Express backend API
- a MySQL database
- local file storage for uploaded media (server-side `uploads/`)

### 1.2 Scope
Vansh enables families to:
- create and manage a family space and member records
- build and browse a family tree (relationships)
- upload, browse, tag, and organize family memories
- record and manage voice stories (kathas), optionally linked to memories
- create and unlock time-locked messages (vasiyats)
- document traditions/recipes (parampara)
- view a chronological “Time River” feed

AI-assisted capabilities exist for:
- memory analysis (image analysis + tag suggestions)
- katha transcription placeholders and summarization (implementation-dependent)

### 1.3 Product perspective
Vansh is a client-server system:
- **Mobile client:** Expo Router screens under `app/` and feature modules under `src/features/`.
- **Backend:** Express server under `backend/src/` exposing `/api/*` routes.
- **Database:** MySQL schema in `backend/sql/schema.sql`.
- **Storage:** File uploads saved to `backend/uploads/` and served statically via `/uploads/*`.

### 1.4 Product functions (summary)
- Authentication: register, login, refresh token, logout, user profile
- Family: view/update family profile and settings, family stats
- Members: CRUD, avatar upload, relationships, ancestry queries, full tree
- Memories: upload, CRUD, tagging, member tagging, favorites, time-river, AI analyze
- Katha: upload audio, CRUD, transcription endpoint, link to memory, favorites, play tracking
- Vasiyat: CRUD, recipients management, unlock & request-unlock, pending unlock checks, view tracking
- Traditions: CRUD under family routes

### 1.5 User classes and characteristics
- **Admin:** Full access, can manage family settings, delete members/traditions (per backend role checks).
- **Elder:** Elevated permissions for certain family/admin operations.
- **Member:** Standard authenticated family user.
- **Viewer:** Read-only or limited contributor (implementation-defined; enforced in backend where present).

### 1.6 Operating environment
- Mobile: iOS/Android/Web (Expo)
- Backend: Node.js 18+ (TypeScript)
- DB: MySQL 8.0+
- Network: HTTPS recommended (HTTP supported in local dev)

### 1.7 Constraints
- Backend stores media on local disk; horizontal scaling requires shared storage (or an object store).
- Authentication uses JWT; token lifecycle must be respected by the client.
- Data privacy is sensitive (family content); access control must be strict.

### 1.8 Assumptions and dependencies
- Users belong to exactly one family (tenant) via `family_id`.
- Backend is reachable from device (LAN, tunnel, or hosted URL).
- AI features depend on `GEMINI_API_KEY`; without it, AI responses may be placeholders.

---

## 2. Overall Description

### 2.1 System context
- The mobile client calls the backend API over HTTP(S).
- The backend reads/writes MySQL for structured data.
- The backend writes media files to disk and serves them via `/uploads`.

### 2.2 High-level workflows
- **Onboarding:** Register → create family + root member → login.
- **Daily use:** Login → view Time River → navigate to Smriti/Katha/Vriksha/Parampara/Vasiyat.
- **Content creation:** Upload memory / record katha / create tradition / create vasiyat.
- **Consumption:** View media and details; unlock and view vasiyats if conditions satisfied.

### 2.3 Data model (conceptual)
Key entities (per database schema):
- Family, Member, User, UserSession
- Relationship, MemberClosure
- Memory, MemoryTag, MemoryMember
- Katha, KathaListener
- Vasiyat, VasiyatRecipient, VasiyatTrustee
- Tradition, TraditionStep, TraditionParticipant
- EchoConversation (AI conversation persistence)

---

## 3. Specific Requirements (Functional)

> Requirement IDs follow `FR-###`. “Shall” indicates a mandatory requirement.

### 3.1 Authentication & Authorization
- **FR-001** The system shall allow a new user to register using email or phone plus a password.
- **FR-002** The system shall create a new family and a linked member record during registration (admin role by default).
- **FR-003** The system shall allow users to log in using email + password.
- **FR-004** The system shall issue an access token (JWT) and refresh token on successful login.
- **FR-005** The system shall allow refresh-token based session renewal.
- **FR-006** The system shall restrict protected endpoints to authenticated users.
- **FR-007** The system shall enforce role-based permissions for privileged actions (e.g., deleting members, updating family settings).

**Acceptance criteria**
- Login returns tokens and user profile data.
- Accessing a protected endpoint without token returns 401.

### 3.2 Family Management
- **FR-020** The system shall provide an endpoint to fetch the authenticated user’s family profile.
- **FR-021** The system shall allow admins/elders to update family profile and settings.
- **FR-022** The system shall provide family statistics (counts/summary; implementation-defined).
- **FR-023** The system shall allow admins to delete a family (destructive).

### 3.3 Member Management (Vriksha)
- **FR-040** The system shall allow listing family members.
- **FR-041** The system shall allow creating a member record.
- **FR-042** The system shall allow updating member attributes (bio, dates, places, etc.).
- **FR-043** The system shall allow admins/elders to delete a member.
- **FR-044** The system shall support member avatar upload.
- **FR-045** The system shall allow adding and removing relationships between members.
- **FR-046** The system shall provide ancestry queries (ancestors/descendants) for a member.
- **FR-047** The system shall provide a full family tree dataset suitable for visualization.

### 3.4 Memories (Smriti)
- **FR-060** The system shall allow uploading a memory (photo/video/audio/document) with metadata.
- **FR-061** The system shall store the uploaded file and persist memory metadata in the database.
- **FR-062** The system shall allow listing and retrieving memory details.
- **FR-063** The system shall allow updating and deleting memories.
- **FR-064** The system shall support adding/removing text tags for a memory.
- **FR-065** The system shall support tagging members in a memory.
- **FR-066** The system shall support toggling a memory as favorite.
- **FR-067** The system shall provide a Time River view endpoint returning chronological feed items.
- **FR-068** The system shall provide AI analysis for a memory (image analysis/tag suggestions) when enabled.

### 3.5 Katha (Voice Stories)
- **FR-080** The system shall allow uploading audio to create a katha with metadata.
- **FR-081** The system shall allow listing, retrieving, updating, and deleting kathas.
- **FR-082** The system shall provide an endpoint to transcribe a katha (may be placeholder depending on AI capability).
- **FR-083** The system shall allow linking a katha to one or more memories.
- **FR-084** The system shall support toggling a katha as favorite.
- **FR-085** The system shall record play events (play count tracking).

### 3.6 Vasiyat (Wisdom Vault)
- **FR-100** The system shall allow creating a vasiyat with content, mood, trigger type, and recipients.
- **FR-101** The system shall allow listing vasiyats relevant to a member (created and/or received).
- **FR-102** The system shall allow updating and deleting a vasiyat (subject to permissions).
- **FR-103** The system shall allow managing vasiyat recipients.
- **FR-104** The system shall allow authorized users (creator/approver/admin) to unlock a vasiyat.
- **FR-105** The system shall allow recipients to request unlock.
- **FR-106** The system shall provide an endpoint to check for vasiyats eligible for unlocking (date-based).
- **FR-107** The system shall record view events for a vasiyat.

**Note:** The mobile UI includes a sealed/unsealed viewer state with an “unlock attempt” flow.

### 3.7 Parampara (Traditions)
- **FR-120** The system shall allow listing traditions for a family.
- **FR-121** The system shall allow creating a tradition with category, frequency, story, and optional recipe details.
- **FR-122** The system shall allow updating a tradition.
- **FR-123** The system shall allow admins/elders to delete a tradition.

### 3.8 Digital Echo (AI Persona) — Planned/Partial
- The database includes `echo_conversations` and the AI service contains echo-generation logic.
- The frontend API client defines `/echo/*` requests.

- **FR-140** The system shall support generating an “echo” response using an approved member’s content, with an explicit disclaimer.
- **FR-141** The system shall store echo conversations for continuity.

**Implementation note (current repo):** Backend routes for `/api/echo/*` are not currently mounted in `backend/src/index.ts`. Treat FR-140/141 as a future increment unless you add the routes.

---

## 4. External Interface Requirements

### 4.1 User interfaces (mobile)
- The system shall provide a tab-based navigation experience with primary sections:
  - Time River (Home)
  - Smriti (Memories)
  - Katha (Stories)
  - Vriksha (Family Tree)
  - Parampara (Traditions)
  - Vasiyat (Wisdom Vault)
  - Settings/Explore

### 4.2 API interfaces (backend)
Base URL (dev): `http://localhost:3000/api`

Implemented route groups (per backend `routes/`):
- `/auth/*`
- `/families/*`
- `/members/*`
- `/memories/*`
- `/kathas/*`
- `/vasiyats/*`

### 4.3 File/media interfaces
- The backend shall accept multipart uploads for:
  - memory files
  - katha audio
  - member avatars
  - multiple files for vasiyat/traditions documents where applicable
- The backend shall serve uploaded files from `/uploads/*`.

### 4.4 Communications interfaces
- Client ↔ Server: JSON over HTTP(S)
- Auth header: `Authorization: Bearer <token>`

---

## 5. Non-Functional Requirements

### 5.1 Security & privacy
- **NFR-001** All protected endpoints shall require authentication.
- **NFR-002** The system shall enforce family-level multi-tenancy: users can only access records within their family.
- **NFR-003** Passwords shall be stored as salted hashes (bcrypt).
- **NFR-004** Tokens shall expire and be refreshable via refresh tokens.
- **NFR-005** Upload endpoints shall validate file types and file size limits.
- **NFR-006** Sensitive logs (tokens/passwords) shall not be logged.

### 5.2 Reliability & availability
- **NFR-020** The backend shall return consistent error responses (with error codes) for invalid requests.
- **NFR-021** The system shall avoid partial writes for multi-step operations (e.g., registration) by using transactions.

### 5.3 Performance
- **NFR-030** List endpoints should support pagination where appropriate.
- **NFR-031** Time River endpoint should return results in chronological order and be performant for typical family sizes.

### 5.4 Usability
- **NFR-040** Core navigation shall be discoverable via tabs.
- **NFR-041** Locked vasiyat content shall remain hidden until unlock conditions are met.

### 5.5 Maintainability
- **NFR-050** The codebase shall use TypeScript for type safety (frontend and backend).
- **NFR-051** API request/response types shall be kept consistent across frontend and backend.

### 5.6 Portability
- **NFR-060** Mobile client shall run on iOS and Android using Expo.

---

## 6. Data Requirements

### 6.1 Persistence
- Primary storage: MySQL.
- Media storage: server file system under an `uploads/` directory.

### 6.2 Data retention and deletion
- Deleting a family shall cascade-delete related records (per foreign keys).
- Deleting a member may cascade-delete associated content depending on schema constraints.

### 6.3 Backups (recommended)
- Daily database backups in production.
- Separate backups for uploaded media.

---

## 7. Appendix A — Endpoint Summary (Implemented)

> This is a summary at SRS level; refer to backend route files for exact request/response shapes.

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/change-password`
- **Families**: `/api/families` (get/create), `/api/families/:familyId` (update/delete), `.../settings`, `.../stats`, `.../traditions`
- **Members**: `/api/members` (list/create), `/api/members/:memberId` (get/update/delete), `.../avatar`, `.../relationships`, `.../ancestors`, `.../descendants`, `/api/members/tree/full`
- **Memories**: `/api/memories` (list/upload), `/api/memories/:memoryId` (get/update/delete), tagging, favorites, `/api/memories/timeline/river`, `/api/memories/:memoryId/analyze`
- **Kathas**: `/api/kathas` (list/create), `/api/kathas/:kathaId` (get/update/delete), `.../transcribe`, `.../link-memory`, `.../favorite`, `.../play`
- **Vasiyats**: `/api/vasiyats` (list/create), `/api/vasiyats/:vasiyatId` (get/update/delete), recipients, `.../unlock`, `.../request-unlock`, `/api/vasiyats/check/pending`, `.../view`

---

## 8. Appendix B — Open Items / Known Gaps

- **Digital Echo routes:** Frontend types/client include `/echo/*`, and backend has AI logic + DB table, but backend router is not currently exposed in server index.
- **API type alignment:** Frontend API type definitions (e.g., login request) should be checked for parity with backend auth implementation.

---

## 9. Appendix C — Roles Matrix (High-Level)

- **Admin:** Manage family settings; delete members/traditions; full CRUD.
- **Elder:** Similar to admin for some operations (where enabled).
- **Member:** Create/view content; limited destructive actions.
- **Viewer:** View-only (enforcement depends on endpoint-specific checks).
