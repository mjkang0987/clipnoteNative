// 온보딩 최초 표시 여부 플래그 (이 기기 AsyncStorage).
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "clipnote.onboardingSeen";

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {
    // 저장 실패해도 앱 흐름은 막지 않음.
  }
}
