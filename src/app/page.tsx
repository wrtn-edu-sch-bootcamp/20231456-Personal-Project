"use client";

import { useEffect, useState } from "react";
import { House, FileText, ChevronRight, ShieldCheck, ClipboardList, FolderOpen, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { loadHistory, clearHistory, formatDate, type HistoryItem } from "@/lib/history";
import { renderMarkdownText } from "@/lib/render-markdown";

export default function Home() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="flex w-full max-w-md min-h-screen flex-col px-6 py-12">
        {/* 헤더 */}
        <header className="flex flex-col items-center text-center mb-12 mt-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              체크마이룸
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
            나의 첫 자취방, 물리적 하자부터 법적 권리까지
            <br />
            <span className="font-semibold text-indigo-600">원클릭 체크!</span>
          </p>
        </header>

        {/* 메인 버튼 영역 */}
        <section className="flex flex-col gap-4">

          {/* 1순위: 계약 전 체크리스트 */}
          <Link href="/checklist" className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 shadow-lg shadow-indigo-200 transition-transform duration-200 active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mb-4">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    계약 전 체크리스트
                  </h2>
                  <p className="text-sm text-indigo-100">
                    계약 유형·건물별 필수 확인 항목을 체크해요
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60 mt-1 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
            </div>
          </Link>

          {/* 2순위: 방 하자 분석 */}
          <Link href="/defect" className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg shadow-blue-200 transition-transform duration-200 active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mb-4">
                    <House className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    방 하자 분석하기
                  </h2>
                  <p className="text-sm text-blue-100">
                    사진을 찍으면 AI가 곰팡이·균열·누수를 분석해드려요
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60 mt-1 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
            </div>
          </Link>

          {/* 3순위: 등기부등본 분석 */}
          <Link href="/register" className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 shadow-lg shadow-teal-200 transition-transform duration-200 active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mb-4">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    등기부등본 분석하기
                  </h2>
                  <p className="text-sm text-teal-100">
                    서류를 업로드하면 AI가 권리관계·위험요소를 짚어드려요
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60 mt-1 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
            </div>
          </Link>
        </section>

        {/* 분석 기록 섹션 */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-600">최근 분석한 내 방 기록</h2>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                전체 삭제
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-6 text-center">
              <p className="text-2xl mb-2">🏠</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                아직 분석한 방이 없어요.<br />
                <span className="text-indigo-400 font-medium">첫 번째 방을 진단해 보세요!</span>
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="w-full text-left rounded-xl bg-white border border-slate-100 px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        item.type === "defect"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-teal-50 text-teal-600"
                      }`}>
                        {item.type === "defect" ? "🏠 하자 분석" : "📄 등기부등본"}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto shrink-0">{formatDate(item.date)}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-0.5">
                      {item.roomName ?? "이름 없는 방"}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 푸터 */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-slate-400">
            AI 분석 결과는 참고용이며, 전문가 상담을 권장합니다.
          </p>
        </footer>
      </main>

      {/* 상세 결과 모달 */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white px-6 pt-5 pb-10 shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    selectedItem.type === "defect"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-teal-50 text-teal-600"
                  }`}>
                    {selectedItem.type === "defect" ? "🏠 하자 분석" : "📄 등기부등본"}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(selectedItem.date)}</span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {selectedItem.roomName ?? "이름 없는 방"}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 위험도 뱃지 (등기부등본) */}
            {selectedItem.type === "register" && selectedItem.riskScore != null && (
              <div className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                selectedItem.riskScore <= 30
                  ? "bg-emerald-50 text-emerald-700"
                  : selectedItem.riskScore <= 70
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-red-50 text-red-700"
              }`}>
                위험도 점수: {selectedItem.riskScore}점
              </div>
            )}

            {/* 상세 내용 */}
            <div className="rounded-xl bg-slate-50 px-4 py-4">
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {renderMarkdownText(selectedItem.detail)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
