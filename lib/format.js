// 공용 포맷/표시 유틸 — 모든 화면이 여기서 가져다 씀 (중복 제거)

/** 생년월일 → 숫자 6자리만 */
export function cleanBirth(b) {
  return (b || "").replace(/\D/g, "").slice(0, 6);
}

/** 6자리 생년월일 → 90.07.15 (표시용) */
export function fmtBirth(b) {
  const d = cleanBirth(b);
  return d.length === 6 ? `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4, 6)}` : (b || "-");
}

/** 6자리(YYMMDD) → 1990.07.15 (전체 표기, 2000년대 기본 처리) */
export function fmtBirthFull(b) {
  const d = cleanBirth(b);
  if (d.length !== 6) return b || "-";
  const yy = Number(d.slice(0, 2));
  const century = yy <= 25 ? "20" : "19"; // 단순 추정(데모용)
  return `${century}${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4, 6)}`;
}

/** 이름 마스킹 — 홍길동 → 홍○동 */
export function mask(n) {
  if (!n) return "";
  if (n.length <= 1) return n;
  if (n.length === 2) return n[0] + "○";
  return n[0] + "○".repeat(n.length - 2) + n.slice(-1);
}

/** 휴대폰 마스킹 — 010-1234-5678 → 010-****-5678 */
export function maskPhone(p) {
  if (!p) return "-";
  const d = p.replace(/\D/g, "");
  return d.length >= 10 ? `${d.slice(0, 3)}-****-${d.slice(-4)}` : p;
}

/** 휴대폰 자동 하이픈 (입력값 → 형식 문자열) */
export function hyphenPhone(v) {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  return d.length < 4 ? d
    : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}`
    : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 날짜 표시 — Date|ms|ISO → 2026.06.08 */
export function fmtDate(v) {
  if (!v) return "-";
  const d = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
  if (isNaN(d)) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 날짜+시각 표시 */
export function fmtDateTime(v) {
  if (!v) return "-";
  const d = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
  if (isNaN(d)) return "-";
  return `${fmtDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
