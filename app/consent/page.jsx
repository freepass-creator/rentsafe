"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { findMemberByCode, createSelfConsent } from "@/lib/db";
import { CONSENT_CLAUSES, CONSENT_FOOTNOTES, CONSENT_NOTICES, CONSENT_VERSION, CAMPAIGN_TITLE, CAMPAIGN_HEADLINE, CAMPAIGN_LEAD, CODE_LABEL, DEMO_MODE } from "@/lib/constants";
import { fmtBirth, fmtDateTime } from "@/lib/format";
import AuthFlow from "@/components/AuthFlow";
import NoticeList from "@/components/NoticeList";
import SignaturePad from "@/components/SignaturePad";
import StepFooter from "@/components/StepFooter";
import FlowHeader from "@/components/FlowHeader";

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

  // 회원이 보낸 링크(/consent?code=...)로 들어오면 거래코드 자동 입력·확인
  useEffect(() => {
    const c = (new URLSearchParams(window.location.search).get("code") || "").replace(/\D/g, "");
    if (!c) return;
    setCode(c);
    findMemberByCode(c).then((m) => { if (m) setTarget(m); }).catch(() => {});
  }, []);

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
    if (verified && signing) return "완료";
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
  const screen = done ? "done" : signing ? "sign" : verified ? "agree" : target ? "intro" : "code";

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
      <FlowHeader title="착한거래 동의하기" sub={target ? `${target.company} 와의 거래` : `${CODE_LABEL}를 입력해 시작하세요`} steps={4} step={step} />

      {started && !verified ? (
        <AuthFlow onVerified={setVerified} onCancel={() => setStarted(false)} />
      ) : (
        <>
      <div className="c-body anim-in" key={screen}>
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
        {/* STEP 2 — 동의 */}
        {verified && !signing && !done && (
          <>
            <div className="verified">
              <div className="vrow"><span className="chk">✓</span> 본인확인 완료 <span style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 600 }}>· {verified.method}</span></div>
              <div className="info"><span><b>{verified.name}</b> 님</span><span>생년월일 {fmtBirth(verified.birth)}</span></div>
            </div>
            <div className="slabel">STEP 2 · {target.company} 착한거래 동의</div>
            <div className="stitle">아래 내용에 동의해 주세요</div>
            <div className="clauses">
              {CONSENT_CLAUSES.map((c, i) => (
                <div className="clause" key={i}><div className="clause-t">{c.t}</div><div className="clause-b">{c.b}</div></div>
              ))}
            </div>
            <ul className="footnotes">
              {CONSENT_FOOTNOTES.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
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
              <div className="r"><span className="k">안내 문자</span><span className="v">{verified.phone ? `${verified.phone} 발송` : "본인 휴대폰 발송"}</span></div>
              <div className="r"><span className="k">문구버전</span><span className="v">{CONSENT_VERSION}</span></div>
            </div>
            <div className="hint">동의 확인 안내를 본인 휴대폰으로 문자 발송했습니다.<br />이 화면은 닫으셔도 되며, 동의 증빙은 안전하게 보관됩니다.</div>
          </div>
        )}
      </div>
      {!done && <StepFooter prev={{ onClick: goBack }} next={{ label: nextLabel(), onClick: onNext, disabled: nextDisabled() }} />}
        </>
      )}
    </div>
  );
}
