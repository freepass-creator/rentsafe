/**
 * 신분증 OCR — Gemini 기반 (jpkerp 방식과 동일).
 *   POST /api/ocr/id  (multipart/form-data)  · file: 신분증 이미지
 *   → { ok:true, name, birth(YYMMDD), doc }   |   { ok:false, error }
 *
 * 이름·생년월일만 추출하며, 주민등록번호 뒷자리·면허번호·주소 등은 수집하지 않습니다.
 * 서버에서만 동작 · GEMINI_API_KEY 필요 · 이미지는 저장하지 않고 추출 후 폐기.
 */
import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";

const ID_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, nullable: true, description: "성명 (한글 이름)" },
    birth: { type: Type.STRING, nullable: true, description: "생년월일 6자리 YYMMDD (주민등록번호 앞 6자리)" },
    doc: { type: Type.STRING, nullable: true, description: "신분증 종류: 주민등록증 | 운전면허증 | 기타" },
  },
  required: ["name", "birth", "doc"],
};

const PROMPT = `이 이미지는 한국 신분증(주민등록증 또는 운전면허증)입니다. 아래 세 가지만 추출하세요.
- name: 성명 (한글 이름)
- birth: 생년월일 6자리 (YYMMDD) — 주민등록번호 앞 6자리
- doc: 신분증 종류 ("주민등록증" / "운전면허증" / "기타")

⚠️ 주민등록번호 뒷자리, 면허번호, 발급일자, 주소 등 그 외 정보는 절대 추출하거나 반환하지 마세요.
신분증이 아니거나 글자를 읽을 수 없으면 모든 값을 null 로 반환하세요.`;

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: "GEMINI_API_KEY 미설정" }, { status: 500 });

  let file;
  try {
    const fd = await req.formData();
    file = fd.get("file");
  } catch {
    return NextResponse.json({ ok: false, error: "FormData 파싱 실패" }, { status: 400 });
  }
  if (!file || typeof file === "string") return NextResponse.json({ ok: false, error: "file 누락" }, { status: 400 });
  if (file.size > 12 * 1024 * 1024) return NextResponse.json({ ok: false, error: "파일은 12MB 이하" }, { status: 413 });

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const mime = file.type || "image/jpeg";
  const ai = new GoogleGenAI({ apiKey });

  async function call() {
    let lastErr;
    for (let i = 0; i < 3; i++) {
      try {
        return await ai.models.generateContent({
          model: MODEL,
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: PROMPT }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: ID_SCHEMA,
            temperature: 0,
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 512,
          },
        });
      } catch (err) {
        lastErr = err;
        const m = err?.message || "";
        const retry = m.includes("503") || m.includes("429") || m.includes("UNAVAILABLE") || m.includes("RESOURCE_EXHAUSTED");
        if (!retry || i === 2) throw err;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** i + Math.random() * 500));
      }
    }
    throw lastErr;
  }

  try {
    const res = await call();
    const text = res.text;
    if (!text) return NextResponse.json({ ok: false, error: "Gemini 응답 없음" }, { status: 502 });
    const parsed = JSON.parse(text);
    const birth = String(parsed.birth || "").replace(/\D/g, "").slice(0, 6);
    return NextResponse.json({ ok: true, name: parsed.name || "", birth, doc: parsed.doc || "" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: `OCR 실패: ${err?.message || err}` }, { status: 500 });
  }
}
