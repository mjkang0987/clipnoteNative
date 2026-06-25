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

type Props = {
  clip: { title: string; tags: string[] } | null;
  onClose: () => void;
  onSubmit: (title: string, tags: string[]) => void | Promise<void>;
};

/** 단건 편집 모달 — 제목·태그 수정(저장 방식은 부모가 결정: 로컬/DB). */
export default function EditClipModal({ clip, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clip) {
      setTitle(clip.title);
      setTagInput(clip.tags.join(", "));
    }
  }, [clip]);

  async function save() {
    if (!clip || saving) return;
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);
    const t = title.trim() || clip.title;
    setSaving(true);
    await onSubmit(t, tags);
    setSaving(false);
    onClose();
  }

  return (
    <Modal
      visible={clip !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.heading}>클립 편집</Text>

          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목"
            placeholderTextColor={colors.fgMuted}
            maxLength={80}
          />

          <Text style={[styles.label, styles.mt12]}>태그 (쉼표로 구분, 최대 6개)</Text>
          <TextInput
            style={styles.input}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="개발, 디자인"
            placeholderTextColor={colors.fgMuted}
            autoCapitalize="none"
          />

          <View style={styles.row}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
            >
              <Text style={styles.btnGhostText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressedPrimary]}
            >
              <Text style={styles.btnPrimaryText}>{saving ? "저장 중…" : "저장"}</Text>
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
  mt12: { marginTop: 12 },
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
  row: { flexDirection: "row", gap: 8, marginTop: 20 },
  btn: { flex: 1, height: 46, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  btnGhost: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
  btnGhostText: { fontSize: 15, fontWeight: "600", color: colors.fg },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { fontSize: 15, fontWeight: "600", color: colors.white },
  pressed: { backgroundColor: colors.border },
  pressedPrimary: { backgroundColor: colors.brandStrong },
});
