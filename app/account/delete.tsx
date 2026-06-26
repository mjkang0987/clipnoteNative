import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { deleteAccount } from "@/lib/api";
import { clearLocalClips } from "@/lib/local-clips";
import { colors, radius } from "@/lib/theme";

/**
 * 회원 탈퇴 화면. 계정과 저장된 모든 클립을 영구 삭제한다.
 * 삭제는 서버(DELETE /api/account)가 처리하고, 성공 시 로컬 세션·로컬 클립을 비운다.
 */
export default function DeleteAccount() {
  const router = useRouter();
  const { loggedIn, accessToken, signOut } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loggedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.dim}>로그인 후 이용할 수 있어요.</Text>
        <Pressable onPress={() => router.replace("/")} style={styles.linkBtn}>
          <Text style={styles.link}>홈으로</Text>
        </Pressable>
      </View>
    );
  }

  async function runDelete() {
    setBusy(true);
    setError(null);
    const res = await deleteAccount(accessToken ?? undefined);
    if (!res.ok) {
      setBusy(false);
      setError(
        res.error === "network"
          ? "네트워크 문제로 탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요."
          : "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }
    // 서버에서 계정 삭제 완료 → 로컬 세션·로컬 클립 정리.
    await clearLocalClips();
    await signOut();
    Alert.alert("탈퇴 완료", "계정과 저장된 클립이 모두 삭제되었어요.");
    router.replace("/");
  }

  function confirmDelete() {
    if (!agreed || busy) return;
    Alert.alert(
      "정말 탈퇴할까요?",
      "계정과 저장된 모든 클립이 영구적으로 삭제되며 복구할 수 없어요.",
      [
        { text: "취소", style: "cancel" },
        { text: "탈퇴하기", style: "destructive", onPress: runDelete },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>회원 탈퇴</Text>
      <Text style={styles.lead}>
        탈퇴하면 아래 정보가 영구적으로 삭제되며 복구할 수 없어요.
      </Text>

      <View style={styles.box}>
        <Text style={styles.boxItem}>• 계정 정보(소셜 로그인 식별자·이메일·프로필)</Text>
        <Text style={styles.boxItem}>• 저장한 모든 클립과 공유 링크</Text>
        <Text style={styles.boxItem}>• 이 기기에 보관된 클립</Text>
      </View>

      <Pressable style={styles.consent} onPress={() => setAgreed((v) => !v)}>
        <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
          {agreed && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.consentText}>
          위 내용을 확인했으며, 모든 데이터가 삭제되는 것에 동의합니다.
        </Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={confirmDelete}
        disabled={!agreed || busy}
        style={({ pressed }) => [
          styles.dangerBtn,
          (!agreed || busy) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.dangerText}>회원 탈퇴</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        disabled={busy}
        style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
      >
        <Text style={styles.cancelText}>취소</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 24 },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  dim: { fontSize: 14, color: colors.fgMuted },

  title: { fontSize: 22, fontWeight: "700", color: colors.fg },
  lead: { marginTop: 10, fontSize: 14, lineHeight: 21, color: colors.fgMuted },

  box: {
    marginTop: 18,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
  },
  boxItem: { fontSize: 14, lineHeight: 20, color: colors.fg },

  consent: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.danger, borderColor: colors.danger },
  checkMark: { color: colors.white, fontSize: 13, fontWeight: "700" },
  consentText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.fg },

  error: { marginTop: 16, fontSize: 14, color: colors.danger },

  dangerBtn: {
    marginTop: 24,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerText: { fontSize: 16, fontWeight: "700", color: colors.white },
  disabled: { opacity: 0.45 },

  cancelBtn: {
    marginTop: 12,
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: colors.fgMuted },

  linkBtn: { padding: 8 },
  link: { color: colors.brandStrong, fontWeight: "600" },
  pressed: { opacity: 0.85 },
});
