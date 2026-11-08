import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Instrument_Sans, Nunito } from "next/font/google";
import "./globals.css";
import { PHASE_BOOT_SCRIPT, SkyProvider } from "@/components/sky/SkyProvider";

// All three are self-hosted at build time by next/font (no requests to Google at runtime).
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });
// The signed-in app's face (one family; the landing page sets its own).
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: "Regather",
  description: "A small, private pond of families who get it, any hour.",
};

export const viewport: Viewport = {
  themeColor: "#1b2547",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the boot script sets data-phase / data-weather before first
    // paint (from the clock and the last known sun times), which differs from the server default.
    <html
      lang="en"
      data-phase="night"
      suppressHydrationWarning
      className={`${nunito.variable} ${fraunces.variable} ${caveat.variable} ${instrument.variable} h-full antialiased`}
    >
      <head>
        <script>{PHASE_BOOT_SCRIPT}</script>
      </head>
      <body className="min-h-full flex flex-col">
        <SkyProvider>{children}</SkyProvider>
      </body>
    </html>
  );
}
