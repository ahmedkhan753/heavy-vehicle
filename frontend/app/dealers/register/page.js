import DealerRegisterForm from "@/components/dealers/DealerRegisterForm";

export default function DealerRegisterPage() {
  return (
    <main className="hw-container py-10">
      <div className="mb-8">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Dealer onboarding</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Register your dealership</h1>
      </div>
      <DealerRegisterForm />
    </main>
  );
}
