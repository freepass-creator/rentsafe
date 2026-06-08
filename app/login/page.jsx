"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, TEST_LOGIN } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";

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
    document.getElementById("login-email").value = TEST_LOGIN.email;
    document.getElementById("login-pw").value = TEST_LOGIN.pw;
  }

  return (
    <>
      <AppHeader subtitle="회원사 로그인" />
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card">
          <div className="card-title">로그인</div>
          <div className="card-desc">착한거래 회원사 계정으로 로그인하세요.</div>
          <form onSubmit={submit}>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>이메일</label>
              <input id="login-email" name="email" type="email" placeholder="dudguq@gmail.com" autoComplete="username" />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>비밀번호</label>
              <input id="login-pw" name="pw" type="password" placeholder="비밀번호" autoComplete="current-password" />
            </div>
            {err && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{err}</div>}
            <button className="btn btn-primary btn-block" type="submit">로그인</button>
          </form>
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 13.5 }}>
            아직 회원이 아니신가요? <a href="/signup" style={{ color: "var(--navy2)", fontWeight: 700 }}>계정 만들기</a>
          </div>
        </div>

        <div className="card">
          <div className="card-title">테스트 계정</div>
          <div className="card-desc">데모용 — 아래 계정으로 바로 로그인하실 수 있습니다.</div>
          <div className="risk-row">
            <div><div className="type">스피드렌터카</div><div className="meta" style={{ fontFamily: "Consolas,monospace" }}>{TEST_LOGIN.email} / {TEST_LOGIN.pw}</div></div>
            <div className="sp" />
            <button className="btn btn-sm" onClick={fillTest}>자동 입력</button>
          </div>
        </div>
      </div>
    </>
  );
}
