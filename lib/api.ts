// 웹 백엔드(clipnote.co.kr) API 클라이언트. 서버 로직을 그대로 재사용한다.

import Constants from "expo-constants";

const API_BASE =
  (Constants.expoConfig?.extra?.apiBase as string | undefined) ??
  "https://clipnote.co.kr";

export type ClipMetadata = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  source: "adapter" | "og" | "embedded" | "html" | "none";
  reason?: string;
};

/** URL 메타데이터 추출 (웹 GET /api/metadata). 실패 시 throw. */
export async function fetchMetadata(
  url: string,
  signal?: AbortSignal,
): Promise<ClipMetadata> {
  const res = await fetch(
    `${API_BASE}/api/metadata?url=${encodeURIComponent(url)}`,
    { signal },
  );
  if (!res.ok) throw new Error(`metadata ${res.status}`);
  return (await res.json()) as ClipMetadata;
}

export type CreateClipInput = {
  url: string;
  title: string;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
  tags?: string[];
  gradient?: string;
  /** true 면 내 클립 목록에 저장(saved), false/없으면 공유 링크만. */
  save?: boolean;
};

export type CreateClipResult = {
  slug?: string;
  shareUrl?: string;
  alreadySaved?: boolean;
  error?: string;
};

/** 클립 생성 (웹 POST /api/clip). 인증 필요 — 비로그인은 401.
 *  accessToken: Supabase 세션 토큰(있으면 Authorization 헤더로 전달). */
export async function createClip(
  input: CreateClipInput,
  accessToken?: string,
): Promise<CreateClipResult> {
  const res = await fetch(`${API_BASE}/api/clip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as CreateClipResult;
  if (!res.ok) {
    return { error: data.error ?? `clip ${res.status}` };
  }
  return data;
}

/** OG 이미지 URL(미리보기/공유 카드 이미지). 웹 GET /api/og 와 동일 파라미터. */
export function ogImageUrl(p: {
  title: string;
  description?: string | null;
  siteName?: string | null;
  gradient: string;
}): string {
  const q = new URLSearchParams({ title: p.title, g: p.gradient });
  if (p.description) q.set("desc", p.description);
  if (p.siteName) q.set("site", p.siteName);
  return `${API_BASE}/api/og?${q.toString()}`;
}

export type DbClip = {
  slug: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string | null;
  gradient: string;
  tags: string[];
  saved: boolean;
  shared: boolean; // 공개 브릿지 링크(/[slug]) 켜졌는지. 저장만 한 클립은 false
  createdAt: string;
};

/** 내 클립(DB) 목록 — 로그인 토큰 필요. GET /api/clips. */
export async function getClips(
  accessToken?: string,
): Promise<{ loggedIn: boolean; clips: DbClip[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/clips`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (!res.ok) return { loggedIn: false, clips: [] };
    return (await res.json()) as { loggedIn: boolean; clips: DbClip[] };
  } catch {
    return { loggedIn: false, clips: [] };
  }
}

/** DB 클립 수정(제목·태그). PATCH /api/clip/[slug]. */
export async function updateClip(
  slug: string,
  patch: { title?: string; tags?: string[] },
  accessToken?: string,
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/clip/${slug}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

/** DB 클립 삭제. DELETE /api/clip/[slug]. */
export async function deleteClip(
  slug: string,
  accessToken?: string,
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/clip/${slug}`, {
    method: "DELETE",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  return res.ok;
}

export { API_BASE };
