import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BannerAd,
  BannerAdSize,
} from "react-native-google-mobile-ads";
import { colors } from "@/lib/theme";
import { BANNER_UNIT_ID } from "@/lib/ads";

// 앵커 배너. floating=true면 화면 하단에 떠 있게(absolute) 배치.
// 광고 로드 전/실패 시 빈 공간이 생기지 않도록 로드 성공 전까진 숨김.
export default function AdBanner({ floating = false }: { floating?: boolean }) {
  const insets = useSafeAreaInsets();
  const [loaded, setLoaded] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: insets.bottom },
        floating && styles.floating,
        !loaded && styles.hidden,
      ]}
      pointerEvents={loaded ? "auto" : "none"}
    >
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setLoaded(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: "center",
  },
  floating: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  hidden: {
    height: 0,
    overflow: "hidden",
    borderTopWidth: 0,
  },
});
