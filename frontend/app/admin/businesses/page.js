import BusinessesPanel from "@/components/admin/BusinessesPanel";

export const metadata = {
  title: "Businesses",
};

export default function AdminBusinessesPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-black text-[var(--hw-text-primary)] sm:text-2xl">Business directory</h2>
      <BusinessesPanel />
    </>
  );
}
