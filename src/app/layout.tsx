import type { Metadata } from "next";
import { Geist_Mono, Inter, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediAgent — Dispensario",
  description:
    "Centro de operación del dispensario: agenda, llamadas y entregas en tiempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-[var(--color-canvas-soft)] text-[var(--color-ink)]">
        <AppShell>{children}</AppShell>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              border: "1px solid #0e0f0c",
              borderRadius: 0,
              background: "#ffffff",
              color: "#0e0f0c",
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </body>
    </html>
  );
}
