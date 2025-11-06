import type { Metadata } from "next";
import { Suspense } from "react";

import "./globals.css";
import { BreathingBackground } from "../components/BreathingBackground";

export const metadata: Metadata = {
  title: "Goal App Prototype",
  description: "A breathing companion for personal growth."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen overflow-hidden bg-black text-slate-900 antialiased">
        <Suspense fallback={null}>
          <BreathingBackground />
        </Suspense>
        <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
