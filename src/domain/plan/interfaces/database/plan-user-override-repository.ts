import { IdValueObject } from "../../value-objects";

export interface PlanUserOverride {
    plan_user_override_id: IdValueObject;
    company_plan_id: IdValueObject;
    admin: boolean;
    extra_user_price: number;
    created_at: Date;
    updated_at: Date;
}

export interface IPlanUserOverrideRepository {
    create(override: PlanUserOverride): Promise<PlanUserOverride>;
    getById(overrideId: IdValueObject): Promise<PlanUserOverride | null>;
    getByCompanyPlanId(companyPlanId: IdValueObject): Promise<PlanUserOverride[]>;
    getByCompanyPlanIdAndAdmin(companyPlanId: IdValueObject, isAdmin: boolean): Promise<PlanUserOverride | null>;
    update(override: PlanUserOverride): Promise<PlanUserOverride>;
    delete(overrideId: IdValueObject): Promise<boolean>;
}
