"use client";

import { CAMPAIGN_HEADLINE, CODE_LABEL } from "@/lib/constants";
import Icon from "@/components/Icon";
import BrandMark from "@/components/BrandMark";

export default function Landing() {
  return (
    <div className="land">
      <div className="land-main">
      <div className="land-hero">
        <BrandMark size={34} className="land-mark" />
        <h1 className="land-title"><span className="accent">착한</span>거래</h1>
        <p className="land-lead">{CAMPAIGN_HEADLINE}<br />본인인증 후 안전하게 진행하세요.</p>
      </div>

      <div className="land-cards">
        <a href="/consent" className="land-card primary">
          <span className="lc-ic"><Icon name="shield" size={22} /></span>
          <span className="lc-tx">
            <b>착한거래 동의하기</b>
            <span>{CODE_LABEL}를 입력해 거래 상대에게 동의를 진행합니다.</span>
          </span>
          <span className="lc-arrow">→</span>
        </a>

        <a href="/me" className="land-card">
          <span className="lc-ic"><Icon name="user" size={22} /></span>
          <span className="lc-tx">
            <b>내 거래이력 확인</b>
            <span>본인인증 후 내 거래이력을 직접 확인하고 전달합니다.</span>
          </span>
          <span className="lc-arrow">→</span>
        </a>
      </div>

      <div style={{ marginTop: 26 }}>
        {[
          { label: "우리 서비스", items: ["렌터카매니저", "Freepasserp", "신차견적기", "중고차구독견적기", "착한거래"] },
          { label: "협력사", items: ["프리패스", "카벨"] },
          { label: "회원사", items: ["손오공", "웰릭스", "스위치"] },
        ].map((g) => (
          <div key={g.label} style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink3)", letterSpacing: ".5px", marginBottom: 9 }}>{g.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {g.items.map((it) => <span key={it} style={{ fontSize: 13, fontWeight: 700, color: "var(--ink2)", background: "#f3f6f9", border: "1px solid #e6ebf1", borderRadius: 9, padding: "8px 13px" }}>{it}</span>)}
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className="land-foot">
        <span>회원이신가요?</span>
        <a href="/login" className="land-biz">회원 로그인</a>
      </div>
    </div>
  );
}
