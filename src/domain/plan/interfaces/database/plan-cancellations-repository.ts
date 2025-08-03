import { IdValueObject } from "../../value-objects";

export interface PlanCancellation {
    plan_cancellation_id: IdValueObject;
    company_plan_id: IdValueObject;
    cancellation_reason: string;
    cancelled_by_user_id: IdValueObject;
    cancelled_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface IPlanCancellationsRepository {
    create(cancellation: PlanCancellation): Promise<PlanCancellation>;
    getById(cancellationId: IdValueObject): Promise<PlanCancellation | null>;
    getByCompanyPlanId(companyPlanId: IdValueObject): Promise<PlanCancellation[]>;
}
