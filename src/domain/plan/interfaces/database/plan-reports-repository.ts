import { IdValueObject } from "../../value-objects";

export interface PlanReport {
    plan_report_id: IdValueObject;
    plan_type_id: IdValueObject; // Changed from plan_id to plan_type_id
    template_id: IdValueObject;
}

export interface IPlanReportsRepository {
    create(planReport: PlanReport): Promise<PlanReport>;
    getByPlanTypeId(planTypeId: IdValueObject): Promise<PlanReport[]>; // Changed from planId to planTypeId
    getByTemplateId(templateId: IdValueObject): Promise<PlanReport[]>;
    update(planReport: PlanReport): Promise<PlanReport>;
    delete(planReportId: IdValueObject): Promise<boolean>;
}
