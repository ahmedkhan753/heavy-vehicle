import InspectorRegisterForm from "@/components/inspectors/InspectorRegisterForm";

export const metadata = {
  title: "Become an Inspector — HeavyWheels",
  description: "Join HeavyWheels as a vehicle inspector. Set your own fee and reach buyers and sellers across Pakistan.",
};

export default function InspectorRegisterPage() {
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Inspectors</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Become an Inspector</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
          List your inspection service, set your own fee, and get discovered by buyers and sellers.
        </p>
        <div className="mt-8">
          <InspectorRegisterForm />
        </div>
      </div>
    </main>
  );
}
