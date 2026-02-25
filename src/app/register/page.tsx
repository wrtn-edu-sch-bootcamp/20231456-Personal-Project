"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ImagePlus,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Status = "idle" | "loading" | "success" | "error";

export default function RegisterPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus("idle");
    setResult("");
    setErrorMsg("");
  }

  function handleRemove() {
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setResult("");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!file) return;
    setStatus("loading");
    setResult("");
    setErrorMsg("");

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, type: "register" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? "알 수 없는 오류가 발생했습니다.");
      }
      setResult(data.result);
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setStatus("error");
    }
  }

  const isLoading = status === "loading";

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

        {/* 업로드 영역 */}
        <section className="flex-1 flex flex-col gap-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            onClick={() => !preview && inputRef.current?.click()}
            className={`relative w-full rounded-2xl overflow-hidden border-2 border-dashed transition-colors ${
              preview
                ? "border-transparent cursor-default"
                : "border-emerald-300 bg-emerald-50/60 cursor-pointer hover:bg-emerald-50 hover:border-emerald-400"
            }`}
            style={{ minHeight: "320px" }}
          >
            {preview ? (
              <>
                <Image
                  src={preview}
                  alt="업로드 미리보기"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={handleRemove}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black/70"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  다시 선택
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                  <ImagePlus className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">서류 사진을 업로드하세요</p>
                  <p className="mt-1 text-sm text-slate-400">
                    등기부등본 전체가 잘 보이도록
                    <br />
                    촬영하거나 스캔해 올려주세요
                  </p>
                </div>
                <span className="mt-1 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white">
                  사진 선택하기
                </span>
              </div>
            )}
          </div>

          {/* 안내 팁 (이미지 없을 때만) */}
          {!preview && (
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

          {/* 분석 결과 카드 */}
          {status === "success" && result && (
            <div className="rounded-2xl bg-white border border-emerald-100 shadow-md overflow-hidden">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-3 border-b border-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold text-emerald-700">AI 분석 결과</span>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {result}
                </p>
              </div>
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

        {/* 분석 버튼 */}
        <div className="mt-6 pb-4">
          <button
            onClick={handleAnalyze}
            disabled={!preview || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                AI가 열심히 분석 중이에요...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                AI 분석 시작하기
              </>
            )}
          </button>
          {!preview && !isLoading && (
            <p className="mt-2 text-center text-xs text-slate-400">
              사진을 업로드하면 버튼이 활성화돼요
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
