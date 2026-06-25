import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { colors, radius } from "@/lib/theme";

type Props = {
  url: string | null;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
};

/** 공유 링크 생성 결과 — 복사·열기·내 클립에 저장·닫기. */
export default function ShareResultModal({ url, onClose, onSave, saving, saved }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal visible={url !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.heading}>공유 링크가 만들어졌어요 🎉</Text>
          <Text style={styles.desc}>
            링크를 복사해 공유하세요. 열면 공유 카드가 먼저 보인 뒤 원본으로 이동해요.
          </Text>

          <View style={styles.urlBox}>
            <Text style={styles.urlText} numberOfLines={1}>
              {url}
            </Text>
          </View>

          <View style={styles.row}>
            <Pressable
              onPress={copy}
              style={({ pressed }) => [styles.btn, styles.primary, pressed && styles.pressedP]}
            >
              <Text style={styles.primaryText}>{copied ? "복사됨 ✓" : "링크 복사"}</Text>
            </Pressable>
            <Pressable
              onPress={() => url && WebBrowser.openBrowserAsync(url)}
              style={({ pressed }) => [styles.btn, styles.ghost, pressed && styles.pressed]}
            >
              <Text style={styles.ghostText}>열기</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onSave}
            disabled={saving || saved}
            style={({ pressed }) => [
              styles.saveBtn,
              (saving || saved) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.saveText}>
              {saved ? "내 클립에 저장됨 ✓" : saving ? "저장 중…" : "내 클립에 저장"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
    paddingBottom: 32,
  },
  heading: { fontSize: 17, fontWeight: "700", color: colors.fg },
  desc: { marginTop: 6, fontSize: 13, lineHeight: 20, color: colors.fgMuted },
  urlBox: {
    marginTop: 14,
    height: 44,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  urlText: { fontSize: 13, color: colors.fg },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: { height: 46, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  primary: { flex: 1, backgroundColor: colors.brand },
  primaryText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  ghost: {
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ghostText: { color: colors.fg, fontSize: 14, fontWeight: "600" },
  saveBtn: {
    marginTop: 8,
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: colors.brandStrong, fontSize: 14, fontWeight: "600" },
  closeBtn: { marginTop: 8, height: 44, alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.fgMuted, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  pressedP: { backgroundColor: colors.brandStrong },
});
