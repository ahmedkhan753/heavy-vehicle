import AdminNav from "@/components/admin/AdminNav";

export const metadata = {
  title: "Admin — HeavyWheels",
};

export default function AdminLayout({ children }) {
  return (
    <main className="hw-container py-10">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Admin</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">Control panel</h1>
      </div>
      <AdminNav />
      {children}
    </main>
  );
}
