import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
const CALLBACK = "https://clipnote.co.kr/api/auth/naver/callback";

export type NaverResult = { ok: boolean; cancelled?: boolean; error?: string };

// token_hash 는 1회용. 인앱 브라우저 복귀(openAuthSessionAsync)와
// 딥링크 리스너(lib/auth.tsx) 양쪽에서 호출될 수 있어 중복 verify 를 막는다.
const consumed = new Set<string>();

/**
 * 콜백이 돌려준 magiclink token_hash 로 세션을 만든다.
 * 인앱 브라우저 복귀 경로와 딥링크 복귀 경로가 공유한다(먼저 도착한 쪽이 처리).
 */
export async function verifyNaverToken(tokenHash: string): Promise<NaverResult> {
  if (!supabase) return { ok: false, error: "no_supabase" };
  if (consumed.has(tokenHash)) return { ok: true }; // 이미 처리됨
  consumed.add(tokenHash);
  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (error) {
    consumed.delete(tokenHash); // 실패 시 재시도 허용
    return { ok: false, error: "verify" };
  }
  return { ok: true };
}

/**
 * 네이버 로그인(커스텀 OAuth). Supabase 미지원이라 웹 콜백을 거쳐
 * magiclink token_hash 를 받아 verifyOtp 로 세션을 만든다.
 *
 * 복귀는 두 경로 중 먼저 되는 쪽:
 *  1) openAuthSessionAsync 가 exp://·clipnote:// 복귀를 낚아채면 → 여기서 verify.
 *  2) 낚아채지 못하면(Expo Go 터널에서 흔함) → 콜백 HTML 의 딥링크가
 *     앱을 다시 열고 lib/auth.tsx 의 리스너가 verify. 이 경우 여기선 cancelled 로
 *     끝나지만 로그인은 리스너가 완료한다.
 */
export async function signInWithNaver(): Promise<NaverResult> {
  if (!supabase) return { ok: false, error: "no_supabase" };
  if (!NAVER_CLIENT_ID) return { ok: false, error: "no_client_id" };

  const returnUrl = Linking.createURL("auth/naver");
  const state = JSON.stringify({
    returnUrl,
    n: Math.random().toString(36).slice(2),
  });
  const authUrl =
    "https://nid.naver.com/oauth2.0/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: NAVER_CLIENT_ID,
      redirect_uri: CALLBACK,
      state,
    }).toString();

  // SFSafariViewController 로 연다(openAuthSessionAsync 의 ASWebAuthenticationSession 은
  // 샌드박스라, 우리 콜백이 돌려보내는 커스텀 스킴 복귀를 삼켜버린다). SFSafari 는 콜백이
  // clipnote:// 로 이동하면 앱을 실제로 열어주고, 로그인 완료(verifyOtp)는 expo-router 가
  // 라우팅하는 `app/auth/naver.tsx` 화면이 처리한다.
  await WebBrowser.openBrowserAsync(authUrl, { showInRecents: true });
  // 완료는 딥링크 복귀 화면이 비동기로 처리 → 여기선 "시작됨"만 알린다(에러로 보지 않음).
  return { ok: false, cancelled: true };
}
