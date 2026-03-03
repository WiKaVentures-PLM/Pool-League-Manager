# Pool League Manager V2 — Comprehensive Audit Report

**Date:** 2026-03-02
**Scope:** Security, Functionality, and Bug audit of the entire V2 codebase
**Stack:** Next.js 14 + Supabase + Stripe + Twilio + Claude Vision API

---

## Executive Summary

| Severity | Count | Key Themes |
|----------|-------|------------|
| **CRITICAL** | 7 | Tenant isolation is non-deterministic, RPC functions missing auth checks, missing INSERT policies |
| **HIGH** | 13 | Missing admin role checks on settings/standings, OCR route unprotected, Twilio webhook verification optional, schedule data injection, multi-org `.single()` breakage |
| **MEDIUM** | 24 | Over-permissive captain policies, missing indexes, trial tier never expires, race conditions, CORS issues |
| **LOW** | 29 | Data model inconsistencies, accessibility gaps, timezone bugs, missing timestamps |
| **INFO** | 22 | Positive findings confirming good practices |

---

## CRITICAL Findings (Fix Immediately)

### C1. `auth_org_id()` returns an arbitrary org for multi-org users
**File:** `supabase/migrations/00001_create_helper_functions.sql:14-22`

`LIMIT 1` without `ORDER BY` means multi-org users get a non-deterministic org. Every RLS policy that uses `auth_org_id()` inherits this flaw. `auth_org_role()` has the same issue — a user who is admin in Org A and player in Org B could get admin role applied to Org B's queries.

**Impact:** Cross-tenant data leakage and privilege escalation.

**Fix:** Replace with a session-based org selection mechanism (pass `org_id` as parameter, store in JWT claim, or use a `current_org_id` column on `profiles`).

### C2. `create_org_with_admin` accepts any `p_auth_user_id` — no verification
**File:** `supabase/migrations/00004_create_rpc_functions.sql:5-62`

SECURITY DEFINER function never verifies `auth.uid() = p_auth_user_id`. Any authenticated user can create orgs under other users' auth IDs.

**Fix:** Add `IF p_auth_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;`

### C3. `add_org_member` — any authenticated user can add members to any org
**File:** `supabase/migrations/00004_create_rpc_functions.sql:68-115`

SECURITY DEFINER accepts any `p_org_id` and `p_role` including `'admin'` with zero authorization. Any authenticated user can grant themselves admin access to any organization.

**Fix:** Add check that calling user is admin of the target org.

### C4–C6. Missing INSERT policies on `profiles`, `organizations`, `league_settings`
**Files:** `supabase/migrations/00003_create_rls_policies.sql`

No INSERT policies exist. Only SECURITY DEFINER functions can insert, but those functions (C2, C3) have no auth checks. If any row is accidentally deleted, no one can re-create it through RLS.

---

## HIGH Findings

### H1. `replace_schedule` trusts JSON payload for org_id/season_id
**File:** `supabase/migrations/00008_schedule_team_id_to_uuid.sql:145-187`

INSERT reads `org_id` from the JSON payload instead of using the verified `p_org_id` parameter. A malicious admin could inject schedule entries into another org.

**Fix:** Force `p_org_id` and `p_season_id` in the INSERT instead of `r->>'org_id'`.

### H2. Schedule FK constraints break bye weeks
**File:** `supabase/migrations/00008_schedule_team_id_to_uuid.sql:17-18`

Both `home_team_id` and `away_team_id` are `NOT NULL` with FK constraints to `teams(id)`. Bye weeks (where one team has no opponent) cannot be represented without a dummy "BYE" team record.

### H3. Twilio signature verification skipped when env var missing
**File:** `supabase/functions/twilio-webhook/index.ts:91-104`

If `TWILIO_AUTH_TOKEN` is not set, anyone can POST arbitrary data to the webhook endpoint, triggering fake score submissions and burning Anthropic API credits.

**Fix:** Return 500 error if auth token is not configured.

### H4. Settings actions missing admin role check
**File:** `src/app/(app)/settings/actions.ts`

All settings actions use `getOrgId()` which only checks membership, NOT role. Any player/captain can modify `matches_per_night`, `best_of`, `bye_points`, create/delete venues, create/archive seasons.

**Fix:** Replace `getOrgId()` with `getAdminOrgId()` pattern from `schedule/actions.ts`.

### H5. Standings adjustments missing admin role check
**File:** `src/app/(app)/standings/actions.ts`

`addStandingsAdjustment` and `deleteStandingsAdjustment` use `getOrgId()` — any org member can manipulate standings adjustments.

### H6. OCR route missing tenant isolation, role check, and billing gate
**File:** `src/app/api/ocr/route.ts`

Only checks `auth.getUser()`. No org membership verification, no subscription tier check (`hasOcrScanning`), no rate limiting. Any authenticated user can consume Anthropic API credits.

### H7. OCR route has no rate limiting
**File:** `src/app/api/ocr/route.ts`

Each call invokes Claude Vision API (paid). An authenticated user could repeatedly call this endpoint to run up API costs.

### H8. `.single()` membership query breaks for multi-org users
**Files:** All server action files

Every auth helper uses `.single()` on memberships. If a user belongs to multiple orgs, `.single()` returns an error. User gets generic "Not authenticated" for all their orgs.

### H9. Schedule save fallback has data loss risk
**File:** `src/app/(app)/schedule/actions.ts:63-80`

Fallback path does DELETE then batched INSERT without transaction. If any batch fails, old schedule is lost and new schedule is partial.

### H10. Checkout webhook silently swallows missing orgId
**File:** `supabase/functions/stripe-webhook/index.ts:49-52`

If `session.metadata?.org_id` is undefined, the handler is silently skipped. Org has active Stripe subscription but database never updated.

### H11. No role-based middleware enforcement
**File:** `src/lib/supabase/middleware.ts`

Middleware only checks user existence. Admin-only pages (`/admin`, `/settings`) are guarded only in client React — brief flash of admin content visible to non-admins.

### H12. Client-side subscription gates are bypassable
**File:** `src/lib/subscription/use-features.ts`

Feature gating reads from client state. DevTools can change `subscription_tier` to unlock all features. Combined with H6 (OCR route has no server-side tier check), this is exploitable.

### H13. Settings page setState during render
**File:** `src/app/(app)/settings/page.tsx:31-35`

Calling `setPlayDays` and `setInitialized` during render phase causes double-renders and race conditions. Should use `useEffect`.

---

## MEDIUM Findings

### M1. `submit_scores` DELETE doesn't filter by org_id
`DELETE FROM submissions WHERE schedule_id = p_schedule_id` — should scope by `org_id`.

### M2. `subscription_status` CHECK constraint added twice (migration conflict risk)
Migrations 00002 and 00006 both define the CHECK. Could fail on fresh deploy.

### M3–M5. Missing indexes on `submissions(org_id)`, `matches(org_id)`, adjustment tables
Every RLS policy check scans without index.

### M6. `teams.captain_profile_id` — no ON DELETE behavior
Deleting a profile causes FK violation instead of SET NULL.

### M7–M8. Captains can edit ANY team/player in the org (not just their own)
RLS policies check `role IN ('admin', 'captain')` but don't verify team ownership.

### M9. `matchups` JSONB has no schema validation
Malformed JSONB could cause auto-approval comparison to silently produce wrong results.

### M10. Audit log allows spoofed org_id/profile_id
INSERT policy only checks `auth.uid() IS NOT NULL` — no validation of the actual content.

### M11. SMS score processing missing org_id filter on some queries
Admin page queries SMS records by `id` without `org_id`.

### M12. OCR route parses untrusted JSON without try-catch
`JSON.parse(formData.get('homeRoster'))` can throw, causing unhandled 500.

### M13. Standings calculation doesn't handle tied matches
If `homeScore === awayScore`, neither team gets a win or loss.

### M14. Position nights use pre-season ordering, not current standings
Schedule generated once — position nights are meaningless since they use initial team order.

### M15. Score validation doesn't enforce integer types
`home_wins: 2.0` would pass validation. Should check for non-negative integers.

### M16. Trial tier has no server-side expiration enforcement
`trial_ends_at` is never checked server-side. A trial org retains full access forever.

### M17. `past_due_since` race condition between webhook handlers
`subscription.updated` overwrites `past_due_since` without checking existing value.

### M18. Checkout webhook doesn't check Supabase update result
If the org update fails, webhook returns 200 to Stripe, subscription never recorded.

### M19. Multiple active seasons edge case
Twilio webhook's `.single()` query fails if org has multiple active seasons.

### M20. Anthropic model version hardcoded in Twilio webhook
`claude-sonnet-4-5-20250929` will break when deprecated.

### M21. Missing `Access-Control-Allow-Methods` header in CORS
Browsers may reject preflight requests for non-simple methods.

### M22. `origin` header used for Stripe redirect URLs
Forged Origin header could redirect after checkout if Stripe dashboard isn't locked down.

### M23. Memory leak in ScoresheetScanner
`URL.createObjectURL()` called but never `revokeObjectURL()`.

### M24. Sidebar links to `/history` — page doesn't exist
404 when clicked.

---

## LOW Findings (29 items)

- Slug collision uses epoch seconds (could still collide)
- `schedule.venue` is text, not FK to `venues` table
- `players.profile_id` is nullable — disconnected player records
- Missing `updated_at` trigger on most tables
- No UNIQUE constraint on `(org_id, name)` for seasons
- CORS `ALLOWED_ORIGINS` doesn't trim whitespace
- Stripe price IDs hardcoded in Edge Function
- Service role client widely accessible via named export
- Minimal password requirements (8 chars, no complexity)
- Auth confirm route doesn't validate `type` parameter
- TwiML response not XML-escaped (breaks for special chars in names)
- No timeout on Claude Vision API call
- Static CORS headers used instead of dynamic (multi-origin broken)
- `getCorsHeaders()` defined but never used (dead code)
- Non-null assertions on env vars in shared supabase client
- No prevention of duplicate active Stripe subscriptions
- Unknown price ID falls back to `'basic'` silently
- Subscription deleted resets to `trial` tier (more features than basic)
- Raw phone stored instead of normalized
- Round-robin creates Map per match (performance)
- 2-team leagues produce very short schedules
- Email notifications fire-and-forget with no retry
- OCR response matchup count not validated
- Venue conflict resolution only handles 2-way conflicts
- Login error from URL param enables phishing text injection
- Mobile nav missing Dashboard, Players, History, Admin links
- Season dates not validated for logical consistency (start < end)
- Timezone-sensitive date rendering (could show wrong day)
- `window.confirm()` for destructive actions (not accessible)
- Icon buttons lack `aria-label` attributes
- `maximumScale: 1` in viewport prevents zoom (accessibility)
- `useEffect` dependency warnings suppressed across all pages
- No read-only UI feedback for past-due orgs on admin page
- nodemailer transporter created at module level

---

## Positive Findings (INFO)

- All RPC functions use SECURITY DEFINER with `SET search_path = public` correctly
- RLS enabled on all 15 tables
- No SQL injection risks (all parameterized)
- Foreign key cascades are generally appropriate
- Migration 00007 properly addressed original audit issues
- Stripe webhook verifies signatures correctly
- `matches` has UNIQUE index on `schedule_id`
- CSRF protection via Next.js Server Actions defaults
- No API keys exposed to client
- TypeScript strict mode enabled
- PWA manifest properly configured
- Server actions have proper auth and write-access checks (teams/actions.ts is good pattern)
- OCR pipeline is well-structured
- Auth flow is structurally sound
- Org isolation correctly enforced in frontend queries

---

## Recommended Fix Priority

### Tier 1 — Fix Before Launch (CRITICAL + HIGH Security)
1. **C1:** Replace `auth_org_id()` / `auth_org_role()` with deterministic org selection
2. **C2 + C3:** Add auth checks to `create_org_with_admin` and `add_org_member`
3. **H3:** Make Twilio signature verification mandatory
4. **H4 + H5:** Add admin role checks to settings + standings actions
5. **H6 + H7:** Add org/role/billing checks + rate limiting to OCR route
6. **H1:** Force `p_org_id` in `replace_schedule` INSERT

### Tier 2 — Fix Before Production Scale
7. **H8:** Handle multi-org memberships or add database constraint
8. **H9:** Remove schedule save fallback or wrap in transaction
9. **H10:** Add logging/error handling for missing orgId in Stripe webhook
10. **M16:** Add server-side trial expiration enforcement
11. **M7-M8:** Scope captain RLS policies to their own teams

### Tier 3 — Fix When Convenient
12. **H11:** Add role-based middleware for admin routes
13. **M3-M5:** Add missing indexes for RLS performance
14. **M9:** Add JSONB schema validation for matchups
15. **M23:** Fix memory leak in ScoresheetScanner
16. Remaining MEDIUM and LOW items
