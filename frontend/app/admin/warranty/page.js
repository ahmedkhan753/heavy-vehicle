import WarrantyPanel from "@/components/admin/WarrantyPanel";

export const metadata = {
  title: "Warranty",
};

export default function AdminWarrantyPage() {
  return (
    <>
      <h2 className="mb-4 text-2xl font-black text-[var(--hw-text-primary)]">Dealer Warranty Requests</h2>
      <WarrantyPanel />
    </>
  );
}
