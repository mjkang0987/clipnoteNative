import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getLocalClips,
  removeLocalClip,
  updateLocalClip,
  type LocalClip,
} from "@/lib/local-clips";
import EditClipModal from "@/components/EditClipModal";
import TagApplyModal from "@/components/TagApplyModal";
import { GRADIENTS, colors, pickGradient, radius } from "@/lib/theme";

export default function Clips() {
  const [clips, setClips] = useState<LocalClip[] | null>(null);
  const [editing, setEditing] = useState<LocalClip | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [tagModal, setTagModal] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLocalClips().then((list) => {
        if (active) setClips(list);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  function enterSelect(url: string) {
    setSelectMode(true);
    setSelected([url]);
  }
  function exitSelect() {
    setSelectMode(false);
    setSelected([]);
  }
  function toggle(url: string) {
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]));
  }

  function confirmDelete(clip: LocalClip) {
    Alert.alert("클립 삭제", `‘${clip.title}’ 클립을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => setClips(await removeLocalClip(clip.url)),
      },
    ]);
  }

  async function applyTags(tags: string[], mode: "add" | "replace") {
    const list = clips ?? [];
    for (const url of selected) {
      const cur = list.find((c) => c.url === url)?.tags ?? [];
      const next =
        mode === "add"
          ? Array.from(new Set([...cur, ...tags])).slice(0, 6)
          : tags.slice(0, 6);
      await updateLocalClip(url, { tags: next });
    }
    setClips(await getLocalClips());
    exitSelect();
  }

  function confirmBulkDelete() {
    if (selected.length === 0) return;
    Alert.alert("클립 삭제", `선택한 ${selected.length}개 클립을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          let list = clips ?? [];
          for (const url of selected) list = await removeLocalClip(url);
          setClips(list);
          exitSelect();
        },
      },
    ]);
  }

  if (clips === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.dim}>불러오는 중…</Text>
      </View>
    );
  }

  if (clips.length === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>아직 저장한 클립이 없어요.</Text>
          <Pressable
            onPress={() => router.push("/")}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>첫 클립 만들기</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          selectMode && { paddingBottom: insets.bottom + 88 },
        ]}
      >
        <View style={styles.toolbar}>
          {selectMode ? (
            <>
              <Pressable onPress={exitSelect} hitSlop={8}>
                <Text style={styles.toolLink}>취소</Text>
              </Pressable>
              <Text style={styles.toolCount}>{selected.length}개 선택</Text>
            </>
          ) : (
            <Pressable onPress={() => setSelectMode(true)} hitSlop={8} style={styles.toolRight}>
              <Text style={styles.toolLink}>선택</Text>
            </Pressable>
          )}
        </View>

        {clips.map((clip) => {
          const g =
            GRADIENTS.find((x) => x.name === clip.gradient) ??
            pickGradient(clip.title || clip.url);
          const isSel = selected.includes(clip.url);

          const card = (
            <Pressable
              onPress={() =>
                selectMode ? toggle(clip.url) : WebBrowser.openBrowserAsync(clip.url)
              }
              onLongPress={() => {
                if (!selectMode) enterSelect(clip.url);
              }}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              {selectMode && (
                <View style={[styles.checkbox, isSel && styles.checkboxOn]}>
                  {isSel && <Text style={styles.checkMark}>✓</Text>}
                </View>
              )}
              <View style={styles.thumb}>
                <LinearGradient
                  colors={[g.from, g.to]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {!!clip.image && (
                  <Image source={{ uri: clip.image }} style={styles.thumbImg} contentFit="cover" />
                )}
              </View>

              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>
                  {clip.title}
                </Text>
                <Text style={styles.host} numberOfLines={1}>
                  {prettyHost(clip.url)}
                </Text>
                {clip.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {clip.tags.map((t) => (
                      <View key={t} style={styles.tag}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {!selectMode && <Text style={styles.swipeHint}>‹</Text>}
            </Pressable>
          );

          // 선택 모드에선 스와이프 비활성(탭=선택). 일반 모드만 Swipeable.
          return selectMode ? (
            <View key={clip.url}>{card}</View>
          ) : (
            <Swipeable
              key={clip.url}
              friction={2}
              rightThreshold={40}
              renderRightActions={() => (
                <View style={styles.swipeActions}>
                  <Pressable
                    onPress={() => setEditing(clip)}
                    style={[styles.swipeBtn, styles.swipeEdit]}
                    accessibilityLabel="클립 편집"
                  >
                    <Text style={styles.swipeText}>편집</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(clip)}
                    style={[styles.swipeBtn, styles.swipeDel]}
                    accessibilityLabel="클립 삭제"
                  >
                    <Text style={styles.swipeText}>삭제</Text>
                  </Pressable>
                </View>
              )}
            >
              {card}
            </Swipeable>
          );
        })}

        <EditClipModal
          clip={editing}
          onClose={() => setEditing(null)}
          onSaved={(list) => setClips(list)}
        />
      </ScrollView>

      {selectMode && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.barRow}>
            <Pressable
              disabled={selected.length === 0}
              onPress={() => setTagModal(true)}
              style={({ pressed }) => [
                styles.barBtn,
                styles.tagBtn,
                selected.length === 0 && styles.btnDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.tagBtnText}>태그 적용</Text>
            </Pressable>
            <Pressable
              disabled={selected.length === 0}
              onPress={confirmBulkDelete}
              style={({ pressed }) => [
                styles.barBtn,
                styles.bulkBtn,
                selected.length === 0 && styles.btnDisabled,
                pressed && styles.pressedDanger,
              ]}
            >
              <Text style={styles.bulkBtnText}>삭제 ({selected.length})</Text>
            </Pressable>
          </View>
        </View>
      )}

      <TagApplyModal
        visible={tagModal}
        count={selected.length}
        onClose={() => setTagModal(false)}
        onApply={applyTags}
      />
    </View>
  );
}

function prettyHost(raw: string): string {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return raw;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  dim: { fontSize: 14, color: colors.fgMuted },

  emptyBox: {
    marginTop: 40,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 40,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: colors.fgMuted },
  btn: {
    marginTop: 12,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  btnPressed: { backgroundColor: colors.brandStrong },
  btnText: { color: colors.white, fontSize: 14, fontWeight: "600" },

  toolbar: { flexDirection: "row", alignItems: "center", minHeight: 28 },
  toolRight: { marginLeft: "auto" },
  toolLink: { fontSize: 15, fontWeight: "600", color: colors.brandStrong },
  toolCount: { marginLeft: 12, fontSize: 14, color: colors.fgMuted },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  cardPressed: { backgroundColor: colors.border },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkMark: { color: colors.white, fontSize: 13, fontWeight: "700" },

  thumb: { width: 56, height: 56, borderRadius: 8, overflow: "hidden" },
  thumbImg: { width: "100%", height: "100%" },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: "600", color: colors.fg },
  host: { fontSize: 13, color: colors.fgMuted, marginTop: 1 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tag: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 12, fontWeight: "500", color: colors.brandStrong },

  swipeHint: { fontSize: 18, color: colors.border, paddingLeft: 4 },
  swipeActions: { flexDirection: "row", alignItems: "stretch", marginLeft: 8, gap: 8 },
  swipeBtn: {
    width: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  swipeEdit: { backgroundColor: colors.brand },
  swipeDel: { backgroundColor: colors.danger },
  swipeText: { color: colors.white, fontSize: 14, fontWeight: "600" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  barRow: { flexDirection: "row", gap: 8 },
  barBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tagBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  tagBtnText: { color: colors.brandStrong, fontSize: 15, fontWeight: "600" },
  bulkBtn: { backgroundColor: colors.danger },
  bulkBtnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  btnDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  pressedDanger: { opacity: 0.85 },
});
