"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth";
import BrandMark from "@/components/BrandMark";

export default function ResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    setBusy(true);
    const r = await resetPassword(email);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setSent(true);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <BrandMark size={26} className="auth-mark" />
          <div className="auth-name"><span className="accent">착한</span>거래</div>
          <div className="auth-tag">비밀번호 재설정</div>
        </div>

        {sent ? (
          <>
            <div className="card-desc" style={{ textAlign: "center", marginBottom: 16 }}>
              비밀번호 재설정 메일을 보냈습니다.<br />메일함의 링크로 새 비밀번호를 설정해 주세요.
            </div>
            <button className="btn btn-primary btn-block" onClick={() => router.replace("/login")}>로그인으로 돌아가기</button>
          </>
        ) : (
          <>
            <div className="card-desc" style={{ textAlign: "center", marginBottom: 18 }}>가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.</div>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <div className="field"><label>이메일</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@company.com" autoComplete="username" /></div>
              {err && <div className="auth-err">{err}</div>}
              <div className="auth-actions">
                <button type="button" className="btn" onClick={() => router.push("/login")}>이전</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "보내는 중…" : "메일 보내기"}</button>
              </div>
            </form>
          </>
        )}
        <div className="auth-alt"><a href="/login">로그인으로 돌아가기</a></div>
      </div>
    </div>
  );
}
