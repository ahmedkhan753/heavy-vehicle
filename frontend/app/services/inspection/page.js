import Link from "next/link";
import PartnershipForm from "@/components/inspectors/PartnershipForm";

export const metadata = {
  title: "Vehicle Inspection — HeavyWheels",
  description: "Hire a verified inspector before you buy, or join HeavyWheels as an inspection officer or company.",
};

export default function InspectionPage() {
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Service</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Vehicle Inspection</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--hw-text-muted)]">
          Buy with confidence. Get a heavy vehicle checked by a certified inspector before you pay —
          or join our growing network of inspectors and inspection companies.
        </p>

        {/* Two paths */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
            <div className="text-3xl">🔍</div>
            <h2 className="mt-3 text-lg font-black text-[var(--hw-text-primary)]">I want a vehicle inspected</h2>
            <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">Browse verified inspectors, compare fees, and book directly.</p>
            <Link href="/inspectors" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Find an inspector</Link>
          </div>
          <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
            <div className="text-3xl">🧰</div>
            <h2 className="mt-3 text-lg font-black text-[var(--hw-text-primary)]">I am an inspector</h2>
            <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">List your service, set your own fee, and reach buyers across Pakistan.</p>
            <Link href="/inspectors/register" className="mt-4 inline-flex h-11 items-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">Become an inspector</Link>
          </div>
        </div>

        {/* Partnership */}
        <div className="mt-10">
          <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">Partner with us</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--hw-text-secondary)]">
            Run an inspection company? We&apos;re building a nationwide inspection network. Tell us about
            your business and we&apos;ll be in touch about partnering.
          </p>
          <div className="mt-5">
            <PartnershipForm />
          </div>
        </div>
      </div>
    </main>
  );
}
