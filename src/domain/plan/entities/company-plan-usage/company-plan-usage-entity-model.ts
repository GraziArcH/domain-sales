import { IdValueObject } from "../../value-objects";
import { type CompanyPlanUsageDTO, type UsageMetricsDTO } from "./company-plan-usage-dtos";

export class CompanyPlanUsageEntityModel {
    private constructor(
        public readonly usageId: IdValueObject,
        public readonly companyPlanId: IdValueObject,
        public readonly userId: IdValueObject,
        public readonly admin: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    static create({
        usageId,
        companyPlanId,
        userId,
        admin,
        createdAt,
        updatedAt
    }: CompanyPlanUsageDTO): CompanyPlanUsageEntityModel {
        const usageIdObj = IdValueObject.create(usageId);
        if (usageIdObj instanceof Error) throw usageIdObj;

        const companyPlanIdObj = IdValueObject.create(companyPlanId);
        if (companyPlanIdObj instanceof Error) throw companyPlanIdObj;

        const userIdObj = IdValueObject.create(userId);
        if (userIdObj instanceof Error) throw userIdObj;

        return new CompanyPlanUsageEntityModel(
            usageIdObj,
            companyPlanIdObj,
            userIdObj,
            Boolean(admin),
            createdAt || new Date(),
            updatedAt || new Date()
        );
    }

    getValues(): CompanyPlanUsageDTO {
        return {
            usageId: this.usageId.value,
            companyPlanId: this.companyPlanId.value,
            userId: this.userId.value,
            admin: this.admin,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export class UsageMetricsEntityModel {
    private constructor(public readonly metrics: UsageMetricsDTO) {}

    static create(metrics: UsageMetricsDTO): UsageMetricsEntityModel {
        return new UsageMetricsEntityModel(metrics);
    }

    getValues(): UsageMetricsDTO {
        return this.metrics;
    }
}
