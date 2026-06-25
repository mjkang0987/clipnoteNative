import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
const CALLBACK = "https://clipnote.co.kr/api/auth/naver/callback";

export type NaverResult = { ok: boolean; cancelled?: boolean; error?: string };

/**
 * 네이버 로그인(커스텀 OAuth). Supabase 미지원이라 웹 콜백을 거쳐
 * magiclink token_hash 를 받아 verifyOtp 로 세션을 만든다.
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

  const res = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
  if (res.type !== "success" || !res.url) return { ok: false, cancelled: true };

  const url = new URL(res.url);
  const err = url.searchParams.get("error");
  if (err) return { ok: false, error: err };
  const tokenHash = url.searchParams.get("token_hash");
  if (!tokenHash) return { ok: false, error: "no_token" };

  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (error) return { ok: false, error: "verify" };
  return { ok: true };
}
