import { TC_VERSION, COMMISSION_LABEL } from "@/lib/pricing";

export const metadata = {
  title: "Terms & Conditions — HeavyWheels",
  description: "HeavyWheels terms of use, including the sales commission policy for sellers.",
};

export default function TermsPage() {
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Legal</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">Version {TC_VERSION}</p>

        <div className="mt-8 grid gap-8 text-[var(--hw-text-secondary)] leading-7">
          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">1. Acceptance</h2>
            <p className="mt-3">
              By creating an account, posting a listing, or otherwise using HeavyWheels
              (&quot;the Platform&quot;), you agree to these Terms &amp; Conditions. If you do not
              agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">2. Listings</h2>
            <p className="mt-3">
              You are responsible for the accuracy of every listing you post, including the
              price, condition, specifications, and ownership of the item. Listings must not be
              misleading, fraudulent, or unlawful. HeavyWheels may remove any listing or suspend
              any account that violates these Terms.
            </p>
          </section>

          {/* The commission clause — highlighted so it is unmistakable. */}
          <section className="rounded-xl border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] p-5">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">3. Sales Commission</h2>
            <p className="mt-3">
              By posting any listing on HeavyWheels (whether free or paid), you (&quot;the
              Seller&quot;) agree that upon completing a sale of the listed item — whether the
              buyer was introduced through the Platform or otherwise — you will pay HeavyWheels a
              commission equal to <strong>{COMMISSION_LABEL} of the final agreed sale price</strong>.
            </p>
            <p className="mt-3">
              The Seller agrees to report the final sale price truthfully when marking a listing
              as sold and to settle the commission within <strong>7 days</strong> via the payment
              methods provided by HeavyWheels. HeavyWheels may suspend posting privileges,
              verification status, or listing visibility for accounts with unpaid commission. This
              obligation is accepted at the time of posting and recorded against the Seller&apos;s
              account, including the version of these Terms agreed to.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">4. Paid Services</h2>
            <p className="mt-3">
              Featured listings, premium placements, and dealer subscriptions are billed in
              advance in Pakistani Rupees (PKR). Fees for paid services are non-refundable once the
              service period has begun, except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">5. Liability</h2>
            <p className="mt-3">
              HeavyWheels is a listings platform and is not a party to any transaction between
              buyers and sellers. We do not guarantee the quality, safety, legality, or delivery of
              any item listed, and we are not responsible for disputes between users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">6. Changes</h2>
            <p className="mt-3">
              We may update these Terms from time to time. Continued use of the Platform after an
              update constitutes acceptance of the revised Terms. The version in effect when you
              post a listing applies to that listing.
            </p>
          </section>

          <p className="text-sm text-[var(--hw-text-muted)]">
            These Terms are provided for general use and should be reviewed by qualified legal
            counsel before relying on them commercially.
          </p>
        </div>
      </div>
    </main>
  );
}
