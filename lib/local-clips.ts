// 비로그인 사용자의 '내 클립' — 이 기기(AsyncStorage)에만 보관(공유 X).
// 웹 lib/local-clips.ts 의 모바일 버전(비동기).

import AsyncStorage from "@react-native-async-storage/async-storage";

export type LocalClip = {
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string | null;
  gradient: string;
  tags: string[];
  savedAt: string; // ISO
};

const KEY = "clipnote.localClips.v1";
const TAGS_KEY = "clipnote.knownTags.v1";
const MAX = 300;

export async function getLocalClips(): Promise<LocalClip[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalClip[]) : [];
  } catch {
    return [];
  }
}

export async function addLocalClip(
  clip: Omit<LocalClip, "savedAt">,
): Promise<LocalClip[]> {
  const next: LocalClip = { ...clip, savedAt: new Date().toISOString() };
  // 같은 URL 은 최신으로 갱신(중복 방지)
  const rest = (await getLocalClips()).filter((c) => c.url !== next.url);
  const list = [next, ...rest].slice(0, MAX);
  await save(list);
  await recordTags(clip.tags);
  return list;
}

export async function removeLocalClip(url: string): Promise<LocalClip[]> {
  const list = (await getLocalClips()).filter((c) => c.url !== url);
  await save(list);
  return list;
}

/** 단건 편집 — 제목·태그 갱신(주어진 필드만). */
export async function updateLocalClip(
  url: string,
  patch: { title?: string; tags?: string[] },
): Promise<LocalClip[]> {
  const list = (await getLocalClips()).map((c) =>
    c.url === url
      ? {
          ...c,
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        }
      : c,
  );
  await save(list);
  if (patch.tags) await recordTags(patch.tags);
  return list;
}

async function save(list: LocalClip[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 용량 초과 등은 조용히 무시
  }
}

/** 자주 쓴 순으로 정렬된 과거 태그 목록(자동완성용). */
export async function getKnownTags(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(TAGS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  } catch {
    return [];
  }
}

/** 저장 시 사용한 태그를 빈도에 누적. */
export async function recordTags(tags: string[]): Promise<void> {
  if (tags.length === 0) return;
  try {
    const raw = await AsyncStorage.getItem(TAGS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    for (const t of tags) {
      const key = t.trim();
      if (key) map[key] = (map[key] ?? 0) + 1;
    }
    await AsyncStorage.setItem(TAGS_KEY, JSON.stringify(map));
  } catch {
    // 무시
  }
}
