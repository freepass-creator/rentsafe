"use client";

import { useRef, useEffect, useState } from "react";

// 라이브 카메라 촬영 — 저장된 사진 업로드 불가, 그 자리에서 촬영만.
// getUserMedia 스트림 → '촬영' 시 프레임을 캔버스로 캡처해 onCapture(dataUrl).
// facing: "environment"(신분증·후면) | "user"(셀피·전면)
export default function CameraCapture({ facing = "environment", max = 1100, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [err, setErr] = useState("");
  const [shot, setShot] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function stop() { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } }
    async function start() {
      setErr(""); setReady(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
        setReady(true);
      } catch {
        setErr("카메라를 열 수 없습니다. 브라우저에서 카메라 권한을 허용한 뒤 다시 시도해 주세요.");
      }
    }
    if (!shot) start();
    return () => { cancelled = true; stop(); };
  }, [facing, shot]);

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    const cv = document.createElement("canvas");
    cv.width = Math.round(v.videoWidth * scale);
    cv.height = Math.round(v.videoHeight * scale);
    cv.getContext("2d").drawImage(v, 0, 0, cv.width, cv.height);
    const url = cv.toDataURL("image/jpeg", 0.72);
    setShot(url);
    onCapture(url);
  }
  function retake() { setShot(""); onCapture(""); }

  const shootBtn = { width: "100%", marginTop: 10, padding: "13px", borderRadius: 10, border: "none", background: "#13a37a", color: "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer" };
  const retakeBtn = { width: "100%", marginTop: 10, padding: "11px", borderRadius: 10, border: "1px solid #d8dee6", background: "#fff", color: "#445466", fontWeight: 700, fontSize: 13, cursor: "pointer" };

  if (err)
    return (
      <div style={{ border: "1.5px dashed #f1cdc8", background: "#fbeae8", borderRadius: 12, padding: "18px 16px", textAlign: "center", color: "#c0392b", fontSize: 13, lineHeight: 1.6 }}>
        {err}
        <button type="button" onClick={() => { setShot(""); setErr(""); }} style={{ ...retakeBtn, borderColor: "#f1cdc8", color: "#c0392b" }}>다시 시도</button>
      </div>
    );

  if (shot)
    return (
      <div>
        <img src={shot} alt="촬영본" style={{ width: "100%", borderRadius: 12, display: "block", ...(facing === "user" ? { maxWidth: 240, margin: "0 auto", transform: "scaleX(-1)" } : {}) }} />
        <button type="button" onClick={retake} style={retakeBtn}>다시 촬영</button>
      </div>
    );

  return (
    <div>
      <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", aspectRatio: facing === "user" ? "3 / 4" : "4 / 3", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: facing === "user" ? "scaleX(-1)" : "none" }} />
      </div>
      <button type="button" onClick={capture} disabled={!ready} style={{ ...shootBtn, opacity: ready ? 1 : 0.55 }}>{ready ? "● 촬영" : "카메라 준비 중…"}</button>
    </div>
  );
}
