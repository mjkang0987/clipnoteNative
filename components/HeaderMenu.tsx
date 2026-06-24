import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, radius } from "@/lib/theme";

type Item = { label: string; href: string };

const ITEMS: Item[] = [
  { label: "소개", href: "/about" },
  { label: "자주 묻는 질문", href: "/faq" },
];

/** 헤더 좌측 햄버거 버튼 + 드롭다운 메뉴(모달). 항목 선택 시 해당 페이지로 이동. */
export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function go(href: string) {
    setOpen(false);
    router.push(href as never);
  }

  return (
    <>
      <Pressable
        accessibilityLabel="메뉴 열기"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        hitSlop={10}
        style={styles.burger}
      >
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {ITEMS.map((it, i) => (
              <Pressable
                key={it.href}
                onPress={() => go(it.href)}
                style={({ pressed }) => [
                  styles.item,
                  i > 0 && styles.itemBorder,
                  pressed && styles.itemPressed,
                ]}
              >
                <Text style={styles.itemText}>{it.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  burger: { gap: 4, paddingHorizontal: 6, paddingVertical: 8 },
  bar: { width: 18, height: 2, borderRadius: 1, backgroundColor: colors.fg },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  sheet: {
    position: "absolute",
    top: 8,
    left: 12,
    minWidth: 180,
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  item: { paddingHorizontal: 16, paddingVertical: 13 },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemPressed: { backgroundColor: colors.surface },
  itemText: { fontSize: 15, fontWeight: "500", color: colors.fg },
});
