"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RISK_TYPES, CONTRACT_CONSENT_FORM, CONSENT_NOTICES, CONSENT_STATEMENT, STATUS_NOTICES } from "@/lib/constants";
import { mask, hyphenPhone, fmtBirth, fmtDate } from "@/lib/format";
import { IS_LOCAL, createConsent, listConsents, addRisk } from "@/lib/db";
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

  return (
    <>
      <AppHeader
        subtitle={<>회원사 콘솔 · <b style={{ opacity: .95 }}>{company}</b></>}
        right={<button className="btn btn-sm" style={{ background: "transparent", borderColor: "rgba(255,255,255,.3)", color: "#fff" }} onClick={() => { logout(); router.replace("/login"); }}>로그아웃</button>}
      />
      <div className="container">
        {IS_LOCAL && <div className="demo-note">데모 모드 — Firebase 미연결, 브라우저 로컬 저장으로 동작합니다. (배포 후 Firebase 키 등록 시 실제 DB로 전환)</div>}
        <div className="tabs">
          <button className={`tab ${tab === "send" ? "active" : ""}`} onClick={() => setTab("send")}><Icon name="send" /> 동의요청</button>
          <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}><Icon name="plus" /> 위반 등록</button>
        </div>
        {tab === "send" && <SendTab toast={showToast} company={company} />}
        {tab === "register" && <RegisterTab toast={showToast} company={company} />}
      </div>
      {toast && <div className="toast-host"><div className={`toast ${toast.kind || ""}`}>{toast.msg}</div></div>}
    </>
  );
}

/* ---------- 동의요청 ---------- */
function SendTab({ toast, company }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTpl, setShowTpl] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showStatusPreview, setShowStatusPreview] = useState(false);
  const copyText = (t) => { navigator.clipboard?.writeText(t); toast("복사되었습니다.", "safe"); };

  const reload = useCallback(async () => {
    setLoading(true);
    try { setList(await listConsents()); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function submit(e) {
    e.preventDefault();
    const f = e.target;
    try {
      await createConsent({ name: f.name.value.trim(), phone: f.phone.value.trim(), company });
      f.reset();
      toast("동의요청이 생성되었습니다. ‘고객화면 ↗’으로 열어보세요.", "safe");
      reload();
    } catch (err) { console.error(err); toast("저장 실패 — Firestore 설정/규칙을 확인하세요.", "danger"); }
  }
  function copyLink(id) {
    const url = `${location.origin}/consent/${id}`;
    navigator.clipboard?.writeText(url);
    toast("동의 링크가 복사되었습니다.", "safe");
  }

  return (
    <>
      <div className="card">
        <div className="card-title">동의요청 보내기</div>
        <div className="card-desc">손님 이름·휴대폰을 입력하면 동의 링크가 생성됩니다. (실제로는 카카오 알림톡 발송)</div>
        <form onSubmit={submit}>
          <div className="grid">
            <div className="field"><label>손님 이름 <span className="req">*</span></label><input name="name" required placeholder="홍길동" /></div>
            <div className="field"><label>휴대폰 <span className="req">*</span></label>
              <input name="phone" required inputMode="numeric" placeholder="010-0000-0000" onInput={(e) => { e.target.value = hyphenPhone(e.target.value); }} /></div>
          </div>
          <div className="actions"><button className="btn btn-primary btn-block" type="submit"><Icon name="send" /> 동의요청 생성 · 발송</button></div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">손님이 보는 동의 내용
          <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={() => setShowPreview((v) => !v)}>{showPreview ? "접기" : "미리보기"}</button>
        </div>
        {showPreview && (
          <>
            <div className="card-desc">손님이 동의 링크를 열면 아래 내용을 확인하고 동의합니다.</div>
            <NoticeList items={CONSENT_NOTICES} />
            <div className="statement">{CONSENT_STATEMENT}</div>
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
          list.length === 0 ? <div className="empty">발송 내역이 없습니다.</div> :
            list.map((c) => (
              <div className="risk-row" key={c.id}>
                <div>
                  <div className="type">{mask(c.name)} · {c.phone || "-"}</div>
                  <div className="meta">{fmtDate(c.createdAt)} · {c.status === "completed" ? "동의완료" : "대기"}</div>
                </div>
                <div className="sp" />
                {c.status === "completed"
                  ? <span className="badge b-green"><span className="dot" />동의완료</span>
                  : (<div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => copyLink(c.id)}>복사</button>
                      <a className="btn btn-sm btn-primary" href={`/consent/${c.id}`} target="_blank" rel="noreferrer">고객화면 ↗</a>
                    </div>)}
              </div>
            ))}
      </div>

      <div className="card">
        <div className="card-title">개인정보 동의서에 항목 추가
          <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={() => setShowTpl((v) => !v)}>{showTpl ? "접기" : "양식 보기"}</button>
        </div>
        {showTpl && (
          <>
            <div className="card-desc"><b>계약서는 그대로 두고</b>, 기존 「개인정보 수집·이용 동의서」에 아래 <b>제3자 제공 동의 항목만 별도로</b> 추가하면 됩니다. (디지털 동의 링크를 못 쓰는 경우 대안)</div>
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
    listConsents().then((cs) => setCompleted(cs.filter((c) => c.status === "completed"))).catch(() => {});
  }, []);

  function pick(cid) {
    const c = completed.find((x) => x.id === cid);
    if (c) { setName(c.name || ""); setBirth(c.verified?.birth || ""); }
    else { setName(""); setBirth(""); }
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || birth.replace(/\D/g, "").length < 6) { toast("이름·생년월일을 확인해 주세요.", "danger"); return; }
    if (!evidence) { toast("위반 증빙 파일을 첨부해 주세요.", "danger"); return; }
    const f = e.target;
    setBusy(true);
    try {
      await addRisk({
        name: name.trim(), birth, type: f.type.value, company,
        license: f.license.value.trim(), phone: f.phone.value.trim(), reason: f.reason.value.trim(), evidence,
      });
      f.reset(); setName(""); setBirth(""); setEvidence("");
      toast("위반정보가 등록되었습니다.", "safe");
    } catch (err) { console.error(err); toast("저장 실패 — Firestore 설정/규칙을 확인하세요.", "danger"); }
    setBusy(false);
  }

  return (
    <div className="card">
      <div className="card-title">위반 등록</div>
      <div className="card-desc">중대한 계약위반이 발생한 경우에만, <b>동의받은 손님에 한해 객관적 증빙을 첨부하여</b> 등록합니다. 등록처는 로그인 회원사({company})로 자동 기록됩니다.</div>
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
          <div className="field"><label>위반유형 <span className="req">*</span></label>
            <select name="type" required>{Object.entries(RISK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="field"><label>운전면허번호</label><input name="license" placeholder="11-22-334455-66" /></div>
          <div className="field"><label>휴대폰번호</label><input name="phone" inputMode="numeric" placeholder="010-0000-0000" /></div>
          <div className="field full"><label>등록 사유 <span className="req">*</span></label><textarea name="reason" rows={3} required placeholder="계약위반 경위 (예: 대여료 4개월 미납, 3차 통지 후 무응답)" /></div>
          <div className="field full">
            <label>위반 증빙 첨부 <span className="req">*</span> <span className="opt">내용증명·미납내역·반납요청 등</span></label>
            <label className="btn btn-block" style={{ cursor: "pointer" }}>
              <Icon name="file" /> {evidence || "증빙 파일 선택"}
              <input type="file" style={{ display: "none" }} onChange={(e) => setEvidence(e.target.files?.[0]?.name || "")} />
            </label>
          </div>
        </div>
        <div className="actions"><button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "등록 중…" : "＋ 위반 등록"}</button></div>
      </form>
    </div>
  );
}
