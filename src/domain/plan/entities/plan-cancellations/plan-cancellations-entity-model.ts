import { IdValueObject } from "../../value-objects";
import { type PlanCancellationDTO } from "./plan-cancellations-dtos";

export class PlanCancellationEntityModel {
    private constructor(
        public readonly planCancellationId: IdValueObject,
        public readonly companyPlanId: IdValueObject,
        public readonly cancellationReason: string,
        public readonly cancelledByUserId: IdValueObject,
        public readonly cancelledAt: Date | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) { }

    static create({
        planCancellationId,
        companyPlanId,
        cancellationReason,
        cancelledByUserId,
        cancelledAt,
        createdAt,
        updatedAt
    }: PlanCancellationDTO): PlanCancellationEntityModel {
        const cancellationIdObj = IdValueObject.create(planCancellationId);
        if (cancellationIdObj instanceof Error) throw cancellationIdObj;

        const companyPlanIdObj = IdValueObject.create(companyPlanId);
        if (companyPlanIdObj instanceof Error) throw companyPlanIdObj;

        const userIdObj = IdValueObject.create(cancelledByUserId);
        if (userIdObj instanceof Error) throw userIdObj;

        if (!cancellationReason || cancellationReason.trim().length === 0) {
            throw new Error("Motivo do cancelamento é obrigatório");
        }

        return new PlanCancellationEntityModel(
            cancellationIdObj,
            companyPlanIdObj,
            cancellationReason.trim(),
            userIdObj,
            cancelledAt,
            createdAt || new Date(),
            updatedAt || new Date()
        );
    }

    getValues(): PlanCancellationDTO {
        return {
            planCancellationId: this.planCancellationId.value,
            companyPlanId: this.companyPlanId.value,
            cancellationReason: this.cancellationReason,
            cancelledByUserId: this.cancelledByUserId.value,
            cancelledAt: this.cancelledAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    withUpdatedCancelledAt(cancelledAt: Date): PlanCancellationEntityModel {
        return PlanCancellationEntityModel.create({
            ...this.getValues(),
            cancelledAt,
            updatedAt: new Date()
        });
    }
}
