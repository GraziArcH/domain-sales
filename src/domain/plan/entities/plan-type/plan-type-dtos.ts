export interface PlanTypeDTO {
    planTypeId: string | number;
    typeName: string;
    description: string;
    isActive: boolean;
}

export type PlanTypeCreateDTO = Omit<PlanTypeDTO, "planTypeId">;
export type PlanTypeUpdateDTO = PlanTypeDTO;
