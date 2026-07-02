import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import { AuthProvider } from "@/lib/auth";
import HeaderMenu from "@/components/HeaderMenu";
import HeaderClipsLink from "@/components/HeaderClipsLink";
import HeaderNewClip from "@/components/HeaderNewClip";
import MigrateLocalClips from "@/components/MigrateLocalClips";
import BrandLogo from "@/components/BrandLogo";
import { colors } from "@/lib/theme";

/** 타 앱에서 "공유 → ClipNote" 로 들어오면 홈으로 보낸다(홈이 URL 을 받아 생성 흐름 시작). */
function ShareIntentGate() {
  const { hasShareIntent } = useShareIntentContext();
  const router = useRouter();
  useEffect(() => {
    if (hasShareIntent) router.replace("/");
  }, [hasShareIntent, router]);
  return null;
}

export default function RootLayout() {
  return (
    <ShareIntentProvider options={{ resetOnBackground: true }}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ShareIntentGate />
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
          <Stack.Screen
            name="account/delete"
            options={{
              title: "회원 탈퇴",
              headerLeft: () => <HeaderMenu />,
            }}
          />
          <Stack.Screen name="auth/naver" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
    </ShareIntentProvider>
  );
}
