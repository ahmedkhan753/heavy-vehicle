export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Signed-in-only areas and the internal API — the pages themselves
        // also carry noindex (dashboard/admin/auth/payment layouts), this
        // additionally keeps crawlers from spending budget on them at all.
        disallow: ["/dashboard", "/admin", "/api/", "/payment/callback"],
      },
    ],
    sitemap: "https://heavywheelspk.com/sitemap.xml",
  };
}
