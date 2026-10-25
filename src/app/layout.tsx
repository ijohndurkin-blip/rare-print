import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { tenant } from "@/lib/tenant";
import { googleFontsHref } from "@/lib/fonts";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Poppins({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: {
    default: `Design Studio | ${tenant.name}`,
    template: `%s | ${tenant.name} Design Studio`,
  },
  description: `Design your own shop signs, business cards, leaflets, banners and mugs online with AI, then have ${tenant.name} print them.`,
};

export const viewport: Viewport = {
  themeColor: tenant.colors.primary,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const themeVars = {
    "--brand": tenant.colors.primary,
    "--brand-dark": tenant.colors.primaryDark,
    "--accent": tenant.colors.accent,
    "--ink": tenant.colors.ink,
  } as React.CSSProperties;
  return (
    <html lang="en-GB" className={`${inter.variable} ${display.variable} h-full antialiased`} style={themeVars}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Fonts offered inside the design editor */}
        <link rel="stylesheet" href={googleFontsHref} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
