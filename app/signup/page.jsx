"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth";
import Icon from "@/components/Icon";
import FlowHeader from "@/components/FlowHeader";
import StepFooter from "@/components/StepFooter";

export default function SignupPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [bizFile, setBizFile] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    if (!company.trim() || !email.trim()) { setErr("회사명과 이메일을 입력해 주세요."); return; }
    if (!bizFile) { setErr("사업자등록증을 첨부해 주세요. (이미지 또는 PDF)"); return; }
    if (pw !== pw2) { setErr("비밀번호가 일치하지 않습니다."); return; }
    setBusy(true);
    const r = await signup({ company, email, pw, bizFile });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    router.replace("/console");
  }

  return (
    <div className="app">
      <FlowHeader title="회원 가입" sub="가입 시 사업자등록증 확인이 필요합니다" />
      <div className="c-body">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="field"><label>회사명 <span className="req">*</span></label><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="스피드렌터카" /></div>
          <div className="field"><label>이메일(로그인 ID) <span className="req">*</span></label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@company.com" /></div>
          <div className="field"><label>비밀번호 <span className="req">*</span></label><input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="비밀번호" autoComplete="new-password" /></div>
          <div className="field"><label>비밀번호 확인 <span className="req">*</span></label><input value={pw2} onChange={(e) => setPw2(e.target.value)} type="password" placeholder="비밀번호 다시 입력" autoComplete="new-password" /></div>
          <div className="field">
            <label>사업자등록증 <span className="req">*</span> <span className="opt">이미지 또는 PDF</span></label>
            <label className="btn btn-block" style={{ cursor: "pointer" }}>
              <Icon name="file" /> {bizFile || "사업자등록증 첨부"}
              <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => setBizFile(e.target.files?.[0]?.name || "")} />
            </label>
            <div className="hint">제출하신 사업자등록증은 회원 자격 확인 용도로만 사용되며 암호화 보관됩니다.</div>
          </div>
          {err && <div className="auth-err">{err}</div>}
        </form>
        <div className="auth-alt">이미 계정이 있으신가요? <a href="/login">로그인</a></div>
      </div>
      <StepFooter prev={{ label: "이전", onClick: () => router.push("/login") }} next={{ label: busy ? "가입 중…" : "가입", onClick: submit, disabled: busy }} />
    </div>
  );
}
