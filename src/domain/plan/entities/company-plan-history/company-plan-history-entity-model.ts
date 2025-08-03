import { IdValueObject } from "../../value-objects";
import { type CompanyPlanHistoryDTO } from "./company-plan-history-dtos";

export class CompanyPlanHistoryEntityModel {
    private constructor(
        public readonly historyId: IdValueObject,
        public readonly companyPlanId: IdValueObject,
        public readonly previousPlanId: IdValueObject | null,
        public readonly newPlanId: IdValueObject,
        public readonly changeType: "upgrade" | "downgrade" | "renewal" | "cancellation",
        public readonly reason: string | null,
        public readonly changeAt: Date,
        public readonly changedByUserId: IdValueObject,
        public readonly createdAt: Date
    ) {}

    static create({
        historyId,
        companyPlanId,
        previousPlanId,
        newPlanId,
        changeType,
        reason,
        changeAt,
        changedByUserId,
        createdAt
    }: CompanyPlanHistoryDTO): CompanyPlanHistoryEntityModel {
        const historyIdObj = IdValueObject.create(historyId);
        if (historyIdObj instanceof Error) throw historyIdObj;

        const companyPlanIdObj = IdValueObject.create(companyPlanId);
        if (companyPlanIdObj instanceof Error) throw companyPlanIdObj;

        const newPlanIdObj = IdValueObject.create(newPlanId);
        if (newPlanIdObj instanceof Error) throw newPlanIdObj;

        const changedByUserIdObj = IdValueObject.create(changedByUserId);
        if (changedByUserIdObj instanceof Error) throw changedByUserIdObj;

        let previousPlanIdObj: IdValueObject | null = null;
        if (previousPlanId) {
            const result = IdValueObject.create(previousPlanId);
            if (result instanceof Error) throw result;
            previousPlanIdObj = result;
        }

        if (!["upgrade", "downgrade", "renewal", "cancellation"].includes(changeType)) {
            throw new Error("Invalid change type");
        }

        return new CompanyPlanHistoryEntityModel(
            historyIdObj,
            companyPlanIdObj,
            previousPlanIdObj,
            newPlanIdObj,
            changeType,
            reason || null,
            changeAt || new Date(),
            changedByUserIdObj,
            createdAt || new Date()
        );
    }

    getValues(): CompanyPlanHistoryDTO {
        return {
            historyId: this.historyId.value,
            companyPlanId: this.companyPlanId.value,
            previousPlanId: this.previousPlanId?.value,
            newPlanId: this.newPlanId.value,
            changeType: this.changeType,
            reason: this.reason || undefined,
            changeAt: this.changeAt,
            changedByUserId: this.changedByUserId.value,
            createdAt: this.createdAt
        };
    }
}
