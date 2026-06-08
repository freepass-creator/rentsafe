"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, TEST_LOGIN } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    const f = e.target;
    const s = login(f.email.value, f.pw.value);
    if (!s) { setErr("이메일 또는 비밀번호가 올바르지 않습니다."); return; }
    router.replace(s.role === "admin" ? "/admin" : "/");
  }
  function fillTest() {
    document.getElementById("le").value = TEST_LOGIN.email;
    document.getElementById("lp").value = TEST_LOGIN.pw;
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
          <div className="auth-name"><span className="accent">착한</span>거래</div>
          <div className="auth-tag">렌터카 착한거래 · 회원사 로그인</div>
        </div>

        <form onSubmit={submit}>
          <div className="field"><label>이메일</label>
            <input id="le" name="email" type="email" placeholder="name@company.com" autoComplete="username" /></div>
          <div className="field"><label>비밀번호</label>
            <input id="lp" name="pw" type="password" placeholder="비밀번호" autoComplete="current-password" /></div>
          {err && <div className="auth-err">{err}</div>}
          <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} type="submit">로그인</button>
        </form>

        <div className="auth-test">
          <span>테스트 계정</span>
          <span><code>{TEST_LOGIN.email}</code> / <code>{TEST_LOGIN.pw}</code>
            <button className="btn btn-sm" style={{ marginLeft: 8 }} onClick={fillTest}>입력</button></span>
        </div>
        <div className="auth-alt">아직 회원이 아니신가요? <a href="/signup">계정 만들기</a></div>
      </div>
    </div>
  );
}
