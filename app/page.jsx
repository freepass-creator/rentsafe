"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RISK_TYPES, fmtBirth, cleanBirth,
  createConsent, listConsents, addRisk, queryRisk,
} from "@/lib/db";

const FB_READY = !!process.env.NEXT_PUBLIC_FB_PROJECT_ID;

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

  if (!FB_READY) return <SetupNeeded />;

  return (
    <>
      <div className="header">
        <div className="wrap">
          <div className="logo">R</div>
          <div>
            <h1>RentSafe</h1>
            <div className="sub">렌터카 안전거래 플랫폼 · 가맹사 콘솔</div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="tabs">
          <button className={`tab ${tab==="send"?"active":""}`} onClick={() => setTab("send")}>📨 동의요청</button>
          <button className={`tab ${tab==="query"?"active":""}`} onClick={() => setTab("query")}>⌕ 조회</button>
          <button className={`tab ${tab==="register"?"active":""}`} onClick={() => setTab("register")}>＋ 등록</button>
        </div>
        {tab === "send" && <SendTab toast={showToast} />}
        {tab === "query" && <QueryTab />}
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

/* ---------- 조회 ---------- */
function QueryTab() {
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const f = e.target;
    setBusy(true);
    const r = await queryRisk({
      name: f.name.value, birth: f.birth.value,
      license: f.license.value, phone: f.phone.value,
    });
    setRes(r);
    setBusy(false);
  }

  return (
    <div className="card">
      <div className="card-title">거래위험 조회</div>
      <div className="card-desc">신규 계약 전, 해당 고객의 거래위험정보 등록 여부만 확인합니다. 결과는 등록 여부 + 유형만 표시됩니다.</div>
      <form onSubmit={submit}>
        <div className="grid">
          <div className="field"><label>이름 <span className="req">*</span></label><input name="name" required placeholder="홍길동" /></div>
          <div className="field"><label>생년월일 <span className="req">*</span></label><input name="birth" required inputMode="numeric" maxLength={6} placeholder="900715 (6자리)" /></div>
          <div className="field"><label>운전면허번호</label><input name="license" placeholder="11-22-334455-66" /></div>
          <div className="field"><label>휴대폰번호</label><input name="phone" inputMode="numeric" placeholder="010-0000-0000" /></div>
        </div>
        <div className="actions"><button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "조회 중…" : "⌕ 조회하기"}</button></div>
      </form>
      {res && <QueryResult res={res} />}
    </div>
  );
}
function QueryResult({ res }) {
  if (res.kind === "none")
    return <div className="result"><div className="r-clean"><div className="ic">✓</div><div><h3>거래위험정보 없음</h3><p>입력한 정보와 일치하는 등록 내역이 없습니다.</p></div></div></div>;
  if (res.kind === "ambiguous")
    return <div className="result"><div className="r-amb"><div style={{fontSize:24}}>⚠</div><div><h3>동일 이름·생년월일이 여러 건입니다</h3><p>정확한 확인을 위해 운전면허번호 또는 휴대폰번호를 추가 입력해 주세요.</p></div></div></div>;
  const who = res.records[0];
  return (
    <div className="result"><div className="r-hit">
      <div className="head"><div className="ic">!</div><div>
        <h3>거래위험정보 있음 · {res.records.length}건</h3>
        <p>대상 <b>{mask(who.name)} · {fmtBirth(who.birth)}</b> — 개인정보는 가린 상태로 존재 여부만 확인됩니다.</p>
      </div></div>
      {res.records.map((r) => (
        <div className="risk-row" key={r.id}>
          <div><div className="type">{RISK_TYPES[r.type] || r.type}</div><div className="meta">발생/등록 거래위험</div></div>
          <div className="sp" /><span className="badge b-red"><span className="dot" />유효</span>
        </div>
      ))}
    </div></div>
  );
}

/* ---------- 등록 ---------- */
function RegisterTab({ toast }) {
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const f = e.target;
    setBusy(true);
    await addRisk({
      name: f.name.value.trim(), birth: f.birth.value, type: f.type.value,
      company: f.company.value.trim(), license: f.license.value.trim(),
      phone: f.phone.value.trim(), reason: f.reason.value.trim(),
    });
    setBusy(false);
    f.reset();
    toast("거래위험정보가 등록되었습니다.", "safe");
  }
  return (
    <div className="card">
      <div className="card-title">거래위험정보 등록</div>
      <div className="card-desc">중대한 계약위반(미납·미반납 등)이 실제 발생한 경우에만 등록합니다.</div>
      <div className="demo-note">⚠ 데모 단계 — 실제 개인정보 대신 테스트 데이터를 사용하세요.</div>
      <form onSubmit={submit}>
        <div className="grid">
          <div className="field"><label>이름 <span className="req">*</span></label><input name="name" required placeholder="홍길동" /></div>
          <div className="field"><label>생년월일 <span className="req">*</span></label><input name="birth" required inputMode="numeric" maxLength={6} placeholder="900715" /></div>
          <div className="field"><label>위험유형 <span className="req">*</span></label>
            <select name="type" required>{Object.entries(RISK_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="field"><label>등록처(회사)</label><input name="company" placeholder="우리 회사명" /></div>
          <div className="field"><label>운전면허번호</label><input name="license" placeholder="11-22-334455-66" /></div>
          <div className="field"><label>휴대폰번호</label><input name="phone" inputMode="numeric" placeholder="010-0000-0000" /></div>
          <div className="field full"><label>등록 사유 <span className="req">*</span></label><textarea name="reason" rows={3} required placeholder="계약위반 경위" /></div>
        </div>
        <div className="actions"><button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "등록 중…" : "＋ 등록하기"}</button></div>
      </form>
    </div>
  );
}

/* ---------- Firebase 미설정 안내 ---------- */
function SetupNeeded() {
  return (
    <div className="center-msg">
      <div>
        <div style={{fontSize:40,marginBottom:12}}>🔧</div>
        <h2 style={{fontSize:18,fontWeight:800,color:"var(--ink)"}}>Firebase 설정이 필요합니다</h2>
        <p style={{marginTop:8,maxWidth:380}}>
          <code>.env.local</code>에 Firebase 키를 넣어주세요.<br/>
          (<code>.env.local.example</code> 참고 · Vercel은 환경변수에 등록)
        </p>
      </div>
    </div>
  );
}
