"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RISK_TYPES, IS_LOCAL,
  createConsent, listConsents, addRisk,
} from "@/lib/db";

// 로그인된 가맹사 (mock) — 실제로는 Firebase Auth 로그인 계정에서 가져옴
const CURRENT_COMPANY = "스피드렌터카";

function mask(n) {
  if (!n) return "";
  if (n.length <= 1) return n;
  if (n.length === 2) return n[0] + "○";
  return n[0] + "○".repeat(n.length - 2) + n.slice(-1);
}
function hyphenPhone(v) {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  return d.length < 4 ? d : d.length < 8 ? `${d.slice(0,3)}-${d.slice(3)}` : `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
}

export default function Console() {
  const [tab, setTab] = useState("send");
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, kind) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <>
      <div className="header">
        <div className="wrap">
          <div className="logo">R</div>
          <div>
            <h1>RentSafe</h1>
            <div className="sub">가맹사 콘솔 · <b style={{opacity:.95}}>{CURRENT_COMPANY}</b> 로그인</div>
          </div>
        </div>
      </div>
      <div className="container">
        {IS_LOCAL && (
          <div className="demo-note">🧪 데모 모드 — Firebase 미연결 상태로 브라우저 로컬 저장(localStorage)으로 동작합니다. (Vercel 환경변수에 Firebase 키 등록 시 실제 DB로 전환)</div>
        )}
        <div className="tabs">
          <button className={`tab ${tab==="send"?"active":""}`} onClick={() => setTab("send")}>📨 동의요청</button>
          <button className={`tab ${tab==="register"?"active":""}`} onClick={() => setTab("register")}>＋ 위반 등록</button>
        </div>
        {tab === "send" && <SendTab toast={showToast} />}
        {tab === "register" && <RegisterTab toast={showToast} />}
      </div>
      {toast && (
        <div className="toast-host"><div className={`toast ${toast.kind||""}`}>{toast.msg}</div></div>
      )}
    </>
  );
}

/* ---------- 발송 ---------- */
function SendTab({ toast }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setList(await listConsents()); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function submit(e) {
    e.preventDefault();
    const f = e.target;
    await createConsent({ name: f.name.value.trim(), phone: f.phone.value.trim() });
    f.reset();
    toast("동의요청이 생성되었습니다. ‘고객화면 ↗’으로 열어보세요.", "safe");
    reload();
  }

  return (
    <>
      <div className="card">
        <div className="card-title">동의요청 보내기</div>
        <div className="card-desc">손님 이름·휴대폰을 입력하면 동의 링크가 생성됩니다. (실제로는 카카오 알림톡 발송)</div>
        <form onSubmit={submit}>
          <div className="grid">
            <div className="field"><label>손님 이름 <span className="req">*</span></label>
              <input name="name" required placeholder="홍길동" /></div>
            <div className="field"><label>휴대폰 <span className="req">*</span></label>
              <input name="phone" required inputMode="numeric" placeholder="010-0000-0000"
                onInput={(e) => { e.target.value = hyphenPhone(e.target.value); }} /></div>
          </div>
          <div className="actions"><button className="btn btn-primary btn-block" type="submit">📨 동의요청 생성 · 발송</button></div>
        </form>
      </div>
      <div className="card">
        <div className="card-title">동의 현황 <span style={{fontSize:12,fontWeight:500,color:"var(--ink3)"}}>· 손님 동의 완료 후 새로고침</span>
          <button className="btn btn-sm" style={{float:"right"}} onClick={reload}>↻ 새로고침</button>
        </div>
        {loading ? <div className="empty">불러오는 중…</div> :
          list.length === 0 ? <div className="empty">발송 내역이 없습니다.</div> :
          list.map((c) => (
            <div className="risk-row" key={c.id}>
              <div>
                <div className="type">{mask(c.name)} · {c.phone || "-"}</div>
                <div className="meta">{c.id.slice(0,8)} · {c.status === "completed" ? "동의완료" : "대기"}</div>
              </div>
              <div className="sp" />
              {c.status === "completed"
                ? <span className="badge b-green"><span className="dot" />동의완료</span>
                : <a className="btn btn-sm" href={`/consent/${c.id}`} target="_blank" rel="noreferrer">고객화면 ↗</a>}
            </div>
          ))}
      </div>
    </>
  );
}

/* ---------- 위반 등록 ---------- */
function RegisterTab({ toast }) {
  const [busy, setBusy] = useState(false);
  const [evidence, setEvidence] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!evidence) { toast("위반 증빙 파일을 첨부해 주세요.", "danger"); return; }
    const f = e.target;
    setBusy(true);
    await addRisk({
      name: f.name.value.trim(), birth: f.birth.value, type: f.type.value,
      company: CURRENT_COMPANY, license: f.license.value.trim(),
      phone: f.phone.value.trim(), reason: f.reason.value.trim(), evidence,
    });
    setBusy(false);
    f.reset(); setEvidence("");
    toast("위반정보가 등록되었습니다.", "safe");
  }
  return (
    <div className="card">
      <div className="card-title">위반 등록</div>
      <div className="card-desc">중대한 계약위반(미납·미반납 등)이 실제 발생한 경우에만, <b>객관적 증빙을 첨부하여</b> 등록합니다. 등록처는 로그인한 가맹사({CURRENT_COMPANY})로 자동 기록됩니다.</div>
      <div className="demo-note">⚠ 데모 단계 — 실제 개인정보 대신 테스트 데이터를 사용하세요.</div>
      <form onSubmit={submit}>
        <div className="grid">
          <div className="field"><label>이름 <span className="req">*</span></label><input name="name" required placeholder="홍길동" /></div>
          <div className="field"><label>생년월일 <span className="req">*</span></label><input name="birth" required inputMode="numeric" maxLength={6} placeholder="900715" /></div>
          <div className="field"><label>위반유형 <span className="req">*</span></label>
            <select name="type" required>{Object.entries(RISK_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="field"><label>운전면허번호</label><input name="license" placeholder="11-22-334455-66" /></div>
          <div className="field"><label>휴대폰번호</label><input name="phone" inputMode="numeric" placeholder="010-0000-0000" /></div>
          <div className="field full"><label>등록 사유 <span className="req">*</span></label><textarea name="reason" rows={3} required placeholder="계약위반 경위 (예: 대여료 4개월 미납, 3차 통지 후 무응답)" /></div>
          <div className="field full">
            <label>위반 증빙 첨부 <span className="req">*</span> <span className="opt">내용증명·미납내역·반납요청 등</span></label>
            <label className="btn btn-block" style={{cursor:"pointer"}}>
              {evidence ? `📎 ${evidence}` : "📎 증빙 파일 선택"}
              <input type="file" style={{display:"none"}} onChange={(e) => setEvidence(e.target.files?.[0]?.name || "")} />
            </label>
          </div>
        </div>
        <div className="actions"><button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "등록 중…" : "＋ 위반 등록"}</button></div>
      </form>
    </div>
  );
}
