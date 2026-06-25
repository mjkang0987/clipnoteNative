import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

type Item = { label: string; href: string };

const ITEMS: Item[] = [
  { label: "홈", href: "/" },
  { label: "내 클립", href: "/clips" },
  { label: "소개", href: "/about" },
  { label: "자주 묻는 질문", href: "/faq" },
];

const PANEL_W = Math.min(300, Dimensions.get("window").width * 0.8);

/** 헤더 좌측 햄버거 → 좌측에서 덮으며 슬라이드 인 하는 사이드 메뉴(aside). */
export default function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const tx = useRef(new Animated.Value(-PANEL_W)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loggedIn, signOut } = useAuth();

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(tx, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [visible, tx, fade]);

  function close(after?: () => void) {
    Animated.parallel([
      Animated.timing(tx, { toValue: -PANEL_W, duration: 200, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      after?.();
    });
  }

  function go(href: string) {
    close(() => router.push(href as never));
  }

  return (
    <>
      <Pressable
        accessibilityLabel="메뉴 열기"
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        hitSlop={10}
        style={styles.burger}
      >
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => close()}
      >
        <View style={styles.root}>
          {/* 백드롭: 전체 화면 탭 → 닫기 */}
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="메뉴 닫기"
            onPress={() => close()}
          />
          {/* 딤(시각용, 터치는 통과) */}
          <Animated.View
            pointerEvents="none"
            style={[styles.overlay, { opacity: fade }]}
          />
          {/* 패널: 터치 흡수(여기 탭은 닫히지 않음) */}
          <Animated.View
            onStartShouldSetResponder={() => true}
            style={[
              styles.panel,
              { width: PANEL_W, paddingTop: insets.top + 12, transform: [{ translateX: tx }] },
            ]}
          >
          <Text style={styles.brand}>
            Clip<Text style={styles.brandAccent}>Note</Text>
          </Text>
          <View style={styles.menu}>
            {ITEMS.map((it) => (
              <Pressable
                key={it.href}
                onPress={() => go(it.href)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <Text style={styles.itemText}>{it.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                if (loggedIn) {
                  close(() => signOut());
                } else {
                  go("/login");
                }
              }}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Text style={styles.itemText}>{loggedIn ? "로그아웃" : "로그인"}</Text>
            </Pressable>
          </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  burger: { gap: 4, paddingHorizontal: 6, paddingVertical: 8 },
  bar: { width: 18, height: 2, borderRadius: 1, backgroundColor: colors.fg },

  root: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#1B1A24",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#2E2C3A",
    paddingHorizontal: 8,
  },
  brand: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  brandAccent: { color: "#A593FF" },
  menu: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2E2C3A",
    paddingTop: 4,
  },
  item: { paddingHorizontal: 12, paddingVertical: 14, borderRadius: 8 },
  itemPressed: { backgroundColor: "rgba(255,255,255,0.08)" },
  itemText: { fontSize: 16, fontWeight: "500", color: "#F4F4F5" },
});
