import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/lib/auth";
import HeaderMenu from "@/components/HeaderMenu";
import HeaderClipsLink from "@/components/HeaderClipsLink";
import HeaderNewClip from "@/components/HeaderNewClip";
import MigrateLocalClips from "@/components/MigrateLocalClips";
import BrandLogo from "@/components/BrandLogo";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <MigrateLocalClips />
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
              headerTitle: () => <BrandLogo />,
              headerLeft: () => <HeaderMenu />,
              headerRight: () => <HeaderClipsLink />,
            }}
          />
          <Stack.Screen
            name="clips"
            options={{
              title: "내 클립",
              headerLeft: () => <HeaderMenu />,
              headerRight: () => <HeaderNewClip />,
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              title: "로그인",
              headerLeft: () => <HeaderMenu />,
              headerRight: () => <HeaderNewClip />,
            }}
          />
          <Stack.Screen
            name="about"
            options={{
              title: "소개",
              headerLeft: () => <HeaderMenu />,
              headerRight: () => <HeaderNewClip />,
            }}
          />
          <Stack.Screen
            name="faq"
            options={{
              title: "자주 묻는 질문",
              headerLeft: () => <HeaderMenu />,
              headerRight: () => <HeaderNewClip />,
            }}
          />
          <Stack.Screen name="auth/naver" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
