"use client";

import { useState } from "react";
import { hyphenPhone, fmtBirth } from "@/lib/format";
import StepFooter from "@/components/StepFooter";

// 본인확인 — 담당자가 보낸 링크로 손님이 직접.
// 신분증 업로드 → Gemini OCR(이름·생년월일) → "맞으세요?" 확인 → 틀리면 직접 입력.
// onVerified({ name, birth(6), phone, method }) / onCancel()
export default function AuthFlow({ onVerified, onCancel, supportHelp = null }) {
  const [stage, setStage] = useState("upload"); // upload | ocr | review | manual | done
  const [ocrUsed, setOcrUsed] = useState(false);
  const [a, setA] = useState({ name: "", birth: "", phone: "" });
  const set = (k) => (e) => setA((s) => ({ ...s, [k]: e.target.value }));
  const setPhone = (e) => setA((s) => ({ ...s, phone: hyphenPhone(e.target.value) }));

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setStage("ocr");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/ocr/id", { method: "POST", body: fd });
      const j = await r.json();
      if (j.ok && (j.name || j.birth)) {
        setOcrUsed(true);
        setA({ name: j.name || "", birth: j.birth || "", phone: "" });
        setStage("review");
      } else {
        setOcrUsed(false);
        setStage("manual");
      }
    } catch {
      setOcrUsed(false);
      setStage("manual");
    }
  }

  const phoneOk = a.phone.replace(/\D/g, "").length >= 10;
  const allOk = a.name.trim() && a.birth.replace(/\D/g, "").length >= 6 && phoneOk;

  function finish() {
    if (!allOk) { alert("이름 · 생년월일 6자리 · 휴대폰번호를 확인해 주세요."); return; }
    setStage("done");
    setTimeout(() => onVerified({
      name: a.name.trim(),
      birth: a.birth.replace(/\D/g, "").slice(0, 6),
      phone: a.phone,
      method: ocrUsed ? "신분증 OCR 확인" : "신분증 · 직접 입력",
    }), 600);
  }

  const linkBtn = { background: "none", border: "none", color: "#0f7f5b", fontWeight: 700, fontSize: 13, textDecoration: "underline", cursor: "pointer", padding: "6px 0", marginTop: 4 };

  if (stage === "ocr" || stage === "done")
    return (
      <>
        <div className="c-body anim-in" key={stage}><div className="verifying"><div className="spinner" /><div style={{ fontWeight: 700, fontSize: 15 }}>{stage === "ocr" ? "신분증을 확인하는 중…" : "본인확인 처리 중…"}</div></div></div>
        <div className="c-footer"><button className="btn btn-block" disabled>처리 중…</button></div>
      </>
    );

  if (stage === "upload")
    return (
      <>
        <div className="c-body anim-in" key={stage}>
          <div className="slabel">STEP 1 · 본인확인</div>
          <div className="stitle">신분증을 올려 주세요</div>
          <div className="sdesc">본인·운전면허 확인을 위해 신분증(주민등록증·운전면허증) 사진을 올리면, 이름·생년월일을 자동으로 읽어 드립니다.</div>
          <label style={{ display: "block", border: "1.5px dashed #cdd6e0", borderRadius: 14, padding: 30, textAlign: "center", cursor: "pointer", background: "#f7f9fb" }}>
            <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#7c8a98" strokeWidth="1.7" /><circle cx="8.5" cy="11" r="2" stroke="#7c8a98" strokeWidth="1.7" /><path d="M14 10h4M14 13.5h4M5.6 16c.5-1.6 4.3-1.6 4.8 0" stroke="#7c8a98" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <b style={{ fontSize: 15, color: "#445466" }}>신분증 사진 올리기</b>
              <small style={{ fontSize: 12, color: "#7c8a98" }}>탭하여 촬영하거나 앨범에서 선택</small>
            </span>
          </label>
          <button type="button" style={linkBtn} onClick={() => { setOcrUsed(false); setA({ name: "", birth: "", phone: "" }); setStage("manual"); }}>신분증 없이 직접 입력할게요</button>
          {supportHelp}
          <div className="hint">이름·생년월일만 본인확인에 사용되며, 주민등록번호 뒷자리 등 그 외 정보는 수집하지 않습니다.</div>
        </div>
        <StepFooter prev={{ onClick: onCancel }} next={{ label: "사진을 올려 주세요", disabled: true, onClick: () => {} }} />
      </>
    );

  if (stage === "review")
    return (
      <>
        <div className="c-body anim-in" key={stage}>
          <div className="slabel">STEP 1 · 정보 확인</div>
          <div className="stitle">이 정보가 맞으세요?</div>
          <div className="sdesc">신분증에서 읽은 내용이에요. 다르면 아래 ‘직접 입력’으로 고쳐 주세요.</div>
          <div className="verified">
            <div className="vrow"><span className="chk">✓</span> 신분증에서 읽음</div>
            <div className="info"><span>이름 <b>{a.name || "—"}</b></span><span>생년월일 {a.birth ? fmtBirth(a.birth) : "—"}</span></div>
          </div>
          <div className="field"><label>휴대폰번호</label><input value={a.phone} onChange={setPhone} inputMode="numeric" placeholder="010-0000-0000" /></div>
          <button type="button" style={linkBtn} onClick={() => setStage("manual")}>정보가 다른가요? 직접 입력하기</button>
        </div>
        <StepFooter prev={{ onClick: () => setStage("upload") }} next={{ label: "네, 맞습니다", disabled: !allOk, onClick: finish }} />
      </>
    );

  // stage === "manual"
  return (
    <>
      <div className="c-body anim-in" key={stage}>
        <div className="slabel">STEP 1 · 본인 정보 입력</div>
        <div className="stitle">본인 정보를 입력해 주세요</div>
        <div className="sdesc">신분증과 동일하게 입력해 주세요.</div>
        <div className="field"><label>이름</label><input value={a.name} onChange={set("name")} placeholder="홍길동" /></div>
        <div className="field"><label>생년월일 6자리</label><input value={a.birth} onChange={set("birth")} inputMode="numeric" maxLength={6} placeholder="900715" /></div>
        <div className="field"><label>휴대폰번호</label><input value={a.phone} onChange={setPhone} inputMode="numeric" placeholder="010-0000-0000" /></div>
        {supportHelp}
      </div>
      <StepFooter prev={{ onClick: () => setStage(ocrUsed ? "review" : "upload") }} next={{ label: "다음", disabled: !allOk, onClick: finish }} />
    </>
  );
}
