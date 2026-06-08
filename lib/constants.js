// 공용 상수/문구 — 한 곳에서 관리 (규격 통일)

export const RISK_TYPES = {
  unpaid:        "대여료 장기 미납",
  not_returned:  "차량 미반납",
  accident:      "사고비용 미정산",
  unauthorized:  "무단 제3자 운행",
  disposal:      "차량 임의처분/담보 의심",
};

export const CARRIERS = ["SKT", "KT", "LG U+", "알뜰폰"];

export const CONSENT_VERSION = "v1.0";

// 거래안전 동의 문구 (정식)
export const CONSENT_STATEMENT =
  "본인은 렌터카 안전거래 플랫폼 가입 및 본 플랫폼을 통한 대여료 결제·정산 서비스 이용에 동의합니다. " +
  "정상 이행 시 거래위험정보는 등록되지 않으며, 대여료 미납·차량 미반납 등 거래상 문제 발생 시 " +
  "본인의 거래정보가 암호화되어 본 플랫폼 가맹 자동차대여사업자에게 제공되어 신규 계약 판단 시 확인될 수 있음에 동의합니다. " +
  "문제 해소 시 해당 정보는 지체 없이 삭제·상태변경됩니다.";

// 동의 안내 4항목
export const CONSENT_NOTICES = [
  { safe: true,  title: "정상 이용 시 등록되지 않습니다.", body: "정상 납부·반환 시 거래위험정보는 남지 않아요." },
  { safe: false, title: "중대한 계약위반 시에만 등록됩니다.", body: "대여료 미납·차량 미반납 등." },
  { safe: false, title: "가맹사가 제한적으로 확인합니다.", body: "신규 계약 판단 목적의 등록 여부 확인만." },
  { safe: true,  title: "해소 시 삭제됩니다.", body: "정산·반환 완료 시 지체 없이 삭제·변경." },
];

// 고객센터 (본인 폰 없는 손님용)
export const SUPPORT = { tel: "1600-0000", email: "help@rentsafe.kr" };
