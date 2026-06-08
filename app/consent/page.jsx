"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findMemberByCode, createSelfConsent } from "@/lib/db";
import { CONSENT_STATEMENT, CONSENT_NOTICES, CONSENT_VERSION, CAMPAIGN_TITLE, CAMPAIGN_HEADLINE, CAMPAIGN_LEAD, CODE_LABEL, DEMO_MODE } from "@/lib/constants";
import { fmtBirth, fmtDateTime } from "@/lib/format";
import AuthFlow from "@/components/AuthFlow";
import NoticeList from "@/components/NoticeList";
import SignaturePad from "@/components/SignaturePad";

export default function SelfConsentPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [target, setTarget] = useState(null);   // { company, code }
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");
  const [started, setStarted] = useState(false);
  const [verified, setVerified] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [sig, setSig] = useState("");
  const [done, setDone] = useState(false);
  const [receipt, setReceipt] = useState(null);

  async function lookup() {
    setErr("");
    const c = code.trim();
    if (!c) { setErr(`${CODE_LABEL}를 입력해 주세요.`); return; }
    setChecking(true);
    try {
      const m = await findMemberByCode(c);
      if (!m) { setErr(`‘${c}’ ${CODE_LABEL}의 거래 상대를 찾을 수 없습니다. 아직 착한거래 회원이 아니라면 동의를 진행할 수 없어요.`); return; }
      setTarget(m);
    } catch (e) {
      console.error(e);
      setErr("확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setChecking(false);
    }
  }

  // 하단 [다음] 버튼 — 현재 단계에 따라 동작/문구/비활성 결정
  function onNext() {
    if (!target) return lookup();
    if (!started && !verified) return setStarted(true);
    if (verified && !signing) return setSigning(true);
    if (verified && signing) return finish();
  }
  function nextLabel() {
    if (!target) return checking ? "확인 중…" : "다음";
    if (!started && !verified) return "본인인증하고 진행";
    if (verified && !signing) return "동의하고 서명";
    if (verified && signing) return "동의 완료";
    return "다음";
  }
  function nextDisabled() {
    if (!target) return checking || !code.trim();
    if (verified && !signing) return !agreed;
    if (verified && signing) return !sig;
    return false;
  }

  async function finish() {
    try {
      const id = await createSelfConsent({
        name: verified.name, company: target.company, code: target.code,
        verified: { name: verified.name, birth: verified.birth, method: verified.method },
        signed: !!sig,
      });
      setReceipt({ cid: id.slice(-8).toUpperCase(), ts: fmtDateTime(new Date()) });
    } catch (e) { console.error(e); setReceipt({ cid: "-", ts: fmtDateTime(new Date()) }); }
    setDone(true);
  }

  const step = done ? 4 : signing ? 3 : verified ? 2 : 1;

  function goBack() {
    if (done) { router.push("/"); return; }
    if (signing) { setSigning(false); return; }
    if (verified) { setVerified(null); setAgreed(false); return; }
    if (started) { setStarted(false); return; }
    if (target) { setTarget(null); setCode(""); setErr(""); return; }
    router.push("/");
  }

  return (
    <div className="app">
      <div className="c-head">
        <div className="eyebrow"><span style={{ color: "#4fd6a8" }}>착한</span>거래</div>
        <h1>착한거래 동의하기</h1>
        <div className="co">{target ? `${target.company} 와의 거래` : `${CODE_LABEL}를 입력해 시작하세요`}</div>
      </div>
      <div className="steps"><div className={`s ${step >= 1 ? "on" : ""}`} /><div className={`s ${step >= 2 ? "on" : ""}`} /><div className={`s ${step >= 3 ? "on" : ""}`} /><div className={`s ${step >= 4 ? "on" : ""}`} /></div>

      <div className="c-body">
        {/* STEP 0 — 업체코드 입력 */}
        {!target && (
          <>
            <div className="slabel">동의 대상 확인</div>
            <div className="stitle">어느 거래에 동의하시나요?</div>
            <div className="sdesc">거래 상대로부터 받은 <b>{CODE_LABEL}</b>를 입력해 주세요. 착한거래에 등록된 회원만 동의 대상이 될 수 있습니다.</div>
            <form onSubmit={(e) => { e.preventDefault(); lookup(); }}>
              <div className="field"><label>{CODE_LABEL}</label>
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} placeholder="예: 100001" style={{ letterSpacing: 2 }} /></div>
              {err && <div className="auth-err">{err}</div>}
            </form>
            {DEMO_MODE && <div className="demo-hint">샘플 {CODE_LABEL} — <b>100001</b> 스피드렌터카 · <b>100002</b> 테스트렌터카 · <b>100003</b> 하나모빌리티</div>}
          </>
        )}

        {/* STEP 1 — 캠페인 안내 + 본인인증 */}
        {target && !started && !verified && (
          <>
            <div className="confirm-co"><span className="cc-chk">✓</span> <b>{target.company}</b>{target.service && <span className="svc-tag">{target.service} 서비스</span>} <span className="cc-ok">확인됨</span></div>
            <div className="slabel">{CAMPAIGN_TITLE}</div>
            <div className="stitle">{CAMPAIGN_HEADLINE}</div>
            <div className="sdesc">{CAMPAIGN_LEAD}</div>
            <NoticeList items={CONSENT_NOTICES} />
          </>
        )}
        {target && started && !verified && <AuthFlow onVerified={setVerified} />}

        {/* STEP 2 — 동의 */}
        {verified && !signing && !done && (
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

        {/* STEP 3 — 서명 */}
        {verified && signing && !done && (
          <>
            <div className="verified">
              <div className="vrow"><span className="chk">✓</span> 본인확인 완료 <span style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 600 }}>· {verified.method}</span></div>
              <div className="info"><span><b>{verified.name}</b> 님</span><span>생년월일 {fmtBirth(verified.birth)}</span></div>
            </div>
            <div className="slabel">STEP 3 · 전자서명</div>
            <div className="stitle">동의 확인을 위해 서명해 주세요</div>
            <div className="sdesc">{target.company} 와의 거래에 대한 착한거래 동의를 본인이 직접 확인하는 전자서명입니다.</div>
            <SignaturePad onChange={setSig} />
          </>
        )}

        {/* STEP 4 — 완료 */}
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
              <div className="r"><span className="k">전자서명</span><span className="v">{sig ? "완료" : "—"}</span></div>
              <div className="r"><span className="k">동의일시</span><span className="v mono">{receipt.ts}</span></div>
              <div className="r"><span className="k">문구버전</span><span className="v">{CONSENT_VERSION}</span></div>
            </div>
            <div className="hint">이 화면은 닫으셔도 됩니다.<br />동의 증빙은 안전하게 보관됩니다.</div>
          </div>
        )}
      </div>

      {!done && (
        started && !verified ? (
          /* 본인인증(자체 흐름) 중 — 이전만 */
          <div className="c-footer"><button className="btn btn-block" onClick={goBack}>이전</button></div>
        ) : (
          <div className="c-footer wiz">
            <button className="btn btn-prev" onClick={goBack}>이전</button>
            <button className="btn btn-safe btn-next" disabled={nextDisabled()} onClick={onNext}>{nextLabel()}</button>
          </div>
        )
      )}
    </div>
  );
}
