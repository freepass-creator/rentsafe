# RentSafe — 렌터카 안전거래 플랫폼

렌터카 대여료 결제·정산 + 거래위험정보(미납·미반납) 확인 플랫폼.
Next.js 14 (App Router) + Firebase (Firestore) + Vercel.

> ⚠️ 본 MVP는 흐름·화면 검증용입니다. 실제 개인정보는 저장하지 않습니다.
> 규제 대응 전략은 [`규제대응전략.html`](./규제대응전략.html) 참고.

## 화면
- `/` — 가맹사 콘솔: **동의요청 발송 / 거래위험 조회 / 위험정보 등록**
- `/consent/[cid]` — 손님 동의 페이지(모바일): **본인인증(mock) → 거래안전 동의 → 완료**
- `demo/` — Firebase 없이 도는 순수 HTML 데모(시연용, 보존)

## 로컬 실행
```bash
npm install
cp .env.local.example .env.local   # Firebase 키 입력
npm run dev                        # http://localhost:3000
```

## Firebase 설정
1. console.firebase.google.com → 프로젝트 생성
2. **Firestore Database** 생성 (테스트 모드로 시작)
3. 프로젝트 설정 → 웹앱 추가 → config 값을 `.env.local`에 입력
4. (선택) `firestore.rules` 적용

## Vercel 배포
1. vercel.com → New Project → GitHub `freepass-creator/rentsafe` import
2. Environment Variables 에 `.env.local`의 `NEXT_PUBLIC_FB_*` 키 등록
3. Deploy → push마다 자동 배포

## 데이터 모델 (Firestore)
- `consents` — 동의요청: `{ name, phone, company, status, verified, createdAt, completedAt }`
- `risks` — 거래위험정보: `{ name, birth, type, license, phone, company, reason, status, createdAt }`

## 향후 (상용화)
- 실제 본인인증(본인확인기관/간편인증) + 결제(PG) 연동
- 매칭키 해시(HMAC) 처리, 원문 미보유
- 동의 증빙 보관, 감사 로그
