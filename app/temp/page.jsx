"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { issueTempMember } from "@/lib/db";
import { loginWithCode } from "@/lib/auth";
import { CODE_LABEL } from "@/lib/constants";
import BrandMark from "@/components/BrandMark";
import Icon from "@/components/Icon";

export default function TempPage() {
  const router = useRouter();
  const [issued, setIssued] = useState(null); // { code, company }
  const [label, setLabel] = useState("");
  const [enterCode, setEnterCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function issue() {
    setBusy(true);
    try { setIssued(await issueTempMember({ label })); }
    catch (e) { console.error(e); setErr("발급 중 오류가 발생했습니다."); }
    setBusy(false);
  }
  async function goConsole(code) {
    const s = await loginWithCode(code);
    if (!s) { setErr("코드를 확인할 수 없습니다."); return; }
    router.push("/console");
  }
  async function enter(e) {
    e.preventDefault();
    setErr("");
    const s = await loginWithCode(enterCode.trim());
    if (!s) { setErr("등록되지 않은 코드입니다."); return; }
    router.push("/console");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <a className="c-back-auth" href="/" aria-label="뒤로"><Icon name="back" size={20} /></a>
        <div className="auth-brand">
          <BrandMark size={26} className="auth-mark" />
          <div className="auth-name"><span className="accent">착한</span>거래</div>
          <div className="auth-tag">임시 회원 · 직거래용</div>
        </div>

        {!issued ? (
          <>
            <div className="card-desc" style={{ textAlign: "center", marginBottom: 18 }}>
              회원가입 없이 <b>개인 간 직거래</b>에 쓸 {CODE_LABEL}를 발급받습니다.
            </div>
            <div className="field"><label>거래 메모 <span className="opt">선택</span></label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: 중고차 직거래 · 홍길동" /></div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={issue} disabled={busy}>{busy ? "발급 중…" : `${CODE_LABEL} 발급받기`}</button>

            <form onSubmit={enter} style={{ marginTop: 20 }}>
              <div className="field"><label>이미 {CODE_LABEL}가 있다면</label>
                <input value={enterCode} onChange={(e) => setEnterCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} placeholder="발급받은 6자리 코드" style={{ letterSpacing: 2 }} /></div>
              {err && <div className="auth-err">{err}</div>}
              <button className="btn btn-block" type="submit">이 코드로 들어가기</button>
            </form>
          </>
        ) : (
          <>
            <div className="r-clean" style={{ marginBottom: 16 }}><div className="ic">✓</div><div><h3>발급 완료</h3><p>이 {CODE_LABEL}를 거래 상대에게 알려주세요.</p></div></div>
            <div className="code-row" style={{ justifyContent: "center", marginBottom: 16 }}>
              <span className="code-val">{issued.code}</span>
              <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(issued.code)}>복사</button>
            </div>
            <div className="hint" style={{ marginBottom: 16 }}>
              상대가 <b>착한거래 동의하기</b>에서 이 코드를 입력해 동의하면, 문제 발생 시 이 코드로 거래 위반사항을 등록할 수 있습니다. <b>코드를 꼭 보관하세요.</b>
            </div>
            {err && <div className="auth-err">{err}</div>}
            <button className="btn btn-primary btn-block" onClick={() => goConsole(issued.code)}>이 코드로 콘솔 들어가기</button>
          </>
        )}
      </div>
    </div>
  );
}
