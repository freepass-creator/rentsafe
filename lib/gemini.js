// 서버 전용 Gemini 이미지 추출 공통 헬퍼 (OCR 라우트 공용)
// file(FormData File) + JSON 스키마 + 프롬프트 → 파싱된 객체. 실패 시 status 붙은 Error throw.
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

function fail(message, status) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export async function extractFromImage({ file, schema, prompt, maxBytes = 12 * 1024 * 1024 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw fail("GEMINI_API_KEY 미설정", 500);
  if (!file || typeof file === "string") throw fail("file 누락", 400);
  if (file.size > maxBytes) throw fail(`파일은 ${Math.round(maxBytes / 1024 / 1024)}MB 이하`, 413);

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const mime = file.type || "image/jpeg";
  const ai = new GoogleGenAI({ apiKey });

  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: prompt }] }],
        config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 512 },
      });
      if (!res.text) throw fail("Gemini 응답 없음", 502);
      return JSON.parse(res.text);
    } catch (err) {
      lastErr = err;
      const m = err?.message || "";
      const retry = m.includes("503") || m.includes("429") || m.includes("UNAVAILABLE") || m.includes("RESOURCE_EXHAUSTED");
      if (i === 2 || !retry) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i + Math.random() * 500));
    }
  }
  throw lastErr;
}
