"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";

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
          <h2 className="intro-title"><span className="accent">착한</span>거래를 만든 이유</h2>
          <p className="intro-kicker"><s>낙인</s>이 아니라, <em>신뢰</em>입니다.</p>
        </div>

        <div className="intro-body">
          <p>
            보증금도, 심사도 낮춘 무심사 렌터카는 더 많은 분께 차를 내어주는 좋은 거래입니다.
            다만 일부의 미납·미반납 때문에, 약속을 잘 지키는 <b>대다수 손님까지 높은 보증금과 까다로운 심사</b>를 함께 떠안아 왔습니다.
          </p>
          <p>
            착한거래는 누군가를 가려내는 블랙리스트가 아닙니다. <b>정직하게 거래한 분이 그만큼 더 신뢰받아, 더 좋은 조건으로 거래</b>하도록 돕습니다.
            정상적으로 이용하면 아무 기록도 남지 않습니다.
          </p>
          <p>
            반대로 미납·미반납을 해결하지 않으면 거래이력 확인서에 남아 <b>새 계약이 쉽지 않습니다</b> — 먼저 정산·반납으로 해소하게 하기 위해서입니다.
            그 확인서도 회원사가 캐묻거나 조회하는 게 아니라, <b>운전경력증명서처럼 본인이 직접 발급해 제출</b>합니다.
          </p>
        </div>

        <p className="intro-punch">감시가 아니라, 정직한 거래가 손해 보지 않게 — 착한거래입니다.</p>

        <label className="intro-dont">
          <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
          <span>다시 보지 않기</span>
        </label>

        <button type="button" className="intro-ok" onClick={close}>확인했어요</button>
      </div>
    </div>
  );
}
