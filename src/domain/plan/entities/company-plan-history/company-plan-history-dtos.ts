export interface CompanyPlanHistoryDTO {
    historyId: string | number;
    companyPlanId: string | number;
    previousPlanId?: string | number;
    newPlanId: string | number;
    changeType: "upgrade" | "downgrade" | "renewal" | "cancellation";
    reason?: string;
    changeAt: Date;
    changedByUserId: string | number;
    createdAt: Date;
}

export type CompanyPlanHistoryCreateDTO = Omit<CompanyPlanHistoryDTO, "historyId" | "createdAt">;
