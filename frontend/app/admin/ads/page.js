import AdsPanel from "@/components/admin/AdsPanel";

export const metadata = {
  title: "Advertising",
};

export default function AdminAdsPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-black text-[var(--hw-text-primary)] sm:text-2xl">Banner campaigns</h2>
      <AdsPanel />
    </>
  );
}
