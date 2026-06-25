// 내 클립 목록 강제 새로고침 신호(마이그레이션 등 외부에서 트리거).
type Listener = () => void;
const listeners = new Set<Listener>();

export function onClipsRefresh(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function emitClipsRefresh(): void {
  listeners.forEach((l) => l());
}
