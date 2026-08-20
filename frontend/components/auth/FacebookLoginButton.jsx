"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/Context/LanguageContext";

const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";

let sdkPromise = null;

// Loads the Facebook JS SDK exactly once, however many buttons are mounted.
function loadFacebookSdk() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.FB) return resolve(window.FB);

    window.fbAsyncInit = function fbAsyncInit() {
      window.FB.init({ appId: APP_ID, cookie: true, xfbml: false, version: "v21.0" });
      resolve(window.FB);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
    document.body.appendChild(script);
  });
  return sdkPromise;
}

/**
 * Continue-with-Facebook button. Renders nothing when no App ID is
 * configured — same "stays hidden until real credentials exist" pattern
 * used for Google, so this ships dormant and activates the moment
 * NEXT_PUBLIC_FACEBOOK_APP_ID/FACEBOOK_APP_ID are set, no code changes
 * needed at that point.
 */
export default function FacebookLoginButton({ onSuccess, onError }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  if (!APP_ID) return null;

  async function handleClick() {
    setBusy(true);
    try {
      const FB = await loadFacebookSdk();
      FB.login(
        (response) => {
          if (!mounted.current) return;
          setBusy(false);
          if (response.authResponse?.accessToken) {
            onSuccess?.(response.authResponse.accessToken);
          } else {
            onError?.();
          }
        },
        { scope: "email,public_profile" }
      );
    } catch {
      if (mounted.current) setBusy(false);
      onError?.();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--hw-border-default)] bg-[#1877F2] text-[13px] font-bold text-white transition hover:bg-[#166FE5] disabled:opacity-60 sm:h-12 sm:text-sm"
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
      </svg>
      {busy ? t("common.loading") : t("auth.continueWithFacebook")}
    </button>
  );
}
