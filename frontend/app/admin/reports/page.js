import ReportsPanel from "@/components/admin/ReportsPanel";

export const metadata = {
  title: "Reports",
};

export default function AdminReportsPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-black text-[var(--hw-text-primary)] sm:text-2xl">Reported listings</h2>
      <ReportsPanel />
    </>
  );
}
