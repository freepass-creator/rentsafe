import "./globals.css";
import { DEMO_MODE } from "@/lib/constants";
import DemoNav from "@/components/DemoNav";

export const metadata = {
  title: "렌터카 착한거래",
  description: "외상·후불 등 비금융 거래의 거래이력 확인 플랫폼 (첫 서비스: 렌터카)",
  robots: { index: false, follow: false },
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
      <body>{DEMO_MODE && <DemoNav />}{children}</body>
    </html>
  );
}
