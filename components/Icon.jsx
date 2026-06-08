// 공용 SVG 아이콘 (이모지 대체) — stroke 기반, currentColor 상속
const PATHS = {
  send: <><path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9z" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  phone: <><rect x="5" y="2" width="14" height="20" rx="2.5" /><path d="M12 18h.01" /></>,
  phoneCall: <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 1h2a2 2 0 0 1 2 1.7c.12.9.33 1.8.62 2.6a2 2 0 0 1-.45 2.1L7.1 9.1a16 16 0 0 0 6 6l1.7-1.2a2 2 0 0 1 2.1-.45c.8.29 1.7.5 2.6.62A2 2 0 0 1 22 16.9z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  refresh: <><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></>,
  car: <><path d="M5 17a2 2 0 0 1-2-2v-3l2-5.2A2 2 0 0 1 6.9 5.5h10.2a2 2 0 0 1 1.9 1.3L21 12v3a2 2 0 0 1-2 2" /><path d="M5 17h14" /><circle cx="7.5" cy="17.5" r="1.6" /><circle cx="16.5" cy="17.5" r="1.6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  shield: <><path d="M12 3 5 6v6c0 4 3 7 7 8 4-1 7-4 7-8V6z" /><path d="m9 12 2 2 4-4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  check: <path d="m5 12 5 5 9-10" />,
};

export default function Icon({ name, size = 16, strokeWidth = 2, style, className }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, verticalAlign: "-3px", ...style }}
      aria-hidden
    >
      {PATHS[name] || null}
    </svg>
  );
}
