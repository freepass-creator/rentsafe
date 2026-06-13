"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
import { SERVICE_NAME } from "@/lib/constants";

const SEEN_KEY = "cd_intro_seen_v1";

// 처음 방문한 손님에게 한 번 뜨는 '왜 만들었나(취지)' 소개 — "다시 보지 않기"로 끌 수 있음.
// (설치 앱/재방문자는 한 번 닫으면 더 이상 보이지 않음)
export default function IntroOverlay() {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(true);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const close = () => {
    if (dontShow) {
      try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
    }
    setOpen(false);
  };

  return (
    <div className="intro-backdrop" role="dialog" aria-modal="true" aria-label="착한거래 소개" onClick={close}>
      <div className="intro-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="intro-head">
          <BrandMark size={30} className="intro-mark" />
          <h2 className="intro-title"><span className="accent">착한</span>거래는?</h2>
          <p className="intro-tagline">약속을 지킨 사람이 더 신뢰받는,<br /><b>거래 신뢰 인프라</b>입니다.</p>
        </div>

        <ul className="intro-vals">
          <li>
            <b>신뢰가 자산이 됩니다</b>
            <span>약속을 지킬수록 더 좋은 조건으로 거래합니다.</span>
          </li>
          <li>
            <b>낙인이 아니라, 해소</b>
            <span>정상 거래엔 아무것도 남지 않고, 위반 이력은 본인이 직접 풀어냅니다.</span>
          </li>
          <li>
            <b>조회가 아니라, 증명</b>
            <span>거래이력은 본인이 발급하고 본인만 열람합니다. 캐묻지 않습니다.</span>
          </li>
        </ul>

        <p className="intro-vision">약속이 곧 자산이 되는 거래 신뢰 인프라.<br />지금은 <b>{SERVICE_NAME}</b>부터 시작합니다.</p>

        <div className="intro-fields" aria-label="확장 분야">
          <span className="on">{SERVICE_NAME}</span>
          <span>숙박·예약 노쇼</span>
          <span>반려동물 분양</span>
          <span>음식점 예약</span>
          <span>후불·외상 거래</span>
        </div>

        <label className="intro-dont">
          <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
          <span>다시 보지 않기</span>
        </label>

        <button type="button" className="intro-ok" onClick={close}>확인했어요</button>
      </div>
    </div>
  );
}
