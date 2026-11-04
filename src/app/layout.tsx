import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { companies } from "@/data/companies";
import { totalRoles } from "@/lib/roles";
import { siteMeta } from "@/lib/site";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: siteMeta.home.title,
  description: siteMeta.home.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0c0c",
};

// Runs before first paint: restores the saved theme (or the OS preference)
// and marks the document as scripted, so there is no theme flash and the
// CSS reveal gating behaves exactly like the previous build.
const themeInitScript = `(function(){try{var t=localStorage.getItem("sa-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#0c0c0c":"#f7f7f2");}catch(e){}document.documentElement.classList.add("js")})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://server.arcgisonline.com" />
        <link rel="preconnect" href="https://basemaps.cartocdn.com" />
      </head>
      <body>
        <Shell companyCount={companies.length} roleCount={totalRoles()}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
