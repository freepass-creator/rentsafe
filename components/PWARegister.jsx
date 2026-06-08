"use client";

import { useEffect } from "react";

// 서비스워커 등록 (PWA 설치/오프라인). 실패해도 앱 동작엔 영향 없음.
export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
