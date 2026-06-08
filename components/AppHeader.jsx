// 공용 헤더 — 가맹사/관리자 콘솔 공통
export default function AppHeader({ subtitle, right }) {
  return (
    <header className="app-header">
      <div className="app-header-in">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.5 4 6v6c0 4.4 3.1 7.9 8 9.5 4.9-1.6 8-5.1 8-9.5V6l-8-3.5Z" fill="rgba(255,255,255,.16)"/>
              <path d="m8.5 12 2.4 2.4L15.7 9.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <div className="brand-tx">
            <div className="brand-name">착한<span className="accent">거래</span></div>
            {subtitle && <div className="brand-sub">{subtitle}</div>}
          </div>
        </div>
        {right && <div className="app-header-right">{right}</div>}
      </div>
    </header>
  );
}
