import ServiceRequests from "@/components/dashboard/ServiceRequests";

export const metadata = {
  title: "My Service Requests — HeavyWheels",
};

export default function DashboardRequestsPage() {
  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">Service Requests</h1>
      </div>
      <ServiceRequests />
    </>
  );
}
