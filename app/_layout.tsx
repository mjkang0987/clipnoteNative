import { Link, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.fg,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "ClipNote",
            headerRight: () => (
              <Link href="/about" asChild>
                <Text style={{ color: colors.brandStrong, fontWeight: "600", fontSize: 15 }}>
                  소개
                </Text>
              </Link>
            ),
          }}
        />
        <Stack.Screen name="about" options={{ title: "ClipNote 소개" }} />
      </Stack>
    </>
  );
}
