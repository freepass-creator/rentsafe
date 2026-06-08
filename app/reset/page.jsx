"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth";
import StepFooter from "@/components/StepFooter";
import FlowHeader from "@/components/FlowHeader";

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
    <div className="app">
      <FlowHeader title="비밀번호 재설정" sub="가입하신 이메일로 재설정 링크를 보내드립니다" />
      <div className="c-body">
        {sent ? (
          <div className="r-clean"><div className="ic">✓</div><div><h3>메일을 보냈습니다</h3><p>메일함의 링크로 새 비밀번호를 설정해 주세요.</p></div></div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="field"><label>이메일</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@company.com" autoComplete="username" /></div>
            {err && <div className="auth-err">{err}</div>}
          </form>
        )}
      </div>
      {sent
        ? <StepFooter next={{ label: "로그인으로", onClick: () => router.replace("/login") }} />
        : <StepFooter prev={{ label: "이전", onClick: () => router.push("/login") }} next={{ label: busy ? "보내는 중…" : "재설정 메일 보내기", onClick: submit, disabled: busy }} />}
    </div>
  );
}
