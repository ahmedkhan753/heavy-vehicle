import CommissionsPanel from "@/components/admin/CommissionsPanel";

export const metadata = {
  title: "Commissions — HeavyWheels Admin",
};

export default function AdminCommissionsPage() {
  return (
    <>
      <h2 className="mb-4 text-2xl font-black text-[var(--hw-text-primary)]">Commissions</h2>
      <CommissionsPanel />
    </>
  );
}
