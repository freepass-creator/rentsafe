"use client";

import { useState, useRef } from "react";
import { hyphenPhone, fmtBirth } from "@/lib/format";
import { CARRIERS } from "@/lib/constants";
import StepFooter from "@/components/StepFooter";
import CameraCapture from "@/components/CameraCapture";
import Icon from "@/components/Icon";

// 본인확인 — 담당자 링크로 손님이 직접. (대면 본인확인 수준)
// ① 신분증 '촬영' → Gemini OCR(이름·생년월일) → "맞으세요?" → (틀리면 직접 입력)
// ② 본인 얼굴 '촬영'(셀카) → 신분증과 대조용
// 저장된 사진 업로드 불가 — 그 자리에서 촬영만.
// onVerified({ name, birth(6), phone, method, idImage, faceImage })
export default function AuthFlow({ onVerified, onCancel, supportHelp = null }) {
  // method=방법 선택 | (신분증) idcam·ocr·review·manual·selfie | (휴대폰) phone·phonecode | done
  const [stage, setStage] = useState("method");
  const [ocrUsed, setOcrUsed] = useState(false);
  const [ocrFail, setOcrFail] = useState(false);
  const [a, setA] = useState({ name: "", birth: "", phone: "" });
  const [carrier, setCarrier] = useState("");
  const [code, setCode] = useState("");
  const [idImage, setIdImage] = useState("");
  const [faceImage, setFaceImage] = useState("");
  const set = (k) => (e) => setA((s) => ({ ...s, [k]: e.target.value }));
  const setPhone = (e) => setA((s) => ({ ...s, phone: hyphenPhone(e.target.value) }));
  const camRef = useRef(null);

  async function runOcr() {
    if (!idImage) return;
    setStage("ocr");
    try {
      const fd = new FormData();
      fd.append("file", dataUrlToBlob(idImage), "id.jpg");
      const r = await fetch("/api/ocr/id", { method: "POST", body: fd });
      const j = await r.json();
      // OCR이 이름·생년월일을 명확히 읽었을 때만 진행. 불명확하면 재촬영(우회 불가).
      if (j.ok && j.name && j.birth && j.birth.replace(/\D/g, "").length === 6) {
        setOcrUsed(true);
        setA({ name: j.name, birth: j.birth, phone: "" });
        setStage("review");
      } else { setIdImage(""); setOcrFail(true); setStage("idcam"); }
    } catch { setIdImage(""); setOcrFail(true); setStage("idcam"); }
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
  // 휴대폰 본인인증 — 연동 전 mock. 나중에 PASS/통신사 API만 끼우면 됨.
  const phoneFormOk = a.name.trim() && a.birth.replace(/\D/g, "").length >= 6 && carrier && phoneOk;
  function finishPhone() {
    if (code.length !== 6) { alert("인증번호 6자리를 입력해 주세요."); return; }
    setStage("done");
    setTimeout(() => onVerified({
      name: a.name.trim(),
      birth: a.birth.replace(/\D/g, "").slice(0, 6),
      phone: a.phone,
      method: "휴대폰 본인인증",
      idImage: "",
      faceImage: "",
    }), 600);
  }

  const linkBtn = { background: "none", border: "none", color: "#0f7f5b", fontWeight: 700, fontSize: 13, textDecoration: "underline", cursor: "pointer", padding: "8px 0 0", display: "block", margin: "10px auto 0" };

  if (stage === "ocr" || stage === "done")
    return (
      <>
        <div className="c-body anim-in" key={stage}><div className="verifying"><div className="spinner" /><div style={{ fontWeight: 700, fontSize: 15 }}>{stage === "ocr" ? "신분증을 확인하는 중…" : "본인확인 처리 중…"}</div></div></div>
        <div className="c-footer"><button className="btn btn-block" disabled>처리 중…</button></div>
      </>
    );

  if (stage === "method")
    return (
      <>
        <div className="c-body anim-in" key={stage}>
          <div className="slabel">본인확인</div>
          <div className="stitle">본인확인 방법을 선택하세요</div>
          <div className="sdesc">요청하신 방식에 맞춰 본인확인을 진행합니다.</div>
          <button type="button" className="auth-opt" onClick={() => { setOcrFail(false); setStage("idcam"); }}>
            <span className="ic" style={{ background: "var(--navy)" }}><Icon name="file" size={18} /></span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>신분증으로 인증<span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)" }}>신분증 촬영 + 얼굴 촬영 · 온라인 대면</span></span>
          </button>
          <button type="button" className="auth-opt" onClick={() => setStage("phone")}>
            <span className="ic" style={{ background: "var(--safe)" }}><Icon name="phone" size={18} /></span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>휴대폰으로 인증<span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)" }}>PASS·통신사 본인확인 <b style={{ color: "var(--warn)" }}>· 연동 예정</b></span></span>
          </button>
          {supportHelp}
        </div>
        <StepFooter prev={{ onClick: onCancel }} />
      </>
    );

  if (stage === "idcam")
    return (
      <>
        <div className="c-body anim-in" key={stage} style={{ display: "flex", flexDirection: "column", paddingBottom: 6 }}>
          <div className="slabel">STEP 1 · 신분증 촬영</div>
          <div className="stitle">신분증을 촬영해 주세요</div>
          <div className="sdesc" style={{ marginBottom: 10 }}>가로 틀에 맞춰 촬영하면 이름·생년월일을 자동으로 읽어요. 신분증 촬영은 본인확인에 꼭 필요합니다.</div>
          {ocrFail && (
            <div style={{ background: "var(--danger50)", border: "1px solid #f1cdc8", color: "var(--danger)", borderRadius: "var(--radius)", padding: "10px 13px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.55, marginBottom: 10 }}>
              글자가 또렷하게 읽히지 않았어요. 빛 반사 없이 가로 틀에 꽉 차게 다시 촬영해 주세요.
            </div>
          )}
          <div style={{ flex: 1, minHeight: 200 }}>
            <CameraCapture ref={camRef} facing="environment" max={1100} onCapture={(u) => { setIdImage(u); if (u) setOcrFail(false); }} guide="신분증을 가로 틀에 꽉 차게" />
          </div>
        </div>
        <StepFooter prev={{ onClick: () => { setOcrFail(false); setStage("method"); } }} next={idImage ? { label: "다음", onClick: runOcr } : { label: "● 촬영", onClick: () => camRef.current?.capture() }} />
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
          <div className="slabel">STEP 1 · 정보 보정</div>
          <div className="stitle">잘못 읽힌 부분을 고쳐 주세요</div>
          <div className="sdesc">신분증에서 읽은 정보예요. 다른 부분만 신분증과 동일하게 고쳐 주세요.</div>
          <div className="field"><label>이름</label><input value={a.name} onChange={set("name")} placeholder="홍길동" /></div>
          <div className="field"><label>생년월일 6자리</label><input value={a.birth} onChange={set("birth")} inputMode="numeric" maxLength={6} placeholder="900715" /></div>
          <div className="field"><label>휴대폰번호</label><input value={a.phone} onChange={setPhone} inputMode="numeric" placeholder="010-0000-0000" /></div>
          {supportHelp}
        </div>
        <StepFooter prev={{ onClick: () => setStage(ocrUsed ? "review" : "idcam") }} next={{ label: "다음", disabled: !allOk, onClick: toSelfie }} />
      </>
    );

  if (stage === "phone")
    return (
      <>
        <div className="c-body anim-in" key={stage}>
          <div className="slabel">휴대폰 본인인증</div>
          <div className="stitle">휴대폰으로 본인인증</div>
          <div className="sdesc">통신사 본인확인으로 인증합니다.</div>
          <div className="demo-hint">연동 예정 — 지금은 데모예요. 인증번호는 아무 6자리나 넣으면 통과됩니다.</div>
          <div className="field"><label>이름</label><input value={a.name} onChange={set("name")} placeholder="홍길동" /></div>
          <div className="field"><label>생년월일 6자리</label><input value={a.birth} onChange={set("birth")} inputMode="numeric" maxLength={6} placeholder="900715" /></div>
          <div className="field"><label>통신사</label><select value={carrier} onChange={(e) => setCarrier(e.target.value)}><option value="">선택</option>{CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="field"><label>휴대폰번호</label><input value={a.phone} onChange={setPhone} inputMode="numeric" placeholder="010-0000-0000" /></div>
        </div>
        <StepFooter prev={{ onClick: () => setStage("method") }} next={{ label: "인증번호 요청", disabled: !phoneFormOk, onClick: () => { setCode(""); setStage("phonecode"); } }} />
      </>
    );

  if (stage === "phonecode")
    return (
      <>
        <div className="c-body anim-in" key={stage}>
          <div className="slabel">휴대폰 본인인증</div>
          <div className="stitle">인증번호 입력</div>
          <div className="sdesc"><b>{a.phone}</b> 로 보낸 6자리 인증번호를 입력하세요.</div>
          <div className="field"><label>인증번호</label><input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="000000" /></div>
          <button type="button" style={linkBtn} onClick={() => setStage("phone")}>번호가 안 왔나요? 다시 요청</button>
        </div>
        <StepFooter prev={{ onClick: () => setStage("phone") }} next={{ label: "인증 완료", disabled: code.length !== 6, onClick: finishPhone }} />
      </>
    );

  // stage === "selfie"
  return (
    <>
      <div className="c-body anim-in" key={stage} style={{ display: "flex", flexDirection: "column", paddingBottom: 6 }}>
        <div className="slabel">STEP 2 · 본인 얼굴</div>
        <div className="stitle">본인 얼굴을 촬영해 주세요</div>
        <div className="sdesc" style={{ marginBottom: 10 }}>신분증 사진과 같은 사람인지 확인합니다. 얼굴을 틀 안에 맞춰 주세요.</div>
        <div style={{ flex: 1, minHeight: 200 }}>
          <CameraCapture ref={camRef} facing="user" max={720} onCapture={setFaceImage} guide="얼굴을 틀 안에 맞춰 주세요" />
        </div>
      </div>
      <StepFooter prev={{ onClick: () => setStage(ocrUsed ? "review" : "manual") }} next={faceImage ? { label: "본인확인 완료", onClick: finish } : { label: "● 촬영", onClick: () => camRef.current?.capture() }} />
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
