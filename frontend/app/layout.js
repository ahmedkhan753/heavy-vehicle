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
import { getLang } from "@/lib/i18n-server";

export const metadata = {
  title: "HeavyWheels Pakistan - Heavy Vehicles, Machinery and Parts",
  description:
    "Buy and sell dumpers, trollers, tankers, construction vehicles, trucks, dealers and spare parts across Pakistan in English and Urdu.",
};

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
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ToastProvider>

      </body>
    </html>
  );
}
