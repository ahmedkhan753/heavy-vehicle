import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { getT } from "@/lib/i18n-server";

export default async function ResetPasswordPage() {
  const t = await getT();
  return (
    <main className="hw-container grid min-h-[calc(100vh-220px)] place-items-center py-12">
      <Suspense fallback={<div className="text-[var(--hw-text-secondary)]">{t("common.loading")}</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
