// 인증 — Firebase Auth(설정 시) + localStorage mock 폴백
// 회원 프로필은 Firestore members/{uid}. 가입은 '승인제': status pending → 관리자 승인 → approved + 거래코드 발급.
import { auth, db, FB_READY } from "./firebase";
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, query, where, getDocs, orderBy,
} from "firebase/firestore";

// 운영자 화이트리스트 — 항상 승인됨
const BUILTIN = {
  "dudguq@gmail.com": { company: "착한거래 관리자", role: "admin", code: "", status: "approved" },
  "test@test.com":    { company: "테스트렌터카", role: "member", code: "100002", status: "approved" },
};

// 거래코드 발급 — 6자리 숫자
function genCode() {
  let r = "";
  for (let i = 0; i < 6; i++) r += Math.floor(Math.random() * 10);
  return r;
}

const MOCK_PW = { "dudguq@gmail.com": "1234", "test@test.com": "000000" };
export const TEST_LOGIN = { email: "test@test.com", pw: "000000" };

const ACCT_KEY = "rs_accounts";
const SESSION_KEY = "rs_session";

function loadAccounts() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ACCT_KEY) || "{}"); } catch { return {}; }
}
function saveAccounts(a) { localStorage.setItem(ACCT_KEY, JSON.stringify(a)); }
function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); return s; }

async function resolveProfile(uid, email) {
  try {
    const snap = await getDoc(doc(db, "members", uid));
    if (snap.exists()) { const d = snap.data(); return { company: d.company, role: d.role || "member", code: d.code || "", status: d.status || "approved" }; }
  } catch { /* 기본값 */ }
  return BUILTIN[email] || { company: email.split("@")[0], role: "member", code: "", status: "approved" };
}

export async function login(email, pw) {
  const e = (email || "").trim().toLowerCase();
  if (FB_READY) {
    try {
      const cred = await signInWithEmailAndPassword(auth, e, pw);
      const p = await resolveProfile(cred.user.uid, e);
      return setSession({ uid: cred.user.uid, email: e, company: p.company, role: p.role, code: p.code, status: p.status });
    } catch {
      return null;
    }
  }
  // 데모(mock)
  const acc = loadAccounts()[e];
  if (acc && acc.pw === pw) return setSession({ email: e, company: acc.company, role: acc.role || "member", code: acc.code || "", status: acc.status || "approved" });
  if (MOCK_PW[e] && MOCK_PW[e] === pw) { const b = BUILTIN[e]; return setSession({ email: e, company: b.company, role: b.role, code: b.code, status: b.status }); }
  return null;
}

// 회원사 가입(승인제) — 사업자등록증 + 대표자 신분증 첨부, status: pending
export async function signup({ company, email, pw, bizImage, ceoIdImage, service = "", bizNo = "", ceo = "", industry = "" }) {
  const e = (email || "").trim().toLowerCase();
  if (!company?.trim() || !e || !pw) return { error: "회사명·이메일·비밀번호를 입력해 주세요." };
  if (!bizImage) return { error: "사업자등록증을 첨부해 주세요." };
  if (!ceoIdImage) return { error: "대표자 신분증을 첨부해 주세요." };
  const profile = {
    company: company.trim(), email: e, role: "member", code: "", service: service.trim(),
    bizNo, ceo, industry, status: "pending", bizImage, ceoIdImage,
  };
  if (FB_READY) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, e, pw);
      await setDoc(doc(db, "members", cred.user.uid), { ...profile, createdAt: serverTimestamp() });
      await signOut(auth).catch(() => {}); // 승인 전이라 로그인 상태로 두지 않음
      return { pending: true };
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") return { error: "이미 가입된 이메일입니다." };
      if (code === "auth/weak-password") return { error: "비밀번호는 6자 이상이어야 합니다." };
      if (code === "auth/invalid-email") return { error: "이메일 형식이 올바르지 않습니다." };
      return { error: "가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
    }
  }
  // 데모(mock)
  const acc = loadAccounts();
  if (acc[e] || BUILTIN[e]) return { error: "이미 가입된 이메일입니다." };
  acc[e] = { pw, ...profile, createdAt: Date.now() };
  saveAccounts(acc);
  return { pending: true };
}

// ── 회원사 승인 (관리자) ──
export async function listPendingMembers() {
  if (FB_READY) {
    try {
      const snap = await getDocs(query(collection(db, "members"), where("status", "==", "pending")));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch { return []; }
  }
  const acc = loadAccounts();
  return Object.entries(acc).filter(([, v]) => (v.status || "approved") === "pending")
    .map(([email, v]) => ({ id: email, email, ...v })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function approveMember(id) {
  const code = genCode();
  if (FB_READY) { await updateDoc(doc(db, "members", id), { status: "approved", code, approvedAt: serverTimestamp() }); return code; }
  const acc = loadAccounts();
  if (acc[id]) { acc[id].status = "approved"; acc[id].code = code; saveAccounts(acc); }
  return code;
}

export async function rejectMember(id) {
  if (FB_READY) { await updateDoc(doc(db, "members", id), { status: "rejected", rejectedAt: serverTimestamp() }); return; }
  const acc = loadAccounts();
  if (acc[id]) { acc[id].status = "rejected"; saveAccounts(acc); }
}

export async function resetPassword(email) {
  const e = (email || "").trim().toLowerCase();
  if (!e) return { error: "이메일을 입력해 주세요." };
  if (!FB_READY) return { error: "데모 모드에서는 비밀번호 재설정 메일을 보낼 수 없습니다." };
  try {
    await sendPasswordResetEmail(auth, e);
    return { ok: true };
  } catch (err) {
    if (err?.code === "auth/user-not-found") return { error: "가입되지 않은 이메일입니다." };
    if (err?.code === "auth/invalid-email") return { error: "이메일 형식이 올바르지 않습니다." };
    return { error: "메일 발송 중 오류가 발생했습니다." };
  }
}

export function getSession() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

export async function logout() {
  if (FB_READY) { try { await signOut(auth); } catch { /* 무시 */ } }
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}
