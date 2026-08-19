import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import PlanPromoBanner from "@/components/marketing/PlanPromoBanner";

export default function DashboardLayout({ children }) {
  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <DashboardSidebar />
        <div className="min-w-0">
          <PlanPromoBanner />
          {children}
        </div>
      </div>
    </main>
  );
}
