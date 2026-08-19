import DealersPanel from "@/components/admin/DealersPanel";

export const metadata = {
  title: "Dealers — HeavyWheels Admin",
};

export default function AdminDealersPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-black text-[var(--hw-text-primary)] sm:text-2xl">Dealer applications</h2>
      <DealersPanel />
    </>
  );
}
