"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  ChevronDown,
  Info,
  RotateCcw,
} from "lucide-react";
import {
  type ContractType,
  type BuildingType,
  getChecklistItems,
  getChecklistKey,
} from "@/lib/checklist-data";

const CONTRACT_TYPES: ContractType[] = ["전세", "월세"];
const BUILDING_TYPES: BuildingType[] = ["아파트", "빌라", "원룸"];

const STORAGE_KEY_PREFIX = "checkmyroom_checklist_";
const STORAGE_CONFIG_KEY = "checkmyroom_checklist_config";

function getStorageKey(contract: ContractType, building: BuildingType) {
  return `${STORAGE_KEY_PREFIX}${getChecklistKey(contract, building)}`;
}

export default function ChecklistPage() {
  const [contract, setContract] = useState<ContractType>("전세");
  const [building, setBuilding] = useState<BuildingType>("아파트");
  // itemId → checked
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [openTip, setOpenTip] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const items = getChecklistItems(contract, building);
  const checkedCount = items.filter((i) => checks[i.id]).length;
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  // 초기 로드: localStorage에서 설정 복원
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (savedConfig) {
        const { contract: c, building: b } = JSON.parse(savedConfig);
        if (c) setContract(c);
        if (b) setBuilding(b);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // 설정 변경 시 localStorage 저장
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ contract, building }));
  }, [contract, building, hydrated]);

  // 조건 변경 시 해당 조건의 체크 상태 불러오기
  useEffect(() => {
    if (!hydrated) return;
    try {
      const saved = localStorage.getItem(getStorageKey(contract, building));
      setChecks(saved ? JSON.parse(saved) : {});
    } catch {
      setChecks({});
    }
  }, [contract, building, hydrated]);

  // 체크 상태 변경 시 localStorage 저장
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(getStorageKey(contract, building), JSON.stringify(checks));
  }, [checks, contract, building, hydrated]);

  function toggleCheck(id: string) {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleReset() {
    setChecks({});
    localStorage.removeItem(getStorageKey(contract, building));
  }

  if (!hydrated) return null; // SSR hydration mismatch 방지

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
            <h1 className="text-lg font-bold text-slate-900">계약 전 체크리스트</h1>
            <p className="text-xs text-slate-400">조건에 맞는 필수 항목을 확인해요</p>
          </div>
          <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
            <ClipboardList className="h-4 w-4 text-violet-600" />
          </div>
        </header>

        {/* ── 입력 폼 ── */}
        <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 mb-5">
          <div className="flex gap-4">

            {/* 계약 유형 탭 */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 mb-2">계약 유형</p>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 p-1 gap-1 bg-slate-50">
                {CONTRACT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setContract(type)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      contract === type
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 건물 유형 드롭다운 */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 mb-2">건물 유형</p>
              <div className="relative">
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value as BuildingType)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {BUILDING_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

          </div>
        </section>

        {/* ── 체크리스트 ── */}
        <section className="flex flex-col gap-3">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">
                {contract} · {building} 필수 체크리스트
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {checkedCount}/{items.length} 완료
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              초기화
            </button>
          </div>

          {/* 프로그레스 바 */}
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <p className="text-center text-sm font-semibold text-violet-600">
              🎉 모든 항목을 확인했어요!
            </p>
          )}

          {/* 체크박스 리스트 */}
          <ul className="flex flex-col gap-2 mt-1">
            {items.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-colors ${
                  checks[item.id] ? "border-violet-200 bg-violet-50/40" : "border-slate-100"
                }`}
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  {/* 커스텀 체크박스 */}
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                      checks[item.id]
                        ? "border-violet-500 bg-violet-500"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {checks[item.id] && (
                      <svg viewBox="0 0 10 8" className="h-3 w-3 fill-none stroke-white stroke-2">
                        <polyline points="1,4 4,7 9,1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* 텍스트 */}
                  <span
                    onClick={() => toggleCheck(item.id)}
                    className={`flex-1 cursor-pointer text-sm leading-relaxed transition-colors ${
                      checks[item.id] ? "text-slate-400 line-through" : "text-slate-700"
                    }`}
                  >
                    {item.text}
                  </span>

                  {/* 팁 토글 버튼 */}
                  {item.tip && (
                    <button
                      onClick={() => setOpenTip(openTip === item.id ? null : item.id)}
                      className="shrink-0 mt-0.5"
                    >
                      <Info
                        className={`h-4 w-4 transition-colors ${
                          openTip === item.id ? "text-violet-500" : "text-slate-300 hover:text-slate-400"
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* 팁 펼침 */}
                {item.tip && openTip === item.id && (
                  <div className="border-t border-violet-100 bg-violet-50 px-4 py-3">
                    <p className="text-xs leading-relaxed text-violet-700">{item.tip}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* 하단 여백 */}
        <div className="pb-8" />
      </main>
    </div>
  );
}
