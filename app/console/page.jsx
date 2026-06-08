"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RISK_TYPES, CONTRACT_CONSENT_FORM, CONSENT_NOTICES, CONSENT_CLAUSES, STATUS_NOTICES, CODE_LABEL, VIOLATION_LABEL } from "@/lib/constants";
import { mask, fmtBirth, fmtDate } from "@/lib/format";
import { IS_LOCAL, listConsents, addRisk } from "@/lib/db";
import { getSession, logout } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import Icon from "@/components/Icon";
import NoticeList from "@/components/NoticeList";

export default function Console() {
  const router = useRouter();
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState("send");
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, kind) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => { const s = getSession(); if (!s) router.replace("/login"); else setSession(s); }, [router]);
  if (!session) return null;
  const company = session.company;
  const code = session.code || "";

  return (
    <>
      <AppHeader
        subtitle={<>회원 콘솔 · <b style={{ opacity: .95 }}>{company}</b></>}
        right={<button className="btn btn-sm" style={{ background: "transparent", borderColor: "rgba(255,255,255,.3)", color: "#fff" }} onClick={async () => { await logout(); router.replace("/login"); }}>로그아웃</button>}
      />
      <div className="container">
        {IS_LOCAL && <div className="demo-note">데모 모드 — Firebase 미연결, 브라우저 로컬 저장으로 동작합니다. (배포 후 Firebase 키 등록 시 실제 DB로 전환)</div>}
        <div className="tabs">
          <button className={`tab ${tab === "send" ? "active" : ""}`} onClick={() => setTab("send")}><Icon name="check" /> 동의 현황</button>
          <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}><Icon name="plus" /> {VIOLATION_LABEL}</button>
        </div>
        {tab === "send" && <SendTab toast={showToast} company={company} code={code} />}
        {tab === "register" && <RegisterTab toast={showToast} company={company} />}
      </div>
      {toast && <div className="toast-host"><div className={`toast ${toast.kind || ""}`}>{toast.msg}</div></div>}
    </>
  );
}

/* ---------- 동의요청 ---------- */
function SendTab({ toast, company, code }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTpl, setShowTpl] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showStatusPreview, setShowStatusPreview] = useState(false);
  const copyText = (t) => { navigator.clipboard?.writeText(t); toast("복사되었습니다.", "safe"); };

  const reload = useCallback(async () => {
    setLoading(true);
    try { setList(await listConsents(company)); } catch (e) { console.error(e); }
    setLoading(false);
  }, [company]);
  useEffect(() => { reload(); }, [reload]);

  return (
    <>
      <div className="card code-card">
        <div className="card-title">우리 {CODE_LABEL}</div>
        <div className="card-desc">손님에게 이 {CODE_LABEL}를 알려주세요. 손님이 <b>착한거래 동의하기</b>에서 이 {CODE_LABEL}를 입력하면 우리 앞으로 동의가 등록됩니다.</div>
        <div className="code-row">
          <span className="code-val">{code || "—"}</span>
          {code && <button className="btn btn-sm" onClick={() => copyText(code)}><Icon name="file" /> {CODE_LABEL} 복사</button>}
          <button className="btn btn-sm" onClick={() => copyText(`${location.origin}/consent`)}>동의 화면 링크 복사</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">손님이 보는 동의 내용
          <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={() => setShowPreview((v) => !v)}>{showPreview ? "접기" : "미리보기"}</button>
        </div>
        {showPreview && (
          <>
            <div className="card-desc">손님이 <b>착한거래 동의하기</b>에서 아래 내용을 확인하고 동의합니다.</div>
            <NoticeList items={CONSENT_NOTICES} />
            <div className="clauses" style={{ marginTop: 12 }}>
              {CONSENT_CLAUSES.map((c, i) => (
                <div className="clause" key={i}><div className="clause-t">{c.t}</div><div className="clause-b">{c.b}</div></div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">손님이 보는 상태확인 내용
          <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={() => setShowStatusPreview((v) => !v)}>{showStatusPreview ? "접기" : "미리보기"}</button>
        </div>
        {showStatusPreview && (
          <>
            <div className="card-desc">손님이 본인인증 후 보는 상태확인 안내입니다.</div>
            <NoticeList items={STATUS_NOTICES} />
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">동의 현황
          <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={reload}>↻ 새로고침</button>
        </div>
        {loading ? <div className="empty">불러오는 중…</div> :
          list.filter((c) => c.status === "completed").length === 0 ? <div className="empty">아직 동의한 손님이 없습니다.</div> :
            list.filter((c) => c.status === "completed").map((c) => (
              <div className="risk-row" key={c.id}>
                <div>
                  <div className="type">{mask(c.name)}</div>
                  <div className="meta">{fmtDate(c.completedAt || c.createdAt)} · {c.self ? "손님 직접 동의" : "동의완료"}</div>
                </div>
                <div className="sp" />
                <span className="badge b-green"><span className="dot" />동의완료</span>
              </div>
            ))}
      </div>

      <div className="card">
        <div className="card-title">개인정보 동의서에 항목 추가
          <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={() => setShowTpl((v) => !v)}>{showTpl ? "접기" : "양식 보기"}</button>
        </div>
        {showTpl && (
          <>
            <div className="card-desc"><b>계약서는 그대로 두고</b>, 기존 「개인정보 수집·이용 동의서」에 아래 <b>제3자 제공 동의 항목만 별도로</b> 추가하면 됩니다. (디지털 동의를 못 쓰는 경우 대안) <b>이 방식으로 받은 동의서는 회원이 직접 보관·관리</b>하며, 착한거래 플랫폼에는 기록되지 않습니다.</div>
            <div className="tpl-label">개인정보 제3자 제공 동의 항목
              <button className="btn btn-sm" onClick={() => copyText(CONTRACT_CONSENT_FORM)}><Icon name="file" /> 복사</button></div>
            <pre className="tpl">{CONTRACT_CONSENT_FORM}</pre>
          </>
        )}
      </div>
    </>
  );
}

/* ---------- 위반 등록 ---------- */
function RegisterTab({ toast, company }) {
  const [busy, setBusy] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    listConsents(company).then((cs) => setCompleted(cs.filter((c) => c.status === "completed"))).catch(() => {});
  }, [company]);

  function pick(cid) {
    const c = completed.find((x) => x.id === cid);
    if (c) { setName(c.name || ""); setBirth(c.verified?.birth || ""); }
    else { setName(""); setBirth(""); }
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || birth.replace(/\D/g, "").length < 6) { toast("이름·생년월일을 확인해 주세요.", "danger"); return; }
    if (!evidence) { toast("증빙 파일을 첨부해 주세요.", "danger"); return; }
    const f = e.target;
    setBusy(true);
    try {
      await addRisk({
        name: name.trim(), birth, type: f.type.value, company,
        license: f.license.value.trim(), phone: f.phone.value.trim(), reason: f.reason.value.trim(), evidence,
      });
      f.reset(); setName(""); setBirth(""); setEvidence("");
      toast(`${VIOLATION_LABEL}이 등록되었습니다.`, "safe");
    } catch (err) { console.error(err); toast("저장 실패 — Firestore 설정/규칙을 확인하세요.", "danger"); }
    setBusy(false);
  }

  return (
    <div className="card">
      <div className="card-title">{VIOLATION_LABEL} 등록</div>
      <div className="card-desc">중대한 계약 위반이 발생한 경우에만, <b>동의받은 손님에 한해 객관적 증빙을 첨부하여</b> 등록합니다. 등록처는 로그인 회원({company})으로 자동 기록됩니다.</div>
      <div className="demo-note">⚠ 데모 단계 — 실제 개인정보 대신 테스트 데이터를 사용하세요.</div>
      <form onSubmit={submit}>
        <div className="grid">
          {completed.length > 0 && (
            <div className="field full"><label>동의완료 손님에서 선택 <span className="opt">선택 시 자동입력</span></label>
              <select onChange={(e) => pick(e.target.value)} defaultValue="">
                <option value="">직접 입력</option>
                {completed.map((c) => <option key={c.id} value={c.id}>{mask(c.name)} · {fmtBirth(c.verified?.birth)}</option>)}
              </select></div>
          )}
          <div className="field"><label>이름 <span className="req">*</span></label><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="홍길동" /></div>
          <div className="field"><label>생년월일 <span className="req">*</span></label><input value={birth} onChange={(e) => setBirth(e.target.value)} required inputMode="numeric" maxLength={6} placeholder="900715" /></div>
          <div className="field"><label>위반 유형 <span className="req">*</span></label>
            <select name="type" required>{Object.entries(RISK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="field"><label>운전면허번호</label><input name="license" placeholder="11-22-334455-66" /></div>
          <div className="field"><label>휴대폰번호</label><input name="phone" inputMode="numeric" placeholder="010-0000-0000" /></div>
          <div className="field full"><label>등록 사유 <span className="req">*</span></label><textarea name="reason" rows={3} required placeholder="계약위반 경위 (예: 대여료 4개월 미납, 3차 통지 후 무응답)" /></div>
          <div className="field full">
            <label>증빙 첨부 <span className="req">*</span> <span className="opt">내용증명·미납내역·반납요청 등</span></label>
            <label className="btn btn-block" style={{ cursor: "pointer" }}>
              <Icon name="file" /> {evidence || "증빙 파일 선택"}
              <input type="file" style={{ display: "none" }} onChange={(e) => setEvidence(e.target.files?.[0]?.name || "")} />
            </label>
          </div>
        </div>
        <div className="actions"><button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "등록 중…" : `＋ ${VIOLATION_LABEL} 등록`}</button></div>
      </form>
    </div>
  );
}
