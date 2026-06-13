"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import BrandMark from "@/components/BrandMark";

const SEEN_KEY = "cd_intro_seen_v1";

// 처음 방문한 손님에게 한 번 뜨는 서비스 소개 — "다시 보지 않기"로 끌 수 있음.
// (설치 앱/재방문자는 한 번 닫으면 더 이상 보이지 않음)
const POINTS = [
  {
    icon: "shield",
    title: "정상 이용 시 기록이 남지 않습니다",
    body: "대여료 미납·차량 미반납 등 문제가 객관적으로 확인된 경우에만 기록됩니다.",
  },
  {
    icon: "user",
    title: "본인만 열람합니다",
    body: "본인인증한 본인과, 본인이 동의한 거래 회원사만 확인할 수 있습니다.",
  },
  {
    icon: "file",
    title: "본인이 직접 전달합니다",
    body: "확인서를 발급받아 새 거래처에 직접 제출하는 본인 중심 구조입니다.",
  },
];

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
          <h2 className="intro-title"><span className="accent">착한</span>거래란?</h2>
          <p className="intro-lead">렌터카 거래이력을 본인이 직접 확인하고 전달하는<br />안전한 거래 플랫폼입니다.</p>
        </div>

        <ul className="intro-points">
          {POINTS.map((p) => (
            <li key={p.title} className="intro-point">
              <span className="ip-ic"><Icon name={p.icon} size={18} /></span>
              <span className="ip-tx">
                <b>{p.title}</b>
                <span>{p.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <label className="intro-dont">
          <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
          <span>다시 보지 않기</span>
        </label>

        <button type="button" className="intro-ok" onClick={close}>확인했어요</button>
      </div>
    </div>
  );
}
