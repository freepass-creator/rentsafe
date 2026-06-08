// Firebase 초기화 — 환경변수(.env.local / Vercel)에서 설정을 읽습니다.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { DEMO_MODE } from "./constants";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
};

// DEMO_MODE 동안은 Firebase 미사용(localStorage/mock) — 실서비스 시 DEMO_MODE=false
export const FB_READY = !!firebaseConfig.projectId && !DEMO_MODE;

// config(projectId)가 있을 때만 초기화 — 없으면(예: Vercel에 env 미설정 + 데모모드) 건너뜀.
// 이래야 빌드(SSG) 중 getAuth/getFirestore가 빈 config로 던지지 않음.
const app = firebaseConfig.projectId ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export default app;
