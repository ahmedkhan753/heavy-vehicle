"use client";

import { useEffect } from "react";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { normalizeApiError } from "@/lib/api";
import FacebookLoginButton from "./FacebookLoginButton";

/**
 * QuickAuthModal — one-tap sign-in for actions that shouldn't cost a
 * visitor the page they're on (revealing a seller's phone number,
 * messaging them). The old behaviour sent an unauthenticated visitor to
 * /auth/login and back; this keeps them in place — successful login just
 * closes the modal, and the calling component (already reading
 * useAuth().isAuthenticated) re-renders into its signed-in state on its
 * own, no extra plumbing needed.
 *
 * Email/password stays reachable via a plain link for anyone who'd rather
 * use that — this doesn't replace /auth/login, it just front-loads the
 * fastest path for people who have a Google or Facebook account.
 */
export default function QuickAuthModal({ open, onClose, redirectPath }) {
  const { googleLogin, facebookLogin } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function afterGoogle(credentialResponse) {
    try {
      await googleLogin(credentialResponse.credential);
      toast.success("Logged in with Google successfully");
      onClose();
    } catch (err) {
      toast.error(normalizeApiError(err));
    }
  }

  async function afterFacebook(accessToken) {
    try {
      await facebookLogin(accessToken);
      toast.success("Logged in with Facebook successfully");
      onClose();
    } catch (err) {
      toast.error(normalizeApiError(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("auth.quickSignIn")}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-lg">{t("auth.quickSignIn")}</h2>
            <p className="mt-1 text-[12px] text-[var(--hw-text-secondary)] sm:text-sm">{t("auth.quickSignInHint")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-1 text-[var(--hw-text-muted)] hover:text-[var(--hw-text-primary)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 grid gap-2.5">
          <div className="flex justify-center [&>div]:w-full">
            <GoogleLogin onSuccess={afterGoogle} onError={() => toast.error("Google login failed")} theme="filled_black" size="large" text="continue_with" width="100%" />
          </div>
          <FacebookLoginButton onSuccess={afterFacebook} onError={() => toast.error("Facebook login failed")} />
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[var(--hw-border-subtle)]" /></div>
          <div className="relative flex justify-center text-[11px] uppercase text-[var(--hw-text-muted)]"><span className="bg-[var(--hw-bg-card)] px-2">or</span></div>
        </div>

        <Link
          href={`/auth/login?redirect=${encodeURIComponent(redirectPath || "/")}`}
          onClick={onClose}
          className="block text-center text-[13px] font-bold text-[var(--hw-orange)] hover:underline sm:text-sm"
        >
          {t("auth.orContinueWithEmail")}
        </Link>
      </div>
    </div>
  );
}
