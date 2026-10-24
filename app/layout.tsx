import type { Metadata, Viewport } from "next";
import { Caveat, Onest, Oswald, PT_Mono, Rubik_Dirt } from "next/font/google";
import { SensorProvider } from "@/components/SensorProvider";
import { UserProvider } from "@/components/UserProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { MotionProvider } from "@/components/motion/Motion";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/nav/Footer";
import { DICTS } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

// Every family ships Cyrillic — the interface is bilingual.
const onest = Onest({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-onest",
  weight: ["400", "500", "600"],
});

// Condensed poster sans — the lettering printed on grain sacks
const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-oswald",
  weight: ["400", "500", "600", "700"],
});

// Worn rubber-stamp ink, used sparingly for stamps and the wordmark
const dirt = Rubik_Dirt({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-dirt",
  weight: "400",
});

const ptmono = PT_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-ptmono",
  weight: "400",
});

// Handwritten notes on tags
const caveat = Caveat({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-caveat",
  weight: ["500", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = DICTS[await getLang()];
  return {
    title: t.meta.title,
    description: t.meta.description,
    applicationName: "SoilPlus",
    keywords: [
      "SoilPlus",
      "precision agriculture",
      "ESP32",
      "Kazakhstan",
      "irrigation",
      "soil moisture",
      "plant disease AI",
      "crop yield prediction",
    ],
  };
}

export const viewport: Viewport = {
  themeColor: "#EFE4CC",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${onest.variable} ${oswald.variable} ${dirt.variable} ${ptmono.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-paper antialiased">
        <LanguageProvider initialLang={lang}>
          <MotionProvider>
            <UserProvider>
              <SensorProvider>
                <Navbar />
                {/* clip: slide-in reveals start off-canvas and must not widen the page */}
                <div className="overflow-x-clip pt-24">{children}</div>
                <Footer />
              </SensorProvider>
            </UserProvider>
          </MotionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
