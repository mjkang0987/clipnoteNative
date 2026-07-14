import { useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { markOnboardingSeen } from "@/lib/onboarding";
import { colors, radius } from "@/lib/theme";

const { width: SCREEN_W } = Dimensions.get("window");

type Step = { n: number; text: string };
type Slide = {
  key: string;
  emoji: string;
  title: string;
  body?: string[];
  steps?: Step[];
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    emoji: "🔗",
    title: "링크만 붙여넣으면\n예쁜 공유 카드",
    body: ["ClipNote가 밋밋한 링크를 클릭하고 싶은 카드로 바꿔 줘요."],
  },
  {
    key: "how",
    emoji: "✨",
    title: "이렇게 동작해요",
    steps: [
      { n: 1, text: "공유할 URL을 붙여넣어요." },
      { n: 2, text: "제목·설명·이미지를 자동으로 읽어 카드를 완성해요." },
      { n: 3, text: "로그인하면 짧은 공유 링크까지 만들어져요." },
    ],
  },
  {
    key: "more",
    emoji: "📚",
    title: "이런 것도 돼요",
    body: [
      "인스타·네이버 카페처럼 미리보기가 안 잡히는 링크도 알아서 정리해요.",
      "로그인만 하면 어느 기기·브라우저에서든 내 북마크를 볼 수 있어요.",
    ],
  },
  {
    key: "share",
    emoji: "🚀",
    title: "공유는 클릭 한 번",
    body: [
      "공유용 페이지를 자동으로 만들어 줘요.",
      "굳이 설명을 안 써도 받는 사람이 한눈에 알아봐요.",
    ],
  },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  async function finish() {
    await markOnboardingSeen();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function next() {
    if (isLast) {
      void finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: SCREEN_W * (index + 1), animated: true });
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== index) setIndex(i);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        {!isLast ? (
          <Pressable onPress={finish} hitSlop={12} style={styles.skipBtn}>
            <Text style={styles.skipText}>건너뛰기</Text>
          </Pressable>
        ) : (
          <View style={styles.skipBtn} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}
      >
        {SLIDES.map((s) => (
          <View key={s.key} style={[styles.slide, { width: SCREEN_W }]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.title}>{s.title}</Text>

            {s.steps ? (
              <View style={styles.stepList}>
                {s.steps.map((st) => (
                  <View key={st.n} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{st.n}</Text>
                    </View>
                    <Text style={styles.stepText}>{st.text}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.bodyList}>
                {s.body?.map((line, i) => (
                  <Text key={i} style={styles.bodyText}>
                    {line}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={next}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>{isLast ? "시작하기" : "다음"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    height: 44,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  skipBtn: { minWidth: 64, alignItems: "flex-end", paddingVertical: 8 },
  skipText: { fontSize: 15, color: colors.fgMuted },

  pager: { flex: 1 },
  slide: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 64, marginBottom: 28 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.fg,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 24,
  },

  bodyList: { gap: 12 },
  bodyText: {
    fontSize: 16,
    color: colors.fgMuted,
    textAlign: "center",
    lineHeight: 24,
  },

  stepList: { gap: 18, alignSelf: "stretch" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  stepText: { flex: 1, fontSize: 16, color: colors.fg, lineHeight: 23 },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.brand, width: 20 },

  footer: { paddingHorizontal: 24 },
  cta: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPressed: { backgroundColor: colors.brandStrong },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "700" },
});
