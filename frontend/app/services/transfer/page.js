import ServiceRequestForm from "@/components/services/ServiceRequestForm";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Ownership Transfer — HeavyWheels",
  description: "Get hassle-free help transferring vehicle ownership and registration documents in Pakistan.",
};

export default async function OwnershipTransferPage({ searchParams }) {
  const params = (await searchParams) || {};
  const vehicleId = params.vehicleId || "";
  const t = await getT();

  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("services.serviceEyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("services.transferTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">{t("transfer.subtitle")}</p>

        <div className="mt-6 grid gap-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-deep)] p-5 text-sm text-[var(--hw-text-secondary)] sm:grid-cols-3">
          <div><span className="font-black text-[var(--hw-text-primary)]">{t("transfer.step1")}</span><br />{t("transfer.step1Desc")}</div>
          <div><span className="font-black text-[var(--hw-text-primary)]">{t("transfer.step2")}</span><br />{t("transfer.step2Desc")}</div>
          <div><span className="font-black text-[var(--hw-text-primary)]">{t("transfer.step3")}</span><br />{t("transfer.step3Desc")}</div>
        </div>

        <div className="mt-6">
          <ServiceRequestForm
            serviceType="ownership-transfer"
            redirectTo={`/services/transfer${vehicleId ? `?vehicleId=${vehicleId}` : ""}`}
            initialVehicleId={vehicleId}
            extraFields={[
              {
                name: "direction",
                label: t("transfer.directionLabel"),
                type: "select",
                placeholder: t("svc.select"),
                options: [
                  { value: "buying", label: t("transfer.buying") },
                  { value: "selling", label: t("transfer.selling") },
                ],
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
