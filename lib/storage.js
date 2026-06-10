// 이미지(dataURL) → Firebase Storage 업로드 후 download URL 반환.
// Storage 미설정(데모/키 없음)이면 dataURL을 그대로 반환(자동 폴백) — 호출부는 항상 문자열을 얻음.
import { storage } from "./firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export async function putImage(path, dataUrl) {
  if (!dataUrl) return "";
  if (!storage) return dataUrl;
  try {
    const r = ref(storage, path);
    await uploadString(r, dataUrl, "data_url");
    return await getDownloadURL(r);
  } catch (e) {
    console.error("Storage 업로드 실패 — dataURL 폴백", e);
    return dataUrl;
  }
}
