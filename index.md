# ClipNote Native — index.md

> 프로젝트 구조와 현재 상태의 source of truth. 작업 완료 시 갱신한다.

## 프로젝트 정보

- **이름**: ClipNote Native (모바일 앱)
- **저장소**: https://github.com/mjkang0987/clipnoteNative.git
- **연관**: 웹 ClipNote(clipnote.co.kr) — 백엔드 API 재사용
- **스택**: Expo (dev build) · expo-router · React Native · TypeScript · Supabase
- **배포**: EAS Build → App Store / Play Store (예정)

## 현재 상태

- 단계: **Phase 1 진행 중 — 스캐폴딩 + 홈 자동추출 + 소개/FAQ 메뉴 완료.** `plan.md` 참고.
- 원격 저장소: `main`에 푸시됨. Expo SDK 56 + expo-router + TS.
- 백엔드: 신규 개발 없음 — 웹 API(`clipnote.co.kr/api/*`) 그대로 호출.
- 실행 확인: 웹(react-native-web)에서 홈 자동추출 카드 동작 확인. 시뮬레이터는 LAN 이슈 → `--localhost`/`--tunnel` 권장.

## 디렉터리 구조

```
clipnoteNative/
├── app/
│   ├── _layout.tsx     # Stack + 헤더(햄버거 메뉴)
│   ├── index.tsx       # 홈: URL 자동추출 → 공유 카드/클립 저장 카드 미리보기
│   ├── about.tsx       # 소개(ClipNote란/동작/로그인 분기)
│   └── faq.tsx         # 자주 묻는 질문
├── components/
│   └── HeaderMenu.tsx  # 헤더 햄버거 메뉴(모달) → 소개/FAQ 이동
├── lib/
│   ├── api.ts          # 웹 API 클라이언트(metadata/clip/og)
│   └── theme.ts        # 디자인 토큰·그라디언트(웹 이식)
├── assets/             # 아이콘·스플래시
├── app.json            # Expo 설정(scheme:clipnote, expo-router)
└── package.json
```

## 다음 할 일

`plan.md` Phase 2(로그인 — Google·Kakao): EAS dev build 세팅 → Supabase RN 인증 → 딥링크.
(또는 Phase 1 잔여: 비로그인 로컬 저장(AsyncStorage), 화면 디테일 다듬기.)

## 변경 이력

- 2026-06-24: 최초 작성. 계획 문서화(plan.md), Expo 결정.
- 2026-06-24: Phase 1 — Expo SDK 56 + expo-router + TS 스캐폴딩, 홈(URL 자동추출→공유 카드/클립 저장 카드 미리보기), lib/api(웹 API 재사용)·lib/theme(토큰 이식). main 푸시.
- 2026-06-24: 소개(about)/FAQ(faq) 페이지 분리 + 헤더 햄버거 메뉴(HeaderMenu). expo-linear-gradient ~56.0.4 고정, package-lock 커밋.
- 2026-06-24: 햄버거를 좌측 슬라이드 사이드 메뉴(다크 배경)로, backdrop 닫기. '내 클립' 메뉴/헤더 바로가기 추가.
- 2026-06-24: Phase 1 마무리 — 게스트 로컬 저장(AsyncStorage 2.2.0, lib/local-clips), 홈 '이 기기에 저장', 내 클립 카드 리스트(웹과 동일 카드 + 삭제 + 탭 시 원본 열기). 실기기(시뮬레이터)에서 저장→조회 확인.
- 2026-06-24: 내 클립 편집 — A) 단건 편집 모달(제목·태그, EditClipModal), 스와이프 편집/삭제(react-native-gesture-handler ~2.31.1). B) 선택 모드(선택 버튼+롱프레스)+일괄 삭제. C) 태그 일괄 적용(추가/교체, TagApplyModal). lib/local-clips 에 updateLocalClip 추가. 실기기 확인.
- 2026-06-25: 네이버 로그인 dev build 에서 검증 완료. Expo Go 터널 exp:// 복귀 불가 확인 → `npx expo run:ios` dev build(`clipnote://` 스킴) 전환. `lib/naver.ts` openBrowserAsync(SFSafari)+verifyNaverToken(중복 가드), 복귀는 `app/auth/naver.tsx` 라우트가 처리(verify→홈), `_layout.tsx` auth/naver Stack.Screen. 수동 딥링크 리스너 제거. 로그: returnUrl=clipnote://→token_hash present→verify ok→홈.
- 2026-06-26: 소개(about)/FAQ(faq) 마케팅 카피 강화 — 웹(clipnote) 랜딩 카피와 톤 일치. 소개 리드 가치 우선, 동작 3스텝·로그인 분기 박스 표현 다듬기, FAQ "공유 링크를 열면" 1건. 의미·범위 불변. tsc 통과.
