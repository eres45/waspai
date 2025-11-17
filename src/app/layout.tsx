import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import {
  ThemeProvider,
  ThemeStyleProvider,
} from "@/components/layouts/theme-provider";
import { Toaster } from "ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ApiPreloader } from "./components/api-preloader";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wasp AI",
  description:
    "Wasp AI is an intelligent chatbot that uses advanced tools to answer your questions.",
  icons: {
    icon: "/favicon.ico",
    apple: "/wasp-ai-logo.png?v=2",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wasp AI",
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          themes={["light", "dark"]}
          storageKey="app-theme-v2"
          disableTransitionOnChange
        >
          <ThemeStyleProvider>
            <NextIntlClientProvider>
              <div id="root">
                <ApiPreloader />
                {children}
                <Toaster richColors />
              </div>
            </NextIntlClientProvider>
          </ThemeStyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
