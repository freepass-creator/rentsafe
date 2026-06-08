"use client";

import { useEffect, useState, useCallback } from "react";
import { RISK_TYPES } from "@/lib/constants";
import { mask, fmtBirth, cleanBirth, fmtDate } from "@/lib/format";
import { IS_LOCAL, listAppeals, resolveAppeal, listRisks } from "@/lib/db";
import AppHeader from "@/components/AppHeader";

export default function Admin() {
  const [appeals, setAppeals] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([listAppeals(), listRisks()]);
      setAppeals(a); setRisks(r);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function approve(a) {
    await resolveAppeal(a);
    setToast("해제 처리되었습니다. 해당 위반정보가 해소되었습니다.");
    setTimeout(() => setToast(null), 2600);
    reload();
  }

  const pending = appeals.filter((a) => a.status === "pending");
  const doneAppeals = appeals.filter((a) => a.status !== "pending");
  const active = risks.filter((r) => r.status === "active");
  const resolved = risks.filter((r) => r.status === "resolved");
  const people = new Set(active.map((r) => `${r.name}|${cleanBirth(r.birth)}`)).size;

  return (
    <>
      <AppHeader subtitle="플랫폼 관리자 · 등록 현황 · 소명 심사" />
      <div className="container">
        {IS_LOCAL && <div className="demo-note">데모 모드 (localStorage). 가맹사 등록·손님 소명이 여기로 모입니다.</div>}

        <div className="stat-row">
          <div className="stat-box"><div className="v">{people}</div><div className="k">등록 인원</div></div>
          <div className="stat-box"><div className="v">{active.length}</div><div className="k">유효 건수</div></div>
          <div className="stat-box"><div className="v">{pending.length}</div><div className="k">소명 대기</div></div>
        </div>

        {/* 소명 대기 */}
        <div className="card">
          <div className="card-title">소명 심사 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)" }}>· 대기 {pending.length}건</span>
            <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={reload}>새로고침</button>
          </div>
          {loading ? <div className="empty">불러오는 중…</div> :
            pending.length === 0 ? <div className="empty">대기 중인 소명이 없습니다.</div> :
              pending.map((a) => (
                <div className="risk-row" key={a.id} style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div className="type">{mask(a.name)} · {fmtBirth(a.birth)} {a.type ? `· ${RISK_TYPES[a.type] || a.type}` : ""}</div>
                    <div className="meta">{a.channel === "self" ? "셀프(본인인증)" : "수동"} 소명 · {a.note || "내용 없음"}</div>
                  </div>
                  <button className="btn btn-sm btn-safe" onClick={() => approve(a)}>해제 승인</button>
                </div>
              ))}
        </div>

        {/* 전체 등록 거래이력 */}
        <div className="card">
          <div className="card-title">전체 등록 거래이력 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)" }}>· 유효 {active.length} / 해소 {resolved.length}</span></div>
          {loading ? <div className="empty">불러오는 중…</div> :
            risks.length === 0 ? <div className="empty">등록된 거래이력이 없습니다.</div> :
              risks.map((r) => (
                <div className="risk-row" key={r.id}>
                  <div>
                    <div className="type">{mask(r.name)} · {fmtBirth(r.birth)} · {RISK_TYPES[r.type] || r.type}</div>
                    <div className="meta">{r.company || "-"} · {fmtDate(r.createdAt)}</div>
                  </div>
                  <div className="sp" />
                  {r.status === "active"
                    ? <span className="badge b-red"><span className="dot" />유효</span>
                    : <span className="badge b-green"><span className="dot" />해소</span>}
                </div>
              ))}
        </div>

        {doneAppeals.length > 0 && (
          <div className="card">
            <div className="card-title">소명 처리 완료 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)" }}>· {doneAppeals.length}건</span></div>
            {doneAppeals.map((a) => (
              <div className="risk-row" key={a.id}>
                <div><div className="type">{mask(a.name)} · {fmtBirth(a.birth)}</div><div className="meta">{a.note || ""}</div></div>
                <div className="sp" /><span className="badge b-green"><span className="dot" />해제됨</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div className="toast-host"><div className="toast safe">{toast}</div></div>}
    </>
  );
}
