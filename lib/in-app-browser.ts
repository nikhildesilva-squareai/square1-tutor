// Client-only detection of in-app browsers (embedded webviews).
//
// Google BLOCKS OAuth inside most of these (Error 403: disallowed_useragent) —
// the sign-in fails at Google regardless of our configuration. Most of our paid
// traffic arrives inside the Instagram/Facebook in-app browser, so the auth
// pages use this to lead with the email code (which works fine in webviews)
// and explain why Google isn't offered.
//
// `googleBlocked` is per-app: Instagram/Facebook/TikTok use raw webviews where
// Google definitively refuses; LinkedIn and X often open a system browser view
// where OAuth still works, so there we keep the button and just add a caution.

export interface InAppBrowser {
  name: string;
  googleBlocked: boolean;
}

export function detectInAppBrowser(): InAppBrowser | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/Instagram/i.test(ua)) return { name: "Instagram", googleBlocked: true };
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A|MessengerForiOS/i.test(ua)) return { name: "Facebook", googleBlocked: true };
  if (/TikTok|Bytedance/i.test(ua)) return { name: "TikTok", googleBlocked: true };
  if (/MicroMessenger/i.test(ua)) return { name: "WeChat", googleBlocked: true };
  if (/Snapchat/i.test(ua)) return { name: "Snapchat", googleBlocked: true };
  if (/LinkedInApp/i.test(ua)) return { name: "LinkedIn", googleBlocked: false };
  if (/Twitter/i.test(ua)) return { name: "X", googleBlocked: false };
  // Generic Android WebView marker — treat as blocked (raw webview).
  if (/; wv\)/.test(ua)) return { name: "this app", googleBlocked: true };
  return null;
}
