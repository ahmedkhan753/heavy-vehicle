import { Suspense } from "react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="hw-container grid min-h-[calc(100vh-220px)] place-items-center py-12">
      <Suspense fallback={<div className="text-[var(--hw-text-secondary)]">Loading...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
