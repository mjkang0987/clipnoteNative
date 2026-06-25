import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radius } from "@/lib/theme";

type Mode = "add" | "replace";

type Props = {
  visible: boolean;
  count: number;
  onClose: () => void;
  onApply: (tags: string[], mode: Mode) => void;
};

/** 선택 클립에 태그 일괄 적용 — 추가(기존에 더함) / 교체(기존 무시). */
export default function TagApplyModal({ visible, count, onClose, onApply }: Props) {
  const [tagInput, setTagInput] = useState("");
  const [mode, setMode] = useState<Mode>("add");

  useEffect(() => {
    if (visible) {
      setTagInput("");
      setMode("add");
    }
  }, [visible]);

  function apply() {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);
    if (mode === "replace" || tags.length > 0) {
      onApply(tags, mode);
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.heading}>태그 적용 ({count}개)</Text>

          <Text style={styles.label}>태그 (쉼표로 구분, 최대 6개)</Text>
          <TextInput
            style={styles.input}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="개발, 디자인"
            placeholderTextColor={colors.fgMuted}
            autoCapitalize="none"
            autoFocus
          />

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setMode("add")}
              style={[styles.chip, mode === "add" && styles.chipOn]}
            >
              <Text style={[styles.chipText, mode === "add" && styles.chipTextOn]}>
                추가
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("replace")}
              style={[styles.chip, mode === "replace" && styles.chipOn]}
            >
              <Text style={[styles.chipText, mode === "replace" && styles.chipTextOn]}>
                교체
              </Text>
            </Pressable>
          </View>
          <Text style={styles.help}>
            {mode === "add"
              ? "기존 태그에 더해요."
              : "기존 태그를 지우고 이 태그로 바꿔요."}
          </Text>

          <View style={styles.row}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
            >
              <Text style={styles.btnGhostText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={apply}
              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressedPrimary]}
            >
              <Text style={styles.btnPrimaryText}>적용</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 20,
  },
  heading: { fontSize: 17, fontWeight: "700", color: colors.fg, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: colors.fg },
  input: {
    marginTop: 6,
    height: 46,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.fg,
  },
  modeRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.fgMuted },
  chipTextOn: { color: colors.brandStrong },
  help: { marginTop: 8, fontSize: 12, color: colors.fgMuted },
  row: { flexDirection: "row", gap: 8, marginTop: 20 },
  btn: { flex: 1, height: 46, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  btnGhost: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
  btnGhostText: { fontSize: 15, fontWeight: "600", color: colors.fg },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { fontSize: 15, fontWeight: "600", color: colors.white },
  pressed: { backgroundColor: colors.border },
  pressedPrimary: { backgroundColor: colors.brandStrong },
});
