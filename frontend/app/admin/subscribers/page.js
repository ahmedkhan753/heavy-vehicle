import SubscribersPanel from "@/components/admin/SubscribersPanel";

export const metadata = {
  title: "Subscribers — HeavyWheels Admin",
};

export default function AdminSubscribersPage() {
  return (
    <>
      <h2 className="mb-4 text-2xl font-black text-[var(--hw-text-primary)]">Subscribers</h2>
      <SubscribersPanel />
    </>
  );
}
