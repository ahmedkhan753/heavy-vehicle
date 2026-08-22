import "./globals.css";
import { ToastProvider } from "@/Context/ToastContext";
import { AuthProvider } from "@/Context/AuthContext";
import { ThemeProvider } from "@/Context/ThemeContext";
import { LanguageProvider } from "@/Context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import HeavyWheelsAssistant from "@/components/assistant/HeavyWheelsAssistant";
import AdBanner from "@/components/ads/AdBanner";
import IntroExperience from "@/components/intro/IntroExperience";
import { getLang } from "@/lib/i18n-server";
import { fallbackImage } from "@/lib/constants";

const SITE_NAME = "HeavyWheels Pakistan";
const SITE_URL = "https://heavywheelspk.com";
const SITE_DESCRIPTION =
  "Buy and sell dumpers, trollers, tankers, construction vehicles, trucks, dealers and spare parts across Pakistan in English and Urdu.";

export const metadata = {
  // Lets relative/og:url resolution work correctly; individual listing pages
  // override title/description/openGraph with their own via generateMetadata
  // so a shared ad link shows its own photo and price, not this default.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Heavy Vehicles, Machinery and Parts`,
    // Pages that set their own title (e.g. "Hino 500 | HeavyWheels") get it
    // used as-is; this template only fills in for a bare title string.
    template: "%s | HeavyWheels",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: fallbackImage }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [fallbackImage],
  },
};

// Organization + WebSite JSON-LD — tells Google this domain is HeavyWheels
// (not just "some new domain"), and gives it a preferred site name to show
// in results. Emitted once, site-wide, on every page via the root layout.
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/heavywheels-logo.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  },
];

export default async function RootLayout({ children }) {
  // Read the language cookie on the server so the very first paint has the
  // correct lang + text direction (RTL for Urdu) — no flash, no layout jump.
  const lang = await getLang();
  const dir = lang === "ur" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      {/* pb-16 reserves space for the fixed mobile bottom nav (h-16) so the
          footer isn't hidden behind it; removed at lg where the bar is hidden. */}
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-[var(--hw-bg-base)] text-[var(--hw-text-primary)] antialiased font-sans pb-16 lg:pb-0">

        <ToastProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                {/* Leaderboard above the navbar — renders nothing when no
                    campaign is live, so the layout is unaffected until one is. */}
                <AdBanner placement="header" limit={1} />
                <Navbar />
                {children}
                <Footer />
                <MobileNav />
                <HeavyWheelsAssistant />
                {/* Sits above everything via z-index — no restructuring of
                    Navbar/Footer/MobileNav needed to hide them visually. */}
                <IntroExperience />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ToastProvider>

      </body>
    </html>
  );
}
