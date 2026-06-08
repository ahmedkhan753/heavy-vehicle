import "./globals.css";
import { ToastProvider } from "@/Context/ToastContext";
import { AuthProvider } from "@/Context/AuthContext";
import { ThemeProvider } from "@/Context/ThemeContext";
import { LanguageProvider } from "@/Context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
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
    <html lang={lang} dir={dir}>
      {/* pb-16 reserves space for the fixed mobile bottom nav (h-16) so the
          footer isn't hidden behind it; removed at lg where the bar is hidden. */}
      <body className="min-h-screen flex flex-col bg-[var(--hw-bg-base)] text-[var(--hw-text-primary)] antialiased font-sans pb-16 lg:pb-0">

        <ToastProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <Navbar />
                {children}
                <Footer />
                <MobileNav />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ToastProvider>

      </body>
    </html>
  );
}
