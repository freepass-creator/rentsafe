"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
import { PRE_LAUNCH_INTRO } from "@/lib/constants";

const SEEN_KEY = "cd_intro_seen_v1";

// 착한거래 소개 오버레이.
// 오픈 전(PRE_LAUNCH_INTRO=true): 새로고침마다 떠서 확인하고 들어가게.
// 오픈 후(false): 첫 방문 1회만 뜨고 '다시 보지 않기'로 끔.
export default function IntroOverlay() {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (standalone) return; // 설치 앱에선 표시하지 않음 (바로 진입)
    if (PRE_LAUNCH_INTRO) { setOpen(true); return; } // 오픈 전: 새로고침마다 표시
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const close = () => {
    if (!PRE_LAUNCH_INTRO && dontShow) {
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
          <p className="intro-tagline">신뢰가 필요한 곳에,<br /><b>스스로 증명</b>해요.</p>
        </div>

        <ul className="intro-vals">
          <li>
            <b>시작은 가볍게</b>
            <span>거래이력이 없어도 괜찮아요. 동의하는 것부터가 시작이에요.</span>
          </li>
          <li>
            <b>내 기록은 내가</b>
            <span>거래이력은 본인이 발급하고, 당사자만 봐요.</span>
          </li>
          <li>
            <b>서로 같이</b>
            <span>거래는 한쪽만 잘하면 안 되니까요. 사는 쪽도, 파는 쪽도 같이 신경 써요.</span>
          </li>
          <li>
            <b>이런 경우에만 이력이 남아요</b>
            <span>약속을 어긴 몇몇 경우에만요. 평소대로 거래하면 아무것도 안 남아요.</span>
          </li>
        </ul>

        <p className="intro-vision">여기서 쌓은 신뢰는,<br />신뢰가 필요한 <b>다른 거래</b>에서도 힘이 돼요.</p>

        <div className="intro-fields" aria-label="적용 분야">
          <span>렌터카</span>
          <span>전월세 임대차</span>
          <span>숙박·예약 노쇼</span>
          <span>반려동물 분양</span>
          <span>음식점 예약</span>
          <span>후불·외상 거래</span>
        </div>

        {!PRE_LAUNCH_INTRO && (
          <label className="intro-dont">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
            <span>다시 보지 않기</span>
          </label>
        )}

        <button type="button" className="intro-ok" onClick={close}>확인했어요</button>
      </div>
    </div>
  );
}
