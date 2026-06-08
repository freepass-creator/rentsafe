"use client";

import { useState } from "react";
import { CARRIERS } from "@/lib/constants";
import { hyphenPhone } from "@/lib/format";
import Icon from "@/components/Icon";

// 공용 본인인증(mock) 흐름 — /consent, /me 등에서 재사용
// onVerified({ name, birth(6자리), method }) 콜백으로 결과 전달
export default function AuthFlow({ onVerified, supportHelp = null }) {
  const [stage, setStage] = useState("select"); // select | form | code | loading
  const [auth, setAuth] = useState({ name: "", birth: "", phone: "", simple: "" });

  function goSimple(method) {
    setAuth((a) => ({ ...a, simple: method }));
    setStage("loading");
    setTimeout(() => setStage("code"), 1200);
  }
  function submitForm(e) {
    e.preventDefault();
    const f = e.target;
    const next = {
      carrier: f.carrier.value, name: f.name.value.trim(),
      birth: f.birth.value.replace(/\D/g, "").slice(0, 6), phone: f.phone.value.trim(), simple: "",
    };
    if (!next.carrier || !next.name || next.birth.length < 6 || !next.phone) {
      alert("모든 항목을 입력해 주세요. (데모: 아무 값)"); return;
    }
    setAuth(next); setStage("loading"); setTimeout(() => setStage("code"), 800);
  }
  function submitCode(e) {
    e.preventDefault();
    const code = (e.target.code.value || "").replace(/\D/g, "");
    if (code.length < 6) { alert("인증번호 6자리를 입력해 주세요."); return; }
    setStage("loading");
    setTimeout(() => {
      onVerified({
        name: auth.name || "홍길동",
        birth: auth.birth || "900715",
        method: auth.simple ? `${auth.simple} 간편인증` : "휴대폰 본인확인",
      });
    }, 900);
  }

  if (stage === "loading")
    return <div className="verifying"><div className="spinner" /><div style={{ fontWeight: 700, fontSize: 15 }}>본인인증 처리 중…</div></div>;

  if (stage === "select")
    return (
      <>
        <div className="slabel">STEP 1 · 본인확인</div>
        <div className="stitle">본인인증 방법을<br />선택해 주세요</div>
        <div className="sdesc">동의 전 본인 명의 확인이 필요합니다.</div>
        <div className="auth-opt rec" onClick={() => setStage("form")}><span className="ic phone"><Icon name="phone" size={18} /></span><span className="tx">휴대폰 본인확인<small>이름·생년월일·통신사</small></span><span className="arr">›</span></div>
        <div className="auth-opt" onClick={() => goSimple("카카오")}><span className="ic kakao">k</span><span className="tx">카카오 간편인증</span><span className="arr">›</span></div>
        <div className="auth-opt" onClick={() => goSimple("토스")}><span className="ic toss">t</span><span className="tx">토스 간편인증</span><span className="arr">›</span></div>
        {supportHelp}
        <div className="hint">실제 서비스에서는 본인확인기관(나이스·KCB) 인증이 연동됩니다.</div>
      </>
    );

  if (stage === "form")
    return (
      <form onSubmit={submitForm}>
        <div className="back" onClick={() => setStage("select")}>‹ 뒤로</div>
        <div className="slabel">휴대폰 본인확인</div>
        <div className="stitle">본인 정보 입력</div>
        <div className="sdesc" style={{ marginBottom: 18 }}>데모이므로 아무 값이나 입력해도 됩니다.</div>
        <div className="field"><label>통신사</label><select name="carrier" defaultValue=""><option value="">선택</option>{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label>이름</label><input name="name" placeholder="홍길동" /></div>
        <div className="field"><label>생년월일 6자리</label><input name="birth" inputMode="numeric" maxLength={6} placeholder="900715" /></div>
        <div className="field"><label>휴대폰번호</label><input name="phone" inputMode="numeric" onInput={(e) => { e.target.value = hyphenPhone(e.target.value); }} placeholder="010-0000-0000" /></div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 6 }} type="submit">인증번호 받기</button>
      </form>
    );

  return (
    <form onSubmit={submitCode}>
      <div className="back" onClick={() => setStage(auth.simple ? "select" : "form")}>‹ 뒤로</div>
      <div className="slabel">인증번호 입력</div>
      <div className="stitle">인증번호를 입력하세요</div>
      <div className="sent-to"><Icon name="mail" /> <b>{auth.simple ? `${auth.simple} 앱` : auth.phone}</b> 로 발송했습니다.</div>
      <div className="field codebox"><input name="code" inputMode="numeric" maxLength={6} placeholder="● ● ● ● ● ●" /></div>
      <div className="hint">데모: 아무 숫자 6자리.</div>
      <button className="btn btn-primary btn-block" style={{ marginTop: 6 }} type="submit">확인</button>
    </form>
  );
}
