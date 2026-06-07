import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorThemeProvider } from "@/components/color-theme-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_COLOR_THEME,
} from "@/lib/constants/color-themes";
import "./globals.css";

const colorThemeScript = `
  try {
    var colorTheme = localStorage.getItem("${COLOR_THEME_STORAGE_KEY}");
    document.documentElement.setAttribute(
      "data-color",
      colorTheme || "${DEFAULT_COLOR_THEME}"
    );
  } catch (e) {
    document.documentElement.setAttribute("data-color", "${DEFAULT_COLOR_THEME}");
  }
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GymTrack Pro",
  description: "Fast, simple workout tracking",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymTrack",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
    <html lang="en" suppressHydrationWarning data-color={DEFAULT_COLOR_THEME}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorThemeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <ThemeProvider>
          <ColorThemeProvider>
            {children}
            <Toaster richColors position="top-center" />
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
