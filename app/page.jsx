"use client";

import { CAMPAIGN_HEADLINE } from "@/lib/constants";
import Icon from "@/components/Icon";

export default function Landing() {
  return (
    <div className="land">
      <div className="land-main">
      <div className="land-hero">
        <span className="land-mark" aria-hidden>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="land-title">렌터카 <span className="accent">착한</span>거래</h1>
        <p className="land-lead">{CAMPAIGN_HEADLINE}<br />본인인증 후 안전하게 진행하세요.</p>
      </div>

      <div className="land-cards">
        <a href="/consent" className="land-card primary">
          <span className="lc-ic"><Icon name="shield" size={22} /></span>
          <span className="lc-tx">
            <b>착한거래 동의하기</b>
            <span>업체코드를 입력해 해당 회원사에 동의를 진행합니다.</span>
          </span>
          <span className="lc-arrow">→</span>
        </a>

        <a href="/me" className="land-card">
          <span className="lc-ic"><Icon name="user" size={22} /></span>
          <span className="lc-tx">
            <b>내 거래이력 확인</b>
            <span>본인인증 후 내 거래이력을 직접 확인하고 제출합니다.</span>
          </span>
          <span className="lc-arrow">→</span>
        </a>
      </div>
      </div>

      <div className="land-foot">
        <span>회원사이신가요?</span>
        <a href="/login" className="land-biz">회원사 로그인</a>
      </div>
    </div>
  );
}
