export const metadata = {
  title: "About Us — HeavyWheels",
  description: "HeavyWheels is Pakistan's marketplace for heavy vehicles, machinery, and commercial vehicle parts.",
};

export default function AboutPage() {
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Company</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">About HeavyWheels</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">Pakistan&apos;s marketplace for heavy vehicles, machinery &amp; parts</p>

        <div className="mt-8 grid gap-8 text-[var(--hw-text-secondary)] leading-7">
          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Who we are</h2>
            <p className="mt-3">
              HeavyWheels is an online marketplace built specifically for Pakistan&apos;s commercial
              and heavy vehicle industry. From prime movers, dumpers, and oil tankers to excavators,
              cranes, and tractors — along with the parts that keep them running — we connect buyers
              and sellers across the country in one trusted place.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">What we offer</h2>
            <ul className="mt-3 grid gap-2 list-disc pl-5">
              <li>Free and featured listings for heavy vehicles, machinery, and parts.</li>
              <li>A verified dealer network so buyers can shop with confidence.</li>
              <li>Direct contact with sellers by phone and WhatsApp — no middlemen.</li>
              <li>Subscription and promotion options for dealers and frequent sellers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Our mission</h2>
            <p className="mt-3">
              The heavy vehicle trade in Pakistan has long relied on word of mouth and scattered
              listings. Our mission is to bring it online — making it faster, more transparent, and
              safer to buy and sell trucks, machinery, and parts, wherever you are in the country.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Get in touch</h2>
            <p className="mt-3">
              Have a question or want to partner with us? Visit our{" "}
              <a href="/contact" className="font-bold text-[var(--hw-orange)] hover:underline">contact page</a>{" "}
              — we&apos;d love to hear from you.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
