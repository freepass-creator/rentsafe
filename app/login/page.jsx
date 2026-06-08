"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, TEST_LOGIN } from "@/lib/auth";
import FlowHeader from "@/components/FlowHeader";
import StepFooter from "@/components/StepFooter";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    setBusy(true);
    const s = await login(email, pw);
    setBusy(false);
    if (!s) { setErr("이메일 또는 비밀번호가 올바르지 않습니다."); return; }
    router.replace(s.role === "admin" ? "/admin" : "/console");
  }

  return (
    <div className="app">
      <FlowHeader title="회원 로그인" sub="사업자 회원 전용" />
      <div className="c-body c-center">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="field"><label>이메일</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@company.com" autoComplete="username" /></div>
          <div className="field"><label>비밀번호</label>
            <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="비밀번호" autoComplete="current-password" /></div>
          {err && <div className="auth-err">{err}</div>}
        </form>
        <div className="auth-test">
          <span>테스트 계정</span>
          <span><code>{TEST_LOGIN.email}</code> / <code>{TEST_LOGIN.pw}</code>
            <button className="btn btn-sm" style={{ marginLeft: 8 }} onClick={() => { setEmail(TEST_LOGIN.email); setPw(TEST_LOGIN.pw); }}>입력</button></span>
        </div>
        <div className="auth-foot">
          <a href="/signup">회원 가입</a>
          <a href="/reset">비밀번호 찾기</a>
        </div>
      </div>
      <StepFooter prev={{ label: "이전", onClick: () => router.push("/") }} next={{ label: busy ? "로그인 중…" : "로그인", onClick: submit, disabled: busy }} />
    </div>
  );
}
