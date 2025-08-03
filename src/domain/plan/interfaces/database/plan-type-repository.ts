import { IdValueObject } from "../../value-objects";

export interface PlanType {
    plan_type_id: IdValueObject;
    type_name: string;
    description: string;
    is_active: boolean; // Added is_active field
}

export interface IPlanTypeRepository {
    create(planType: PlanType): Promise<PlanType>;
    getById(planTypeId: IdValueObject): Promise<PlanType | null>;
    getAll(): Promise<PlanType[]>;
    update(planType: PlanType): Promise<PlanType>;
    delete(planTypeId: IdValueObject): Promise<boolean>;
}
