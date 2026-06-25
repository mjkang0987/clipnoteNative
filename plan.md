# ClipNote Native — plan.md

> 현재 작업과 향후 작업의 source of truth. 구현 범위가 바뀌면 이 문서를 먼저 갱신한다.

## 1. 제품 개요

`clipnoteNative` — ClipNote(웹: clipnote.co.kr)의 **모바일 앱(iOS/Android)**.
링크를 받아 예쁜 공유 카드 + 짧은 공유 링크를 만들고, 내 클립을 모아 본다.

핵심 가치(모바일 특화): **다른 앱에서 "공유 → ClipNote"로 링크를 바로 받아** 카드/공유링크 생성.
(웹에선 불가능한 진입점 — RN으로 가는 가장 큰 이유)

## 2. 핵심 전략 — 백엔드 재사용

서버 로직(메타 추출·OG 이미지·슬러그·중복방지·Supabase 저장·공유 페이지)은 **웹(clipnote.co.kr)에 이미 구현**돼 있다.
앱은 이 API를 그대로 호출한다 → 새로 만들 건 **UI + 인증 + 모바일 특화 기능**뿐.

재사용 API (base: `https://clipnote.co.kr`):

| 엔드포인트 | 용도 |
|---|---|
| `GET /api/metadata?url=` | URL 메타(제목·설명·이미지·siteName·source) 추출 |
| `POST /api/clip` | 클립 생성(공유 slug 발급) / `save:true` 시 내 클립 저장 |
| `PATCH /DELETE /api/clip/[slug]` | 수정 / 삭제(소유자) |
| `GET /api/clips` | 내 클립 목록(`{loggedIn, clips}`) |
| `GET /api/og?title=&desc=&site=&g=` | 동적 OG 이미지(미리보기/공유 카드 이미지로 표시) |
| `/{slug}` | 공유 페이지(앱은 공유 링크 텍스트만 전달, 열람은 웹) |

> 메타 추출 검증 완료(웹 작업 시): 일반 사이트·네이버 뉴스·카페(토큰 링크) OK / 인스타·쿠팡 로그인벽은 폴백.

## 3. 스택 / 결정

- **Expo (dev build)** — 빠른 시작, EAS 클라우드 빌드, OTA, 필요 시 `expo prebuild`로 네이티브 직접 제어.
- **expo-router** — 파일 기반 라우팅(웹 Next App Router와 동일한 멘탈 모델).
- **TypeScript**.
- **인증**: `@supabase/supabase-js` + `expo-auth-session`/딥링크로 OAuth(Google·Kakao). 웹과 같은 Supabase 프로젝트.
- **스타일**: 초기엔 RN `StyleSheet`(웹 디자인 토큰 색상 이식). 필요 시 NativeWind 검토.
- **저장**: 비로그인은 `expo-secure-store`/`AsyncStorage`(웹의 localStorage 대응), 로그인은 DB(API).
- **API base**: `EXPO_PUBLIC_API_BASE`(기본 `https://clipnote.co.kr`).

## 4. 범위 (단계별)

### Phase 1 — 코어 (MVP)
- [x] Expo + expo-router + TS 스캐폴딩, 기본 네비게이션/테마(디자인 토큰).
- [x] 홈: URL 입력/붙여넣기 → **자동 메타 추출**(디바운스) → 미리보기 카드(웹과 동일 흐름).
- [x] 공유 카드 미리보기(OG와 동일 구성: 사이트명→제목→설명→ClipNote) + 클립 저장 카드 미리보기.
- [x] 소개(about)/FAQ(faq) 페이지 + 헤더 햄버거(사이드) 메뉴 + '내 클립' 바로가기.
- [x] 비로그인 로컬 저장(AsyncStorage) + 내 클립 카드 리스트(웹과 동일, 삭제·원본 열기).

### Phase 2 — 인증 (구현 중)
- [ ] Supabase RN 클라이언트(`lib/supabase.ts`) — AsyncStorage 세션 영속, `detectSessionInUrl:false`, `react-native-url-polyfill`.
- [ ] 인증 상태 훅/컨텍스트(`lib/auth.tsx`) — 세션 구독.
- [ ] 로그인 화면(`app/login.tsx`) — Google·Kakao 버튼 + 개인정보 동의 체크박스 + 게스트 계속(웹 동일).
- [ ] OAuth 플로우 — `signInWithOAuth({skipBrowserRedirect})` → `WebBrowser.openAuthSessionAsync` → `exchangeCodeForSession`. redirect = `Linking.createURL("auth/callback")`.
- [ ] 헤더 인증 상태(로그인/로그아웃), 홈 메뉴에 로그인 항목.

#### 핵심 메모
- 카카오·구글 모두 **Supabase 웹 OAuth 콜백 경유**(provider→supabase.co/auth/v1/callback→앱 딥링크). 네이티브 SDK 불필요 → **Expo Go 우선 시도**, 안 되면 dev build.
- 공유 링크 생성(`POST /api/clip`)·DB 클립 목록(`GET /api/clips`)은 **세션 토큰을 Authorization 헤더로** 전달. (웹 API가 토큰 인증 받는지 확인 필요 — 현재 쿠키 기반이면 API에 Bearer 토큰 지원 추가 필요.)

#### 사용자 할 일
- `npx expo install @supabase/supabase-js react-native-url-polyfill`
- Supabase 대시보드 → Authentication → URL Configuration → **Redirect URLs 에 앱 딥링크 추가**: `clipnote://` 와 (Expo Go 테스트용) `exp://` 프록시 URL. (실행 시 콘솔에 찍히는 redirect URL 그대로 등록)
- Google·Kakao provider 는 웹에서 이미 설정됨(콜백이 Supabase 라 모바일 추가 설정 대부분 불필요).

### Phase 3 — 내 클립
- [x] 목록(로컬) — 카드(썸네일/그라디언트·제목·호스트·태그), 탭 시 원본 열기.
- [x] 편집(단건 모달) + 스와이프 편집/삭제(네이티브 제스처).
- [x] 선택 모드(선택 버튼+롱프레스) → 일괄 삭제 + 태그 일괄 적용(추가/교체).
- [x] 태그 필터(상단 태그 칩).
- [x] 카드 액션: 바로가기·링크 복사(expo-clipboard).
- [ ] 로그인 후 DB 목록(`GET /api/clips`) 연결 + 편집/삭제 API 재사용.

### Phase 4 — 공유
- [ ] 공유 링크 생성 → **네이티브 공유 시트**로 바로 보내기.
- [ ] 결과 화면(복사·열기·내 클립 저장).

### Phase 5 — 모바일 특화(핵심 차별점)
- [ ] **iOS Share Extension** + **Android Share Intent(ACTION_SEND)** — 타 앱에서 URL 공유 받기.
- [ ] 받은 URL로 앱 진입 → 바로 생성 흐름.

### Phase 6 — 빌드/출시
- [ ] EAS Build(dev/preview/prod), 실기기 테스트.
- [ ] 딥링크/유니버설 링크(공유 slug 열기).
- [ ] 앱스토어/플레이스토어 등록·심사.

## 5. 영향/구조 (예정)

```
clipnoteNative/
├── app/                 # expo-router 화면
│   ├── _layout.tsx      # 루트 레이아웃/테마
│   ├── index.tsx        # 홈(생성 흐름)
│   ├── clips.tsx        # 내 클립
│   └── login.tsx        # 로그인
├── lib/
│   ├── api.ts           # 웹 API 클라이언트(fetch 래퍼)
│   ├── supabase.ts      # Supabase RN 클라이언트
│   ├── local-clips.ts   # 비로그인 로컬 저장
│   └── theme.ts         # 디자인 토큰(웹 이식)
├── components/          # 카드·입력 등 공통 UI
├── app.json             # Expo 설정(스킴·플러그인)
└── ...
```

## 6. 사용자 할 일 (코드는 Claude, 아래는 사용자/Mac/콘솔)

- `npm install` 후 `npx expo start`(dev) / dev build 생성(`eas build --profile development` 또는 `expo run:ios`).
- Supabase: 모바일 OAuth 리다이렉트(딥링크 스킴) 추가.
- Google/Kakao 개발자 콘솔: 네이티브 앱키·리다이렉트 등록(카카오 네이티브 앱키 등).
- EAS 계정/프로젝트 연결(클라우드 빌드 시).
- 실기기 테스트(공유 익스텐션·딥링크·로그인은 실기기 검증 필수).

## 7. 빌드/검증 메모

- 샌드박스에선 RN 빌드·실행 불가(네이티브 툴체인 없음) → 코드는 Claude, 빌드·기기 테스트는 Mac.
- 타입 체크(`tsc`)는 의존성 설치 후 가능.

## 8. 변경 이력

- 2026-06-24: 최초 작성. Expo(dev build)+expo-router+TS 결정, 웹 API 재사용 전략, 6단계 범위 정의.
