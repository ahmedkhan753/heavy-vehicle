import LoanCalculator from "@/components/services/LoanCalculator";

export const metadata = {
  title: "Loan Calculator — HeavyWheels",
  description: "Estimate the monthly installment for financing a truck, machinery, or commercial vehicle in Pakistan.",
};

export default async function LoanCalculatorPage({ searchParams }) {
  // `?price=` lets a listing deep-link into the calculator pre-filled.
  const params = await searchParams;
  const initialPrice = params?.price ?? "";

  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Tools</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Loan Calculator</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
          Estimate your monthly installment for truck and machinery financing.
        </p>

        <div className="mt-8">
          <LoanCalculator initialPrice={initialPrice} />
        </div>
      </div>
    </main>
  );
}
