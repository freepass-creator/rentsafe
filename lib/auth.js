// 데모용 mock 인증 — 실제로는 Firebase Auth + 사업자등록증 심사로 교체
// 이메일 기반 로그인 + 계정 만들기(사업자등록증 필수).

const BUILTIN = {
  "dudguq@gmail.com": { pw: "1234", company: "스피드렌터카", role: "member" },
  "test@test.com":    { pw: "1234", company: "테스트렌터카", role: "member" },
  "admin@chakan.kr":  { pw: "1234", company: "착한거래 운영팀", role: "admin" },
};

export const TEST_LOGIN = { email: "test@test.com", pw: "1234" };

const ACCT_KEY = "rs_accounts";   // 가입 계정
const SESSION_KEY = "rs_session"; // 로그인 세션

function loadAccounts() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ACCT_KEY) || "{}"); } catch { return {}; }
}
function saveAccounts(a) { localStorage.setItem(ACCT_KEY, JSON.stringify(a)); }

export function login(email, pw) {
  const e = (email || "").trim().toLowerCase();
  const a = loadAccounts()[e] || BUILTIN[e];
  if (a && a.pw === pw) {
    const s = { email: e, company: a.company, role: a.role || "member" };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  }
  return null;
}

// 계정 만들기 — 사업자등록증(bizFile) 필수
export function signup({ company, email, pw, bizFile }) {
  const e = (email || "").trim().toLowerCase();
  if (!company?.trim() || !e || !pw || !bizFile) return { error: "모든 항목과 사업자등록증을 입력해 주세요." };
  if (BUILTIN[e] || loadAccounts()[e]) return { error: "이미 가입된 이메일입니다." };
  const acc = loadAccounts();
  acc[e] = { pw, company: company.trim(), role: "member", bizFile, createdAt: Date.now() };
  saveAccounts(acc);
  const s = { email: e, company: company.trim(), role: "member" };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return { session: s };
}

export function getSession() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

export function logout() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}
