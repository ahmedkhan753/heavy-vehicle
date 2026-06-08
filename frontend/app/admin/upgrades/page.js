import UpgradesPanel from "@/components/admin/UpgradesPanel";

export const metadata = {
  title: "Ad boosts — HeavyWheels Admin",
};

export default function AdminUpgradesPage() {
  return (
    <>
      <h2 className="mb-4 text-2xl font-black text-[var(--hw-text-primary)]">Ad boosts</h2>
      <UpgradesPanel />
    </>
  );
}
