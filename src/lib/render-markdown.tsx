import React from "react";

/**
 * 마크다운 일부를 React 노드로 변환합니다.
 * 지원: **bold**, \n → <br />
 */
export function renderMarkdownText(text: string): React.ReactNode[] {
  return text.split("\n").flatMap((line, lineIdx, lines) => {
    // ** ... ** 를 <strong>으로 변환
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={`${lineIdx}-${partIdx}`} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    // 마지막 줄이 아니면 <br /> 추가
    if (lineIdx < lines.length - 1) {
      return [...rendered, <br key={`br-${lineIdx}`} />];
    }
    return rendered;
  });
}
