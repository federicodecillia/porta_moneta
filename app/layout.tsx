import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/providers/toaster";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { brand } from "@/lib/brand";
import type { BrandTheme } from "@/lib/brand";

const THEME_VAR_MAP: Record<keyof BrandTheme, string[]> = {
  primary: ["--orange"],
  primaryLight: ["--orange-l"],
  accent: ["--teal"],
  accentLight: ["--teal-l"],
  background: ["--background", "--warm-wh"],
  frame: ["--frame"],
};

function themeStyle(): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, vars] of Object.entries(THEME_VAR_MAP)) {
    const value = brand.theme[key as keyof BrandTheme];
    if (value) for (const v of vars) style[v] = value;
  }
  return style as React.CSSProperties;
}

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
    default: brand.appName,
    template: `%s · ${brand.shortName}`,
  },
  description: brand.description,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.shortName,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: brand.theme.primary ?? "#f5a623",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={brand.locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={themeStyle()}
    >
      <head>
        <link rel="apple-touch-icon" href={brand.logoUrl} />
      </head>
      <body className="text-brand-near-black flex min-h-full flex-col">
        {children}
        <Toaster />
        <ConfirmDialogProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
