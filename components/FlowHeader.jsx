// 단계형/인증 화면 공용 헤더 — 네이비 c-head(BI 로고 + 착한거래 + 제목 + 부제) + 선택적 스텝바.
import BrandMark from "@/components/BrandMark";

export default function FlowHeader({ title, sub, steps = 0, step = 0 }) {
  return (
    <>
      <div className="c-head">
        <a href="/" className="fh-brand" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none", color: "inherit", cursor: "pointer", marginBottom: 13 }}>
          <BrandMark size={16} className="brand-mark" />
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.3px" }}><span style={{ color: "#4fd6a8" }}>착한</span>거래</span>
        </a>
        <h1>{title}</h1>
        {sub && <div className="co">{sub}</div>}
      </div>
      {steps > 0 && (
        <div className="steps">
          {Array.from({ length: steps }).map((_, i) => <div key={i} className={`s ${step >= i + 1 ? "on" : ""}`} />)}
        </div>
      )}
    </>
  );
}
