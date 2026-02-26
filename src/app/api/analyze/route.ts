import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFECT_PROMPT = `[절대 규칙: 이미지 판별 및 강제 종료]
첨부된 모든 이미지를 먼저 살펴보고, 각 이미지가 '방 내부의 물리적 하자(벽지, 바닥, 곰팡이, 누수, 파손 등)'를 보여주는 사진인지 판별하라.

CASE 1: 첨부된 이미지 중 방의 하자와 관련 없는 사진이 포함된 경우 (예: 로고, 인물, 풍경, 동물, 일반 사물, 텍스트 캡처 등)
- 반드시 아래의 JSON 형식으로만 응답해라. 다른 텍스트는 절대 포함하지 마.
{
  "isException": true,
  "exceptionMessage": "제공해주신 이미지는 [사진 요약]로 보입니다. 하자를 파악할 수 없으니, 방 내부의 사진을 다시 업로드해 주세요."
}

CASE 2: 첨부된 모든 이미지가 정상적인 방 하자 사진인 경우
- 첨부된 여러 장의 사진을 종합적으로 분석해라.
- 반드시 아래의 JSON 형식으로만 응답해라. 다른 텍스트는 절대 포함하지 마.
{
  "isException": false,
  "messageTemplate": "반드시 '안녕하세요 집주인님, [방 호수]호 세입자입니다.'라는 인사말로 시작하고, 발견된 모든 하자를 포함하여 집주인에게 보수 요청하는 문자를 정중한 톤으로 3줄 이내로 작성",
  "estimateSummary": "발견된 하자 종류에 따른 대략적인 시장 평균 수리 견적 한 줄 (예: 도배 부분 보수 10~20만 원 내외, 누수 처리 20~50만 원 내외)",
  "estimateNote": "※ 위 견적은 참고용이며, 실제 수리비는 환경에 따라 다를 수 있습니다."
}`;

const REGISTER_PROMPT = `가장 먼저, 첨부된 모든 사진이 문서, 특히 '등기사항전부증명서(등기부등본)'의 일부인지 판단해라.

1. 만약 문서가 아니거나, 등기부등본과 전혀 관련 없는 엉뚱한 사진(예: 인물, 풍경, 사물, 로고, 일반 영수증 등)이 포함되어 있다면, 기존의 권리 분석 및 위험도 평가 지시를 완전히 무시하고 오직 다음 형식으로만 짧게 대답해라:
'제공해주신 이미지는 [사진에 대한 짧은 설명]로 보입니다. 정확한 권리 관계 및 위험 요소 분석을 위해 등기부등본(갑구 또는 을구) 사진을 다시 업로드해 주세요.'

2. 첨부된 모든 사진이 정상적인 등기부등본(또는 관련 부동산 서류) 사진일 경우에만, 아래 지시사항대로 분석을 진행하라.
- 여러 장의 사진(갑구, 을구 등 여러 페이지)을 종합적으로 연결하여 하나의 위험도 평가를 내려라.
- 반드시 아래 6가지 항목 각각의 존재 여부와 위험 상태를 확인하라:
  1. 근저당/담보권 (을구): 보증금보다 먼저 갚아야 할 빚이 있는지
  2. 소유권 안전성 (갑구): 최근 소유권 변동이 비정상적으로 잦은지
  3. 압류/가압류 (갑구): 세금 체납 등으로 집이 압류된 상태인지 — 발견 시 반드시 "danger" 처리
  4. 신탁등기 (갑구): 소유권이 신탁사에 넘어가 있는지
  5. 가등기/가처분 (갑구/을구): 소유권 분쟁 소지가 있는지
  6. 임차권 등기 (을구): 과거 세입자가 보증금을 돌려받지 못한 이력이 있는지 — 발견 시 반드시 "danger" 처리
- 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마.

{
  "riskScore": 0~100 사이 정수 (위험할수록 높음. 압류/가압류 또는 임차권 등기 발견 시 최소 80점 이상),
  "summary": "초보 자취생 눈높이에서 이 등기부등본을 3줄 이내로 요약",
  "checkpoints": [
    {
      "label": "근저당/담보권",
      "status": "safe" | "warning" | "danger",
      "detail": "한 줄 설명 (근저당 금액과 보증금 대비 위험 여부 포함)"
    },
    {
      "label": "소유권 안전성",
      "status": "safe" | "warning" | "danger",
      "detail": "한 줄 설명 (최근 소유권 변동 횟수 및 이상 여부)"
    },
    {
      "label": "압류/가압류",
      "status": "safe" | "warning" | "danger",
      "detail": "한 줄 설명 (발견 시 즉시 계약 중단 권고 문구 포함)"
    },
    {
      "label": "신탁등기",
      "status": "safe" | "warning" | "danger",
      "detail": "한 줄 설명 (신탁사 동의 없이 계약 불가 여부)"
    },
    {
      "label": "가등기/가처분",
      "status": "safe" | "warning" | "danger",
      "detail": "한 줄 설명 (소유권 분쟁 가능성)"
    },
    {
      "label": "임차권 등기",
      "status": "safe" | "warning" | "danger",
      "detail": "한 줄 설명 (발견 시 이전 세입자 보증금 미반환 이력 경고 포함)"
    }
  ]
}`;

type MimeType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function parseBase64Image(dataUrl: string): { mimeType: MimeType; data: string } | null {
  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) return null;
  return {
    mimeType: matches[1] as MimeType,
    data: matches[2],
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

  let body: { images: string[]; type: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { images, type } = body;

  if (!images || !Array.isArray(images) || images.length === 0 || !type) {
    return NextResponse.json({ error: "images 배열과 type은 필수 항목입니다." }, { status: 400 });
  }

  if (type !== "defect" && type !== "register") {
    return NextResponse.json({ error: "유효하지 않은 분석 타입입니다." }, { status: 400 });
  }

  // 모든 이미지 파싱
  const parsedImages = images.map(parseBase64Image);
  if (parsedImages.some((p) => p === null)) {
    return NextResponse.json({ error: "이미지 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const prompt = type === "defect" ? DEFECT_PROMPT : REGISTER_PROMPT;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 이미지 파트 배열 + 프롬프트 텍스트
    const contentParts = [
      ...parsedImages.map((p) => ({ inlineData: { mimeType: p!.mimeType, data: p!.data } })),
      prompt,
    ];

    const geminiResult = await model.generateContent(contentParts);
    const text = geminiResult.response.text();

    if (type === "register") {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({
          result: { riskScore: null, summary: text.trim(), checkpoints: [] },
        });
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ result: parsed });
    }

    // defect: JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ result: { isException: true, exceptionMessage: text.trim() } });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ result: parsed });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gemini API 호출 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
