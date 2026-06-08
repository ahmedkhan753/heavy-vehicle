export const metadata = {
  title: "Privacy Policy — HeavyWheels",
  description: "How HeavyWheels collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Legal</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="mt-8 grid gap-8 text-[var(--hw-text-secondary)] leading-7">
          <section>
            <p>
              This Privacy Policy explains how HeavyWheels (&quot;we&quot;, &quot;us&quot;, or
              &quot;the Platform&quot;) collects, uses, and protects your information when you use our
              website and services. By using HeavyWheels, you agree to the practices described below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">1. Information we collect</h2>
            <ul className="mt-3 grid gap-2 list-disc pl-5">
              <li><strong>Account information:</strong> your name, email address, phone number, city, and address when you register.</li>
              <li><strong>Listings:</strong> details and photos of the vehicles or parts you post.</li>
              <li><strong>Usage data:</strong> basic technical information such as your IP address and activity needed to operate and secure the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">2. How we use your information</h2>
            <ul className="mt-3 grid gap-2 list-disc pl-5">
              <li>To create and manage your account and listings.</li>
              <li>To let buyers and sellers contact each other (your phone number is only shown to signed-in users on your listings).</li>
              <li>To process subscriptions, promotions, and sales commissions.</li>
              <li>To protect the Platform against fraud and abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">3. Sharing your information</h2>
            <p className="mt-3">
              We do not sell your personal information. We share data only with service providers
              that help us run the Platform — for example, our cloud image host (Cloudinary) for
              listing photos and our email provider for account notifications — and where required by
              law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">4. Cookies &amp; sessions</h2>
            <p className="mt-3">
              We use secure cookies and tokens to keep you signed in and to remember your
              preferences (such as language and theme). These are necessary for the Platform to
              function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">5. Data retention</h2>
            <p className="mt-3">
              We keep your information for as long as your account is active or as needed to provide
              our services and meet legal obligations. You may request deletion of your account at
              any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">6. Your rights</h2>
            <p className="mt-3">
              You can access, update, or delete your personal information from your account
              dashboard, or by contacting us. To exercise any of these rights, reach us via our{" "}
              <a href="/contact" className="font-bold text-[var(--hw-orange)] hover:underline">contact page</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">7. Changes to this policy</h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. Continued use of the Platform after
              an update means you accept the revised policy.
            </p>
          </section>

          <p className="text-sm text-[var(--hw-text-muted)]">
            This policy is provided for general use and should be reviewed by qualified legal counsel
            before relying on it commercially.
          </p>
        </div>
      </div>
    </main>
  );
}
