export type ContractType = "전세" | "월세";
export type BuildingType = "아파트" | "빌라" | "원룸";

export interface ChecklistItem {
  id: string;
  text: string;
  tip?: string; // 항목 설명 툴팁
}

// key: `${ContractType}_${BuildingType}`
const DATA: Record<string, ChecklistItem[]> = {
  전세_아파트: [
    { id: "j_a_1", text: "등기부등본 열람 (근저당·가압류 확인)", tip: "계약 당일 최신본을 다시 확인하세요." },
    { id: "j_a_2", text: "전세보증보험(HUG/SGI) 가입 가능 여부 확인", tip: "아파트는 대부분 가입 가능하지만 보증금 한도를 꼭 확인하세요." },
    { id: "j_a_3", text: "확정일자 및 전입신고 즉시 처리", tip: "잔금 당일 주민센터 방문 또는 정부24 온라인 신청." },
    { id: "j_a_4", text: "집주인 신분증·등기 소유자 일치 여부 확인", tip: "대리인 계약 시 위임장·인감증명서 필수." },
  ],
  전세_빌라: [
    { id: "j_v_1", text: "등기부등본 열람 (근저당·가압류 확인)", tip: "빌라는 근저당 비율이 높은 경우가 많으니 꼼꼼히 확인하세요." },
    { id: "j_v_2", text: "전세보증보험 가입 가능 여부 확인 (공시가격 대비 비율)", tip: "빌라는 공시가격이 낮아 보증보험 가입이 거절될 수 있습니다." },
    { id: "j_v_3", text: "선순위 채권 합계가 보증금의 80% 이하인지 확인", tip: "초과 시 경매 낙찰 후 보증금 미회수 위험이 있습니다." },
    { id: "j_v_4", text: "확정일자 및 전입신고 즉시 처리", tip: "잔금 당일 처리해야 대항력이 생깁니다." },
  ],
  전세_원룸: [
    { id: "j_r_1", text: "등기부등본 열람 (근저당·가압류 확인)", tip: "원룸 건물 전체에 근저당이 잡혀 있는 경우가 많습니다." },
    { id: "j_r_2", text: "건물 전체 보증금 합산액 확인 (깡통전세 여부)", tip: "다른 세입자 보증금 합산이 건물 시세를 초과하면 위험합니다." },
    { id: "j_r_3", text: "전입신고·확정일자 즉시 처리", tip: "잔금 당일 처리 필수." },
    { id: "j_r_4", text: "임대인 체납 세금 열람 동의 요청", tip: "세금 체납 시 보증금보다 세금이 우선 변제됩니다." },
  ],
  월세_아파트: [
    { id: "w_a_1", text: "등기부등본 열람 (소유자·근저당 확인)", tip: "월세라도 보증금이 있으면 반드시 확인하세요." },
    { id: "w_a_2", text: "확정일자 및 전입신고 (보증금 있는 경우)", tip: "보증금 500만 원 이상이면 반드시 처리하세요." },
    { id: "w_a_3", text: "관리비 항목 및 금액 계약서에 명시 확인", tip: "인터넷·TV·청소비 등 포함 여부를 확인하세요." },
    { id: "w_a_4", text: "특약사항 (수리 책임·도배·장판) 계약서 기재 확인", tip: "구두 약속은 법적 효력이 없습니다." },
  ],
  월세_빌라: [
    { id: "w_v_1", text: "등기부등본 열람 (소유자·근저당 확인)", tip: "빌라는 소유자 변경이 잦으니 꼭 확인하세요." },
    { id: "w_v_2", text: "확정일자 및 전입신고 (보증금 있는 경우)", tip: "보증금 보호를 위해 반드시 처리하세요." },
    { id: "w_v_3", text: "건물 노후도 및 하자 상태 직접 확인", tip: "입주 전 사진 촬영으로 기존 하자를 기록해두세요." },
    { id: "w_v_4", text: "특약사항 (수리 책임·도배·장판) 계약서 기재 확인", tip: "구두 약속은 법적 효력이 없습니다." },
  ],
  월세_원룸: [
    { id: "w_r_1", text: "등기부등본 열람 (소유자 확인)", tip: "임대인이 실제 소유자인지 확인하세요." },
    { id: "w_r_2", text: "확정일자 및 전입신고 (보증금 있는 경우)", tip: "보증금이 소액이라도 처리해두는 것이 안전합니다." },
    { id: "w_r_3", text: "관리비 항목 및 금액 계약서에 명시 확인", tip: "원룸은 관리비 분쟁이 잦습니다." },
    { id: "w_r_4", text: "입주 전 하자 사진 촬영 및 집주인 확인", tip: "퇴실 시 원상복구 분쟁 예방에 필수입니다." },
  ],
};

export function getChecklistKey(contract: ContractType, building: BuildingType): string {
  return `${contract}_${building}`;
}

export function getChecklistItems(contract: ContractType, building: BuildingType): ChecklistItem[] {
  return DATA[getChecklistKey(contract, building)] ?? [];
}
