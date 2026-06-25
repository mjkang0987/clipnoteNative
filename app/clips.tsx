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
import * as Clipboard from "expo-clipboard";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getLocalClips,
  removeLocalClip,
  updateLocalClip,
} from "@/lib/local-clips";
import { getClips, updateClip, deleteClip } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import EditClipModal from "@/components/EditClipModal";
import TagApplyModal from "@/components/TagApplyModal";
import { GRADIENTS, colors, pickGradient, radius } from "@/lib/theme";

// 로컬·DB 클립을 한 형태로 통합. id = slug(DB) 또는 url(로컬).
type UClip = {
  id: string;
  slug?: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string | null;
  gradient: string;
  tags: string[];
  shared: boolean; // 공개 브릿지 링크 켜졌는지(DB). 로컬은 항상 false.
  local: boolean;
};

export default function Clips() {
  const { loggedIn, accessToken } = useAuth();
  const [clips, setClips] = useState<UClip[] | null>(null);
  const [editing, setEditing] = useState<UClip | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [tagModal, setTagModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const load = useCallback(async (): Promise<UClip[]> => {
    if (loggedIn) {
      const { clips: db } = await getClips(accessToken ?? undefined);
      return db.map((c) => ({
        id: c.slug,
        slug: c.slug,
        url: c.url,
        title: c.title,
        description: c.description,
        image: c.image,
        siteName: c.siteName,
        gradient: c.gradient,
        tags: c.tags ?? [],
        shared: c.shared ?? true,
        local: false,
      }));
    }
    const local = await getLocalClips();
    return local.map((c) => ({
      id: c.url,
      url: c.url,
      title: c.title,
      description: c.description,
      image: c.image,
      siteName: c.siteName,
      gradient: c.gradient,
      tags: c.tags ?? [],
      shared: false,
      local: true,
    }));
  }, [loggedIn, accessToken]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load().then((list) => {
        if (active) setClips(list);
      });
      return () => {
        active = false;
      };
    }, [load]),
  );

  async function reload() {
    setClips(await load());
  }

  function enterSelect(id: string) {
    setSelectMode(true);
    setSelected([id]);
  }
  function exitSelect() {
    setSelectMode(false);
    setSelected([]);
  }
  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  // key 별 복사 피드백(원본/공유 구분). value = 복사할 텍스트.
  async function copyAs(key: string, text: string) {
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  }

  // 새 공유 액션(만들기/복사)은 백엔드 연결 전 placeholder — 버튼만.
  function sharePlaceholder(kind: "create" | "copy") {
    Alert.alert(
      "준비 중",
      kind === "create"
        ? "‘공유 링크 만들기’는 곧 연결돼요."
        : "‘공유 링크 복사’는 곧 연결돼요.",
    );
  }

  async function removeOne(clip: UClip) {
    if (clip.local) await removeLocalClip(clip.url);
    else if (clip.slug) await deleteClip(clip.slug, accessToken ?? undefined);
  }

  async function saveEdit(clip: UClip, title: string, tags: string[]) {
    if (clip.local) await updateLocalClip(clip.url, { title, tags });
    else if (clip.slug) await updateClip(clip.slug, { title, tags }, accessToken ?? undefined);
  }

  function confirmDelete(clip: UClip) {
    Alert.alert("클립 삭제", `‘${clip.title}’ 클립을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await removeOne(clip);
          reload();
        },
      },
    ]);
  }

  function confirmBulkDelete() {
    if (selected.length === 0 || !clips) return;
    Alert.alert("클립 삭제", `선택한 ${selected.length}개 클립을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          for (const id of selected) {
            const c = clips.find((x) => x.id === id);
            if (c) await removeOne(c);
          }
          await reload();
          exitSelect();
        },
      },
    ]);
  }

  async function applyTags(tags: string[], mode: "add" | "replace") {
    if (!clips) return;
    for (const id of selected) {
      const c = clips.find((x) => x.id === id);
      if (!c) continue;
      const next =
        mode === "add"
          ? Array.from(new Set([...c.tags, ...tags])).slice(0, 6)
          : tags.slice(0, 6);
      if (c.local) await updateLocalClip(c.url, { tags: next });
      else if (c.slug) await updateClip(c.slug, { tags: next }, accessToken ?? undefined);
    }
    await reload();
    exitSelect();
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
            onPress={() => router.replace("/")}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>첫 클립 만들기</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const allTags = Array.from(new Set(clips.flatMap((c) => c.tags)));
  const filtered =
    activeTag && allTags.includes(activeTag)
      ? clips.filter((c) => c.tags.includes(activeTag))
      : clips;

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

        {!selectMode && allTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <FilterChip label="전체" active={activeTag === null} onPress={() => setActiveTag(null)} />
            {allTags.map((t) => (
              <FilterChip
                key={t}
                label={t}
                active={activeTag === t}
                onPress={() => setActiveTag(t)}
              />
            ))}
          </ScrollView>
        )}

        {filtered.length === 0 ? (
          <Text style={styles.filterEmpty}>‘{activeTag}’ 태그의 클립이 없어요.</Text>
        ) : null}

        {filtered.map((clip) => {
          const g =
            GRADIENTS.find((x) => x.name === clip.gradient) ??
            pickGradient(clip.title || clip.url);
          const isSel = selected.includes(clip.id);

          const card = (
            <View style={styles.card}>
              <Pressable
                onPress={() => {
                  if (selectMode) toggle(clip.id);
                }}
                onLongPress={() => {
                  if (!selectMode) enterSelect(clip.id);
                }}
                style={({ pressed }) => [styles.cardMain, pressed && styles.cardPressed]}
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
                  <Text style={styles.title} numberOfLines={2}>
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

              {!selectMode && (
                <View style={styles.cardActions}>
                  {/* DB 클립만 공유 액션 노출. shared=true→복사, false→만들기. (로컬은 없음) */}
                  {!clip.local && (
                    <>
                      <Pressable
                        onPress={() => sharePlaceholder(clip.shared ? "copy" : "create")}
                        style={({ pressed }) => [styles.cardAction, pressed && styles.actionPressed]}
                      >
                        <Text style={styles.actionText} numberOfLines={1} adjustsFontSizeToFit>
                          {clip.shared ? "공유 링크 복사" : "공유 링크 만들기"}
                        </Text>
                      </Pressable>
                      <View style={styles.actionDivider} />
                    </>
                  )}
                  <Pressable
                    onPress={() => WebBrowser.openBrowserAsync(clip.url)}
                    style={({ pressed }) => [styles.cardAction, pressed && styles.actionPressed]}
                  >
                    <Text style={styles.actionNeutral} numberOfLines={1} adjustsFontSizeToFit>
                      바로가기
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );

          return selectMode ? (
            <View key={clip.id}>{card}</View>
          ) : (
            <Swipeable
              key={clip.id}
              friction={2}
              rightThreshold={40}
              renderRightActions={() => (
                <View style={styles.swipeActions}>
                  <Pressable
                    onPress={() => setEditing(clip)}
                    style={[styles.swipeBtn, styles.swipeEdit]}
                  >
                    <Text style={styles.swipeText}>편집</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(clip)}
                    style={[styles.swipeBtn, styles.swipeDel]}
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
          clip={editing ? { title: editing.title, tags: editing.tags } : null}
          onClose={() => setEditing(null)}
          onSubmit={async (title, tags) => {
            if (editing) {
              await saveEdit(editing, title, tags);
              await reload();
            }
          }}
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

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipOn]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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

  filterRow: { gap: 8, alignItems: "center" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  filterChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterChipText: { fontSize: 13, fontWeight: "500", color: colors.fgMuted },
  filterChipTextOn: { color: colors.white },
  filterEmpty: { marginTop: 24, fontSize: 14, color: colors.fgMuted, textAlign: "center" },

  card: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  cardMain: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  cardPressed: { backgroundColor: colors.border },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cardAction: { flex: 1, paddingVertical: 11, alignItems: "center", justifyContent: "center" },
  actionPressed: { backgroundColor: colors.border },
  actionDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  actionText: { fontSize: 13, fontWeight: "600", color: colors.brandStrong },
  actionNeutral: { fontSize: 13, fontWeight: "600", color: colors.fg },
  actionMuted: { fontSize: 13, fontWeight: "600", color: colors.fgMuted },

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
  swipeBtn: { width: 68, alignItems: "center", justifyContent: "center", borderRadius: radius.md },
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
  barBtn: { flex: 1, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
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
