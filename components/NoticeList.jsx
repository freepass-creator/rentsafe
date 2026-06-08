// 안내 항목 리스트 — 메인(title) + 설명(body) 분리. 동의/상태 안내 공용.
export default function NoticeList({ items }) {
  return (
    <div className="notice">
      {items.map((n, i) => (
        <div className={`ni ${n.safe ? "safe" : ""}`} key={i}>
          <div className="n">{i + 1}</div>
          <div className="ni-tx">
            <div className="ni-t">{n.title}</div>
            <div className="ni-d">{n.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
