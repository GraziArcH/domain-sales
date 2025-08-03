export interface PlanReportDTO {
    planReportId: string | number;
    planTypeId: string | number;
    templateId: string | number;
}

export type PlanReportCreateDTO = Omit<PlanReportDTO, "planReportId">;
export type PlanReportUpdateDTO = PlanReportDTO;
