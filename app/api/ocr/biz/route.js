/**
 * 사업자등록증 OCR — Gemini 기반 (회원사 가입 자동입력용).
 *   POST /api/ocr/biz  (multipart/form-data)  · file: 사업자등록증 이미지/PDF
 *   → { ok:true, company, bizNo, ceo, industry }   |   { ok:false, error }
 * 서버 전용 · GEMINI_API_KEY 필요 · 이미지는 추출 후 폐기(미저장).
 */
import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    company: { type: Type.STRING, nullable: true, description: "상호 / 법인명" },
    bizNo: { type: Type.STRING, nullable: true, description: "사업자등록번호 XXX-XX-XXXXX" },
    ceo: { type: Type.STRING, nullable: true, description: "대표자 성명(한글)" },
    industry: { type: Type.STRING, nullable: true, description: "업태/종목 (여러 개면 콤마)" },
  },
  required: ["company", "bizNo", "ceo", "industry"],
};

const PROMPT = `이 이미지는 한국 사업자등록증입니다. 아래만 추출하세요.
- company: 상호(법인명). 괄호 안 영문은 제외 (예: "스피드렌터카 주식회사 (Speed Co.,Ltd)" → "스피드렌터카 주식회사").
- bizNo: 사업자등록번호 (XXX-XX-XXXXX 형식).
- ceo: 대표자 성명 (한글 이름만).
- industry: 업태/종목 (여러 개면 콤마로 연결).
값이 없으면 null.`;

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: "GEMINI_API_KEY 미설정" }, { status: 500 });

  let file;
  try { file = (await req.formData()).get("file"); }
  catch { return NextResponse.json({ ok: false, error: "FormData 파싱 실패" }, { status: 400 }); }
  if (!file || typeof file === "string") return NextResponse.json({ ok: false, error: "file 누락" }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ ok: false, error: "파일은 15MB 이하" }, { status: 413 });

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
          config: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 512 },
        });
      } catch (err) {
        lastErr = err;
        const m = err?.message || "";
        if (i === 2 || !(m.includes("503") || m.includes("429") || m.includes("UNAVAILABLE") || m.includes("RESOURCE_EXHAUSTED"))) throw err;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** i + Math.random() * 500));
      }
    }
    throw lastErr;
  }

  try {
    const res = await call();
    const text = res.text;
    if (!text) return NextResponse.json({ ok: false, error: "Gemini 응답 없음" }, { status: 502 });
    const p = JSON.parse(text);
    return NextResponse.json({ ok: true, company: p.company || "", bizNo: p.bizNo || "", ceo: p.ceo || "", industry: p.industry || "" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: `OCR 실패: ${err?.message || err}` }, { status: 500 });
  }
}
