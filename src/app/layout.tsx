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
  title: {
    default: "Wasp AI | Advanced Multi-Model AI Assistant",
    template: "%s | Wasp AI",
  },
  description:
    "Access the future of AI: GPT-5 Pro, Gemini 3, Claude 4.5, and Grok 4 in one professional interface. Generate images, videos, and code with the world's most advanced models on Wasp AI.",
  keywords: [
    "GPT-5 Pro",
    "GPT-5 Mini",
    "Gemini 3 Pro",
    "Gemini 3 Flash",
    "Claude 4.5 Opus",
    "Claude 4.5 Sonnet",
    "Grok 4 DeepSearch",
    "DeepSeek V3.2",
    "Llama 4",
    "Mistral Large 3",
    "AI Chat",
    "Image Generation",
    "Video Generation",
    "PDF Analysis",
    "Document Chat",
    "Social Media Downloader",
    "Professional AI Tool",
    "Multi-model Chatbot",
    "Wasp AI",
  ],
  authors: [{ name: "Wasp AI Team" }],
  creator: "Wasp AI",
  publisher: "Wasp AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://waspai.in",
    siteName: "Wasp AI",
    title: "Wasp AI | Advanced Multi-Model AI Assistant",
    description:
      "Access the future of AI: GPT-5 Pro, Gemini 3, Claude 4.5, and Grok 4 in one professional interface. Generate images, videos, and code with the world's most advanced models on Wasp AI.",
    images: [
      {
        url: "https://waspai.in/og-image.jpg", // We should ideally add a real route for this later
        width: 1200,
        height: 630,
        alt: "Wasp AI Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wasp AI | Advanced Multi-Model AI Assistant",
    description:
      "Access the world's best AI models (GPT-4, Gemini, Claude, DeepSeek) in one professional interface.",
    creator: "@waspai",
    images: ["https://waspai.in/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wasp AI",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Wasp AI",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "featureList": [
    "Multi-model AI Chat",
    "Image Generation",
    "Video Generation",
    "PDF Analysis",
    "Social Media Downloader",
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
