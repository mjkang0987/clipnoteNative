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
import {
  getLocalClips,
  removeLocalClip,
  type LocalClip,
} from "@/lib/local-clips";
import EditClipModal from "@/components/EditClipModal";
import { GRADIENTS, colors, pickGradient, radius } from "@/lib/theme";

export default function Clips() {
  const [clips, setClips] = useState<LocalClip[] | null>(null);
  const [editing, setEditing] = useState<LocalClip | null>(null);
  const router = useRouter();

  // 화면에 들어올 때마다 최신 로컬 클립 로드(저장 직후 반영).
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {clips.map((clip) => {
        const g =
          GRADIENTS.find((x) => x.name === clip.gradient) ??
          pickGradient(clip.title || clip.url);
        return (
          <Pressable
            key={clip.url}
            onPress={() => WebBrowser.openBrowserAsync(clip.url)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
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

            <View style={styles.actions}>
              <Pressable
                onPress={() => setEditing(clip)}
                hitSlop={8}
                style={styles.action}
                accessibilityLabel="클립 편집"
              >
                <Text style={styles.editText}>편집</Text>
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(clip)}
                hitSlop={8}
                style={styles.action}
                accessibilityLabel="클립 삭제"
              >
                <Text style={styles.delText}>삭제</Text>
              </Pressable>
            </View>
          </Pressable>
        );
      })}

      <EditClipModal
        clip={editing}
        onClose={() => setEditing(null)}
        onSaved={(list) => setClips(list)}
      />
    </ScrollView>
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

  actions: { alignItems: "flex-end", gap: 10, paddingLeft: 4 },
  action: { paddingHorizontal: 4, paddingVertical: 2 },
  editText: { fontSize: 13, fontWeight: "500", color: colors.brandStrong },
  delText: { fontSize: 13, fontWeight: "500", color: colors.danger },
});
