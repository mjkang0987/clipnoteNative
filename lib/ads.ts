import { TestIds } from "react-native-google-mobile-ads";

// 개발 빌드(__DEV__)에선 테스트 광고, 실제 빌드에선 실광고 단위 ID.
// 실광고를 본인이 클릭하면 계정 정지되므로 개발 중엔 항상 테스트 광고가 뜨게 분기.
export const BANNER_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : "ca-app-pub-3019917862455282/4728467083";

// 배너가 차지하는 대략 높이(px). 목록 하단 패딩 확보용.
// 앵커 적응형 배너는 기기 폭 따라 50~90 변동 → 여유 두고 64로 잡음.
export const AD_BANNER_HEIGHT = 64;
