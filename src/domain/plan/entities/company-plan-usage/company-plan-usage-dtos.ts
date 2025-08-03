export interface CompanyPlanUsageDTO {
    usageId: string | number;
    companyPlanId: string | number;
    userId: string | number;
    admin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type CompanyPlanUsageCreateDTO = Omit<CompanyPlanUsageDTO, "usageId" | "createdAt" | "updatedAt">;
export interface UsageMetricsDTO {
    totalUsers: number;
    activeUsers: number;
    limitedUsers: number;
    [key: string]: any;
}
