export interface PlanUserTypeDTO {
    planUserTypeId: string | number;
    planTypeId: string | number;
    admin: boolean;
    numberOfUsers: number;
    extraUserPrice: number;
}

export type PlanUserTypeCreateDTO = Omit<PlanUserTypeDTO, "planUserTypeId">;
export type PlanUserTypeUpdateDTO = PlanUserTypeDTO;
