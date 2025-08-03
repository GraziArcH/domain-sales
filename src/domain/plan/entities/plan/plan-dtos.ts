export interface PlanDTO {
    planId: string | number;
    planName: string;
    description: string;
    defaultAmount: number;
    planDuration: "mensal" | "anual" | "trimestral" | "vitalicio"; // Added plan_duration ENUM field
    planTypeId: string | number;
    createdAt: Date;
    updatedAt: Date;
}

export type PlanCreateDTO = Omit<PlanDTO, "planId" | "createdAt" | "updatedAt">;
export type PlanUpdateDTO = Omit<PlanDTO, "createdAt" | "updatedAt">;
