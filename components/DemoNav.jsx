"use client";

import { usePathname, useRouter } from "next/navigation";

// 데모 페이지 선택 — 나중에 페이지가 늘면 여기 옵션만 추가하면 됩니다.
const PAGES = [
  { href: "/",        label: "초기화면 · 착한거래 메인" },
  { href: "/consent", label: "손님 · 착한거래 동의하기" },
  { href: "/me",      label: "손님 · 내 거래이력 확인" },
  { href: "/temp",    label: "직거래 · 임시 거래코드 받기" },
  { href: "/login",   label: "회원 · 로그인" },
  { href: "/console", label: "회원 · 콘솔" },
  { href: "/admin",   label: "관리자" },
];

function currentHref(p) {
  if (p.startsWith("/consent")) return "/consent";
  if (p.startsWith("/console")) return "/console";
  if (p.startsWith("/admin")) return "/admin";
  if (p.startsWith("/me")) return "/me";
  if (p.startsWith("/temp")) return "/temp";
  if (p.startsWith("/login") || p.startsWith("/signup") || p.startsWith("/reset")) return "/login";
  return "/";
}

export default function DemoNav() {
  const path = usePathname() || "/";
  const router = useRouter();
  return (
    <div className="demo-bar">
      <span className="demo-bar-tag"><span className="dot" /> 서비스 소개</span>
      <select className="demo-bar-sel" value={currentHref(path)} onChange={(e) => router.push(e.target.value)} aria-label="데모 페이지 선택">
        {PAGES.map((p) => <option key={p.href} value={p.href}>{p.label}</option>)}
      </select>
    </div>
  );
}
