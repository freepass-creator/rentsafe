"use client";

import { useState } from "react";
import { RISK_TYPES, SUPPORT, STATUS_NOTICES } from "@/lib/constants";
import { fmtBirth, fmtDate } from "@/lib/format";
import { queryRisk, createAppeal } from "@/lib/db";
import AuthFlow from "@/components/AuthFlow";
import Icon from "@/components/Icon";
import NoticeList from "@/components/NoticeList";

export default function MyStatus() {
  const [started, setStarted] = useState(false);
  const [verified, setVerified] = useState(null);
  const [result, setResult] = useState(null);
  const [stage, setStage] = useState("auth"); // auth | status | appealed
  const [shareTo, setShareTo] = useState("");
  const [shared, setShared] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState("");

  async function onVerified(v) {
    setVerified(v);
    const res = await queryRisk({ name: v.name, birth: v.birth });
    setResult(res);
    setStage("status");
  }
  function doShare() {
    if (!shareTo.trim()) { alert("공유할 렌트사명을 입력해 주세요."); return; }
    setShared(shareTo.trim());
  }
  async function submitAppeal() {
    if (!note.trim() && !file) { alert("소명 내용 또는 증빙을 입력해 주세요."); return; }
    await createAppeal({ name: verified.name, birth: verified.birth, type: result.records?.[0]?.type || "", note: note.trim(), channel: "self" });
    setStage("appealed");
  }

  const step = stage === "appealed" ? 3 : verified ? 2 : 1;
  const clean = result?.kind === "none";

  const supportHelp = (
    <div className="card" style={{ marginTop: 18, padding: 16, boxShadow: "none" }}>
      <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Icon name="phoneCall" /> 본인 명의 휴대폰이 없으신가요?</div>
      <div style={{ fontSize: 13, color: "var(--ink3)" }}>착한거래 고객센터 <b>{SUPPORT.tel}</b> 또는 {SUPPORT.email} 로 연락 주시면 신분증·증빙 확인 후 수동으로 처리해 드립니다.</div>
    </div>
  );

  return (
    <div className="app">
      <div className="c-head">
        <div className="eyebrow">착한<span style={{ color: "#4fd6a8" }}>거래</span></div>
        <h1>대여자동차 착한거래 상태 확인</h1>
        <div className="co">본인인증 후 본인의 정보만 열람하실 수 있습니다</div>
      </div>
      <div className="steps"><div className={`s ${step >= 1 ? "on" : ""}`} /><div className={`s ${step >= 2 ? "on" : ""}`} /><div className={`s ${step >= 3 ? "on" : ""}`} /></div>

      <div className="c-body">
        {stage === "auth" && !started && (
          <>
            <div className="slabel">내 상태 확인</div>
            <div className="stitle">내 거래이력 상태를 확인합니다</div>
            <div className="sdesc">본인인증 후 본인 정보만 열람됩니다.</div>
            <NoticeList items={STATUS_NOTICES} />
            <button className="btn btn-safe btn-block" onClick={() => setStarted(true)}>본인인증하고 확인하기</button>
          </>
        )}
        {stage === "auth" && started && <AuthFlow onVerified={onVerified} supportHelp={supportHelp} />}

        {stage === "status" && verified && (
          <>
            <div className="verified">
              <div className="vrow"><span className="chk">✓</span> 본인확인 완료 <span style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 600 }}>· {verified.method}</span></div>
              <div className="info"><span><b>{verified.name}</b> 님</span><span>생년월일 {fmtBirth(verified.birth)}</span></div>
            </div>

            {clean ? (
              <>
                <div className="r-clean" style={{ marginBottom: 18 }}><div className="ic">✓</div><div><h3>거래이력 없음</h3><p>등록된 거래이력이 없어요. 깨끗합니다.</p></div></div>
                <div className="receipt" style={{ marginTop: 0 }}>
                  <div className="r"><span className="k">상태</span><span className="v" style={{ color: "var(--safe)" }}>이상 없음 (청정)</span></div>
                  <div className="r"><span className="k">확인자</span><span className="v">{verified.name} · {fmtBirth(verified.birth)}</span></div>
                  <div className="r"><span className="k">발급일</span><span className="v">{fmtDate(new Date())}</span></div>
                  <div className="r"><span className="k">본인확인</span><span className="v">{verified.method}</span></div>
                </div>
                <div className="card" style={{ marginTop: 16, boxShadow: "none" }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>렌트사에 제출하기</div>
                  <div className="hint" style={{ marginTop: 0, marginBottom: 12 }}>① 이 화면을 <b>캡처</b>해 제출하거나, ② 렌트사를 지정해 <b>공유</b>하세요.</div>
                  {shared ? (
                    <div className="r-clean" style={{ padding: 14 }}><div className="ic" style={{ width: 36, height: 36, fontSize: 18 }}>✓</div><div><h3 style={{ fontSize: 14 }}>{shared}에 공유 완료</h3><p>상태확인서가 전달되었습니다.</p></div></div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="inp" value={shareTo} onChange={(e) => setShareTo(e.target.value)} placeholder="예: 홍길동렌터카" style={{ flex: 1 }} />
                      <button className="btn btn-primary" onClick={doShare}>공유</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="r-hit" style={{ marginBottom: 16 }}>
                  <div className="head"><div className="ic">!</div><div><h3>거래이력 있음</h3><p>아래 거래이력이 있어요. 이미 해결하셨다면 해제를 신청하실 수 있어요.</p></div></div>
                  {result.records.map((r) => (
                    <div className="risk-row" key={r.id}><div><div className="type">{RISK_TYPES[r.type] || r.type}</div><div className="meta">등록처 {r.company || "-"}</div></div><div className="sp" /><span className="badge b-red"><span className="dot" />유효</span></div>
                  ))}
                </div>
                <div className="card" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>거래이력 해제 신청</div>
                  <div className="hint" style={{ marginTop: 0, marginBottom: 12 }}>정산 내역·합의서·변제 확인서 등을 올려주시면 확인 후 해제해 드려요.</div>
                  <label className="btn btn-block" style={{ marginBottom: 10, cursor: "pointer" }}>
                    <Icon name="file" /> {file || "증빙 파일 첨부"}
                    <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0]?.name || "")} />
                  </label>
                  <textarea className="inp" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="해결 내용 (예: 2026-06-01 미납금 전액 입금 완료)" style={{ marginBottom: 12 }} />
                  <button className="btn btn-safe btn-block" onClick={submitAppeal}>해제 신청</button>
                </div>
              </>
            )}
          </>
        )}

        {stage === "appealed" && (
          <div className="done">
            <div className="big">✓</div>
            <h2>소명이 접수되었습니다</h2>
            <p>관리자 확인 후 처리됩니다.<br />결과는 본인인증으로 다시 확인하실 수 있습니다.</p>
          </div>
        )}
      </div>

      </div>
  );
}
