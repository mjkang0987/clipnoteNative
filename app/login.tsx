import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { signInWithNaver } from "@/lib/naver";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession();

type Provider = "google" | "kakao";
const KAKAO_ENABLED = true;

export default function Login() {
  const router = useRouter();
  const { loggedIn, signOut } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState<Provider | "naver" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleNaver() {
    if (!agreed) {
      setError("개인정보처리방침에 동의하셔야 로그인할 수 있어요.");
      return;
    }
    setLoading("naver");
    setError(null);
    try {
      const r = await signInWithNaver();
      if (r.ok) {
        router.replace("/");
      } else if (!r.cancelled) {
        setError("네이버 로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setError("네이버 로그인 중 문제가 발생했어요.");
    } finally {
      setLoading(null);
    }
  }

  async function signIn(provider: Provider) {
    if (!supabase) {
      setError("로그인 설정이 필요해요(.env).");
      return;
    }
    if (!agreed) {
      setError("개인정보처리방침에 동의하셔야 로그인할 수 있어요.");
      return;
    }
    setLoading(provider);
    setError(null);
    try {
      const redirectTo = Linking.createURL("auth/callback");
      // Supabase Redirect URLs 에 등록할 값(콘솔에서 복사):
      console.log("[ClipNote] OAuth redirectTo =", redirectTo);
      const { data, error: oErr } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oErr || !data.url) {
        setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== "success" || !res.url) {
        return; // 사용자가 취소
      }
      const code = new URL(res.url).searchParams.get("code");
      if (!code) {
        setError("로그인 응답을 처리하지 못했어요.");
        return;
      }
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) {
        setError("로그인을 완료하지 못했어요.");
        return;
      }
      router.replace("/");
    } catch {
      setError("로그인 중 문제가 발생했어요.");
    } finally {
      setLoading(null);
    }
  }

  if (loggedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.dim}>이미 로그인되어 있어요.</Text>
        <Pressable
          onPress={() => signOut()}
          style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
        >
          <Text style={styles.ghostBtnText}>로그아웃</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/")} style={styles.linkBtn}>
          <Text style={styles.link}>홈으로</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        Clip<Text style={styles.brand}>Note</Text> 로그인
      </Text>
      <Text style={styles.sub}>
        {KAKAO_ENABLED
          ? "Google·카카오 계정으로 간편하게 시작하세요."
          : "Google 계정으로 간편하게 시작하세요."}
      </Text>

      <Pressable style={styles.consent} onPress={() => setAgreed((v) => !v)}>
        <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
          {agreed && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.consentText}>
          로그인 시 회원 식별을 위해 소셜 계정 정보(고유 식별자, 이메일, 프로필
          닉네임·이미지)가 수집되는 데 동의합니다.{" "}
          <Text
            style={styles.link}
            onPress={() => WebBrowser.openBrowserAsync("https://clipnote.co.kr/privacy")}
          >
            개인정보처리방침
          </Text>
          을 확인했어요.
        </Text>
      </Pressable>

      <Pressable
        onPress={() => signIn("google")}
        disabled={loading !== null || !agreed}
        style={({ pressed }) => [
          styles.oauthBtn,
          styles.googleBtn,
          (!agreed || loading !== null) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.googleText}>
          {loading === "google" ? "이동 중…" : "Google로 계속하기"}
        </Text>
      </Pressable>

      {KAKAO_ENABLED && (
        <Pressable
          onPress={() => signIn("kakao")}
          disabled={loading !== null || !agreed}
          style={({ pressed }) => [
            styles.oauthBtn,
            styles.kakaoBtn,
            (!agreed || loading !== null) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.kakaoText}>
            {loading === "kakao" ? "이동 중…" : "카카오로 계속하기"}
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleNaver}
        disabled={loading !== null || !agreed}
        style={({ pressed }) => [
          styles.oauthBtn,
          styles.naverBtn,
          (!agreed || loading !== null) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.naverText}>
          {loading === "naver" ? "이동 중…" : "네이버로 계속하기"}
        </Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
      {!supabaseConfigured && (
        <Text style={styles.error}>로그인 설정(.env)이 없어 비활성 상태예요.</Text>
      )}

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dim}>또는</Text>
        <View style={styles.line} />
      </View>

      <Pressable
        onPress={() => router.replace("/")}
        style={({ pressed }) => [styles.guestBtn, pressed && styles.pressed]}
      >
        <Text style={styles.guestText}>게스트로 계속하기</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 32 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  dim: { fontSize: 14, color: colors.fgMuted },

  title: { fontSize: 22, fontWeight: "700", color: colors.fg, textAlign: "center" },
  brand: { color: colors.brand },
  sub: { marginTop: 8, fontSize: 14, color: colors.fgMuted, textAlign: "center" },

  consent: {
    marginTop: 28,
    flexDirection: "row",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 13,
  },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkMark: { color: colors.white, fontSize: 12, fontWeight: "700" },
  consentText: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.fgMuted },

  oauthBtn: { marginTop: 12, height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  googleBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.bg },
  googleText: { fontSize: 16, fontWeight: "600", color: colors.fg },
  kakaoBtn: { backgroundColor: "#FEE500" },
  kakaoText: { fontSize: 16, fontWeight: "600", color: "#191600" },
  naverBtn: { backgroundColor: "#03C75A" },
  naverText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  disabled: { opacity: 0.5 },

  error: { marginTop: 14, fontSize: 14, color: colors.danger, textAlign: "center" },

  divider: { marginTop: 24, flexDirection: "row", alignItems: "center", gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  guestBtn: { marginTop: 16, height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  guestText: { fontSize: 16, fontWeight: "600", color: colors.fgMuted },

  ghostBtn: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: { fontSize: 15, fontWeight: "600", color: colors.fg },
  linkBtn: { padding: 8 },
  link: { color: colors.brandStrong, fontWeight: "600" },
  pressed: { opacity: 0.85 },
});
