import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/lib/auth";
import { getLocalClips, clearLocalClips } from "@/lib/local-clips";
import { createClip } from "@/lib/api";
import { emitClipsRefresh } from "@/lib/clips-refresh";

/**
 * 게스트가 로그인하면 이 기기에 저장한 로컬 클립을 계정(DB)으로 옮길지 한 번 물어본다.
 * '옮기기' 시 createClip(save:true)로 업로드 후 로컬 비움. UI 없음(루트에 마운트).
 */
export default function MigrateLocalClips() {
  const { loggedIn, accessToken } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!loggedIn) {
      handledRef.current = false; // 로그아웃 시 리셋 → 다음 로그인에 다시 확인
      return;
    }
    if (!accessToken || handledRef.current) return;
    handledRef.current = true; // 로그인 1회만

    (async () => {
      const local = await getLocalClips();
      if (local.length === 0) return;

      Alert.alert(
        "기기에 저장된 클립",
        `이 기기에 저장한 클립 ${local.length}개를 계정으로 옮길까요?`,
        [
          { text: "나중에", style: "cancel" },
          {
            text: "옮기기",
            onPress: async () => {
              for (const c of local) {
                await createClip(
                  {
                    url: c.url,
                    title: c.title,
                    description: c.description,
                    image: c.image,
                    siteName: c.siteName,
                    tags: c.tags,
                    gradient: c.gradient,
                    save: true,
                  },
                  accessToken,
                );
              }
              await clearLocalClips();
              emitClipsRefresh(); // 내 클립 화면이 떠 있으면 즉시 갱신
              Alert.alert("완료", "클립을 계정으로 옮겼어요.");
            },
          },
        ],
      );
    })();
  }, [loggedIn, accessToken]);

  return null;
}
