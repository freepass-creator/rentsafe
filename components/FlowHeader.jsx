// 단계형/인증 화면 공용 헤더 — 네이비 c-head(착한거래 + 제목 + 부제) + 선택적 스텝바.
export default function FlowHeader({ title, sub, steps = 0, step = 0 }) {
  return (
    <>
      <div className="c-head">
        <div className="eyebrow"><span className="hl">착한</span>거래</div>
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
