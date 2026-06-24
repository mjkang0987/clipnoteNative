import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";

export default function Clips() {
  // TODO(Phase 2/3): 게스트=로컬 저장, 로그인=GET /api/clips 로 목록 채우기.
  const items: unknown[] = [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>아직 저장한 클립이 없어요.</Text>
          <Link href="/" asChild>
            <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
              <Text style={styles.btnText}>첫 클립 만들기</Text>
            </Pressable>
          </Link>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },

  // 웹 빈 상태와 동일: 점선 테두리 + surface 배경 + 중앙 정렬
  emptyBox: {
    marginTop: 40,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 40,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: colors.fgMuted },
  btn: {
    marginTop: 12,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  btnPressed: { backgroundColor: colors.brandStrong },
  btnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
});
