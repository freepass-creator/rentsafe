"use client";

import { useState } from "react";
import { RISK_TYPES, fmtBirth, queryRisk, createAppeal } from "@/lib/db";

export default function MyStatus() {
  const [stage, setStage] = useState("auth-select"); // auth-select|auth-form|auth-code|loading|status|appealed
  const [auth, setAuth] = useState({ carrier: "", name: "", birth: "", phone: "", simple: "" });
  const [verified, setVerified] = useState(null);
  const [result, setResult] = useState(null);
  const [shareTo, setShareTo] = useState("");
  const [shared, setShared] = useState("");
  const [appealNote, setAppealNote] = useState("");
  const [fileName, setFileName] = useState("");

  function goSimple(method) {
    setAuth((a) => ({ ...a, simple: method }));
    setStage("loading");
    setTimeout(() => setStage("auth-code"), 1200);
  }
  function requestCode(e) {
    e.preventDefault();
    const f = e.target;
    const next = { carrier: f.carrier.value, name: f.name.value.trim(), birth: f.birth.value.replace(/\D/g,"").slice(0,6), phone: f.phone.value.trim(), simple: "" };
    if (!next.carrier || !next.name || next.birth.length < 6 || !next.phone) { alert("모든 항목을 입력해 주세요. (데모: 아무 값)"); return; }
    setAuth(next); setStage("loading"); setTimeout(() => setStage("auth-code"), 800);
  }
  async function verifyCode(e) {
    e.preventDefault();
    const code = (e.target.code.value || "").replace(/\D/g, "");
    if (code.length < 6) { alert("인증번호 6자리를 입력해 주세요."); return; }
    setStage("loading");
    const v = {
      name: auth.name || "홍길동",
      birth6: auth.birth || "900715",
      birth: auth.birth ? `19${auth.birth.slice(0,2)}.${auth.birth.slice(2,4)}.${auth.birth.slice(4,6)}` : "1990.07.15",
      method: auth.simple ? `${auth.simple} 간편인증` : "휴대폰 본인확인",
    };
    const res = await queryRisk({ name: v.name, birth: v.birth6 });
    setVerified(v); setResult(res); setStage("status");
  }
  function doShare() {
    if (!shareTo.trim()) { alert("공유할 렌트사명을 입력해 주세요."); return; }
    setShared(shareTo.trim());
  }
  async function submitAppeal() {
    if (!appealNote.trim() && !fileName) { alert("소명 내용 또는 증빙을 입력해 주세요."); return; }
    await createAppeal({ name: verified.name, birth: verified.birth6, type: result.records?.[0]?.type || "", note: appealNote.trim(), channel: "self" });
    setStage("appealed");
  }

  const today = new Date();
  const ts = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
  const clean = result?.kind === "none";

  return (
    <div className="app">
      <div className="c-head">
        <div className="eyebrow">RENTSAFE · 내 거래안전 상태</div>
        <h1>내 상태 확인</h1>
        <div className="co">본인 인증 후 본인 정보만 열람됩니다</div>
      </div>

      <div className="c-body">
        {stage === "auth-select" && (
          <>
            <div className="slabel">본인확인</div>
            <div className="stitle">본인인증 후<br/>내 상태를 확인하세요</div>
            <div className="sdesc">본인만 본인 정보를 열람할 수 있습니다.</div>
            <div className="auth-opt rec" onClick={() => setStage("auth-form")}><span className="ic phone">📱</span><span className="tx">휴대폰 본인확인<small>이름·생년월일·통신사</small></span><span className="arr">›</span></div>
            <div className="auth-opt" onClick={() => goSimple("카카오")}><span className="ic kakao">k</span><span className="tx">카카오 간편인증</span><span className="arr">›</span></div>
            <div className="auth-opt" onClick={() => goSimple("토스")}><span className="ic toss">t</span><span className="tx">토스 간편인증</span><span className="arr">›</span></div>
            <div className="card" style={{marginTop:18,padding:16,boxShadow:"none"}}>
              <div style={{fontWeight:700,marginBottom:4}}>📞 본인 명의 휴대폰이 없으신가요?</div>
              <div style={{fontSize:13,color:"var(--ink3)"}}>RentSafe 고객센터 <b>1600-0000</b> 또는 help@rentsafe.kr 로 연락 주시면 신분증·증빙 확인 후 수동으로 처리해 드립니다.</div>
            </div>
          </>
        )}

        {stage === "auth-form" && (
          <form id="af" onSubmit={requestCode}>
            <div className="back" onClick={() => setStage("auth-select")}>‹ 뒤로</div>
            <div className="slabel">휴대폰 본인확인</div>
            <div className="stitle">본인 정보 입력</div>
            <div className="sdesc" style={{marginBottom:18}}>데모이므로 아무 값이나 입력해도 됩니다.</div>
            <div className="field"><label>통신사</label><select name="carrier" defaultValue=""><option value="">선택</option><option>SKT</option><option>KT</option><option>LG U+</option><option>알뜰폰</option></select></div>
            <div className="field"><label>이름</label><input name="name" placeholder="홍길동" /></div>
            <div className="field"><label>생년월일 6자리</label><input name="birth" inputMode="numeric" maxLength={6} placeholder="900715" /></div>
            <div className="field"><label>휴대폰번호</label><input name="phone" inputMode="numeric" placeholder="010-0000-0000" /></div>
          </form>
        )}

        {stage === "auth-code" && (
          <form id="cf" onSubmit={verifyCode}>
            <div className="back" onClick={() => setStage(auth.simple ? "auth-select" : "auth-form")}>‹ 뒤로</div>
            <div className="slabel">인증번호 입력</div>
            <div className="stitle">인증번호를 입력하세요</div>
            <div className="sent-to">📩 <b>{auth.simple ? `${auth.simple} 앱` : auth.phone}</b> 로 발송했습니다.</div>
            <div className="field codebox"><input name="code" inputMode="numeric" maxLength={6} placeholder="● ● ● ● ● ●" /></div>
            <div className="hint">데모: 아무 숫자 6자리.</div>
          </form>
        )}

        {stage === "loading" && <div className="verifying"><div className="spinner" /><div style={{fontWeight:700}}>처리 중…</div></div>}

        {stage === "status" && verified && (
          <>
            <div className="verified">
              <div className="vrow"><span className="chk">✓</span> 본인확인 완료 <span style={{fontSize:11,color:"var(--ink3)",fontWeight:600}}>· {verified.method}</span></div>
              <div className="info"><span><b>{verified.name}</b> 님</span><span>생년월일 {fmtBirth(verified.birth6)}</span></div>
            </div>

            {clean ? (
              <>
                <div className="r-clean" style={{marginBottom:18}}><div className="ic">✓</div><div><h3>거래위험정보 없음</h3><p>현재 등록된 거래위험정보가 없습니다.</p></div></div>
                <div className="receipt" style={{marginTop:0}}>
                  <div className="r"><span className="k">상태</span><span className="v" style={{color:"var(--safe)"}}>이상 없음 (청정)</span></div>
                  <div className="r"><span className="k">확인자</span><span className="v">{verified.name} · {fmtBirth(verified.birth6)}</span></div>
                  <div className="r"><span className="k">발급일</span><span className="v">{ts}</span></div>
                  <div className="r"><span className="k">본인확인</span><span className="v">{verified.method}</span></div>
                </div>
                <div className="card" style={{marginTop:16,boxShadow:"none"}}>
                  <div style={{fontWeight:700,marginBottom:10}}>렌트사에 제출하기</div>
                  <div className="hint" style={{marginTop:0,marginBottom:12}}>① 이 화면을 <b>캡처</b>해서 렌트사에 제출하거나, ② 아래에서 렌트사를 지정해 <b>공유</b>하세요.</div>
                  {shared ? (
                    <div className="r-clean" style={{padding:14}}><div className="ic" style={{width:36,height:36,fontSize:18}}>✓</div><div><h3 style={{fontSize:14}}>{shared}에 공유 완료</h3><p>상태확인서가 전달되었습니다.</p></div></div>
                  ) : (
                    <div style={{display:"flex",gap:8}}>
                      <input value={shareTo} onChange={(e) => setShareTo(e.target.value)} placeholder="예: 홍길동렌터카" style={{flex:1,border:"1px solid var(--line)",borderRadius:9,padding:"11px 13px",fontSize:16}} />
                      <button className="btn btn-primary" onClick={doShare}>공유</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="r-hit" style={{marginBottom:16}}>
                  <div className="head"><div className="ic">!</div><div><h3>거래위험정보 등록됨</h3><p>아래 건이 등록되어 있습니다. 해결하셨다면 소명해 주세요.</p></div></div>
                  {result.records.map((r) => (
                    <div className="risk-row" key={r.id}><div><div className="type">{RISK_TYPES[r.type] || r.type}</div><div className="meta">등록처 {r.company || "-"}</div></div><div className="sp" /><span className="badge b-red"><span className="dot" />유효</span></div>
                  ))}
                </div>
                <div className="card" style={{boxShadow:"none"}}>
                  <div style={{fontWeight:700,marginBottom:6}}>이용 제한 해제 신청 (소명)</div>
                  <div className="hint" style={{marginTop:0,marginBottom:12}}>미납금 정산 내역, 합의서, 변제 확인서 등을 제출하면 관리자 확인 후 해제됩니다.</div>
                  <label className="btn btn-block" style={{marginBottom:10,cursor:"pointer"}}>
                    {fileName ? `📎 ${fileName}` : "📎 증빙 파일 첨부"}
                    <input type="file" style={{display:"none"}} onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
                  </label>
                  <textarea value={appealNote} onChange={(e) => setAppealNote(e.target.value)} rows={3} placeholder="소명 내용 (예: 2026-06-01 미납금 전액 입금 완료)" style={{width:"100%",border:"1px solid var(--line)",borderRadius:9,padding:"11px 13px",fontSize:16,marginBottom:12}} />
                  <button className="btn btn-safe btn-block" onClick={submitAppeal}>소명 제출</button>
                </div>
              </>
            )}
          </>
        )}

        {stage === "appealed" && (
          <div className="done">
            <div className="big">✓</div>
            <h2>소명이 접수되었습니다</h2>
            <p>관리자 확인 후 처리됩니다.<br/>결과는 본인인증으로 다시 확인하실 수 있습니다.</p>
          </div>
        )}
      </div>

      {stage === "auth-form" && <div className="c-footer"><button className="btn btn-primary btn-block" type="submit" form="af">인증번호 받기</button></div>}
      {stage === "auth-code" && <div className="c-footer"><button className="btn btn-primary btn-block" type="submit" form="cf">확인</button></div>}
    </div>
  );
}
