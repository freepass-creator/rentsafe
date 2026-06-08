"use client";

import { useState, useEffect } from "react";
import { getConsent, completeConsent } from "@/lib/db";
import { CONSENT_STATEMENT, CONSENT_NOTICES, CONSENT_VERSION, CAMPAIGN_TITLE, CAMPAIGN_LEAD } from "@/lib/constants";
import { fmtBirth, fmtDateTime } from "@/lib/format";
import AuthFlow from "@/components/AuthFlow";
import NoticeList from "@/components/NoticeList";

export default function ConsentPage({ params }) {
  const cid = params.cid;
  const [company, setCompany] = useState("스피드렌터카");
  const [started, setStarted] = useState(false);
  const [verified, setVerified] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    getConsent(cid).then((c) => { if (c?.company) setCompany(c.company); }).catch(() => {});
  }, [cid]);

  const step = done ? 3 : verified ? 2 : 1;

  async function finish() {
    try { await completeConsent(cid, { name: verified.name, birth: verified.birth, method: verified.method }); }
    catch (e) { console.error(e); }
    setReceipt({ cid: cid.slice(0, 8).toUpperCase(), ts: fmtDateTime(new Date()) });
    setDone(true);
  }

  return (
    <div className="app">
      <div className="c-head">
        <div className="eyebrow">착한거래 · 렌터카</div>
        <h1>거래안전 동의</h1>
        <div className="co">{company} 차량 임대차계약</div>
      </div>
      <div className="steps"><div className={`s ${step >= 1 ? "on" : ""}`} /><div className={`s ${step >= 2 ? "on" : ""}`} /><div className={`s ${step >= 3 ? "on" : ""}`} /></div>

      <div className="c-body">
        {!started && !verified && (
          <>
            <div className="slabel">{CAMPAIGN_TITLE}</div>
            <div className="stitle">안전한 렌터카 거래, 함께 만들어요</div>
            <div className="sdesc">{CAMPAIGN_LEAD}</div>
            <NoticeList items={CONSENT_NOTICES} />
          </>
        )}
        {started && !verified && <AuthFlow onVerified={setVerified} />}

        {verified && !done && (
          <>
            <div className="verified">
              <div className="vrow"><span className="chk">✓</span> 본인확인 완료 <span style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 600 }}>· {verified.method}</span></div>
              <div className="info"><span><b>{verified.name}</b> 님</span><span>생년월일 {fmtBirth(verified.birth)}</span></div>
            </div>
            <div className="slabel">STEP 2 · 거래안전 동의</div>
            <div className="stitle">거래안전 동의 안내</div>
            <NoticeList items={CONSENT_NOTICES} />
            <div className="statement">{CONSENT_STATEMENT}</div>
            <label className={`cc ${agreed ? "on" : ""}`} onClick={() => setAgreed((v) => !v)}>
              <input type="checkbox" checked={agreed} readOnly onClick={(e) => e.stopPropagation()} /> 위 내용을 모두 확인하였으며 거래이력 제공에 동의합니다.
            </label>
          </>
        )}

        {done && verified && receipt && (
          <div className="done">
            <div className="big">✓</div>
            <h2>동의가 완료되었습니다</h2>
            <p>{company} 거래안전 동의가<br />정상 처리되었습니다.</p>
            <div className="receipt">
              <div className="r"><span className="k">동의번호</span><span className="v mono">{receipt.cid}</span></div>
              <div className="r"><span className="k">본인확인</span><span className="v">완료 · {verified.method}</span></div>
              <div className="r"><span className="k">동의자</span><span className="v">{verified.name}</span></div>
              <div className="r"><span className="k">동의일시</span><span className="v mono">{receipt.ts}</span></div>
              <div className="r"><span className="k">문구버전</span><span className="v">{CONSENT_VERSION}</span></div>
            </div>
            <div className="hint">이 화면은 닫으셔도 됩니다.<br />동의 증빙은 안전하게 보관됩니다.</div>
          </div>
        )}
      </div>

      {!started && !verified && (
        <div className="c-footer"><button className="btn btn-safe btn-block" onClick={() => setStarted(true)}>본인인증하고 동의 진행</button></div>
      )}
      {verified && !done && (
        <div className="c-footer"><button className="btn btn-safe btn-block" disabled={!agreed} onClick={finish}>동의 완료</button></div>
      )}
      </div>
  );
}
