import PaymentsPanel from "@/components/admin/PaymentsPanel";

export const metadata = {
  title: "Payment verification — HeavyWheels Admin",
};

export default function AdminPaymentsPage() {
  return (
    <>
      <h2 className="mb-4 text-2xl font-black text-[var(--hw-text-primary)]">Payment verification</h2>
      <PaymentsPanel />
    </>
  );
}
