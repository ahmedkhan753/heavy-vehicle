"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided. Please use the link sent to your email.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully. You can now log in.");
          // Optional: redirect to login after a few seconds
          setTimeout(() => router.push("/auth/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired verification link.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center shadow-sm">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--hw-orange)] border-t-transparent"></div>
            <h1 className="text-xl font-bold text-[var(--hw-text-primary)]">Verifying Email</h1>
            <p className="text-[var(--hw-text-secondary)]">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hw-green)] text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--hw-text-primary)]">Email Verified!</h1>
            <p className="text-[var(--hw-text-secondary)]">{message}</p>
            <p className="text-sm text-[var(--hw-text-muted)]">Redirecting to login...</p>
            <Link
              href="/auth/login"
              className="mt-4 flex w-full justify-center rounded-lg bg-[var(--hw-orange)] p-3 text-sm font-bold text-[var(--hw-text-inverse)] transition-colors hover:bg-opacity-90"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--hw-text-primary)]">Verification Failed</h1>
            <p className="text-[var(--hw-text-secondary)]">{message}</p>
            <Link
              href="/auth/login"
              className="mt-4 flex w-full justify-center rounded-lg border border-[var(--hw-border-strong)] p-3 text-sm font-bold text-[var(--hw-text-primary)] transition-colors hover:border-[var(--hw-orange)]"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--hw-orange)] border-t-transparent"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
