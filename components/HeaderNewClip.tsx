import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { colors } from "@/lib/theme";

/** 헤더 우측 '+ 새 클립' — 홈(생성 화면)으로 이동. */
export default function HeaderNewClip() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.replace("/")}
      hitSlop={8}
      style={{ paddingHorizontal: 6, paddingVertical: 8 }}
      accessibilityRole="button"
      accessibilityLabel="새 클립"
    >
      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.brandStrong }}>
        + 새 클립
      </Text>
    </Pressable>
  );
}
