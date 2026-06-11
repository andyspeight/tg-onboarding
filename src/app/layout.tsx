import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Your Travelgenix onboarding",
  description:
    "Your guided journey to launching with Travelgenix, one clear step at a time.",
};

// Applied before paint so a saved theme never flashes on load. Light is the
// default for everyone; dark only ever comes from the user's own toggle.
const themeInitScript = `(function(){try{if(localStorage.getItem('tg-theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Set by the proxy for the CSP; renders everything per-request, which
  // nonce-based CSP requires anyway.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
