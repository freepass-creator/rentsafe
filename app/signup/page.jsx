"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import Icon from "@/components/Icon";

export default function SignupPage() {
  const router = useRouter();
  const [bizFile, setBizFile] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e) {
    e.preventDefault();
    setErr("");
    const f = e.target;
    if (!bizFile) { setErr("사업자등록증을 첨부해 주세요. (이미지 또는 PDF)"); return; }
    if (f.pw.value !== f.pw2.value) { setErr("비밀번호가 일치하지 않습니다."); return; }
    setBusy(true);
    const r = signup({ company: f.company.value, email: f.email.value, pw: f.pw.value, bizFile });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    router.replace("/");
  }

  return (
    <>
      <AppHeader subtitle="회원사 계정 만들기" />
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="card">
          <div className="card-title">계정 만들기</div>
          <div className="card-desc">착한거래 회원사로 가입합니다. 가입 시 <b>사업자등록증</b> 확인이 필요합니다.</div>
          <form onSubmit={submit}>
            <div className="grid">
              <div className="field full"><label>회사명 <span className="req">*</span></label><input name="company" required placeholder="스피드렌터카" /></div>
              <div className="field full"><label>이메일(로그인 ID) <span className="req">*</span></label><input name="email" type="email" required placeholder="company@example.com" /></div>
              <div className="field"><label>비밀번호 <span className="req">*</span></label><input name="pw" type="password" required placeholder="비밀번호" /></div>
              <div className="field"><label>비밀번호 확인 <span className="req">*</span></label><input name="pw2" type="password" required placeholder="다시 입력" /></div>
              <div className="field full">
                <label>사업자등록증 <span className="req">*</span> <span className="opt">이미지 또는 PDF</span></label>
                <label className="btn btn-block" style={{ cursor: "pointer" }}>
                  <Icon name="file" /> {bizFile || "사업자등록증 첨부"}
                  <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => setBizFile(e.target.files?.[0]?.name || "")} />
                </label>
                <div className="hint">제출하신 사업자등록증은 회원 자격 확인 용도로만 사용되며 암호화 보관됩니다.</div>
              </div>
            </div>
            {err && <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 12 }}>{err}</div>}
            <div className="actions"><button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "가입 중…" : "가입하고 시작하기"}</button></div>
          </form>
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 13.5 }}>
            이미 계정이 있으신가요? <a href="/login" style={{ color: "var(--navy2)", fontWeight: 700 }}>로그인</a>
          </div>
        </div>
      </div>
    </>
  );
}
