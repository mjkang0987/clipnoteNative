# ClipNote iOS 네이티브 마이그레이션 — 설계

- 날짜: 2026-07-15
- 대상 레포: `git@github.com:mjkang0987/clipnote-ios.git` (신규)
- 원본: `clipnoteNative` (Expo / React Native 0.85, expo-router)

## 1. 목표와 범위

React Native(Expo) 앱 **ClipNote**를 네이티브 **Swift(iOS)** 앱으로 다시 만든다.
백엔드(`clipnote.co.kr` REST API)와 Supabase는 **그대로 재사용**한다. 서버 로직은 손대지 않는다.

- 이번 작업: **iOS 전체 기능 패리티**. RN 앱의 모든 화면·기능을 이식한다.
- 다음 단계(별도 스펙): Android(Kotlin), iOS Share Extension.
- 장기 목적: 네이티브에서 계속 개발·유지하기 위한 토대.

## 2. 기술 스택

- SwiftUI, **iOS 17+**, Swift 5.9+
- 아키텍처: MVVM 지향(View + ObservableObject store/viewmodel)
- 의존성(SPM)
  - `supabase-swift` — 인증(세션/토큰)
  - `GoogleMobileAds` — 배너 광고
- 시크릿/설정: `Secrets.xcconfig`(git 제외) + `Info.plist`. RN `.env` 값 이식:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  - `NAVER_CLIENT_ID`
  - `API_BASE`(기본 `https://clipnote.co.kr`)
  - AdMob `GADApplicationIdentifier`(app id), 배너 unit id
- URL scheme: `clipnote` (Info.plist `CFBundleURLTypes`)
- Bundle ID: `kr.co.clipnote.app` (기존 유지)

## 3. 계층 구조

### 3.1 네트워킹 — `APIClient`
`URLSession` async/await. `lib/api.ts` 1:1 이식.

- `fetchMetadata(url:) -> ClipMetadata` — `GET /api/metadata`
- `createClip(_ input:, accessToken:) -> CreateClipResult` — `POST /api/clip`
- `ogImageURL(title:description:siteName:gradient:) -> URL` — `GET /api/og` 파라미터 조립
- `getClips(accessToken:) -> (loggedIn, [DbClip])` — `GET /api/clips`
- `updateClip(slug:patch:accessToken:) -> Bool` — `PATCH /api/clip/{slug}` (title, tags, shared)
- `deleteClip(slug:accessToken:) -> Bool` — `DELETE /api/clip/{slug}`
- `deleteAccount(accessToken:) -> DeleteAccountResult` — `DELETE /api/account`

토큰 있으면 `Authorization: Bearer <token>` 헤더. 실패 시 원본과 동일하게 조용히 폴백(빈 목록 등).

### 3.2 모델 (Codable)
- `ClipMetadata { url, title?, description?, image?, siteName?, source, reason? }`
- `DbClip { slug, url, title, description?, image?, siteName?, gradient, tags[], saved, shared, createdAt }`
- `CreateClipInput { url, title, description?, image?, siteName?, tags[], gradient, save? }`
- `CreateClipResult { slug?, shareUrl?, alreadySaved?, error? }`
- `UClip` — 로컬·DB 통합 뷰 모델. `id = slug(DB) 또는 url(로컬)`, `local: Bool`, `shared: Bool`.

### 3.3 인증 — `AuthStore: ObservableObject`
`supabase-swift` 래핑. `lib/auth.tsx` + `login.tsx` + `lib/naver.ts` 이식.

- 상태: `session`, `accessToken`, `loggedIn`, `loading`
- 세션 지속: supabase-swift 기본 Keychain 저장, 자동 토큰 갱신, `onAuthStateChange` 구독
- **Google / Kakao**: Supabase OAuth. `ASWebAuthenticationSession`(PKCE) → 콜백 `clipnote://auth/callback` 의 `code` → `exchangeCodeForSession`
- **네이버**(커스텀 OAuth, Supabase 미지원):
  1. `SFSafariViewController`로 `https://nid.naver.com/oauth2.0/authorize` 열기 (`redirect_uri = https://clipnote.co.kr/api/auth/naver/callback`, `state`에 returnUrl 포함)
  2. 웹 콜백이 magiclink `token_hash`를 담아 `clipnote://auth/naver?token_hash=...`로 앱 복귀
  3. `.onOpenURL` → `verifyOtp(type: .magiclink, tokenHash:)` → 세션 생성
  4. `token_hash` 1회용 — 중복 verify 가드(consumed Set 대응)
- `signOut()`

### 3.4 로컬 저장 — `LocalClipStore` (SwiftData)
비로그인 사용자의 '내 클립'. `lib/local-clips.ts` 이식.

- `@Model LocalClip { url, title, description?, image?, siteName?, gradient, tags[], savedAt }`
- 규칙: 같은 `url`은 최신으로 갱신(중복 제거), 최대 **300개**, 최신순
- 알려진 태그 빈도(`knownTags`) — 자동완성용, 빈도 내림차순. SwiftData 또는 UserDefaults JSON
- `clearLocalClips()` — 로그인 마이그레이션 후 비움
- 온보딩 표시 플래그: `@AppStorage("clipnote.onboardingSeen")`

### 3.5 테마 — `Theme`
`lib/theme.ts` 이식. 태그(element) 셀렉터 개념 없음(SwiftUI). 값 그대로.

- colors: brand `#7C5CFC`, brandStrong `#5B3FE0`, brandSoft `#EFEBFF`, bg/surface/border/fg/fgMuted, success/danger/warning
- radius: sm 8 / md 12 / lg 16 / full
- `GRADIENTS` 8종(sunset·ocean·grape·forest·peach·midnight·mint·rose)
- `pickGradient(seed:)` — **동일 해시 알고리즘**(`hash = hash*31 + char`, `abs(hash) % 8`) 유지. 같은 시드 → 같은 색 보장(서버 OG와 일치)

### 3.6 광고 — `AdBannerView`
`UIViewRepresentable` → `GADBannerView`(앵커 적응형). `lib/ads.ts` + `AdBanner.tsx` 이식.

- 앱 시작 시 `GADMobileAds.sharedInstance().start()`
- DEBUG 빌드 = 테스트 unit id, RELEASE = 실 unit id `ca-app-pub-3019917862455282/4728467083`
- 예약 높이 64pt. 홈에서 키보드 뜨면 숨김.

### 3.7 딥링크
App 진입점 `.onOpenURL(perform:)`:
- `clipnote://auth/naver?token_hash=...` → 네이버 verify
- `clipnote://auth/callback?code=...` → OAuth code 교환(진행 중 세션과 연결)

## 4. 화면 (NavigationStack)

공통: 헤더 좌측 메뉴(About/FAQ/로그인·로그아웃/회원탈퇴), 우측 새 클립/내 클립 링크. `HeaderMenu` 이식.

### 4.1 HomeView (`app/index.tsx`)
- URL 입력 → **600ms 디바운스** 후 유효 URL이면 메타데이터 자동 추출(`Task` + `Task.sleep`, URL 바뀌면 이전 취소)
- 제목(미입력 시 자동 채움), 태그(쉼표 구분, 최대 6개)
- **공유 카드 미리보기**: SwiftUI `LinearGradient`로 OG 카드 재현(비율 1200:630, siteName·title·description·"ClipNote" 마크, 카드 너비 비례 폰트)
- **클립 카드 미리보기**: 썸네일(원본 image 또는 그라디언트) + 제목·호스트·태그
- 비로그인: "이 기기에 저장"(로컬)
- 로그인: "공유 링크 만들기"(→ ShareResult sheet) + "내 클립에 저장"(DB, save:true)
- 최초 실행 시 온보딩으로 이동(플래그 확인 전 렌더 보류)

### 4.2 ClipsView (`app/clips.tsx`)
- 로컬(비로그인)/DB(로그인) 통합 목록, 포커스 시 새로고침 + `emitClipsRefresh` 신호 구독
- 태그 필터칩(가로 스크롤, "전체" + 태그별)
- 카드: 썸네일 + 제목·호스트·태그, `⋯` 메뉴(편집/삭제)
- **스와이프**(편집/삭제), contextMenu 대체 가능
- **다중선택**(로그인 전용, 롱프레스 진입) → 하단 바 "태그 적용"/"삭제(n)"
- 카드 액션 행:
  - DB 클립: `shared=false`면 **"공유 링크 만들기"**(→ `updateClip(shared:true)` 후 새로고침), `shared=true`면 **"공유 링크 복사"**
  - "바로가기" → `SFSafariViewController`로 원본 열기
- 로컬 클립은 공유 액션 없음

### 4.3 공유 링크 복사 동작 (⚠️ 신규 요구사항 — 원본 대비 변경)
현재 RN `clips.tsx`의 `copyShare`는 **공유 URL만** 복사한다(`{API_BASE}/{slug}`).
iOS에서는 복사 시 **제목 + 설명 + 링크를 개행으로 이어** 복사한다:

```
{title}
{description}       // description 있을 때만 줄 포함
{API_BASE}/{slug}
```

- `description`이 없으면 그 줄은 생략(빈 줄 남기지 않음)
- 적용 위치: ClipsView의 "공유 링크 복사", ShareResultModal의 "링크 복사" 양쪽 동일 규칙
- 복사 후 1.5초 "복사됨 ✓" 피드백 유지

### 4.4 LoginView (`app/login.tsx`)
- 개인정보 동의 체크박스(미동의 시 로그인 버튼 비활성)
- Google / Kakao / 네이버 버튼, "게스트로 계속하기"
- 네이버는 딥링크 복귀로 완료 → 완료 시 홈 이동
- 이미 로그인 상태면 로그아웃 안내

### 4.5 OnboardingView (`app/onboarding.tsx`)
- `TabView(.page)` 4슬라이드(welcome/how/more/share), 페이지 도트, "건너뛰기"/"다음"/"시작하기"
- 완료 시 `onboardingSeen` 저장 후 홈

### 4.6 기타 화면
- **AboutView** (`app/about.tsx`), **FaqView** (`app/faq.tsx`) — 정적 콘텐츠 이식
- **AccountDeleteView** (`app/account/delete.tsx`) — `deleteAccount` 호출, 확인 절차

### 4.7 모달/시트
- **ShareResultModal** — 공유 링크 결과: 복사(§4.3 규칙)/열기/내 클립에 저장/닫기
- **EditClipModal** — 제목·태그 단건 편집(로컬/DB 저장은 호출부가 결정)
- **TagApplyModal** — 다중선택 태그 일괄 적용(추가/교체 모드)

## 5. 로그인 마이그레이션 (`MigrateLocalClips`)
로그인 전환 감지 → 로컬 클립 있으면 1회 확인(Alert): "옮기기" 시 각 클립 `createClip(save:true)` 업로드 → `clearLocalClips()` → 목록 새로고침 → 완료 알림. "나중에"면 유지.

## 6. OG 카드 렌더링
서버 `/api/og`가 실제 공유용 OG 이미지를 생성한다(변경 없음). 앱 내 미리보기·썸네일은 네이티브(SwiftUI)로 동일하게 재현한다. 색은 `pickGradient` 동일 해시로 서버와 일치.

## 7. 안 하는 것 (YAGNI)
- Android(다음 단계 별도 스펙)
- iOS Share Extension(뼈대 완성 후)
- RN 코드/웹뷰 재사용
- 오프라인 동기화·검색 등 신규 기능(패리티 우선)

## 8. 마일스톤(대략)
1. Xcode 프로젝트 + SPM 의존성 + 설정(xcconfig, URL scheme, Info.plist)
2. Theme + Models + APIClient
3. AuthStore(Supabase, 3종 로그인, 딥링크)
4. LocalClipStore(SwiftData) + 마이그레이션
5. HomeView(메타 추출·미리보기·저장)
6. ClipsView(목록·편집·삭제·다중선택·공유복사 §4.3)
7. Login/Onboarding/About/FAQ/AccountDelete
8. AdMob 배너
9. 전체 점검·심사 대비(개인정보 매니페스트 등)
