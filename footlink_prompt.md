4. 바이브코딩용 구현 프롬프트

아래 프롬프트는 Next.js App Router + Tailwind CSS + shadcn/ui + Supabase + Vercel 전제를 깔고 있다. 이 조합은 각각 공식 문서에서 설치 및 사용 경로가 안내되어 있다.

4.1 마스터 프롬프트
You are a senior product engineer and product designer.

Build a mobile-first web MVP for a Korean futsal matching service called "풋링크".

Goal:
Users in Seoul/Gyeonggi should be able to open the app, choose whether they are 1 person, 2-4 people, or a full team, and immediately see nearby futsal opportunities that match their situation. They should then contact the organizer or send a join request with minimal friction.

Core product constraints:
- Futsal only
- Seoul/Gyeonggi only
- Mobile-first web app
- UI/UX polish matters more than feature breadth
- No payment
- No in-app chat
- No map-first UX
- No league/stats system
- Keep it lightweight and clean

Tech stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Deploy-ready for Vercel

Product principles:
- The first screen is NOT signup. It is a context selection screen.
- The user chooses: 1명 / 2~4명 / 팀
- If 2~4명 is selected, ask for exact group size: 2 / 3 / 4
- Then request geolocation or fallback to manual Seoul/Gyeonggi region selection
- Show a list-first feed immediately
- Cards must emphasize status before time
- Example status copy:
  - "지금 2명 부족"
  - "45분 뒤 시작"
  - "팀매치 구함"
- Primary actions:
  - 참가 요청
  - 오픈채팅 바로가기
- Keep visual design modern, calm, and premium, not noisy sports-themed

Pages/routes:
- /               -> entry selection
- /home           -> filtered feed
- /match/[id]     -> match detail
- /create         -> create listing
- /activity       -> my requests and my listings
- /profile        -> simple profile

Required screens:

1) Entry screen
- Headline: "지금 몇 명이서 뛸 건가요?"
- Three large cards:
  - 1명 / 개인 참가, 용병
  - 2~4명 / 친구랑 같이 합류
  - 팀 / 상대 팀 찾기
- If 2~4명 is tapped, show a bottom sheet for 2 / 3 / 4

2) Location sheet
- Ask for geolocation
- Fallback button: "서울/경기에서 직접 선택"
- Manual region select should be simple chip-based UI

3) Home feed
- Sticky top row with region selector and mode selector
- Small optional filter chips: 지금 / 오늘 저녁 / 가까운 순
- List cards with:
  - status badge
  - location + distance
  - start time
  - fee
  - needed count
  - CTA buttons
- Floating CTA button: "지금 한겜 만들기"

4) Match detail
- Condensed match summary at the top
- organizer note
- skill level
- fee
- primary sticky CTA at bottom
- only essential info

5) Create listing
- listing type: 용병 구함 / 부분 합류 / 팀매치
- required fields only:
  - needed count
  - time
  - region
  - fee
  - level
  - contact type
  - short note
- optional live preview card is a plus

6) Activity page
- segmented tabs:
  - 내 요청
  - 내 모집글
- status chips:
  - 대기중 / 수락 / 거절 / 마감

7) Profile page
- nickname
- position
- skill level
- preferred regions
- open chat link optional

Data model:
profiles:
- id
- nickname
- role
- preferred_mode
- preferred_regions
- skill_level
- position

matches:
- id
- creator_id
- mode
- listing_type
- title
- region
- address
- lat
- lng
- start_at
- fee
- needed_count
- min_group_size
- max_group_size
- skill_level
- contact_type
- contact_value
- note
- status

match_requests:
- id
- match_id
- requester_id
- requested_count
- message
- status

Feed logic:
- mode=solo -> only mercenary / individual / partial join compatible listings
- mode=small_group -> only listings that can accept the selected group size
- mode=team -> only team_match
- Sort priority:
  1. mode fit
  2. starts soon
  3. distance
  4. urgency (few spots left)

Design direction:
- Premium mobile lifestyle app
- Strong spacing
- Rounded cards
- Clear hierarchy
- Minimal visual clutter
- Main accent: deep green or blue-green
- Dark neutral text
- Soft shadows
- Korean-first copy
- One-hand usage
- Bottom safe-area aware sticky buttons

Implementation approach:
- First build with local mock data
- Then structure for Supabase integration
- Use reusable components
- Avoid overengineering
- Keep code readable and production-oriented

Deliverables:
1. project structure
2. routes and pages
3. reusable UI components
4. mock data
5. home feed logic
6. polished mobile UI
7. comments only where useful

Output:
- Start by generating the full file/folder plan
- Then implement page by page
- Then implement mock data and feed logic
- Then prepare Supabase integration points
4.2 화면 UI만 먼저 뽑는 프롬프트
Build only the UI layer first for the "풋링크" MVP.

Requirements:
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- Mobile-first
- Korean UI copy
- No backend yet
- Use realistic mock data

Create these pages:
- /
- /home
- /match/[id]
- /create
- /activity
- /profile

Focus on:
- polished visual hierarchy
- premium card design
- strong spacing and touch-friendly layout
- bottom sticky CTA bars
- chips, badges, segmented controls, sheets
- realistic empty states
- skeleton states for loading

Important:
- Entry screen should ask "지금 몇 명이서 뛸 건가요?"
- Support 1명 / 2~4명 / 팀
- If 2~4명 is selected, show a bottom sheet to choose 2, 3, or 4
- Home feed must look immediately useful and alive
- Cards should prioritize:
  1. status
  2. distance/region
  3. time
  4. fee
  5. CTA

Do not add:
- maps
- payment
- chat
- statistics
- auth

Return complete page code and reusable components.
4.3 Supabase 연동 프롬프트

Supabase는 공식 문서에서 Postgres DB, Auth, Realtime, Storage, Edge Functions를 제공하는 플랫폼으로 소개하고 있다. 이 MVP에서는 그중 DB 중심으로만 얇게 쓰면 충분하다.

Now integrate Supabase into the 풋링크 MVP.

Scope:
- Use Supabase for database reads/writes only
- Keep auth minimal
- Guest browsing is allowed
- Require lightweight identity only when creating a listing or sending a request

Create:
1. SQL schema for:
   - profiles
   - matches
   - match_requests

2. Seed data for Seoul/Gyeonggi futsal listings

3. Queries for:
   - filtered home feed
   - match detail
   - create listing
   - send join request
   - fetch my activity

Business rules:
- mode=solo -> mercenary / partial join compatible only
- mode=small_group -> max_group_size must be >= selected group size
- mode=team -> team_match only
- only open/upcoming matches appear in feed
- order by fit, start time soonness, and proximity if location exists

Implementation notes:
- Keep server-side fetching simple
- Organize Supabase access cleanly
- Separate query helpers from UI
- Add TypeScript types
- Do not overbuild auth or permissions yet
- Keep the app MVP-friendly and easy to refactor later

Return:
- SQL schema
- seed script
- query helpers
- page integration code
4.4 품질 마감 프롬프트
Polish the 풋링크 MVP for real user testing.

Focus areas:
1. Mobile UX polish
2. Better spacing and alignment
3. Clear visual states
4. Strong CTA hierarchy
5. Empty states and edge cases
6. Sticky bottom actions
7. Fast perceived performance

Please improve:
- entry selection cards
- region/mode selectors
- match cards
- detail summary block
- create form usability
- activity status design

Add:
- loading skeletons
- empty states
- disabled states
- simple success toasts
- subtle transitions
- safe-area padding for bottom CTA bars

Do not add new product scope.
Do not add map, chat, payment, or analytics dashboards.
Keep the app clean, credible, and test-ready.
4.5 QA 체크 프롬프트
Act as a senior QA + product reviewer.

Review the 풋링크 MVP against these standards:
- A new user must understand the app in under 3 seconds
- A user must reach a relevant listing in under 20 seconds
- The feed must feel immediately useful
- The create flow must be completable in under 60 seconds
- Every main action must be thumb-friendly on mobile
- There should be no dead-end screens

Check:
- entry flow
- location fallback
- home feed states
- detail page clarity
- create form friction
- activity page usefulness
- Korean copy consistency
- spacing and accessibility issues

Return:
1. UX issues
2. visual issues
3. interaction issues
4. priority fixes
5. final pass/fail judgment for MVP user testing
5. 실제 제작 순서
UI만 먼저
진입 화면
홈 피드
상세
생성
활동
목데이터로 검증
서울/경기 샘플 20~30개
상태 배지와 필터 로직 확인
Supabase 연결
matches / requests만 먼저
사용자 테스트
1명 유저
2~4명 유저
팀 대표
각 3~5명씩
지표 확인
카드 클릭
연락/요청
생성 완료
응답률