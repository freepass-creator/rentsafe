// 공용 헤더 — 가맹사/관리자 콘솔 공통
export default function AppHeader({ subtitle, right }) {
  return (
    <header className="app-header">
      <div className="app-header-in">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <div className="brand-tx">
            <div className="brand-name">렌터카 <span className="accent">착한</span>거래</div>
            {subtitle && <div className="brand-sub">{subtitle}</div>}
          </div>
        </div>
        {right && <div className="app-header-right">{right}</div>}
      </div>
    </header>
  );
}
