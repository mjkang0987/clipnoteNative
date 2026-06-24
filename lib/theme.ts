// 디자인 토큰 — 웹(design-guide.md / globals.css)에서 이식.

export const colors = {
  brand: "#7C5CFC",
  brandStrong: "#5B3FE0",
  brandSoft: "#EFEBFF",

  bg: "#FFFFFF",
  surface: "#F7F7F9",
  border: "#E4E4E7",
  fg: "#18181B",
  fgMuted: "#71717A",

  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",

  white: "#FFFFFF",
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const space = (n: number) => n * 4;

// 공유 카드 그라디언트 프리셋 (웹 lib/gradients.ts 와 동일)
export type Gradient = { name: string; from: string; to: string };

export const GRADIENTS: Gradient[] = [
  { name: "sunset", from: "#FF6B6B", to: "#FFA94D" },
  { name: "ocean", from: "#4F8DFD", to: "#6FE0C9" },
  { name: "grape", from: "#7C5CFC", to: "#E879F9" },
  { name: "forest", from: "#0EA5E9", to: "#22C55E" },
  { name: "peach", from: "#FB7185", to: "#FDBA74" },
  { name: "midnight", from: "#4338CA", to: "#7C3AED" },
  { name: "mint", from: "#06B6D4", to: "#34D399" },
  { name: "rose", from: "#EC4899", to: "#8B5CF6" },
];

/** 시드 문자열 → 결정적 그라디언트 선택(같은 시드는 항상 같은 색). */
export function pickGradient(seed: string): Gradient {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[idx];
}
