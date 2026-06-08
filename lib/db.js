// 데이터 접근 + 매칭 엔진
// Firebase 설정이 있으면 → Firestore, 없으면 → localStorage(데모 모드) 자동 전환
import { db } from "./firebase";
import {
  collection, addDoc, getDoc, getDocs, doc, updateDoc,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { cleanBirth, fmtBirth } from "./format";

export const FB_READY = !!process.env.NEXT_PUBLIC_FB_PROJECT_ID;
export const IS_LOCAL = !FB_READY;

// 재export — 기존 import 경로(@/lib/db) 호환 유지
export { cleanBirth, fmtBirth };
export { RISK_TYPES } from "./constants";

/* ===================== localStorage 백엔드 (데모 모드) ===================== */
const LS_C = "rs_consents", LS_R = "rs_risks";
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } }
function lsSet(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function rid(p) { return p + Math.random().toString(36).slice(2, 10); }
function ensureSeed() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(LS_R)) {
    lsSet(LS_R, [
      { id: rid("rk_"), name: "홍길동", birth: "900715", type: "unpaid",       license: "31-44-667788-99", phone: "010-5555-1212", company: "스피드렌터카", reason: "대여료 4개월 미납", status: "active", createdAt: Date.now() - 5e8 },
      { id: rid("rk_"), name: "홍길동", birth: "850228", type: "accident",     license: "41-55-778899-00", phone: "010-9090-3434", company: "하나모빌리티", reason: "사고 자기부담금 미정산", status: "active", createdAt: Date.now() - 4e8 },
      { id: rid("rk_"), name: "최민재", birth: "920909", type: "not_returned", license: "51-66-889900-11", phone: "010-1212-3434", company: "국민카대여",   reason: "계약만료 후 미반납", status: "active", createdAt: Date.now() - 3e8 },
    ]);
  }
}

/* ===================== 회원사(members) — 업체코드 조회 ===================== */
// 데모용 회원사 (Firebase 미연결 시). 실제로는 회원사 가입 시 발급되는 코드.
const DEMO_MEMBERS = [
  { code: "100001", company: "스피드렌터카" },
  { code: "100002", company: "테스트렌터카" },
  { code: "100003", company: "하나모빌리티" },
];

const LS_T = "rs_tempmembers"; // 임시 회원(가입 없이 발급)

// 임시 회원코드 발급 — 회원가입 없이 직거래용. { code, company } 반환
export async function issueTempMember({ label = "" } = {}) {
  const code = (() => { let r = ""; for (let i = 0; i < 6; i++) r += Math.floor(Math.random() * 10); return r; })();
  const company = label.trim() || `임시거래 ${code}`;
  if (IS_LOCAL) {
    const arr = lsGet(LS_T);
    arr.unshift({ code, company, temp: true, createdAt: Date.now() });
    lsSet(LS_T, arr);
    return { code, company };
  }
  await addDoc(collection(db, "tempmembers"), { code, company, temp: true, createdAt: serverTimestamp() });
  return { code, company };
}

// 코드로 거래 상대 찾기(영구 회원 + 임시 회원) → { company, code, temp } 또는 null
export async function findMemberByCode(code) {
  const c = (code || "").trim();
  if (!c) return null;
  if (IS_LOCAL) {
    const acc = (() => { try { return JSON.parse(localStorage.getItem("rs_accounts") || "{}"); } catch { return {}; } })();
    const fromAcc = Object.values(acc).find((a) => (a.code || "") === c);
    const perm = DEMO_MEMBERS.find((m) => m.code === c) || (fromAcc ? { company: fromAcc.company, code: c } : null);
    if (perm) return { ...perm, temp: false };
    const t = lsGet(LS_T).find((m) => m.code === c);
    return t ? { company: t.company, code: c, temp: true } : null;
  }
  const ms = await getDocs(query(collection(db, "members"), where("code", "==", c)));
  if (!ms.empty) return { company: ms.docs[0].data().company, code: c, temp: false };
  const ts = await getDocs(query(collection(db, "tempmembers"), where("code", "==", c)));
  if (!ts.empty) return { company: ts.docs[0].data().company, code: c, temp: true };
  return null;
}

/* ===================== 동의요청 (consents) ===================== */
export async function createConsent({ name, phone, company = "스피드렌터카", code = "" }) {
  if (IS_LOCAL) {
    const arr = lsGet(LS_C);
    const id = rid("cs_");
    arr.unshift({ id, name, phone, company, code, status: "pending", verified: null, createdAt: Date.now(), completedAt: null });
    lsSet(LS_C, arr);
    return id;
  }
  const ref = await addDoc(collection(db, "consents"), {
    name, phone, company, code, status: "pending", verified: null,
    createdAt: serverTimestamp(), completedAt: null,
  });
  return ref.id;
}

// 손님이 직접 진행한 셀프 동의 (업체코드로 대상 지정) → 바로 동의완료 기록
export async function createSelfConsent({ name, phone = "", company, code = "", verified }) {
  if (IS_LOCAL) {
    const arr = lsGet(LS_C);
    const id = rid("cs_");
    arr.unshift({ id, name, phone, company, code, status: "completed", verified, self: true, createdAt: Date.now(), completedAt: Date.now() });
    lsSet(LS_C, arr);
    return id;
  }
  const ref = await addDoc(collection(db, "consents"), {
    name, phone, company, code, status: "completed", verified, self: true,
    createdAt: serverTimestamp(), completedAt: serverTimestamp(),
  });
  return ref.id;
}

// company 지정 시 해당 회원사 것만 (회원사 콘솔 스코프)
export async function listConsents(company) {
  if (IS_LOCAL) {
    const a = lsGet(LS_C).sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
    return company ? a.filter((c) => c.company === company) : a;
  }
  if (company) {
    const snap = await getDocs(query(collection(db, "consents"), where("company", "==", company)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((x, y) => (y.createdAt?.seconds || 0) - (x.createdAt?.seconds || 0));
  }
  const snap = await getDocs(query(collection(db, "consents"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getConsent(id) {
  if (IS_LOCAL) return lsGet(LS_C).find((c) => c.id === id) || null;
  const snap = await getDoc(doc(db, "consents", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function completeConsent(id, verified) {
  if (IS_LOCAL) {
    const arr = lsGet(LS_C);
    const c = arr.find((x) => x.id === id);
    if (c) { c.status = "completed"; c.verified = verified; c.completedAt = Date.now(); lsSet(LS_C, arr); }
    return;
  }
  await updateDoc(doc(db, "consents", id), { status: "completed", verified, completedAt: serverTimestamp() });
}

/* ===================== 거래이력 (risks) ===================== */
export async function addRisk(data) {
  const payload = {
    name: data.name, birth: cleanBirth(data.birth), type: data.type,
    license: data.license || "", phone: data.phone || "",
    company: data.company || "미입력", reason: data.reason || "",
    evidence: data.evidence || "", status: "active",
  };
  if (IS_LOCAL) {
    ensureSeed();
    const arr = lsGet(LS_R);
    arr.unshift({ id: rid("rk_"), ...payload, createdAt: Date.now() });
    lsSet(LS_R, arr);
    return;
  }
  await addDoc(collection(db, "risks"), { ...payload, createdAt: serverTimestamp() });
}

async function fetchRisksByName(nm) {
  if (IS_LOCAL) { ensureSeed(); return lsGet(LS_R).filter((r) => r.name === nm); }
  const snap = await getDocs(query(collection(db, "risks"), where("name", "==", nm)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// 전체 거래이력 (관리자 현황용)
export async function listRisks() {
  if (IS_LOCAL) { ensureSeed(); return lsGet(LS_R).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); }
  const snap = await getDocs(query(collection(db, "risks"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* 매칭: 이름+생년월일(필수) / 면허·폰(보조, 입력 시 함께) */
export async function queryRisk({ name, birth, license = "", phone = "" }) {
  const nm = (name || "").trim();
  const qb = cleanBirth(birth);
  const lic = (license || "").trim(), ph = (phone || "").trim();

  const all = (await fetchRisksByName(nm)).filter((r) => r.status === "active");
  const core = all.filter((r) => cleanBirth(r.birth) === qb);
  const aux = (lic || ph) ? all.filter((r) => (lic && r.license === lic) || (ph && r.phone === ph)) : [];

  const seen = new Set(), merged = [];
  [...core, ...aux].forEach((r) => { if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); } });

  if (merged.length === 0) return { kind: "none", records: [] };
  if (core.length >= 2 && aux.length === 0) return { kind: "ambiguous", records: core };
  if (core.length >= 2 && aux.length >= 1) return { kind: "hit", records: aux };
  return { kind: "hit", records: merged };
}

/* ===================== 소명 (appeals) ===================== */
const LS_A = "rs_appeals";
export async function createAppeal({ name, birth, type = "", note = "", channel = "self" }) {
  const payload = { name, birth: cleanBirth(birth), type, note, channel, status: "pending" };
  if (IS_LOCAL) {
    const arr = lsGet(LS_A);
    arr.unshift({ id: rid("ap_"), ...payload, createdAt: Date.now() });
    lsSet(LS_A, arr);
    return;
  }
  await addDoc(collection(db, "appeals"), { ...payload, createdAt: serverTimestamp() });
}

export async function listAppeals() {
  if (IS_LOCAL) return lsGet(LS_A).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const snap = await getDocs(query(collection(db, "appeals"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// 소명 승인 → 해당 본인(name+birth)의 active 거래이력을 resolved 처리
export async function resolveAppeal(appeal) {
  if (IS_LOCAL) {
    const aps = lsGet(LS_A);
    const a = aps.find((x) => x.id === appeal.id);
    if (a) a.status = "resolved";
    lsSet(LS_A, aps);
    const risks = lsGet(LS_R);
    risks.forEach((r) => {
      if (r.name === appeal.name && cleanBirth(r.birth) === cleanBirth(appeal.birth) && r.status === "active") r.status = "resolved";
    });
    lsSet(LS_R, risks);
    return;
  }
  await updateDoc(doc(db, "appeals", appeal.id), { status: "resolved" });
  const snap = await getDocs(query(collection(db, "risks"), where("name", "==", appeal.name)));
  await Promise.all(
    snap.docs
      .filter((d) => cleanBirth(d.data().birth) === cleanBirth(appeal.birth) && d.data().status === "active")
      .map((d) => updateDoc(doc(db, "risks", d.id), { status: "resolved" }))
  );
}
