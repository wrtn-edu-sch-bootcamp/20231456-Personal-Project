import { Camera, FileText, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
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
        <section className="flex flex-col gap-4 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            분석 시작하기
          </p>

          {/* 방 하자 분석 버튼 */}
          <Link href="/defect" className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 shadow-lg shadow-indigo-200 transition-transform duration-200 active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mb-4">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    방 하자 분석하기
                  </h2>
                  <p className="text-sm text-indigo-100">
                    사진을 찍으면 AI가 곰팡이·균열·누수를 분석해드려요
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60 mt-1 transition-transform group-hover:translate-x-1" />
              </div>
              {/* 배경 장식 */}
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
            </div>
          </Link>

          {/* 등기부등본 분석 버튼 */}
          <Link href="/register" className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-lg shadow-emerald-200 transition-transform duration-200 active:scale-[0.98]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mb-4">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    등기부등본 분석하기
                  </h2>
                  <p className="text-sm text-emerald-100">
                    서류를 업로드하면 AI가 권리관계·위험요소를 짚어드려요
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60 mt-1 transition-transform group-hover:translate-x-1" />
              </div>
              {/* 배경 장식 */}
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
            </div>
          </Link>
        </section>

        {/* 푸터 */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-slate-400">
            AI 분석 결과는 참고용이며, 전문가 상담을 권장합니다.
          </p>
        </footer>
      </main>
    </div>
  );
}
