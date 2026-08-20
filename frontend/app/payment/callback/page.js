import { Suspense } from "react";
import PaymentCallback from "@/components/payment/PaymentCallback";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  robots: { index: false, follow: false },
};

// Safepay redirects the buyer here after checkout. This page only REFLECTS the
// payment status (the signed webhook is what actually activates the plan/boost).
export default async function PaymentCallbackPage() {
  const t = await getT();
  return (
    <main className="hw-container grid min-h-[calc(100vh-220px)] place-items-center py-12">
      <Suspense fallback={<div className="text-[var(--hw-text-secondary)]">{t("common.loading")}</div>}>
        <PaymentCallback />
      </Suspense>
    </main>
  );
}
