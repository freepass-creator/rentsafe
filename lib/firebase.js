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

// config(apiKey+projectId)가 완전할 때만 초기화. 어떤 상황(env 미설정/부분설정)에서도
// 빌드(SSG)가 죽지 않도록 try/catch로 방탄 — 실패 시 db/auth=null → 데모(localStorage)로 동작.
let app = null, db = null, auth = null;
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (e) {
  app = null; db = null; auth = null;
}

// DEMO_MODE 동안은 Firebase 미사용(localStorage/mock). 초기화 실패 시에도 자동 폴백.
export const FB_READY = !!app && !DEMO_MODE;
export { db, auth };
export default app;
