import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import type { ReactNode } from "react";

import Header from "@/components/Header";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LosToys | Vehicle Control Center",
  description: "Manage vehicles, documents, and alerts from one console.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${poppins.variable} bg-neutral-950 text-neutral-100 antialiased`}
      >
        <I18nProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 bg-[radial-gradient(circle_at_top,_#1a1a1a,_#050505)]">
                <div className="mx-auto w-full max-w-6xl px-6 py-10">
                  {children}
                </div>
              </main>
            </div>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
