"use client";

import { useRef, useState, useEffect } from "react";
import { saveHistory } from "@/lib/history";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  House,
  Images,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { renderMarkdownText } from "@/lib/render-markdown";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Status = "idle" | "loading" | "success" | "error";

interface ImageItem {
  file: File;
  preview: string; // object URL
}

interface DefectResult {
  isException: boolean;
  exceptionMessage?: string;
  messageTemplate?: string;
  estimateSummary?: string;
  estimateNote?: string;
}

const HONEY_TIPS = [
  "화장실 변기 물을 내리면서 세면대 물을 틀어보세요! 수압 체크는 필수입니다.",
  "벽을 두드려보세요. 텅 빈 소리가 나면 방음이 취약할 수 있어요.",
  "창문을 열고 닫아보세요. 잠금장치가 헐겁거나 틈새 바람이 들어오면 단열 문제가 생길 수 있어요.",
  "북향 방은 햇빛이 잘 들지 않아 곰팡이가 생기기 쉬워요. 입주 전 꼭 확인하세요!",
  "계약 전 관리비 고지서를 직접 보여달라고 요청하세요. 숨겨진 비용이 있을 수 있어요.",
  "입주 당일 하자 부위를 사진으로 찍어두세요. 퇴실 시 원상복구 분쟁을 막을 수 있어요.",
];

export default function DefectPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [honeyTip, setHoneyTip] = useState<string>("");

  useEffect(() => {
    setHoneyTip(HONEY_TIPS[Math.floor(Math.random() * HONEY_TIPS.length)]);
  }, []);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DefectResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);
  const [roomName, setRoomName] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newItems: ImageItem[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newItems]);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  }

  function handleReset() {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setCopied(false);
    setRoomName("");
  }

  async function handleAnalyze() {
    if (!images.length) return;
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    setCopied(false);

    try {
      const base64List = await Promise.all(images.map((img) => fileToBase64(img.file)));
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: base64List, type: "defect" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "알 수 없는 오류가 발생했습니다.");
      const parsed = data.result as DefectResult;
      setResult(parsed);
      setStatus("success");
      if (!parsed.isException && parsed.messageTemplate) {
        saveHistory({
          type: "defect",
          roomName: roomName.trim() || "이름 없는 방",
          summary: parsed.messageTemplate.slice(0, 60) + (parsed.messageTemplate.length > 60 ? "…" : ""),
          detail: [
            parsed.messageTemplate,
            parsed.estimateSummary ? `\n💰 ${parsed.estimateSummary}` : "",
            parsed.estimateNote ? `\n${parsed.estimateNote}` : "",
          ].join(""),
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setStatus("error");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result?.messageTemplate ?? "");
      setCopied(true);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("복사에 실패했습니다. 직접 텍스트를 선택해 복사해주세요.");
    }
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const hasImages = images.length > 0;

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="flex w-full max-w-md min-h-screen flex-col px-6 py-8">

        {/* 상단 네비게이션 */}
        <header className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">방 하자 분석</h1>
            <p className="text-xs text-slate-400">사진으로 하자를 확인해요</p>
          </div>
          <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
            <House className="h-4 w-4 text-blue-600" />
          </div>
        </header>

        <section className="flex-1 flex flex-col gap-5">
          {/* 카메라 input: 후면 카메라 1장 */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* 갤러리 input: 다중 선택 */}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 업로드 영역 */}
          {!hasImages ? (
            /* 사진 없을 때: 2버튼 업로드 UI */
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 카메라 버튼 */}
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60 hover:bg-blue-50 hover:border-blue-400 transition-colors py-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                    <Camera className="h-7 w-7 text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">카메라로 찍기</p>
                    <p className="text-xs text-slate-400 mt-0.5">한 장씩 찍어 추가할 수 있어요</p>
                  </div>
                </button>
                {/* 갤러리 버튼 */}
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60 hover:bg-blue-50 hover:border-blue-400 transition-colors py-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                    <Images className="h-7 w-7 text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">앨범에서 고르기</p>
                    <p className="text-xs text-slate-400 mt-0.5">여러 장 동시 선택 가능</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* 사진 있을 때: 썸네일 그리드 */
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <Image src={img.preview} alt={`사진 ${idx + 1}`} fill className="object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ))}
                {/* 추가 버튼 */}
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 hover:bg-blue-50 hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <Plus className="h-5 w-5 text-blue-500" />
                  <span className="text-xs text-blue-500 font-medium">추가</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 text-right">{images.length}장 선택됨</p>
            </div>
          )}

          {/* 안내 팁 (사진 없을 때만) */}
          {!hasImages && (
            <ul className="flex flex-col gap-2 rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
              {[
                "벽면, 천장, 바닥 등 하자 부위를 가까이 찍어주세요",
                "여러 부위를 각각 찍어 한 번에 올리면 종합 분석이 가능해요",
                "밝은 환경에서 선명하게 촬영할수록 정확도가 높아요",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {/* 꿀팁 말풍선 (사진 없을 때만) */}
          {!hasImages && honeyTip && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex w-full items-end gap-3">
                {/* 캐릭터 이모지 */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl shadow-sm">
                  🐱
                </div>
                {/* 말풍선 */}
                <div className="relative flex-1 rounded-2xl rounded-bl-none bg-blue-50 border border-blue-100 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-blue-500 mb-1">자취 꿀팁 💡</p>
                  <p className="text-sm leading-relaxed text-slate-600">{honeyTip}</p>
                  {/* 말풍선 꼬리 (왼쪽 하단) */}
                  <span className="absolute -bottom-2 left-0 h-0 w-0 border-r-8 border-t-8 border-r-transparent border-t-blue-50" />
                  <span className="absolute -bottom-[9px] left-0 h-0 w-0 border-r-8 border-t-8 border-r-transparent border-t-blue-100" style={{ zIndex: -1 }} />
                </div>
              </div>
            </div>
          )}

          {/* 분석 결과 카드 */}
          {isSuccess && result && (
            <div className="flex flex-col gap-3">
              {/* 헤더 */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm font-semibold text-blue-700">AI 분석 결과</span>
                <span className="ml-auto text-xs text-slate-400">{images.length}장 종합 분석</span>
              </div>

              {/* 예외 메시지 */}
              {result.isException && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-4">
                  <p className="text-sm leading-relaxed text-amber-800">
                    {result.exceptionMessage}
                  </p>
                </div>
              )}

              {/* 정상 분석 결과 */}
              {!result.isException && (
                <div className="flex flex-col gap-5">
                  {/* 문자 템플릿 영역 */}
                  <div className="rounded-2xl bg-white border border-blue-100 shadow-sm overflow-hidden">
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-xs font-semibold text-blue-500">💬 집주인 전송용 문자</p>
                    </div>
                    <div className="mx-4 mb-3 rounded-xl bg-blue-50 px-4 py-3">
                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                        {renderMarkdownText(result.messageTemplate ?? "")}
                      </p>
                    </div>
                    <div className="flex justify-end px-4 pb-3">
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          copied
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        {copied ? (
                          <><Check className="h-3.5 w-3.5" />복사됨</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" />내용 복사</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 예상 견적 영역 */}
                  <div className="rounded-2xl bg-white border border-gray-200 px-4 py-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">💰 평균 수리 견적</p>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {result.estimateSummary}
                    </p>
                    {result.estimateNote && (
                      <p className="mt-2 text-xs text-slate-400">{result.estimateNote}</p>
                    )}
                  </div>

                  {/* 외부 링크 버튼 */}
                  <a
                    href="https://map.naver.com/p/search/주변%20인테리어%20수리"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200 active:scale-[0.98]"
                  >
                    🛠️ 내 주변 인테리어 수리 업체 찾기 (네이버 지도)
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 에러 카드 */}
          {status === "error" && errorMsg && (
            <div className="rounded-2xl bg-red-50 border border-red-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-100">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm font-semibold text-red-600">오류가 발생했습니다</span>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-red-500">{errorMsg}</p>
              </div>
            </div>
          )}
        </section>

        {/* 방 이름 입력 (분석 전에만 표시) */}
        {!isSuccess && (
          <div className="mt-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="방 이름을 적어주세요 (예: 신림동 201호, 햇빛 투룸)"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="mt-3 pb-4">
          {isSuccess ? (
            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            >
              <RefreshCw className="h-5 w-5" />
              다른 사진 분석하기
            </button>
          ) : (
            <>
              <button
                onClick={handleAnalyze}
                disabled={!hasImages || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />AI가 열심히 분석 중이에요...</>
                ) : (
                  <><Sparkles className="h-5 w-5" />AI 분석 시작하기</>
                )}
              </button>
              {!hasImages && !isLoading && (
                <p className="mt-2 text-center text-xs text-slate-400">
                  사진을 업로드하면 버튼이 활성화돼요
                </p>
              )}
            </>
          )}
        </div>
      </main>

      {/* 토스트 알림 */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-xl transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Check className="h-4 w-4 text-blue-400" />
        클립보드에 복사되었습니다!
      </div>
    </div>
  );
}
