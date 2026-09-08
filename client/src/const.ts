export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Bypass OAuth for local dev - EG Blockchain mode
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // لو مفيش OAuth config - رجع الصفحة الرئيسية
  if (!oauthPortalUrl ||!appId || oauthPortalUrl === 'undefined') {
    console.log('[EG-Blockchain] Local mode - no OAuth');
    return '/';
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
};
