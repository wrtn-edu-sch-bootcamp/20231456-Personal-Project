import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPTS: Record<string, string> = {
  defect:
    "이 사진은 원룸 방 사진이야. 1) 어떤 하자가 있는지 파악하고, 2) 집주인에게 문자로 어떻게 보수 요청을 해야 하는지 정중한 톤으로 3줄 이내로 작성해 줘.",
  register:
    "이 사진은 부동산 등기부등본이야. 1) 근저당권(빚) 등 위험 요소가 있는지 찾고, 2) 이 집을 계약해도 안전한지 초보자 자취생 눈높이에서 3줄 이내로 명확히 설명해 줘.",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let body: { image: string; type: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { image, type } = body;

  if (!image || !type) {
    return NextResponse.json(
      { error: "image와 type은 필수 항목입니다." },
      { status: 400 }
    );
  }

  const prompt = PROMPTS[type];
  if (!prompt) {
    return NextResponse.json(
      { error: "유효하지 않은 분석 타입입니다." },
      { status: 400 }
    );
  }

  // base64 데이터 URL → mimeType + 순수 base64 데이터 분리
  const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) {
    return NextResponse.json(
      { error: "이미지 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }
  const mimeType = matches[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const base64Data = matches[2];

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      prompt,
    ]);

    const text = result.response.text();
    return NextResponse.json({ result: text });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gemini API 호출 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
