import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="hw-container grid min-h-[calc(100vh-220px)] place-items-center py-12">
      <Suspense fallback={<div className="text-[var(--hw-text-secondary)]">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
