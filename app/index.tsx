import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { fetchMetadata, createClip, type ClipMetadata } from "@/lib/api";
import { addLocalClip } from "@/lib/local-clips";
import { useAuth } from "@/lib/auth";
import ShareResultModal from "@/components/ShareResultModal";
import { colors, pickGradient, radius } from "@/lib/theme";

export default function Home() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<ClipMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cardW, setCardW] = useState(0);
  const [savedLocal, setSavedLocal] = useState(false);

  // 로그인 시 공유 링크 생성
  const { loggedIn, accessToken } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [savingClip, setSavingClip] = useState(false);
  const [savedClip, setSavedClip] = useState(false);

  const fetchedUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const tags = useMemo(
    () =>
      tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6),
    [tagInput],
  );

  const hasInput = url.trim().length > 0;
  const effectiveTitle =
    title.trim() || meta?.title || (hasInput ? prettyHost(url) : "여기에 제목이 표시됩니다");
  const description = meta?.description ?? null;
  const image = meta?.image ?? null;
  const seed = title.trim() || meta?.title || url || "clipnote";
  const gradient = useMemo(() => pickGradient(seed), [seed]);

  function isFetchableUrl(raw: string): boolean {
    const t = raw.trim();
    if (!t) return false;
    try {
      const u = new URL(t.startsWith("http") ? t : `https://${t}`);
      return u.hostname.includes(".");
    } catch {
      return false;
    }
  }

  async function loadMeta(raw: string) {
    const target = raw.trim();
    if (!isFetchableUrl(target)) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMetadata(target, controller.signal);
      if (controller.signal.aborted) return;
      setMeta(data);
      fetchedUrlRef.current = target;
      const fetchedTitle = data.title;
      if (fetchedTitle) setTitle((prev) => (prev.trim() ? prev : fetchedTitle));
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError("내용을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  // URL 변경 → 이전 메타·제목 초기화 + 유효하면 600ms 디바운스 후 자동 추출
  useEffect(() => {
    const t = url.trim();
    if (fetchedUrlRef.current && fetchedUrlRef.current !== t) {
      fetchedUrlRef.current = null;
      setMeta(null);
      setTitle("");
    }
    if (!isFetchableUrl(t) || fetchedUrlRef.current === t) return;
    const id = setTimeout(() => {
      void loadMeta(t);
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // 게스트: 이 기기(AsyncStorage)에 저장 → 내 클립에서 조회.
  async function handleSaveLocal() {
    const saveTitle = title.trim() || meta?.title || (hasInput ? prettyHost(url) : "");
    if (!saveTitle) return;
    await addLocalClip({
      url: url.trim(),
      title: saveTitle,
      description: meta?.description ?? null,
      image: meta?.image ?? null,
      siteName: meta?.siteName ?? null,
      gradient: gradient.name,
      tags,
    });
    setSavedLocal(true);
    setTimeout(() => setSavedLocal(false), 1800);
  }

  // 로그인: 공유 링크 생성(웹 API). 토큰을 Authorization 헤더로 전달.
  async function handleCreateShare() {
    const sendTitle = title.trim() || meta?.title || (hasInput ? prettyHost(url) : "");
    if (!sendTitle) {
      setError("공유 링크를 만들려면 제목이 필요해요. 제목을 입력해 주세요.");
      return;
    }
    setCreating(true);
    setError(null);
    setSavedClip(false);
    const res = await createClip(
      {
        url: url.trim(),
        title: sendTitle,
        description: meta?.description ?? null,
        image: meta?.image ?? null,
        siteName: meta?.siteName ?? null,
        tags,
        gradient: gradient.name,
      },
      accessToken ?? undefined,
    );
    setCreating(false);
    if (res.error || !res.shareUrl) {
      setError(res.error ?? "공유 링크 생성에 실패했어요.");
      return;
    }
    setShareUrl(res.shareUrl);
  }

  // 결과 모달의 '내 클립에 저장' — 같은 URL 클립을 saved 처리.
  async function handleAddClipDb() {
    const sendTitle = title.trim() || meta?.title || (hasInput ? prettyHost(url) : "");
    if (!sendTitle) return;
    setSavingClip(true);
    const res = await createClip(
      {
        url: url.trim(),
        title: sendTitle,
        description: meta?.description ?? null,
        image: meta?.image ?? null,
        siteName: meta?.siteName ?? null,
        tags,
        gradient: gradient.name,
        save: true,
      },
      accessToken ?? undefined,
    );
    setSavingClip(false);
    if (!res.error) setSavedClip(true);
  }

  const noMeta = meta?.source === "none";

  // OG 비율(1200:630) 기준 폰트/여백을 카드 너비에 비례 계산 (웹 cqw 대응)
  const pad = cardW * 0.06;
  const fsSite = cardW * 0.026;
  const fsTitle = effectiveTitle.length > 40 ? cardW * 0.05 : cardW * 0.06;
  const fsDesc = cardW * 0.028;
  const fsMark = cardW * 0.026;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Text style={styles.h1}>
          붙여넣으면 끝, <Text style={styles.h1brand}>예쁜 공유 카드</Text>
        </Text>
        <Text style={styles.sub}>
          링크만 넣으면 미리보기 카드와 짧은 공유 링크가 한 번에 만들어져요.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>
          URL <Text style={styles.req}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/article"
          placeholderTextColor={colors.fgMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={url}
          onChangeText={setUrl}
        />
        <Text style={styles.hint}>링크를 붙여넣으면 미리보기를 자동으로 불러와요.</Text>

        <Text style={[styles.label, styles.mt12]}>
          제목 <Text style={styles.labelMuted}>(안 쓰면 자동으로 채워져요)</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="공유 카드에 보일 제목"
          placeholderTextColor={colors.fgMuted}
          maxLength={80}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, styles.mt12]}>
          태그 <Text style={styles.labelMuted}>(선택 · 쉼표로 구분)</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="개발, 디자인, 읽을거리"
          placeholderTextColor={colors.fgMuted}
          autoCapitalize="none"
          value={tagInput}
          onChangeText={setTagInput}
        />
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
            (!hasInput || creating) && styles.btnDisabled,
          ]}
          disabled={!hasInput || creating}
          onPress={loggedIn ? handleCreateShare : handleSaveLocal}
        >
          <Text style={styles.primaryBtnText}>
            {loggedIn
              ? creating
                ? "만드는 중…"
                : "공유 링크 만들기"
              : savedLocal
                ? "저장됨 ✓"
                : "이 기기에 저장"}
          </Text>
        </Pressable>
        {!loggedIn && (
          <Text style={styles.saveHint}>
            짧은 공유 링크는{" "}
            <Text style={styles.hintLink} onPress={() => router.push("/login")}>
              로그인
            </Text>{" "}
            후 만들 수 있어요.
          </Text>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {noMeta && meta?.reason && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>⚠️ {meta.reason}</Text>
        </View>
      )}

      {hasInput && (
        <>
          {/* ① 공유 카드 미리보기 (실제 OG 이미지 구성과 동일) */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>공유 카드</Text>
              {loading && <ActivityIndicator size="small" color={colors.brand} />}
            </View>
            <Text style={styles.sectionDesc}>링크를 공유하면 이렇게 보여요</Text>

            <View
              style={styles.cardWrap}
              onLayout={(e) => setCardW(e.nativeEvent.layout.width)}
            >
              <LinearGradient
                colors={[gradient.from, gradient.to]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.ogCard, { padding: pad }]}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.28)"]}
                  style={styles.scrim}
                  pointerEvents="none"
                />
                {!!meta?.siteName && (
                  <Text style={[styles.ogSite, { fontSize: fsSite }]} numberOfLines={1}>
                    {meta.siteName.toUpperCase()}
                  </Text>
                )}
                <Text style={[styles.ogTitle, { fontSize: fsTitle }]} numberOfLines={3}>
                  {effectiveTitle}
                </Text>
                {!!description && (
                  <Text style={[styles.ogDesc, { fontSize: fsDesc }]} numberOfLines={2}>
                    {description}
                  </Text>
                )}
                <Text style={[styles.ogMark, { fontSize: fsMark }]}>ClipNote</Text>
              </LinearGradient>
            </View>
            <Text style={styles.caption}>
              실제 공유 시 떠는 이미지예요. 배경색은 제목에 따라 자동으로 정해져요.
            </Text>
          </View>

          {/* ② 내 클립 저장 모습 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내 클립에 저장하면</Text>
            <Text style={styles.sectionDesc}>목록에서 이렇게 보여요</Text>
            <View style={styles.clipCard}>
              <View style={styles.thumbWrap}>
                <LinearGradient
                  colors={[gradient.from, gradient.to]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {!!image && (
                  <Image source={{ uri: image }} style={styles.thumb} contentFit="cover" />
                )}
              </View>
              <View style={styles.clipBody}>
                <Text style={styles.clipTitle} numberOfLines={1}>
                  {effectiveTitle}
                </Text>
                {hasInput && (
                  <Text style={styles.clipHost} numberOfLines={1}>
                    {prettyHost(url)}
                  </Text>
                )}
                {tags.length > 0 && (
                  <View style={styles.tagRowSm}>
                    {tags.map((t) => (
                      <View key={t} style={styles.tagSm}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.caption}>
              왼쪽 썸네일은 원본 페이지의 대표 이미지예요. 없으면 그라디언트로 채워져요.
            </Text>
          </View>
        </>
      )}

      <ShareResultModal
        url={shareUrl}
        saving={savingClip}
        saved={savedClip}
        onSave={handleAddClipDb}
        onClose={() => {
          setShareUrl(null);
          setSavedClip(false);
        }}
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
  content: { padding: 16, paddingBottom: 48 },

  hero: { alignItems: "center", paddingVertical: 16 },
  h1: { fontSize: 24, fontWeight: "700", color: colors.fg, textAlign: "center" },
  h1brand: { color: colors.brand },
  sub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.fgMuted,
    textAlign: "center",
    maxWidth: 340,
  },

  form: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.fg },
  labelMuted: { fontWeight: "400", color: colors.fgMuted },
  req: { color: colors.danger },
  mt12: { marginTop: 12 },
  input: {
    marginTop: 6,
    height: 46,
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.fg,
  },
  hint: { marginTop: 6, fontSize: 12, color: colors.fgMuted },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagRowSm: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tagSm: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 12, fontWeight: "500", color: colors.brandStrong },

  primaryBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnPressed: { backgroundColor: colors.brandStrong },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  btnDisabled: { opacity: 0.5 },
  saveHint: { marginTop: 8, fontSize: 12, color: colors.fgMuted, textAlign: "center" },
  hintLink: { color: colors.brandStrong, fontWeight: "600" },

  errorBox: {
    marginTop: 16,
    backgroundColor: "rgba(220,38,38,0.1)",
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: colors.danger, fontSize: 14 },
  warnBox: {
    marginTop: 16,
    backgroundColor: "rgba(217,119,6,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(217,119,6,0.3)",
    borderRadius: 8,
    padding: 12,
  },
  warnText: { color: colors.fg, fontSize: 14 },

  section: { marginTop: 40 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: colors.fg },
  sectionDesc: { marginTop: 2, fontSize: 12, color: colors.fgMuted },

  cardWrap: {
    marginTop: 8,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  ogCard: {
    width: "100%",
    aspectRatio: 1200 / 630,
    justifyContent: "flex-end",
  },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "70%" },
  ogSite: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "700",
    letterSpacing: 1,
  },
  ogTitle: { color: "#fff", fontWeight: "700", marginTop: 6, lineHeight: undefined },
  ogDesc: { color: "rgba(255,255,255,0.9)", marginTop: 6 },
  ogMark: { color: "rgba(255,255,255,0.95)", fontWeight: "700", marginTop: 8 },

  caption: { marginTop: 6, fontSize: 12, color: colors.fgMuted },

  clipCard: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  clipBody: { flex: 1, minWidth: 0 },
  clipTitle: { fontSize: 14, fontWeight: "600", color: colors.fg },
  clipHost: { fontSize: 13, color: colors.fgMuted, marginTop: 1 },
});
