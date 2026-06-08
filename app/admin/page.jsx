"use client";

import { useEffect, useState, useCallback } from "react";
import { RISK_TYPES } from "@/lib/constants";
import { mask, fmtBirth } from "@/lib/format";
import { IS_LOCAL, listAppeals, resolveAppeal } from "@/lib/db";
import AppHeader from "@/components/AppHeader";
import DemoNav from "@/components/DemoNav";

export default function Admin() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setList(await listAppeals()); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function approve(a) {
    await resolveAppeal(a);
    setToast("해제 처리되었습니다. 해당 위반정보가 해소되었습니다.");
    setTimeout(() => setToast(null), 2600);
    reload();
  }

  const pending = list.filter((a) => a.status === "pending");
  const done = list.filter((a) => a.status !== "pending");

  return (
    <>
      <AppHeader subtitle="플랫폼 관리자 · 소명 심사" />
      <div className="container">
        {IS_LOCAL && <div className="demo-note">데모 모드 (localStorage). 손님이 ‘손님’ 화면에서 소명 제출하면 여기로 들어옵니다.</div>}

        <div className="card">
          <div className="card-title">소명 대기 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)" }}>· {pending.length}건</span>
            <button className="btn btn-sm" style={{ float: "right" }} onClick={reload}>↻ 새로고침</button>
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

        {done.length > 0 && (
          <div className="card">
            <div className="card-title">처리 완료 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)" }}>· {done.length}건</span></div>
            {done.map((a) => (
              <div className="risk-row" key={a.id}>
                <div><div className="type">{mask(a.name)} · {fmtBirth(a.birth)}</div><div className="meta">{a.note || ""}</div></div>
                <div className="sp" /><span className="badge b-green"><span className="dot" />해제됨</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div className="toast-host"><div className="toast safe">{toast}</div></div>}
      <DemoNav />
    </>
  );
}
