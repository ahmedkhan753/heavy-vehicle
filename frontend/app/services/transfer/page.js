import ServiceRequestForm from "@/components/services/ServiceRequestForm";

export const metadata = {
  title: "Ownership Transfer — HeavyWheels",
  description: "Get hassle-free help transferring vehicle ownership and registration documents in Pakistan.",
};

export default async function OwnershipTransferPage({ searchParams }) {
  const params = (await searchParams) || {};
  const vehicleId = params.vehicleId || "";

  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Service</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Ownership Transfer</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
          Hassle-free documentation and registration transfer assistance. Submit a request and our
          team will guide you through the paperwork.
        </p>

        <div className="mt-6 grid gap-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-deep)] p-5 text-sm text-[var(--hw-text-secondary)] sm:grid-cols-3">
          <div><span className="font-black text-[var(--hw-text-primary)]">1. Request</span><br />Tell us about the vehicle.</div>
          <div><span className="font-black text-[var(--hw-text-primary)]">2. We assist</span><br />Our team handles the paperwork.</div>
          <div><span className="font-black text-[var(--hw-text-primary)]">3. Done</span><br />Track status to completion.</div>
        </div>

        <div className="mt-6">
          <ServiceRequestForm
            serviceType="ownership-transfer"
            redirectTo={`/services/transfer${vehicleId ? `?vehicleId=${vehicleId}` : ""}`}
            initialVehicleId={vehicleId}
            extraFields={[
              {
                name: "direction",
                label: "Are you buying or selling?",
                type: "select",
                placeholder: "Select",
                options: [
                  { value: "buying", label: "Buying (transfer to me)" },
                  { value: "selling", label: "Selling (transfer to buyer)" },
                ],
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
