# Browser QA Findings - 2026-04-08

Environment:
- App URL: `http://127.0.0.1:3001`
- Mode: production build (`next start`)
- Scope: mercenary pivot follow-up QA after `20260408_0004_mercenary_sport_pivot.sql`

## Bug 1. Kakao place picker blocks open spot creation

Severity: High

Route:
- `/create`

Repro:
1. Open `/create`.
2. Tap `카카오 지도에서 경기장 찾기`.
3. Wait for the place picker modal to load.

Expected:
- Kakao map and search results load so the host can select a venue in Suwon.

Actual:
- The modal opens, but shows `카카오 지도를 불러오지 못했습니다.`
- Venue selection is blocked, so the host cannot complete the open spot creation flow.

Evidence:
- Screenshot: `.gstack/qa-reports/screenshots/qa-kakao-map-failed.png`

Notes:
- `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` is present in `.env.local`, so this is not a simple missing-env case.
- The issue is likely in Kakao script loading or client initialization.

## Bug 2. Profile save fails and does not persist values

Severity: High

Route:
- `/profile`

Repro:
1. Open `/profile`.
2. Enter any nickname.
3. Tap `저장하기`.
4. Reload the page.

Expected:
- The profile saves successfully and the nickname remains after reload.

Actual:
- No success state is shown.
- Reload resets the nickname field to empty.
- Browser console shows `TypeError: Failed to fetch` during anonymous sign-in.

Evidence:
- Screenshot before save: `.gstack/qa-reports/screenshots/qa-profile-before-save.png`
- Screenshot after save attempt: `.gstack/qa-reports/screenshots/qa-profile-after-save.png`
- Console signal: `signInAnonymously` -> `TypeError: Failed to fetch`

Notes:
- This looks like an auth/session bootstrap failure before the save action completes.
- The profile UI renders correctly, but persistence is blocked.

## QA Snapshot

Verified working after migration:
- Landing and onboarding render
- Home renders after `sport_type` migration
- Home sport toggle updates the URL and empty state copy
- Activity screen renders
- Profile screen renders

Primary next steps:
1. Fix Kakao map loader/init path in `KakaoPlacePicker`.
2. Fix anonymous session bootstrap used by profile save.
3. Re-run browser QA on `/create -> /home -> /match -> /activity`.
