import "./globals.css";

export const metadata = {
  title: "RentSafe · 렌터카 안전거래 플랫폼",
  description: "렌터카 대여료 결제·정산 + 거래위험정보 확인 플랫폼",
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
      <body>{children}</body>
    </html>
  );
}
