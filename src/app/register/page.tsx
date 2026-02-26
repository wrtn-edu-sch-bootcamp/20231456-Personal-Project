"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Camera,
  Images,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { renderMarkdownText } from "@/lib/render-markdown";
import { TooltipText, useTooltipContext } from "@/lib/tooltip-renderer";

// ── 타입 정의 ──────────────────────────────────────────────
type CheckpointStatus = "safe" | "warning" | "danger";

interface Checkpoint {
  label: string;
  status: CheckpointStatus;
  detail: string;
}

interface RegisterResult {
  riskScore: number | null;
  summary: string;
  checkpoints: Checkpoint[];
}

type Status = "idle" | "loading" | "success" | "error";

const REGISTER_HONEY_TIPS = [
  "등기부등본은 계약 직전, 그리고 잔금 치르기 직전에 최신판으로 다시 확인하세요!",
  "갑구에서는 집주인 이름이 신분증과 정확히 일치하는지 꼭 대조하세요.",
  "을구에 근저당권(빚)이 너무 많다면 깡통전세 위험이 있으니 주의하세요!",
  "계약서에 '잔금 지급일 다음 날까지 권리 상태를 유지한다'는 특약을 꼭 넣으세요.",
  "내가 계약할 방 호수가 등기부등본과 정확히 일치하는지 확인하세요!",
];

// ── 유틸 ──────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getRiskLevel(score: number): {
  label: string;
  color: string;          // 텍스트
  ring: string;           // SVG stroke
  bg: string;             // 배경 뱃지
  icon: React.ReactNode;
} {
  if (score <= 30)
    return {
      label: "안전 · 계약 진행 추천",
      color: "text-emerald-600",
      ring: "#10b981",
      bg: "bg-emerald-50 border-emerald-200",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
    };
  if (score <= 70)
    return {
      label: "주의 · 추가 확인 필요",
      color: "text-amber-600",
      ring: "#f59e0b",
      bg: "bg-amber-50 border-amber-200",
      icon: <ShieldAlert className="h-5 w-5 text-amber-500" />,
    };
  return {
    label: "위험 · 계약 재고 권장",
    color: "text-red-600",
    ring: "#ef4444",
    bg: "bg-red-50 border-red-200",
    icon: <ShieldX className="h-5 w-5 text-red-500" />,
  };
}

const CHECKPOINT_STYLE: Record<CheckpointStatus, { badge: string; dot: string }> = {
  safe:    { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  warning: { badge: "bg-amber-100 text-amber-700",    dot: "bg-amber-400" },
  danger:  { badge: "bg-red-100 text-red-600",        dot: "bg-red-400" },
};
const CHECKPOINT_LABEL: Record<CheckpointStatus, string> = {
  safe: "안전", warning: "주의", danger: "위험",
};

// ── 원형 프로그레스 바 ────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const level = getRiskLevel(score);
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: 148, height: 148 }}>
        {/* 배경 트랙 */}
        <svg width="148" height="148" className="absolute rotate-[-90deg]">
          <circle cx="74" cy="74" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="74" cy="74" r={r}
            fill="none"
            stroke={level.ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        {/* 중앙 점수 */}
        <div className="flex flex-col items-center">
          <span className={`text-4xl font-extrabold leading-none ${level.color}`}>{score}</span>
          <span className="text-xs text-slate-400 mt-0.5">/ 100</span>
        </div>
      </div>
      {/* 등급 뱃지 */}
      <div className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${level.bg} ${level.color}`}>
        {level.icon}
        {level.label}
      </div>
    </div>
  );
}

// ── 체크포인트 아이템 ─────────────────────────────────────
function CheckpointItem({ item }: { item: Checkpoint }) {
  const [open, setOpen] = useState(false);
  const style = CHECKPOINT_STYLE[item.status];

  return (
    <li className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
          <span className="text-sm font-medium text-slate-800">{item.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
            {CHECKPOINT_LABEL[item.status]}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <TooltipText text={item.detail} className="text-xs leading-relaxed text-slate-600" keyPrefix={`cp-${item.label}`} ctx={tooltipCtx} />
        </div>
      )}
    </li>
  );
}

interface ImageItem {
  file: File;
  preview: string;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function RegisterPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [honeyTip, setHoneyTip] = useState<string>("");

  useEffect(() => {
    setHoneyTip(REGISTER_HONEY_TIPS[Math.floor(Math.random() * REGISTER_HONEY_TIPS.length)]);
  }, []);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);

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
        body: JSON.stringify({ images: base64List, type: "register" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "알 수 없는 오류가 발생했습니다.");
      setResult(data.result as RegisterResult);
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setStatus("error");
    }
  }

  async function handleCopy() {
    if (!result) return;
    const text = `[위험도 ${result.riskScore}점]\n${result.summary}\n\n${result.checkpoints
      .map((c) => `• ${c.label}: ${CHECKPOINT_LABEL[c.status]} — ${c.detail}`)
      .join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
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

  // 페이지 전체에서 용어 첫 등장을 추적하는 공유 컨텍스트
  const tooltipCtx = useTooltipContext();

  // 새 분석 결과가 올 때 usedTerms 초기화
  useEffect(() => {
    tooltipCtx.usedTerms.clear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

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
            <h1 className="text-lg font-bold text-slate-900">등기부등본 분석</h1>
            <p className="text-xs text-slate-400">권리관계·위험요소를 확인해요</p>
          </div>
          <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
            <FileText className="h-4 w-4 text-emerald-600" />
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

          {/* 업로드 / 썸네일 영역 */}
          {!hasImages ? (
            /* 사진 없을 때: 2버튼 업로드 UI */
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 카메라 버튼 */}
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-400 transition-colors py-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                    <Camera className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">카메라로 찍기</p>
                    <p className="text-xs text-slate-400 mt-0.5">한 장씩 찍어 추가할 수 있어요</p>
                  </div>
                </button>
                {/* 갤러리 버튼 */}
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-400 transition-colors py-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                    <Images className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">앨범에서 고르기</p>
                    <p className="text-xs text-slate-400 mt-0.5">여러 장 동시 선택 가능</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <Image src={img.preview} alt={`서류 ${idx + 1}`} fill className="object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-400 transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <Plus className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs text-emerald-500 font-medium">추가</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 text-right">{images.length}장 선택됨</p>
            </div>
          )}

          {/* 안내 팁 */}
          {!hasImages && (
            <ul className="flex flex-col gap-2 rounded-xl bg-white border border-slate-100 p-4 shadow-sm">
              {[
                "등기부등본 전체 페이지가 한 장에 담기도록 촬영해주세요",
                "글자가 선명하게 보여야 분석 정확도가 높아져요",
                "인터넷등기소에서 PDF를 캡처해 올리셔도 돼요",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
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
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xl shadow-sm">
                  🐱
                </div>
                {/* 말풍선 */}
                <div className="relative flex-1 rounded-2xl rounded-bl-none bg-emerald-50 border border-emerald-100 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-emerald-600 mb-1">부동산 꿀팁 💡</p>
                  <p className="text-sm leading-relaxed text-slate-600">{honeyTip}</p>
                  {/* 말풍선 꼬리 (왼쪽 하단) */}
                  <span className="absolute -bottom-2 left-0 h-0 w-0 border-r-8 border-t-8 border-r-transparent border-t-emerald-50" />
                  <span className="absolute -bottom-[9px] left-0 h-0 w-0 border-r-8 border-t-8 border-r-transparent border-t-emerald-100" style={{ zIndex: -1 }} />
                </div>
              </div>
            </div>
          )}

          {/* ── 분석 결과 ── */}
          {isSuccess && result && (
            <div className="flex flex-col gap-4">

              {/* 위험도 게이지 카드 (정상 분석일 때만) */}
              {result.riskScore !== null && (
                <div className="rounded-2xl bg-white border border-slate-100 shadow-md px-6 py-6 flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">전세 사기 위험도</p>
                  <RiskGauge score={result.riskScore} />
                </div>
              )}

              {/* 요약 카드 */}
              <div className="rounded-2xl bg-white border border-emerald-100 shadow-md overflow-hidden">
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-3 border-b border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-700">AI 종합 요약</span>
                  <span className="ml-auto text-xs text-slate-400">{images.length}장 종합 분석</span>
                </div>
                <div className="px-4 py-4">
                  <TooltipText
                    text={result.summary}
                    className="text-sm leading-relaxed text-slate-700"
                    keyPrefix="summary"
                    ctx={tooltipCtx}
                  />
                </div>
                {/* 복사 버튼: 예외 안내 메시지일 때는 숨김 */}
                {!result.summary.includes("다시 업로드해 주세요") && (
                  <div className="flex justify-end px-4 pb-4">
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        copied ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
                      }`}
                    >
                      {copied ? <><Check className="h-3.5 w-3.5" />복사됨</> : <><Copy className="h-3.5 w-3.5" />분석 결과 복사</>}
                    </button>
                  </div>
                )}
              </div>

              {/* 체크포인트 리스트 (항목이 있을 때만) */}
              {result.checkpoints.length > 0 && <div className="rounded-2xl bg-white border border-slate-100 shadow-md overflow-hidden">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 border-b border-slate-100">
                  <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">주요 확인 요소</span>
                </div>
                <ul className="flex flex-col gap-2 p-3">
                  {result.checkpoints.map((cp) => (
                    <CheckpointItem key={cp.label} item={cp} />
                  ))}
                </ul>
              </div>}

              {/* 위험 등급(71점↑)일 때만 HUG 안심전세포털 링크 표시 */}
              {result.riskScore !== null && result.riskScore >= 71 && (
                <a
                  href="https://www.khug.or.kr/jeonse/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 hover:border-red-400 active:scale-[0.98]"
                >
                  🚨 전세사기 의심 시 대처 매뉴얼 (HUG 안심전세포털)
                </a>
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

        {/* 하단 버튼 */}
        <div className="mt-6 pb-4">
          {isSuccess ? (
            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
            >
              <RefreshCw className="h-5 w-5" />
              다른 서류 분석하기
            </button>
          ) : (
            <>
              <button
                onClick={handleAnalyze}
                disabled={!hasImages || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />AI가 열심히 분석 중이에요...</>
                ) : (
                  <><Sparkles className="h-5 w-5" />AI 분석 시작하기</>
                )}
              </button>
              {!hasImages && !isLoading && (
                <p className="mt-2 text-center text-xs text-slate-400">사진을 업로드하면 버튼이 활성화돼요</p>
              )}
            </>
          )}
        </div>
      </main>

      {/* 토스트 */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-xl transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Check className="h-4 w-4 text-emerald-400" />
        클립보드에 복사되었습니다!
      </div>
    </div>
  );
}
