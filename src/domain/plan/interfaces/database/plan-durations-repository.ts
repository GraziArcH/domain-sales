import { IdValueObject } from "../../value-objects";

export interface PlanDuration {
    plan_duration_id: IdValueObject;
    plan_id: IdValueObject;
    duration_type: string;
    duration_value: number;
}

export interface IPlanDurationsRepository {
    create(planDuration: PlanDuration): Promise<PlanDuration>;
    getById(planDurationId: IdValueObject): Promise<PlanDuration | null>;
    getByPlanId(planId: IdValueObject): Promise<PlanDuration[]>;
    update(planDuration: PlanDuration): Promise<PlanDuration>;
    delete(planDurationId: IdValueObject): Promise<boolean>;
}
