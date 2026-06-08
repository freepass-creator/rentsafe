// 인증 — Firebase Auth(설정 시) + localStorage mock 폴백
// 회사명·역할 등 회원 프로필은 Firestore members/{uid} 에 저장.
import { auth, db, FB_READY } from "./firebase";
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// 역할/회사 기본값 — Firestore 프로필이 없을 때 사용 (운영자 화이트리스트 포함)
const BUILTIN = {
  "dudguq@gmail.com": { company: "스피드렌터카", role: "member", code: "100001" },
  "test@test.com":    { company: "테스트렌터카", role: "member", code: "100002" },
  "admin@chakan.kr":  { company: "착한거래 운영팀", role: "admin", code: "" },
};

// 거래코드 발급 (가입 시) — 6자리 숫자
function genCode() {
  let r = "";
  for (let i = 0; i < 6; i++) r += Math.floor(Math.random() * 10);
  return r;
}

// mock 전용 비밀번호 (Firebase 미설정 데모 모드에서만 사용)
const MOCK_PW = { "dudguq@gmail.com": "1234", "test@test.com": "000000", "admin@chakan.kr": "1234" };

export const TEST_LOGIN = { email: "test@test.com", pw: "000000" };

const ACCT_KEY = "rs_accounts";   // mock 가입 계정
const SESSION_KEY = "rs_session"; // 로그인 세션

function loadAccounts() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ACCT_KEY) || "{}"); } catch { return {}; }
}
function saveAccounts(a) { localStorage.setItem(ACCT_KEY, JSON.stringify(a)); }
function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); return s; }

// Firestore에서 회원 프로필 조회 → 없으면 BUILTIN/기본값
async function resolveProfile(uid, email) {
  try {
    const snap = await getDoc(doc(db, "members", uid));
    if (snap.exists()) { const d = snap.data(); return { company: d.company, role: d.role || "member", code: d.code || "" }; }
  } catch { /* 무시하고 기본값 */ }
  return BUILTIN[email] || { company: email.split("@")[0], role: "member", code: "" };
}

export async function login(email, pw) {
  const e = (email || "").trim().toLowerCase();
  if (FB_READY) {
    try {
      const cred = await signInWithEmailAndPassword(auth, e, pw);
      const p = await resolveProfile(cred.user.uid, e);
      return setSession({ uid: cred.user.uid, email: e, company: p.company, role: p.role, code: p.code });
    } catch {
      return null; // Firebase 사용 시 실제 인증 실패는 그대로 실패 처리
    }
  }
  // 데모(mock) 모드
  const acc = loadAccounts()[e];
  if (acc && acc.pw === pw) return setSession({ email: e, company: acc.company, role: acc.role || "member", code: acc.code || "" });
  if (MOCK_PW[e] && MOCK_PW[e] === pw) return setSession({ email: e, company: BUILTIN[e].company, role: BUILTIN[e].role, code: BUILTIN[e].code });
  return null;
}

// 계정 만들기 — 사업자등록증(bizFile) 필수
export async function signup({ company, email, pw, bizFile }) {
  const e = (email || "").trim().toLowerCase();
  if (!company?.trim() || !e || !pw || !bizFile) return { error: "모든 항목과 사업자등록증을 입력해 주세요." };
  if (FB_READY) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, e, pw);
      const code = genCode();
      await setDoc(doc(db, "members", cred.user.uid), {
        company: company.trim(), email: e, role: "member", code, bizFile, createdAt: serverTimestamp(),
      });
      return { session: setSession({ uid: cred.user.uid, email: e, company: company.trim(), role: "member", code }) };
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") return { error: "이미 가입된 이메일입니다." };
      if (code === "auth/weak-password") return { error: "비밀번호는 6자 이상이어야 합니다." };
      if (code === "auth/invalid-email") return { error: "이메일 형식이 올바르지 않습니다." };
      return { error: "가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
    }
  }
  // 데모(mock) 모드
  const acc = loadAccounts();
  if (acc[e] || BUILTIN[e]) return { error: "이미 가입된 이메일입니다." };
  const code = genCode();
  acc[e] = { pw, company: company.trim(), role: "member", code, bizFile, createdAt: Date.now() };
  saveAccounts(acc);
  return { session: setSession({ email: e, company: company.trim(), role: "member", code }) };
}

// 비밀번호 재설정 메일 발송
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
