"use client";

import { useState } from "react";
import { findMemberByCode, createSelfConsent } from "@/lib/db";
import { CONSENT_STATEMENT, CONSENT_NOTICES, CONSENT_VERSION, CAMPAIGN_TITLE, CAMPAIGN_HEADLINE, CAMPAIGN_LEAD } from "@/lib/constants";
import { fmtBirth, fmtDateTime } from "@/lib/format";
import AuthFlow from "@/components/AuthFlow";
import NoticeList from "@/components/NoticeList";

export default function SelfConsentPage() {
  const [code, setCode] = useState("");
  const [target, setTarget] = useState(null);   // { company, code }
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");
  const [started, setStarted] = useState(false);
  const [verified, setVerified] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const [receipt, setReceipt] = useState(null);

  async function lookup(e) {
    e.preventDefault();
    setErr("");
    const c = code.trim().toUpperCase();
    if (!c) { setErr("업체코드를 입력해 주세요."); return; }
    setChecking(true);
    const m = await findMemberByCode(c);
    setChecking(false);
    if (!m) { setErr(`‘${c}’ 코드의 회원사를 찾을 수 없습니다. 아직 착한거래 회원사가 아니라면 동의를 진행할 수 없어요.`); return; }
    setTarget(m);
  }

  async function finish() {
    try {
      const id = await createSelfConsent({
        name: verified.name, company: target.company, code: target.code,
        verified: { name: verified.name, birth: verified.birth, method: verified.method },
      });
      setReceipt({ cid: id.slice(-8).toUpperCase(), ts: fmtDateTime(new Date()) });
    } catch (e) { console.error(e); setReceipt({ cid: "-", ts: fmtDateTime(new Date()) }); }
    setDone(true);
  }

  const step = done ? 3 : verified ? 2 : 1;

  return (
    <div className="app">
      <div className="c-head">
        <div className="eyebrow"><span style={{ color: "#4fd6a8" }}>착한</span>거래</div>
        <h1>렌터카 착한거래 동의하기</h1>
        <div className="co">{target ? `${target.company} 차량 임대차계약` : "업체코드를 입력해 시작하세요"}</div>
      </div>
      <div className="steps"><div className={`s ${step >= 1 ? "on" : ""}`} /><div className={`s ${step >= 2 ? "on" : ""}`} /><div className={`s ${step >= 3 ? "on" : ""}`} /></div>

      <div className="c-body">
        {/* STEP 0 — 업체코드 입력 */}
        {!target && (
          <>
            <div className="slabel">동의 대상 확인</div>
            <div className="stitle">어느 회원사에 동의하시나요?</div>
            <div className="sdesc">거래하시는 렌터카 회원사로부터 받은 <b>업체코드</b>를 입력해 주세요. 등록된 착한거래 회원사만 동의 대상이 될 수 있습니다.</div>
            <form onSubmit={lookup}>
              <div className="field"><label>업체코드</label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="예: SPEED1" autoCapitalize="characters" style={{ letterSpacing: 1 }} /></div>
              {err && <div className="auth-err">{err}</div>}
              <button className="btn btn-safe btn-block" type="submit" disabled={checking}>{checking ? "확인 중…" : "회원사 확인"}</button>
            </form>
          </>
        )}

        {/* STEP 1 — 캠페인 안내 + 본인인증 */}
        {target && !started && !verified && (
          <>
            <div className="confirm-co"><span className="cc-chk">✓</span> <b>{target.company}</b> <span className="cc-ok">회원사 확인됨</span></div>
            <div className="slabel">{CAMPAIGN_TITLE}</div>
            <div className="stitle">{CAMPAIGN_HEADLINE}</div>
            <div className="sdesc">{CAMPAIGN_LEAD}</div>
            <NoticeList items={CONSENT_NOTICES} />
          </>
        )}
        {target && started && !verified && <AuthFlow onVerified={setVerified} />}

        {/* STEP 2 — 동의 */}
        {verified && !done && (
          <>
            <div className="verified">
              <div className="vrow"><span className="chk">✓</span> 본인확인 완료 <span style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 600 }}>· {verified.method}</span></div>
              <div className="info"><span><b>{verified.name}</b> 님</span><span>생년월일 {fmtBirth(verified.birth)}</span></div>
            </div>
            <div className="slabel">STEP 2 · {target.company} 착한거래 동의</div>
            <div className="stitle">착한거래 동의 안내</div>
            <NoticeList items={CONSENT_NOTICES} />
            <div className="statement">{CONSENT_STATEMENT}</div>
            <label className={`cc ${agreed ? "on" : ""}`} onClick={() => setAgreed((v) => !v)}>
              <input type="checkbox" checked={agreed} readOnly onClick={(e) => e.stopPropagation()} /> 위 내용을 모두 확인하였으며 거래이력 제공에 동의합니다.
            </label>
          </>
        )}

        {/* STEP 3 — 완료 */}
        {done && verified && receipt && (
          <div className="done">
            <div className="big">✓</div>
            <h2>동의가 완료되었습니다</h2>
            <p>{target.company} 착한거래 동의가<br />정상 처리되었습니다.</p>
            <div className="receipt">
              <div className="r"><span className="k">동의번호</span><span className="v mono">{receipt.cid}</span></div>
              <div className="r"><span className="k">대상 회원사</span><span className="v">{target.company}</span></div>
              <div className="r"><span className="k">본인확인</span><span className="v">완료 · {verified.method}</span></div>
              <div className="r"><span className="k">동의자</span><span className="v">{verified.name}</span></div>
              <div className="r"><span className="k">동의일시</span><span className="v mono">{receipt.ts}</span></div>
              <div className="r"><span className="k">문구버전</span><span className="v">{CONSENT_VERSION}</span></div>
            </div>
            <div className="hint">이 화면은 닫으셔도 됩니다.<br />동의 증빙은 안전하게 보관됩니다.</div>
          </div>
        )}
      </div>

      {target && !started && !verified && (
        <div className="c-footer"><button className="btn btn-safe btn-block" onClick={() => setStarted(true)}>본인인증하고 동의 진행</button></div>
      )}
      {verified && !done && (
        <div className="c-footer"><button className="btn btn-safe btn-block" disabled={!agreed} onClick={finish}>동의 완료</button></div>
      )}
    </div>
  );
}
