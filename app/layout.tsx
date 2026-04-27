import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { SensorProvider } from "@/components/SensorProvider";
import { UserProvider } from "@/components/UserProvider";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/nav/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SoilPlus — Portable Soil Intelligence for Every Farmer",
  description:
    "Portable ESP32 soil sensor + AI agronomist. Photo disease diagnosis, yield forecast, weather-aware irrigation. Built for farmers of Kazakhstan.",
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

export const viewport: Viewport = {
  themeColor: "#FAFBF7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-paper antialiased">
        <UserProvider>
          <SensorProvider>
            <Navbar />
            <div className="pt-16">{children}</div>
            <Footer />
          </SensorProvider>
        </UserProvider>
      </body>
    </html>
  );
}
