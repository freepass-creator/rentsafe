"use client";

import { useState } from "react";
import { CARRIERS } from "@/lib/constants";
import { hyphenPhone } from "@/lib/format";
import Icon from "@/components/Icon";
import StepFooter from "@/components/StepFooter";

// 공용 본인인증(mock) — c-body + 하단 StepFooter 규격으로 렌더(부모는 c-head/steps만).
// onVerified({ name, birth(6), phone, method }) / onCancel() = 첫 단계에서 뒤로(인증 취소)
export default function AuthFlow({ onVerified, onCancel, supportHelp = null }) {
  const [stage, setStage] = useState("select"); // select | form | code | loading
  const [chosen, setChosen] = useState(""); // phone | 카카오 | 토스
  const [a, setA] = useState({ carrier: "", name: "", birth: "", phone: "", simple: "", code: "" });
  const set = (k) => (e) => setA((s) => ({ ...s, [k]: e.target.value }));

  function proceed() {
    if (chosen === "phone") { setStage("form"); return; }
    if (chosen) goSimple(chosen);
  }
  function goSimple(method) {
    setA((s) => ({ ...s, simple: method }));
    setStage("loading");
    setTimeout(() => setStage("code"), 1200);
  }
  function toCode() {
    if (!a.carrier || !a.name.trim() || a.birth.replace(/\D/g, "").length < 6 || !a.phone.trim()) {
      alert("모든 항목을 입력해 주세요. (데모: 아무 값)"); return;
    }
    setStage("loading"); setTimeout(() => setStage("code"), 800);
  }
  function confirmCode() {
    if ((a.code || "").replace(/\D/g, "").length < 6) { alert("인증번호 6자리를 입력해 주세요."); return; }
    setStage("loading");
    setTimeout(() => onVerified({
      name: a.name.trim() || "홍길동",
      birth: (a.birth || "900715").replace(/\D/g, "").slice(0, 6),
      phone: a.phone || "",
      method: a.simple ? `${a.simple} 간편인증` : "휴대폰 본인확인",
    }), 900);
  }

  if (stage === "loading")
    return (
      <>
        <div className="c-body anim-in" key={stage}><div className="verifying"><div className="spinner" /><div style={{ fontWeight: 700, fontSize: 15 }}>본인인증 처리 중…</div></div></div>
        <div className="c-footer"><button className="btn btn-block" disabled>처리 중…</button></div>
      </>
    );

  if (stage === "select")
    return (
      <>
        <div className="c-body anim-in" key={stage}>
          <div className="slabel">STEP 1 · 본인확인</div>
          <div className="stitle">본인인증 방법을 선택해 주세요</div>
          <div className="sdesc">동의 전 본인 명의 확인이 필요합니다.</div>
          <div className={`auth-opt ${chosen === "phone" ? "sel" : ""}`} onClick={() => setChosen("phone")}><span className="ic phone"><Icon name="phone" size={18} /></span><span className="tx">휴대폰 본인확인<small>이름·생년월일·통신사</small></span><span className="arr">{chosen === "phone" ? "✓" : "›"}</span></div>
          <div className={`auth-opt ${chosen === "카카오" ? "sel" : ""}`} onClick={() => setChosen("카카오")}><span className="ic kakao">k</span><span className="tx">카카오 간편인증</span><span className="arr">{chosen === "카카오" ? "✓" : "›"}</span></div>
          <div className={`auth-opt ${chosen === "토스" ? "sel" : ""}`} onClick={() => setChosen("토스")}><span className="ic toss">t</span><span className="tx">토스 간편인증</span><span className="arr">{chosen === "토스" ? "✓" : "›"}</span></div>
          {supportHelp}
          <div className="hint">실제 서비스에서는 본인확인기관(나이스·KCB) 인증이 연동됩니다.</div>
        </div>
        <StepFooter prev={{ onClick: onCancel }} next={{ label: "다음", disabled: !chosen, onClick: proceed }} />
      </>
    );

  if (stage === "form")
    return (
      <>
        <div className="c-body anim-in" key={stage}>
          <div className="slabel">휴대폰 본인확인</div>
          <div className="stitle">본인 정보 입력</div>
          <div className="sdesc" style={{ marginBottom: 18 }}>데모이므로 아무 값이나 입력해도 됩니다.</div>
          <div className="field"><label>통신사</label><select value={a.carrier} onChange={set("carrier")}><option value="">선택</option>{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label>이름</label><input value={a.name} onChange={set("name")} placeholder="홍길동" /></div>
          <div className="field"><label>생년월일 6자리</label><input value={a.birth} onChange={set("birth")} inputMode="numeric" maxLength={6} placeholder="900715" /></div>
          <div className="field"><label>휴대폰번호</label><input value={a.phone} onChange={(e) => setA((s) => ({ ...s, phone: hyphenPhone(e.target.value) }))} inputMode="numeric" placeholder="010-0000-0000" /></div>
        </div>
        <StepFooter prev={{ onClick: () => setStage("select") }} next={{ label: "다음", onClick: toCode }} />
      </>
    );

  return (
    <>
      <div className="c-body anim-in" key={stage}>
        <div className="slabel">인증번호 입력</div>
        <div className="stitle">인증번호를 입력하세요</div>
        <div className="sent-to"><Icon name="mail" /> <b>{a.simple ? `${a.simple} 앱` : a.phone}</b> 로 발송했습니다.</div>
        <div className="field codebox"><input value={a.code} onChange={set("code")} inputMode="numeric" maxLength={6} placeholder="● ● ● ● ● ●" /></div>
        <div className="hint">데모: 아무 숫자 6자리.</div>
      </div>
      <StepFooter prev={{ onClick: () => setStage(a.simple ? "select" : "form") }} next={{ label: "다음", onClick: confirmCode }} />
    </>
  );
}
