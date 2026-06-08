// 공용 헤더 — 가맹사/관리자 콘솔 공통
import BrandMark from "@/components/BrandMark";

export default function AppHeader({ subtitle, right }) {
  return (
    <header className="app-header">
      <div className="app-header-in">
        <div className="brand">
          <BrandMark size={18} className="brand-mark" />
          <div className="brand-tx">
            <div className="brand-name"><span className="accent">착한</span>거래</div>
            {subtitle && <div className="brand-sub">{subtitle}</div>}
          </div>
        </div>
        {right && <div className="app-header-right">{right}</div>}
      </div>
    </header>
  );
}
