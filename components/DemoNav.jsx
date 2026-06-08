"use client";

import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

// 데모 전용 역할 전환 바 (실서비스에서는 각 역할이 별도 진입)
const LINKS = [
  { href: "/",      label: "가맹사", icon: "car" },
  { href: "/me",    label: "손님",   icon: "user" },
  { href: "/admin", label: "관리자", icon: "shield" },
];

export default function DemoNav() {
  const path = usePathname();
  return (
    <div className="demo-nav">
      <span className="demo-nav-tag">DEMO</span>
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <a key={l.href} href={l.href} className={`demo-nav-item ${active ? "on" : ""}`}>
            <Icon name={l.icon} size={15} /> {l.label}
          </a>
        );
      })}
    </div>
  );
}
