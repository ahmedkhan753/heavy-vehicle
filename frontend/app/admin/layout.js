import AdminNav from "@/components/admin/AdminNav";

export const metadata = {
  // Own template so admin page titles read "X | HeavyWheels Admin" instead
  // of inheriting the root's "X | HeavyWheels" — noindexed either way, this
  // is purely for the browser tab.
  title: { default: "Admin Dashboard", template: "%s | HeavyWheels Admin" },
  robots: { index: false, follow: false },
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
