# Account Onboarding — Welcome Dialog State

Step 1 of Section 4.2 (`PLAN.md`).

## Purpose

Tracks whether an authenticated user is eligible for the one-time welcome dialog after registration, and persists their decision (`complete` or `skip`).

## Key Principles

1. **Separation from Email Consent:**
   - Onboarding state is owned by `auth` (`public.account_onboarding`).
   - Email reminder consent is owned by `reminders` (`public.wishlist_email_preferences`).
   - A user who clicks "Continue" without ticking the reminder checkbox completes onboarding, but creates **zero** consent records.

2. **Grandfathering Legacy Accounts:**
   - Existing accounts registered before this rollout boundary are populated with `is_eligible = false, skipped_at = now()`.
   - Never infer eligibility from a missing row; missing rows fail closed (`evaluateOnboardingPrompt` returns `{ shouldPrompt: false, reason: 'unknown' }`).

3. **Rollout Versioning:**
   - Uses `rollout_version = 'welcome-v1'`.
   - Version mismatch prevents unintended re-prompting.

4. **Security & Ownership:**
   - RLS enabled; tables revoked from public and anon.
   - Access mediated via `read_account_onboarding` and `record_onboarding_decision` RPCs.
   - Enforces `auth.uid() = user_id`. No cross-account reading or mutation.
   - Uses per-account transactional advisory lock (`pg_advisory_xact_lock`).

## Files in this Directory

- `schema.sql`: DDL for table, grandfathering seed, RLS policies, and RPC functions.
- `role-tests.sql`: Role assertions running in a transaction with `ROLLBACK;`.
