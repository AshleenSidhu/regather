import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { PHASE_BOOT_SCRIPT, SkyProvider } from "@/components/sky/SkyProvider";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Regather",
  description: "Families who get it, any hour.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the boot script sets data-phase from the device clock
    // before first paint, which intentionally differs from the server's default.
    <html
      lang="en"
      data-phase="day"
      suppressHydrationWarning
      className={`${nunito.variable} h-full antialiased`}
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
