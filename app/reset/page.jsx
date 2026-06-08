"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/auth";

export default function ResetPage() {
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const r = await resetPassword(e.target.email.value);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setSent(true);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-mark">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="auth-name">렌터카 <span className="accent">착한</span>거래</div>
          <div className="auth-tag">비밀번호 재설정</div>
        </div>

        {sent ? (
          <>
            <div className="card-desc" style={{ textAlign: "center", marginBottom: 8 }}>
              비밀번호 재설정 메일을 보냈습니다.<br />메일함에서 링크를 눌러 새 비밀번호를 설정해 주세요.
            </div>
            <a className="btn btn-primary btn-block" href="/login" style={{ marginTop: 8 }}>로그인으로 돌아가기</a>
          </>
        ) : (
          <>
            <div className="card-desc" style={{ textAlign: "center", marginBottom: 18 }}>
              가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.
            </div>
            <form onSubmit={submit}>
              <div className="field"><label>이메일</label>
                <input name="email" type="email" required placeholder="name@company.com" autoComplete="username" /></div>
              {err && <div className="auth-err">{err}</div>}
              <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} type="submit" disabled={busy}>{busy ? "보내는 중…" : "재설정 메일 보내기"}</button>
            </form>
            <div className="auth-alt"><a href="/login">로그인으로 돌아가기</a></div>
          </>
        )}
      </div>
    </div>
  );
}
