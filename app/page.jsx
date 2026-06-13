"use client";

import { CAMPAIGN_HEADLINE, CODE_LABEL } from "@/lib/constants";
import Icon from "@/components/Icon";
import BrandMark from "@/components/BrandMark";
import InstallButton from "@/components/InstallButton";
import IntroOverlay from "@/components/IntroOverlay";

export default function Landing() {
  return (
    <div className="land">
      <IntroOverlay />
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
      </div>

      <div className="land-foot">
        <span>회원이신가요?</span>
        <a href="/login" className="land-biz">회원 로그인</a>
        <InstallButton />
      </div>
    </div>
  );
}
