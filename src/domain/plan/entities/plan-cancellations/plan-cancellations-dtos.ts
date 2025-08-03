export interface PlanCancellationDTO {
    planCancellationId: string | number;
    companyPlanId: string | number;
    cancellationReason: string;
    cancelledByUserId: string | number;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type PlanCancellationCreateDTO = Omit<PlanCancellationDTO, "planCancellationId" | "createdAt" | "updatedAt">;
export type PlanCancellationUpdateDTO = Partial<
    Omit<PlanCancellationDTO, "planCancellationId" | "companyPlanId" | "createdAt" | "updatedAt">
>;
