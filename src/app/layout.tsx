import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { LoadingProvider } from "@/components/LoadingContext";
import GlobalLoader from "@/components/GlobalLoader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cricket Match Platform",
  description: "Dynamic batting slot assignment and leaderboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen`}>
        <LoadingProvider>
          <AuthProvider>
            <GlobalLoader />
            {children}
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
