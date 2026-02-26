export type AnalysisType = "defect" | "register";

export interface HistoryItem {
  id: string;
  type: AnalysisType;
  date: string; // ISO string
  roomName: string; // 사용자가 입력한 방 이름
  summary: string; // 결과 요약 (1~2줄)
  riskScore?: number | null; // register 전용
  detail: string; // 전체 결과 (모달에서 표시)
}

const STORAGE_KEY = "room_analysis_history";
const MAX_ITEMS = 5;

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(item: Omit<HistoryItem, "id" | "date">): void {
  const history = loadHistory();
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  const updated = [newItem, ...history].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

export function riskLabel(score: number | null | undefined): string {
  if (score == null) return "";
  if (score <= 30) return "🟢 안전";
  if (score <= 70) return "🟡 주의";
  return "🔴 위험";
}
