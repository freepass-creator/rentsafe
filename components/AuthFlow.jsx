"use client";

import { useState } from "react";
import { hyphenPhone, fmtBirth } from "@/lib/format";
import StepFooter from "@/components/StepFooter";
import CameraCapture from "@/components/CameraCapture";

// 본인확인 — 담당자 링크로 손님이 직접. (대면 본인확인 수준)
// ① 신분증 '촬영' → Gemini OCR(이름·생년월일) → "맞으세요?" → (틀리면 직접 입력)
// ② 본인 얼굴 '촬영'(셀카) → 신분증과 대조용
// 저장된 사진 업로드 불가 — 그 자리에서 촬영만.
// onVerified({ name, birth(6), phone, method, idImage, faceImage })
export default function AuthFlow({ onVerified, onCancel, supportHelp = null }) {
  const [stage, setStage] = useState("idcam"); // idcam | ocr | review | manual | selfie | done
  const [ocrUsed, setOcrUsed] = useState(false);
  const [a, setA] = useState({ name: "", birth: "", phone: "" });
  const [idImage, setIdImage] = useState("");
  const [faceImage, setFaceImage] = useState("");
  const set = (k) => (e) => setA((s) => ({ ...s, [k]: e.target.value }));
  const setPhone = (e) => setA((s) => ({ ...s, phone: hyphenPhone(e.target.value) }));

  async function runOcr() {
    if (!idImage) return;
    setStage("ocr");
    try {
      const fd = new FormData();
      fd.append("file", dataUrlToBlob(idImage), "id.jpg");
      const r = await fetch("/api/ocr/id", { method: "POST", body: fd });
      const j = await r.json();
      if (j.ok && (j.name || j.birth)) {
        setOcrUsed(true);
        setA({ name: j.name || "", birth: j.birth || "", phone: "" });
        setStage("review");
      } else { setOcrUsed(false); setStage("manual"); }
    } catch { setOcrUsed(false); setStage("manual"); }
  }

  const phoneOk = a.phone.replace(/\D/g, "").length >= 10;
  const allOk = a.name.trim() && a.birth.replace(/\D/g, "").length >= 6 && phoneOk;
  function toSelfie() { if (!allOk) { alert("이름 · 생년월일 6자리 · 휴대폰번호를 확인해 주세요."); return; } setStage("selfie"); }
  function finish() {
    if (!faceImage) { alert("본인 얼굴을 촬영해 주세요."); return; }
    setStage("done");
    setTimeout(() => onVerified({
      name: a.name.trim(),
      birth: a.birth.replace(/\D/g, "").slice(0, 6),
      phone: a.phone,
      method: ocrUsed ? "신분증 OCR + 얼굴 대조" : "신분증 + 얼굴 대조",
      idImage,
      faceImage,
    }), 600);
  }

  const linkBtn = { background: "none", border: "none", color: "#0f7f5b", fontWeight: 700, fontSize: 13, textDecoration: "underline", cursor: "pointer", padding: "8px 0 0", display: "block", margin: "10px auto 0" };
  const whyNote = { background: "#eef3f8", border: "1px solid #dde7f1", borderRadius: 11, padding: "12px 14px", margin: "2px 0 14px", fontSize: 12, color: "#445466", lineHeight: 1.6 };

  if (stage === "ocr" || stage === "done")
    return (
      <>
        <div className="c-body anim-in" key={stage}><div className="verifying"><div className="spinner" /><div style={{ fontWeight: 700, fontSize: 15 }}>{stage === "ocr" ? "신분증을 확인하는 중…" : "본인확인 처리 중…"}</div></div></div>
        <div className="c-footer"><button className="btn btn-block" disabled>처리 중…</button></div>
      </>
    );

  if (stage === "idcam")
    return (
      <>
        <div className="c-body anim-in" key={stage}>
          <div className="slabel">STEP 1 · 신분증 촬영</div>
          <div className="stitle">신분증을 촬영해 주세요</div>
          <div className="sdesc">주민등록증·운전면허증을 화면에 맞춰 촬영하면, 이름·생년월일을 자동으로 읽어 드립니다.</div>
          <div style={whyNote}><b style={{ color: "#16314d" }}>왜 신분증·얼굴인가요?</b><br />휴대폰 인증은 비밀번호만 알면 남이 대신 할 수 있어요. 착한거래는 거래를 앞두고 <b style={{ color: "#16314d" }}>대면 본인확인 수준</b>으로, 신분증과 본인 얼굴을 그 자리에서 촬영·대조합니다.</div>
          <CameraCapture facing="environment" max={1100} onCapture={setIdImage} />
          <button type="button" style={linkBtn} onClick={() => { setOcrUsed(false); setIdImage(""); setA({ name: "", birth: "", phone: "" }); setStage("manual"); }}>촬영이 어려우면 직접 입력</button>
          {supportHelp}
          <div className="hint">이름·생년월일만 본인확인에 사용되며, 주민등록번호 뒷자리 등 그 외 정보는 수집하지 않습니다.</div>
        </div>
        <StepFooter prev={{ onClick: onCancel }} next={{ label: "다음", disabled: !idImage, onClick: runOcr }} />
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
        <StepFooter prev={{ onClick: () => { setIdImage(""); setStage("idcam"); } }} next={{ label: "네, 맞습니다", disabled: !allOk, onClick: toSelfie }} />
      </>
    );

  if (stage === "manual")
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
        <StepFooter prev={{ onClick: () => setStage(ocrUsed ? "review" : "idcam") }} next={{ label: "다음", disabled: !allOk, onClick: toSelfie }} />
      </>
    );

  // stage === "selfie"
  return (
    <>
      <div className="c-body anim-in" key={stage}>
        <div className="slabel">STEP 2 · 본인 얼굴</div>
        <div className="stitle">본인 얼굴을 촬영해 주세요</div>
        <div className="sdesc">신분증 사진과 같은 사람인지 확인합니다. 정면을 보고 촬영해 주세요.</div>
        <CameraCapture facing="user" max={720} onCapture={setFaceImage} />
        <div className="hint">얼굴 사진은 신분증 대조·본인확인 용도로만 사용되며, 암호화 보관됩니다.</div>
      </div>
      <StepFooter prev={{ onClick: () => setStage(ocrUsed ? "review" : "manual") }} next={{ label: "본인확인 완료", disabled: !faceImage, onClick: finish }} />
    </>
  );
}

// dataURL → Blob (OCR 전송용)
function dataUrlToBlob(url) {
  const [meta, b64] = url.split(",");
  const mime = (meta.match(/:(.*?);/) || [])[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
