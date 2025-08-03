import { IdValueObject } from "../../value-objects";
import { type PlanReportDTO } from "./plan-reports-dtos";

export class PlanReportEntityModel {
    private constructor(
        public readonly planReportId: IdValueObject,
        public readonly planTypeId: IdValueObject,
        public readonly templateId: IdValueObject
    ) { }

    static create({ planReportId, planTypeId, templateId }: PlanReportDTO): PlanReportEntityModel {
        const planReportIdObj = IdValueObject.create(planReportId);
        if (planReportIdObj instanceof Error) throw planReportIdObj;

        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) throw planTypeIdObj;

        const templateIdObj = IdValueObject.create(templateId);
        if (templateIdObj instanceof Error) throw templateIdObj;

        return new PlanReportEntityModel(planReportIdObj, planTypeIdObj, templateIdObj);
    }

    getValues(): PlanReportDTO {
        return {
            planReportId: this.planReportId.value,
            planTypeId: this.planTypeId.value,
            templateId: this.templateId.value
        };
    }

    withUpdatedStatus(): PlanReportEntityModel {
        return PlanReportEntityModel.create({
            ...this.getValues()
        });
    }
}
