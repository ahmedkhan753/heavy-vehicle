import ServiceRequestsPanel from "@/components/admin/ServiceRequestsPanel";

export const metadata = {
  title: "Service Requests — HeavyWheels Admin",
};

export default function AdminRequestsPage() {
  return (
    <>
      <h2 className="mb-4 text-2xl font-black text-[var(--hw-text-primary)]">Service Requests</h2>
      <ServiceRequestsPanel />
    </>
  );
}
