import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F1 Clash Setup & Loadout Optimizer | Telemetry & Performance",
  description:
    "Calcolatore matematico e gestore preset per massimizzare il Team Score e le prestazioni su ogni circuito di F1 Clash.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0f1115] text-[#f1f3f5] font-sans selection:bg-[#e10600]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
