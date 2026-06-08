"use client";

import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

// 데모 전용 역할/화면 전환 바 (상단). 실서비스에서는 각 역할이 별도 진입.
const LINKS = [
  { href: "/",        label: "초기화면", icon: "info",   match: (p) => p === "/" },
  { href: "/consent", label: "손님동의", icon: "shield", match: (p) => p.startsWith("/consent") },
  { href: "/me",      label: "손님상태", icon: "user",   match: (p) => p.startsWith("/me") },
  { href: "/console", label: "회원사",   icon: "car",    match: (p) => p.startsWith("/console") || p.startsWith("/login") || p.startsWith("/signup") },
  { href: "/admin",   label: "관리자",   icon: "check",  match: (p) => p.startsWith("/admin") },
];

export default function DemoNav() {
  const path = usePathname() || "/";
  return (
    <nav className="demo-nav">
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} className={`demo-nav-item ${l.match(path) ? "on" : ""}`}>
          <Icon name={l.icon} size={14} /> {l.label}
        </a>
      ))}
    </nav>
  );
}
