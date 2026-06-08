import InspectorsPanel from "@/components/admin/InspectorsPanel";

export const metadata = {
  title: "Inspectors — HeavyWheels Admin",
};

export default function AdminInspectorsPage() {
  return (
    <>
      <h2 className="mb-4 text-2xl font-black text-[var(--hw-text-primary)]">Inspectors</h2>
      <InspectorsPanel />
    </>
  );
}
