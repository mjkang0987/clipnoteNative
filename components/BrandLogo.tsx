import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

/** 아이콘 + ClipNote 워드마크 락업(밝은 배경용). */
export default function BrandLogo({ size = 18 }: { size?: number }) {
  const icon = Math.round(size * 1.25);
  return (
    <View style={styles.row}>
      <Image
        source={require("../assets/icon.png")}
        style={{ width: icon, height: icon, borderRadius: Math.round(icon * 0.28) }}
        accessibilityLabel="ClipNote"
      />
      <Text style={[styles.text, { fontSize: size }]}>
        Clip<Text style={styles.accent}>Note</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  text: { fontWeight: "700", color: colors.fg },
  accent: { color: colors.brand },
});
