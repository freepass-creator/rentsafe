import "./globals.css";
import { DEMO_MODE } from "@/lib/constants";
import DemoNav from "@/components/DemoNav";
import PWARegister from "@/components/PWARegister";

export const metadata = {
  metadataBase: process.env.VERCEL_URL ? new URL(`https://${process.env.VERCEL_URL}`) : undefined,
  title: "착한거래",
  description: "비금융 거래의 거래이력 확인 플랫폼 (렌터카)",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "착한거래" },
  openGraph: {
    title: "착한거래",
    description: "비금융 거래의 거래이력 확인 플랫폼 (렌터카)",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "착한거래",
    description: "비금융 거래의 거래이력 확인 플랫폼 (렌터카)",
  },
};

export const viewport = {
  themeColor: "#16314d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <PWARegister />
        {DEMO_MODE && <DemoNav />}
        {children}
      </body>
    </html>
  );
}
