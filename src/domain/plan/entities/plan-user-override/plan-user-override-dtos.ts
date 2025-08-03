export interface PlanUserOverrideDTO {
    overrideId: string | number;
    companyPlanId: string | number;
    admin: boolean;
    extraUserPrice: number;
    createdAt: Date;
    updatedAt: Date;
}

export type PlanUserOverrideCreateDTO = Omit<PlanUserOverrideDTO, "overrideId" | "createdAt" | "updatedAt">;
export type PlanUserOverrideUpdateDTO = Partial<
    Omit<PlanUserOverrideDTO, "overrideId" | "companyPlanId" | "createdAt" | "updatedAt">
>;
