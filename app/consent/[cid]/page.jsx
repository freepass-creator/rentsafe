"use client";

import { useState, useEffect } from "react";
import { getConsent, completeConsent } from "@/lib/db";

export default function ConsentPage({ params }) {
  const cid = params.cid;
  const [company, setCompany] = useState("스피드렌터카");
  const [stage, setStage] = useState("auth-select"); // auth-select|auth-form|auth-code|auth-loading|consent|done
  const [auth, setAuth] = useState({ carrier: "", name: "", birth: "", phone: "", simple: "" });
  const [verified, setVerified] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    getConsent(cid).then((c) => { if (c?.company) setCompany(c.company); }).catch(() => {});
  }, [cid]);

  const step = stage === "done" ? 3 : stage === "consent" ? 2 : 1;

  function goSimple(method) {
    setAuth((a) => ({ ...a, simple: method }));
    setStage("auth-loading");
    setTimeout(() => setStage("auth-code"), 1300);
  }
  function requestCode(e) {
    e.preventDefault();
    const f = e.target;
    const next = {
      carrier: f.carrier.value, name: f.name.value.trim(),
      birth: f.birth.value.replace(/\D/g, "").slice(0, 6), phone: f.phone.value.trim(), simple: "",
    };
    if (!next.carrier || !next.name || next.birth.length < 6 || !next.phone) {
      alert("모든 항목을 입력해 주세요. (데모: 아무 값)"); return;
    }
    setAuth(next);
    setStage("auth-loading");
    setTimeout(() => setStage("auth-code"), 900);
  }
  function verifyCode(e) {
    e.preventDefault();
    const code = (e.target.code.value || "").replace(/\D/g, "");
    if (code.length < 6) { alert("인증번호 6자리를 입력해 주세요."); return; }
    setStage("auth-loading");
    setTimeout(() => {
      const birth = auth.birth ? `19${auth.birth.slice(0,2)}.${auth.birth.slice(2,4)}.${auth.birth.slice(4,6)}` : "1990.07.15";
      setVerified({ name: auth.name || "홍길동", birth, method: auth.simple ? `${auth.simple} 간편인증` : "휴대폰 본인확인" });
      setStage("consent");
    }, 900);
  }
  async function finish() {
    const v = verified;
    try { await completeConsent(cid, { name: v.name, birth: v.birth, method: v.method }); } catch (e) { console.error(e); }
    const now = new Date();
    setReceipt({
      cid: cid.slice(0, 8).toUpperCase(),
      ts: `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,
    });
    setStage("done");
  }

  return (
    <div className="app">
      <div className="c-head">
        <div className="eyebrow">RENTSAFE · 렌터카 안전거래</div>
        <h1>거래안전 동의</h1>
        <div className="co">{company} 차량 임대차계약</div>
      </div>
      <div className="steps">
        <div className={`s ${step>=1?"on":""}`} /><div className={`s ${step>=2?"on":""}`} /><div className={`s ${step>=3?"on":""}`} />
      </div>

      <div className="c-body">
        {stage === "auth-select" && (
          <>
            <div className="slabel">STEP 1 · 본인확인</div>
            <div className="stitle">본인인증 방법을<br/>선택해 주세요</div>
            <div className="sdesc">동의 전 본인 명의 확인이 필요합니다.</div>
            <div className="auth-opt rec" onClick={() => setStage("auth-form")}><span className="ic phone">📱</span><span className="tx">휴대폰 본인확인<small>이름·생년월일·통신사로 인증</small></span><span className="arr">›</span></div>
            <div className="auth-opt" onClick={() => goSimple("카카오")}><span className="ic kakao">k</span><span className="tx">카카오 간편인증</span><span className="arr">›</span></div>
            <div className="auth-opt" onClick={() => goSimple("토스")}><span className="ic toss">t</span><span className="tx">토스 간편인증</span><span className="arr">›</span></div>
            <div className="hint">실제 서비스에서는 본인확인기관(나이스·KCB) 인증이 연동됩니다.</div>
          </>
        )}

        {stage === "auth-form" && (
          <form id="authform" onSubmit={requestCode}>
            <div className="back" onClick={() => setStage("auth-select")}>‹ 뒤로</div>
            <div className="slabel">STEP 1 · 휴대폰 본인확인</div>
            <div className="stitle">본인 정보를 입력해 주세요</div>
            <div className="sdesc" style={{marginBottom:18}}>통신사 등록 정보와 일치해야 합니다.</div>
            <div className="field"><label>통신사</label>
              <select name="carrier" defaultValue=""><option value="">선택</option><option>SKT</option><option>KT</option><option>LG U+</option><option>알뜰폰</option></select></div>
            <div className="field"><label>이름</label><input name="name" placeholder="홍길동" /></div>
            <div className="field"><label>생년월일 6자리</label><input name="birth" inputMode="numeric" maxLength={6} placeholder="900715" /></div>
            <div className="field"><label>휴대폰번호</label><input name="phone" inputMode="numeric" placeholder="010-0000-0000" /></div>
            <div className="hint">데모이므로 아무 값이나 입력해도 됩니다.</div>
          </form>
        )}

        {stage === "auth-code" && (
          <form id="codeform" onSubmit={verifyCode}>
            <div className="back" onClick={() => setStage(auth.simple ? "auth-select" : "auth-form")}>‹ 뒤로</div>
            <div className="slabel">STEP 1 · 인증번호 입력</div>
            <div className="stitle">인증번호를 입력해 주세요</div>
            <div className="sent-to">📩 <b>{auth.simple ? `${auth.simple} 간편인증 앱` : auth.phone}</b> 로<br/>인증번호를 발송했습니다.</div>
            <div className="field codebox"><input name="code" inputMode="numeric" maxLength={6} placeholder="● ● ● ● ● ●" /></div>
            <div className="hint">데모: 아무 숫자 6자리나 입력하세요.</div>
          </form>
        )}

        {stage === "auth-loading" && (
          <div className="verifying"><div className="spinner" /><div style={{fontWeight:700,fontSize:15}}>본인인증 처리 중…</div></div>
        )}

        {stage === "consent" && verified && (
          <>
            <div className="verified">
              <div className="vrow"><span className="chk">✓</span> 본인확인 완료 <span style={{fontSize:11,color:"var(--ink3)",fontWeight:600}}>· {verified.method}</span></div>
              <div className="info"><span><b>{verified.name}</b> 님</span><span>생년월일 {verified.birth}</span></div>
            </div>
            <div className="slabel">STEP 2 · 거래안전 동의</div>
            <div className="stitle">거래안전 동의 안내</div>
            <div className="notice">
              <div className="ni safe"><div className="n">1</div><div><b>정상 이용 시 등록되지 않습니다.</b> 정상 납부·반환 시 거래위험정보는 남지 않아요.</div></div>
              <div className="ni"><div className="n">2</div><div><b>중대한 계약위반 시에만 등록됩니다.</b> 대여료 미납·차량 미반납 등.</div></div>
              <div className="ni"><div className="n">3</div><div><b>가맹사가 제한 조회합니다.</b> 신규 계약 판단 목적의 등록 여부 확인만.</div></div>
              <div className="ni safe"><div className="n">4</div><div><b>해소 시 삭제됩니다.</b> 정산·반환 완료 시 지체 없이 삭제·변경.</div></div>
            </div>
            <div className="statement">본인은 렌터카 안전거래 플랫폼 가입 및 본 플랫폼을 통한 대여료 결제·정산 서비스 이용에 동의합니다. 정상 이행 시 거래위험정보는 등록되지 않으며, 대여료 미납·차량 미반납 등 거래상 문제 발생 시 본인의 거래정보가 <b>암호화되어 본 플랫폼 가맹 자동차대여사업자에게 제공</b>되어 신규 계약 판단 시 확인될 수 있음에 동의합니다. 문제 해소 시 해당 정보는 지체 없이 삭제·상태변경됩니다.</div>
            <label className={`cc ${agreed?"on":""}`} onClick={() => setAgreed((v) => !v)}>
              <input type="checkbox" checked={agreed} readOnly onClick={(e) => e.stopPropagation()} /> 위 내용을 모두 확인하였으며 거래위험정보 제공에 동의합니다.
            </label>
          </>
        )}

        {stage === "done" && verified && receipt && (
          <div className="done">
            <div className="big">✓</div>
            <h2>동의가 완료되었습니다</h2>
            <p>{company} 거래안전 동의가<br/>정상 처리되었습니다.</p>
            <div className="receipt">
              <div className="r"><span className="k">동의번호</span><span className="v mono">{receipt.cid}</span></div>
              <div className="r"><span className="k">본인확인</span><span className="v">완료 · {verified.method}</span></div>
              <div className="r"><span className="k">동의자</span><span className="v">{verified.name}</span></div>
              <div className="r"><span className="k">동의일시</span><span className="v mono">{receipt.ts}</span></div>
              <div className="r"><span className="k">문구버전</span><span className="v">v1.0</span></div>
            </div>
            <div className="hint">이 화면은 닫으셔도 됩니다.<br/>동의 증빙은 안전하게 보관됩니다.</div>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      {stage === "auth-form" && (
        <div className="c-footer"><button className="btn btn-primary btn-block" type="submit" form="authform">인증번호 받기</button></div>
      )}
      {stage === "auth-code" && (
        <div className="c-footer"><button className="btn btn-primary btn-block" type="submit" form="codeform">확인</button></div>
      )}
      {stage === "consent" && (
        <div className="c-footer"><button className="btn btn-safe btn-block" disabled={!agreed} onClick={finish}>동의 완료</button></div>
      )}
    </div>
  );
}
