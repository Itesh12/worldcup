import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { LoadingProvider } from "@/components/LoadingContext";
import GlobalLoader from "@/components/GlobalLoader";
import Script from "next/script";
import { BottomNav } from "@/components/BottomNav";
import { TournamentProvider } from "@/components/TournamentContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "World Cup Hub",
  description: "Official Player Portal for Cricket World Cup",
  manifest: "/manifest.json",
  themeColor: "#050B14",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "World Cup Hub",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen pb-12 md:pb-0`}>
        <LoadingProvider>
          <TournamentProvider>
            <AuthProvider>
              <GlobalLoader />
              <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
              <Script id="register-sw" strategy="afterInteractive">
                {`
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(
                        function(registration) {
                          console.log('ServiceWorker registration successful with scope: ', registration.scope);
                        },
                        function(err) {
                          console.log('ServiceWorker registration failed: ', err);
                        }
                      );
                    });
                  }
                `}
              </Script>
              {children}
              <BottomNav />
            </AuthProvider>
          </TournamentProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
