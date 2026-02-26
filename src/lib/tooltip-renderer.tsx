"use client";

import React, { useState, useEffect } from "react";

// ── 용어 사전 ──────────────────────────────────────────────
export const TERM_DICT: Record<string, string> = {
  근저당권: "집주인이 이 집을 담보로 은행에서 빌린 빚",
  근저당: "집주인이 이 집을 담보로 은행에서 빌린 빚",
  가압류: "집주인이 빚을 안 갚아서 임시로 집을 팔지 못하게 막아둔 상태",
  선순위채권: "나보다 먼저 보증금을 돌려받을 권리가 있는 빚",
  선순위: "나보다 먼저 보증금을 돌려받을 권리가 있는 순위",
  대항력: "집주인이 바뀌어도 내 보증금을 지킬 수 있는 법적 권리",
  임대인: "집을 빌려주는 사람 (집주인)",
  임차인: "집을 빌리는 사람 (세입자)",
  전세권: "보증금을 돌려받지 못할 때 집을 경매로 넘길 수 있는 강력한 권리",
};

// ── 단일 툴팁 단어 컴포넌트 ───────────────────────────────
interface TermChipProps {
  id: string;       // 고유 인스턴스 ID
  term: string;
  definition: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

function TermChip({ id, term, definition, openId, setOpenId }: TermChipProps) {
  const isOpen = openId === id;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setOpenId(isOpen ? null : id);
  }

  return (
    <span className="relative inline-block">
      <span
        onClick={handleClick}
        className="cursor-pointer border-b-2 border-dashed border-blue-400 text-blue-600 font-medium select-none"
      >
        {term}
      </span>
      {isOpen && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl bg-slate-800 px-3 py-2.5 text-xs leading-relaxed text-white shadow-xl"
        >
          <span className="block font-semibold text-blue-300 mb-1">{term}</span>
          {definition}
          {/* 말풍선 꼬리 */}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  );
}

// ── 텍스트 → 툴팁 노드 변환 함수 ────────────────────────────
function buildNodes(
  text: string,
  openId: string | null,
  setOpenId: (id: string | null) => void,
  keyPrefix: string,
  usedTerms: Set<string>   // 외부에서 공유된 Set
): React.ReactNode[] {
  const terms = Object.keys(TERM_DICT);
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");

  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");

  lines.forEach((line, lineIdx) => {
    const parts = line.split(pattern);

    parts.forEach((part, partIdx) => {
      const nodeKey = `${keyPrefix}-${lineIdx}-${partIdx}`;

      if (TERM_DICT[part] && !usedTerms.has(part)) {
        // 전체 페이지 통틀어 첫 번째 등장 → 툴팁 적용
        usedTerms.add(part);
        const chipId = `${keyPrefix}-chip-${part}`;
        nodes.push(
          <TermChip
            key={nodeKey}
            id={chipId}
            term={part}
            definition={TERM_DICT[part]}
            openId={openId}
            setOpenId={setOpenId}
          />
        );
      } else if (part.startsWith("**") && part.endsWith("**")) {
        nodes.push(
          <strong key={nodeKey} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      } else {
        nodes.push(part);
      }
    });

    if (lineIdx < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${lineIdx}`} />);
    }
  });

  return nodes;
}

// ── 여러 TooltipText가 공유할 컨텍스트 ───────────────────────
interface TooltipContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  usedTerms: Set<string>;
}

// ── 단일 블록용 래퍼 (usedTerms를 외부에서 주입) ─────────────
interface TooltipTextProps {
  text: string;
  className?: string;
  keyPrefix?: string;
  ctx: TooltipContextValue;
}

export function TooltipText({ text, className, keyPrefix = "tt", ctx }: TooltipTextProps) {
  return (
    <p className={className}>
      {buildNodes(text, ctx.openId, ctx.setOpenId, keyPrefix, ctx.usedTerms)}
    </p>
  );
}

// ── 페이지 단위로 컨텍스트를 생성하는 훅 ─────────────────────
export function useTooltipContext(): TooltipContextValue {
  const [openId, setOpenId] = useState<string | null>(null);
  // usedTerms는 결과가 바뀔 때마다 초기화되어야 하므로 ref 대신 state로 관리
  const [usedTerms] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    function handleOutsideClick() {
      setOpenId(null);
    }
    document.addEventListener("click", handleOutsideClick, true);
    return () => document.removeEventListener("click", handleOutsideClick, true);
  }, []);

  return { openId, setOpenId, usedTerms };
}
