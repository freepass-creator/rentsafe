// Firestore 데이터 접근 + 매칭 엔진
// 컬렉션: consents(동의요청), risks(거래위험정보)
import { db } from "./firebase";
import {
  collection, addDoc, getDoc, getDocs, doc, updateDoc,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";

export const RISK_TYPES = {
  unpaid:        "대여료 장기 미납",
  not_returned:  "차량 미반납",
  accident:      "사고비용 미정산",
  unauthorized:  "무단 제3자 운행",
  disposal:      "차량 임의처분/담보 의심",
};

export function cleanBirth(b) {
  return (b || "").replace(/\D/g, "").slice(0, 6);
}
export function fmtBirth(b) {
  const d = cleanBirth(b);
  return d.length === 6 ? `${d.slice(0,2)}.${d.slice(2,4)}.${d.slice(4,6)}` : (b || "-");
}

/* ---------- 동의요청 (consents) ---------- */
export async function createConsent({ name, phone, company = "스피드렌터카" }) {
  const ref = await addDoc(collection(db, "consents"), {
    name, phone, company,
    status: "pending", verified: null,
    createdAt: serverTimestamp(), completedAt: null,
  });
  return ref.id;
}

export async function listConsents() {
  const q = query(collection(db, "consents"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getConsent(id) {
  const snap = await getDoc(doc(db, "consents", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function completeConsent(id, verified) {
  await updateDoc(doc(db, "consents", id), {
    status: "completed",
    verified, // { name, birth, method }
    completedAt: serverTimestamp(),
  });
}

/* ---------- 거래위험정보 (risks) ---------- */
export async function addRisk(data) {
  await addDoc(collection(db, "risks"), {
    name: data.name,
    birth: cleanBirth(data.birth),
    type: data.type,
    license: data.license || "",
    phone: data.phone || "",
    company: data.company || "미입력",
    reason: data.reason || "",
    status: "active",
    createdAt: serverTimestamp(),
  });
}

/* ---------- 매칭 ----------
   핵심: 이름+생년월일(필수) / 보조: 면허·폰(입력 시 함께 매칭)
   ※ 복합 인덱스 회피를 위해 name으로만 쿼리하고 나머지는 클라이언트에서 필터
*/
export async function queryRisk({ name, birth, license = "", phone = "" }) {
  const nm = (name || "").trim();
  const qb = cleanBirth(birth);
  const lic = (license || "").trim();
  const ph = (phone || "").trim();

  // 이름으로 후보 수집 (보조 식별자만 입력한 경우까지 커버하려면 전체 active도 고려하지만,
  // MVP에서는 이름 일치 + 보조매칭으로 충분)
  const snap = await getDocs(query(collection(db, "risks"), where("name", "==", nm)));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === "active");

  const core = all.filter((r) => cleanBirth(r.birth) === qb);
  const aux = (lic || ph) ? all.filter((r) => (lic && r.license === lic) || (ph && r.phone === ph)) : [];

  const seen = new Set(), merged = [];
  [...core, ...aux].forEach((r) => { if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); } });

  if (merged.length === 0) return { kind: "none", records: [] };
  if (core.length >= 2 && aux.length === 0) return { kind: "ambiguous", records: core };
  if (core.length >= 2 && aux.length >= 1) return { kind: "hit", records: aux };
  return { kind: "hit", records: merged };
}
