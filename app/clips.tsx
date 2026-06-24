import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";

export default function Clips() {
  return (
    <View style={styles.screen}>
      <View style={styles.empty}>
        <Text style={styles.title}>아직 저장한 클립이 없어요</Text>
        <Text style={styles.desc}>
          홈에서 링크를 붙여넣어 클립을 만들어 보세요. 만든 클립이 여기에 모여요.
        </Text>
        <Link href="/" asChild>
          <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
            <Text style={styles.btnText}>클립 만들러 가기</Text>
          </Pressable>
        </Link>
        <Text style={styles.note}>
          저장·동기화는 다음 단계에서 연결됩니다(로컬 저장 → 로그인).
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center" },
  empty: { alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700", color: colors.fg, textAlign: "center" },
  desc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.fgMuted,
    textAlign: "center",
    maxWidth: 300,
  },
  btn: {
    marginTop: 20,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: { backgroundColor: colors.brandStrong },
  btnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  note: { marginTop: 16, fontSize: 12, color: colors.fgMuted, textAlign: "center" },
});
