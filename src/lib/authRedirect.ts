import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const POST_AUTH_REDIRECT_KEY = "founderid.postAuthRedirect";

const safeDestination = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/app";
  return value;
};

export const rememberPostAuthRedirect = (path = "/app") => {
  try {
    window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, safeDestination(path));
  } catch {
    // Session storage may be unavailable in restrictive browser modes.
  }
};

export const consumePostAuthRedirect = () => {
  try {
    const stored = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return safeDestination(stored);
  } catch {
    return "/app";
  }
};

const getRedirectParam = (key: string) => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.get(key) ?? queryParams.get(key);
};

const cleanSensitiveUrl = () => {
  const hasAuthParams = ["access_token", "refresh_token", "code", "error"].some((key) => getRedirectParam(key));
  if (!hasAuthParams) return;
  window.history.replaceState({}, document.title, window.location.pathname || "/");
};

const waitForSession = async (): Promise<Session | null> => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }
  return null;
};

export const hydrateSessionFromRedirectUrl = async (): Promise<Session | null> => {
  const accessToken = getRedirectParam("access_token");
  const refreshToken = getRedirectParam("refresh_token");
  const code = getRedirectParam("code");
  let lastError: Error | null = null;

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    cleanSensitiveUrl();
    if (error) throw error;
    if (data.session) return data.session;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    cleanSensitiveUrl();
    if (error) lastError = error;
    if (data.session) return data.session;
  }

  cleanSensitiveUrl();
  const session = await waitForSession();
  if (session) return session;
  if (lastError) throw lastError;
  return null;
};