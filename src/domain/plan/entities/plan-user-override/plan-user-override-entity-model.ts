import { IdValueObject } from "../../value-objects";
import { type PlanUserOverrideDTO } from "./plan-user-override-dtos";

export class PlanUserOverrideEntityModel {
    private constructor(
        public readonly overrideId: IdValueObject,
        public readonly companyPlanId: IdValueObject,
        public readonly admin: boolean,
        public readonly extraUserPrice: number,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    static create({
        overrideId,
        companyPlanId,
        admin,
        extraUserPrice,
        createdAt,
        updatedAt
    }: PlanUserOverrideDTO): PlanUserOverrideEntityModel {
        const overrideIdObj = IdValueObject.create(overrideId);
        if (overrideIdObj instanceof Error) throw overrideIdObj;

        const companyPlanIdObj = IdValueObject.create(companyPlanId);
        if (companyPlanIdObj instanceof Error) throw companyPlanIdObj;

        if (extraUserPrice < 0) {
            throw new Error("Extra user price cannot be negative");
        }

        return new PlanUserOverrideEntityModel(
            overrideIdObj,
            companyPlanIdObj,
            Boolean(admin),
            extraUserPrice,
            createdAt || new Date(),
            updatedAt || new Date()
        );
    }

    getValues(): PlanUserOverrideDTO {
        return {
            overrideId: this.overrideId.value,
            companyPlanId: this.companyPlanId.value,
            admin: this.admin,
            extraUserPrice: this.extraUserPrice,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
