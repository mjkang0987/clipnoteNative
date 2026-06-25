import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { verifyNaverToken } from "@/lib/naver";
import { colors } from "@/lib/theme";

/**
 * 네이버 로그인 딥링크 복귀 화면.
 * 콜백이 `clipnote://auth/naver?token_hash=...` 로 앱을 열면 expo-router 가 이 화면으로
 * 라우팅한다. token_hash 로 세션을 만든 뒤(중복은 verifyNaverToken 가드가 처리) 홈으로 보낸다.
 */
export default function NaverAuthReturn() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token_hash?: string; error?: string }>();

  useEffect(() => {
    let alive = true;
    (async () => {
      const token =
        typeof params.token_hash === "string" ? params.token_hash : null;
      if (token) await verifyNaverToken(token);
      // 네이버 로그인용으로 열려 있던 인앱 브라우저를 닫는다.
      try {
        WebBrowser.dismissBrowser();
      } catch {
        // 열린 브라우저가 없으면 무시
      }
      if (alive) router.replace("/");
    })();
    return () => {
      alive = false;
    };
    // params 는 1회만 처리(토큰은 단발성)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand} />
      <Text style={styles.text}>로그인 처리 중…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.bg,
  },
  text: {
    color: colors.fgMuted,
    fontSize: 14,
  },
});
