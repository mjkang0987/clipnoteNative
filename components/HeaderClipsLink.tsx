import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { colors } from "@/lib/theme";

/** 헤더 우측 '내 클립' 바로가기. */
export default function HeaderClipsLink() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.replace("/clips")}
      hitSlop={8}
      style={{ paddingHorizontal: 6, paddingVertical: 8 }}
      accessibilityRole="button"
    >
      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.brandStrong }}>
        내 클립
      </Text>
    </Pressable>
  );
}
